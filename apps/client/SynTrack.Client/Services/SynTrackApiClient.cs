namespace SynTrack.Client.Services;

using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using SynTrack.Client.Models;

public interface ISynTrackApiClient
{
    Task<DeviceLinkCreateResponse> CreateLinkAsync(CancellationToken cancellationToken);

    Task<DeviceLinkStatusResponse> PollStatusAsync(string deviceCode, CancellationToken cancellationToken);

    /// <summary>
    /// Codeless START (PR #19). Returns browserUrl + in-memory pollToken.
    /// </summary>
    Task<DeviceConnectStartResponse> StartConnectAsync(
        string? deviceName,
        CancellationToken cancellationToken);

    /// <summary>
    /// Codeless POLL. 404 becomes <see cref="DeviceConnectPollKind.NotFound"/>.
    /// Credential is present only on the first CONSUMED response.
    /// </summary>
    Task<DeviceConnectPollResult> PollConnectStatusAsync(
        string pollToken,
        CancellationToken cancellationToken);

    /// <summary>
    /// Distinguishes fully connected identity, legacy reconnect-required,
    /// unauthorized/revoked, and temporary network failures - never collapses
    /// those into a single nullable BattleTag.
    /// </summary>
    Task<ClientProfileFetchResult> GetMeAsync(string deviceToken, CancellationToken cancellationToken);

    /// <summary>
    /// Roster fetch that never throws into the sync/watcher pipeline.
    /// Distinguishes ok / legacy / unauthorized / temporary failure.
    /// </summary>
    Task<ClientCharactersFetchResult> GetCharactersAsync(string deviceToken, CancellationToken cancellationToken);

    Task<SyncStatus> SendImportAsync(
        string deviceToken,
        string addon,
        string clientVersion,
        string observedAt,
        string fileModifiedAt,
        string contentSha256,
        string rawBody,
        CancellationToken cancellationToken);
}

/// <summary>
/// All authenticated SynTrack API calls happen here - the raw
/// DeviceCredential is only ever read from <see cref="ICredentialService"/>
/// by the caller and passed straight into an Authorization header, never
/// logged.
/// </summary>
public sealed class SynTrackApiClient : ISynTrackApiClient
{
    private const string ProtocolVersion = "1";

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    private readonly HttpClient _http;
    private readonly string _apiBaseUrl;

    public SynTrackApiClient(HttpClient http, string apiBaseUrl)
    {
        _http = http;
        _apiBaseUrl = apiBaseUrl.TrimEnd('/');
    }

    public async Task<DeviceLinkCreateResponse> CreateLinkAsync(CancellationToken cancellationToken)
    {
        var response = await _http.PostAsJsonAsync(
            $"{_apiBaseUrl}/client/link",
            new { },
            JsonOptions,
            cancellationToken);

        response.EnsureSuccessStatusCode();

        return (await response.Content.ReadFromJsonAsync<DeviceLinkCreateResponse>(JsonOptions, cancellationToken))!;
    }

    public async Task<DeviceLinkStatusResponse> PollStatusAsync(string deviceCode, CancellationToken cancellationToken)
    {
        var response = await _http.PostAsJsonAsync(
            $"{_apiBaseUrl}/client/link/status",
            new { deviceCode },
            JsonOptions,
            cancellationToken);

        response.EnsureSuccessStatusCode();

        return (await response.Content.ReadFromJsonAsync<DeviceLinkStatusResponse>(JsonOptions, cancellationToken))!;
    }

    public async Task<DeviceConnectStartResponse> StartConnectAsync(
        string? deviceName,
        CancellationToken cancellationToken)
    {
        var response = await _http.PostAsJsonAsync(
            $"{_apiBaseUrl}/client/connect",
            new { deviceName },
            JsonOptions,
            cancellationToken);

        response.EnsureSuccessStatusCode();

        return (await response.Content.ReadFromJsonAsync<DeviceConnectStartResponse>(JsonOptions, cancellationToken))!;
    }

    public async Task<DeviceConnectPollResult> PollConnectStatusAsync(
        string pollToken,
        CancellationToken cancellationToken)
    {
        var response = await _http.PostAsJsonAsync(
            $"{_apiBaseUrl}/client/connect/status",
            new { pollToken },
            JsonOptions,
            cancellationToken);

        if (response.StatusCode == HttpStatusCode.NotFound)
        {
            return new DeviceConnectPollResult { Kind = DeviceConnectPollKind.NotFound };
        }

        response.EnsureSuccessStatusCode();

        var body = await response.Content.ReadFromJsonAsync<DeviceLinkStatusResponse>(JsonOptions, cancellationToken);

        if (body is null)
        {
            return new DeviceConnectPollResult { Kind = DeviceConnectPollKind.NotFound };
        }

        return body.Status switch
        {
            "PENDING" => new DeviceConnectPollResult { Kind = DeviceConnectPollKind.Pending },
            "EXPIRED" => new DeviceConnectPollResult { Kind = DeviceConnectPollKind.Expired },
            "CONSUMED" when body.Credential is not null =>
                new DeviceConnectPollResult
                {
                    Kind = DeviceConnectPollKind.Consumed,
                    Credential = body.Credential
                },
            "CONSUMED" => new DeviceConnectPollResult
            {
                Kind = DeviceConnectPollKind.ConsumedWithoutCredential
            },
            _ => new DeviceConnectPollResult { Kind = DeviceConnectPollKind.NotFound }
        };
    }

