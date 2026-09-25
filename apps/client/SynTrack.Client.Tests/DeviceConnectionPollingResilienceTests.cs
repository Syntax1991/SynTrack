namespace SynTrack.Client.Tests;

using System.Text.Json;
using SynTrack.Client.Models;
using SynTrack.Client.Services;

/// <summary>
/// A flaky network or a proxy error page during POLL must not silently
/// stop polling (the UI would wait forever), and polling must still end.
/// </summary>
public class DeviceConnectionPollingResilienceTests
{
    private sealed class Browser : IBrowserLauncher
    {
        public bool TryOpen(string url) => true;
    }

    private sealed class Credentials : ICredentialService
    {
        public List<string> Stores { get; } = new();

        public void Store(string rawToken) => Stores.Add(rawToken);

        public string? Load() => Stores.LastOrDefault();

        public void Clear() => Stores.Clear();
    }

    private sealed class ScriptedApi : ISynTrackApiClient
    {
        public DeviceConnectStartResponse Start { get; set; } = new()
        {
            BrowserUrl = "https://syntrack.io/client/connect?token=browser-secret",
            PollToken = "poll-secret",
            ExpiresAt = DateTimeOffset.UtcNow.AddMinutes(10).ToString("O")
        };

        public Queue<Func<DeviceConnectPollResult>> Polls { get; } = new();

        public int PollCount { get; private set; }

        public Task<DeviceConnectStartResponse> StartConnectAsync(string? deviceName, CancellationToken cancellationToken) =>
            Task.FromResult(Start);

        public Task<DeviceConnectPollResult> PollConnectStatusAsync(string pollToken, CancellationToken cancellationToken)
        {
            PollCount++;
            return Task.FromResult(Polls.Count > 0
                ? Polls.Dequeue()()
                : new DeviceConnectPollResult { Kind = DeviceConnectPollKind.Pending });
        }

        public Task<DeviceLinkCreateResponse> CreateLinkAsync(CancellationToken cancellationToken) => throw new NotSupportedException();

        public Task<DeviceLinkStatusResponse> PollStatusAsync(string deviceCode, CancellationToken cancellationToken) => throw new NotSupportedException();

        public Task<ClientProfileFetchResult> GetMeAsync(string deviceToken, CancellationToken cancellationToken) => throw new NotSupportedException();

        public Task<ClientCharactersFetchResult> GetCharactersAsync(string deviceToken, CancellationToken cancellationToken) => throw new NotSupportedException();

        public Task<SyncStatus> SendImportAsync(string deviceToken, string addon, string clientVersion, string observedAt,
            string fileModifiedAt, string contentSha256, string rawBody, CancellationToken cancellationToken) => throw new NotSupportedException();
    }

    private static async Task WaitFor(Func<bool> condition)
    {
        var deadline = DateTime.UtcNow.AddSeconds(5);
        while (!condition() && DateTime.UtcNow < deadline)
        {
            await Task.Delay(10);
        }
    }

    private static DeviceConnectPollResult Consumed() =>
        new() { Kind = DeviceConnectPollKind.Consumed, Credential = "dvc_once" };

    [Fact]
    public async Task TransientNetworkTimeoutAndGarbledBodiesAreRetriedUntilConsumed()
    {
        var api = new ScriptedApi();
        api.Polls.Enqueue(() => throw new HttpRequestException("reset"));
        api.Polls.Enqueue(() => throw new TaskCanceledException("HttpClient.Timeout"));
        api.Polls.Enqueue(() => throw new JsonException("'<' is an invalid start of a value"));
        api.Polls.Enqueue(() => throw new NotSupportedException("text/html"));
        api.Polls.Enqueue(Consumed);

        var credentials = new Credentials();
        var service = new DeviceConnectionService(api, credentials, new Browser(), TimeSpan.FromMilliseconds(5));
        var completed = 0;
        service.Completed += () => completed++;

        await service.StartAsync("PC", CancellationToken.None);
        await WaitFor(() => completed > 0);

        Assert.Equal(1, completed);
        Assert.Equal(5, api.PollCount);
        Assert.Equal(new[] { "dvc_once" }, credentials.Stores);
    }

    [Fact]
    public async Task PersistentNetworkFailureStopsAtTheLocalDeadlineAsExpired()
    {
        var now = DateTimeOffset.UtcNow;
        var clock = now;
        var api = new ScriptedApi
        {
            Start = new()
            {
                BrowserUrl = "https://syntrack.io/client/connect?token=t",
                PollToken = "poll-secret",
                ExpiresAt = now.AddMinutes(10).ToString("O"),
                ServerDate = now
            }
        };
        for (var i = 0; i < 1000; i++)
        {
            api.Polls.Enqueue(() =>
            {
                clock = clock.AddMinutes(1);
                throw new HttpRequestException("offline");
            });
        }

        var service = new DeviceConnectionService(api, new Credentials(), new Browser(), TimeSpan.FromMilliseconds(1), () => clock);
        var expired = 0;
        service.Expired += () => expired++;

        await service.StartAsync("PC", CancellationToken.None);
        await WaitFor(() => expired > 0);

        Assert.Equal(1, expired);
        Assert.InRange(api.PollCount, 9, 11);
    }

    [Fact]
    public void ALocalClockAheadOfTheServerDoesNotExpireTheConnectionInstantly()
    {
        var serverNow = new DateTimeOffset(2026, 9, 25, 12, 0, 0, TimeSpan.Zero);
        var skewedLocalNow = serverNow.AddHours(3);
        var created = new DeviceConnectStartResponse
        {
            BrowserUrl = "https://syntrack.io/client/connect?token=t",
            PollToken = "p",
            ExpiresAt = serverNow.AddMinutes(10).ToString("O"),
            ServerDate = serverNow
        };

        var deadline = DeviceConnectionService.ComputeLocalDeadline(created, skewedLocalNow);

        Assert.Equal(skewedLocalNow.AddMinutes(10), deadline);
    }

    [Fact]
    public void ABogusFarFutureExpiryIsClampedSoPollingCannotRunForever()
    {
        var now = new DateTimeOffset(2026, 9, 25, 12, 0, 0, TimeSpan.Zero);
        var created = new DeviceConnectStartResponse
        {
            BrowserUrl = "https://syntrack.io/client/connect?token=t",
            PollToken = "p",
            ExpiresAt = now.AddYears(5).ToString("O")
        };

        var deadline = DeviceConnectionService.ComputeLocalDeadline(created, now);

        Assert.Equal(now + DeviceConnectionService.MaxPollWindow, deadline);
    }

    [Fact]
    public async Task AnInvalidStartContractFailsSafelyBeforeOpeningTheBrowser()
    {
        var api = new ScriptedApi
        {
            Start = new() { BrowserUrl = "https://syntrack.io/client/connect?token=t", PollToken = "p", ExpiresAt = "soon" }
        };
        var service = new DeviceConnectionService(api, new Credentials(), new Browser(), TimeSpan.FromMilliseconds(5));

        var error = await Assert.ThrowsAsync<DeviceConnectStartException>(() => service.StartAsync("PC", CancellationToken.None));

        Assert.Equal(DeviceConnectStartFailure.InvalidResponse, error.Failure);
        Assert.Null(service.BrowserUrl);
        Assert.Equal(0, api.PollCount);
    }
}
