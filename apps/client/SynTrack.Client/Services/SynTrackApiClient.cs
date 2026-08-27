namespace SynTrack.Client.Services;

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