    public async Task<ClientProfileFetchResult> GetMeAsync(string deviceToken, CancellationToken cancellationToken)
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, $"{_apiBaseUrl}/client/me");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", deviceToken);

        try
        {
            var response = await _http.SendAsync(request, cancellationToken);

            if (response.StatusCode == HttpStatusCode.Unauthorized)
            {
                return new ClientProfileFetchResult { Health = AccountHealth.SignedOut };
            }

            if (!response.IsSuccessStatusCode)
            {
                return new ClientProfileFetchResult { Health = AccountHealth.ConnectionIssue };
            }

            var body = await response.Content.ReadFromJsonAsync<ClientProfileResponse>(JsonOptions, cancellationToken);

            if (string.Equals(body?.IdentityStatus, "legacy_reconnect_required", StringComparison.OrdinalIgnoreCase))
            {
                return new ClientProfileFetchResult { Health = AccountHealth.ReconnectRequired };
            }

            return new ClientProfileFetchResult
            {
                Health = AccountHealth.FullyConnected,
                BattleTag = body?.BattleTag
            };
        }
        catch (HttpRequestException)
        {
            return new ClientProfileFetchResult { Health = AccountHealth.ConnectionIssue };
        }
        catch (TaskCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            return new ClientProfileFetchResult { Health = AccountHealth.ConnectionIssue };
        }
        catch (JsonException)
        {
            return new ClientProfileFetchResult { Health = AccountHealth.ConnectionIssue };
        }
    }

    public async Task<ClientCharactersFetchResult> GetCharactersAsync(string deviceToken, CancellationToken cancellationToken)
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, $"{_apiBaseUrl}/client/characters");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", deviceToken);

        try
        {
            var response = await _http.SendAsync(request, cancellationToken);

            if (response.StatusCode == HttpStatusCode.Unauthorized)
            {
                return new ClientCharactersFetchResult { Status = ClientCharactersFetchStatus.Unauthorized };
            }

            if (response.StatusCode == HttpStatusCode.Conflict)
            {
                return new ClientCharactersFetchResult { Status = ClientCharactersFetchStatus.LegacyReconnectRequired };
            }

            if (!response.IsSuccessStatusCode)
            {
                return new ClientCharactersFetchResult { Status = ClientCharactersFetchStatus.TemporaryFailure };
            }

            var parsed = await response.Content.ReadFromJsonAsync<ClientCharactersResponse>(JsonOptions, cancellationToken);
            return new ClientCharactersFetchResult
            {
                Status = ClientCharactersFetchStatus.Ok,
                Items = parsed?.Items ?? new List<ClientCharacterSummary>()
            };
        }
        catch (HttpRequestException)
        {
            return new ClientCharactersFetchResult { Status = ClientCharactersFetchStatus.TemporaryFailure };
        }
        catch (TaskCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            return new ClientCharactersFetchResult { Status = ClientCharactersFetchStatus.TemporaryFailure };
        }
        catch (JsonException)
        {
            return new ClientCharactersFetchResult { Status = ClientCharactersFetchStatus.TemporaryFailure };
        }
    }

    public async Task<SyncStatus> SendImportAsync(
        string deviceToken,
        string addon,
        string clientVersion,
        string observedAt,
        string fileModifiedAt,
        string contentSha256,
        string rawBody,
        CancellationToken cancellationToken)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, $"{_apiBaseUrl}/client/import")
        {
            Content = new StringContent(rawBody, Encoding.UTF8, "text/plain")
        };

        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", deviceToken);
        request.Headers.Add("X-SynTrack-Protocol-Version", ProtocolVersion);
        request.Headers.Add("X-SynTrack-Addon", addon);
        request.Headers.Add("X-SynTrack-Client-Version", clientVersion);
        request.Headers.Add("X-SynTrack-Observed-At", observedAt);
        request.Headers.Add("X-SynTrack-File-Modified-At", fileModifiedAt);
        request.Headers.Add("X-SynTrack-Content-SHA256", contentSha256);

        HttpResponseMessage response;

        try
        {
            response = await _http.SendAsync(request, cancellationToken);
        }
        catch (HttpRequestException)
        {
            return SyncStatus.ApiUnavailable;
        }
        catch (TaskCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            return SyncStatus.ApiUnavailable;
        }

        if (response.IsSuccessStatusCode)
        {
            return SyncStatus.Synced;
        }

        var message = await response.Content.ReadAsStringAsync(cancellationToken);
        return SyncStatusExtensions.ClassifyImportError((int)response.StatusCode, message);
    }
}
