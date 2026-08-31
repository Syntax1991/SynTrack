namespace SynTrack.Client.Tests;

using SynTrack.Client.Models;
using SynTrack.Client.Services;

public class DeviceConnectionServiceTests
{
    private sealed class FakeBrowserLauncher : IBrowserLauncher
    {
        public bool OpenResult { get; set; } = true;
        public string? LastUrl { get; private set; }
        public int OpenCount { get; private set; }

        public bool TryOpen(string url)
        {
            LastUrl = url;
            OpenCount++;
            return OpenResult;
        }
    }

    private sealed class FakeCredentialService : ICredentialService
    {
        public string? Stored { get; private set; }
        public bool ThrowOnStore { get; set; }

        public void Store(string rawToken)
        {
            if (ThrowOnStore)
            {
                throw new InvalidOperationException("dpapi failed");
            }

            Stored = rawToken;
        }

        public string? Load() => Stored;

        public void Clear() => Stored = null;
    }

    private sealed class FakeApiClient : ISynTrackApiClient
    {
        public DeviceConnectStartResponse StartResponse { get; set; } =
            new()
            {
                BrowserUrl = "https://app.syntrack.example/connect/abc",
                PollToken = "poll-secret",
                ExpiresAt = DateTimeOffset.UtcNow.AddMinutes(10).ToString("O")
            };

        public Queue<DeviceConnectPollResult> Polls { get; } = new();
        public string? LastPollToken { get; private set; }
        public string? LastDeviceName { get; private set; }
        public int PollCount { get; private set; }

        public Task<DeviceLinkCreateResponse> CreateLinkAsync(CancellationToken cancellationToken) =>
            throw new NotSupportedException();

        public Task<DeviceLinkStatusResponse> PollStatusAsync(string deviceCode, CancellationToken cancellationToken) =>
            throw new NotSupportedException();

        public Task<DeviceConnectStartResponse> StartConnectAsync(string? deviceName, CancellationToken cancellationToken)
        {
            LastDeviceName = deviceName;
            return Task.FromResult(StartResponse);
        }

        public Task<DeviceConnectPollResult> PollConnectStatusAsync(string pollToken, CancellationToken cancellationToken)
        {
            PollCount++;
            LastPollToken = pollToken;
            return Task.FromResult(Polls.Count > 0
                ? Polls.Dequeue()
                : new DeviceConnectPollResult { Kind = DeviceConnectPollKind.Pending });
        }

        public Task<ClientProfileFetchResult> GetMeAsync(string deviceToken, CancellationToken cancellationToken) =>
            throw new NotSupportedException();

        public Task<ClientCharactersFetchResult> GetCharactersAsync(string deviceToken, CancellationToken cancellationToken) =>
            throw new NotSupportedException();

        public Task<SyncStatus> SendImportAsync(
            string deviceToken, string addon, string clientVersion, string observedAt,
            string fileModifiedAt, string contentSha256, string rawBody, CancellationToken cancellationToken) =>
            throw new NotSupportedException();
    }

    private static DeviceConnectionService CreateService(
        FakeApiClient api,
        FakeCredentialService credentials,
        FakeBrowserLauncher browser) =>
        new(api, credentials, browser, TimeSpan.FromMilliseconds(20));

    [Fact]
    public async Task StartOpensTheSystemBrowserWithBrowserUrlAndNeverExposesThePollTokenOnTheOutcome()
    {
        var api = new FakeApiClient();
        var credentials = new FakeCredentialService();
        var browser = new FakeBrowserLauncher();
        var service = CreateService(api, credentials, browser);

        var outcome = await service.StartAsync("DESKTOP-TEST", CancellationToken.None);

        Assert.Equal("https://app.syntrack.example/connect/abc", outcome.BrowserUrl);
        Assert.True(outcome.BrowserOpened);
        Assert.Equal("https://app.syntrack.example/connect/abc", browser.LastUrl);
        Assert.Equal("DESKTOP-TEST", api.LastDeviceName);
        Assert.Null(typeof(DeviceConnectStartOutcome).GetProperty("PollToken"));
    }

    [Fact]
    public async Task TheCredentialIsStoredExactlyOnceOnTheFirstConsumedPoll()
    {
        var api = new FakeApiClient();
        api.Polls.Enqueue(new DeviceConnectPollResult
        {
            Kind = DeviceConnectPollKind.Consumed,
            Credential = "dvc_final-secret"
        });
        var credentials = new FakeCredentialService();
        var browser = new FakeBrowserLauncher();
        var service = CreateService(api, credentials, browser);

        var completed = false;
        service.Completed += () => completed = true;

        await service.StartAsync("pc", CancellationToken.None);
        await Task.Delay(80);

        Assert.True(completed);
        Assert.Equal("dvc_final-secret", credentials.Stored);
        Assert.Equal("poll-secret", api.LastPollToken);
    }

    [Fact]
    public async Task ConsumedWithoutCredentialDoesNotInventALogin()
    {
        var api = new FakeApiClient();
        api.Polls.Enqueue(new DeviceConnectPollResult
        {
            Kind = DeviceConnectPollKind.ConsumedWithoutCredential
        });
        var credentials = new FakeCredentialService();
        var service = CreateService(api, credentials, new FakeBrowserLauncher());

        var consumed = false;
        service.ConsumedWithoutCredential += () => consumed = true;

        await service.StartAsync("pc", CancellationToken.None);
        await Task.Delay(80);

        Assert.True(consumed);
        Assert.Null(credentials.Stored);
    }

    [Fact]
    public async Task StorageFailureStopsPollingWithoutADurableCopy()
    {
        var api = new FakeApiClient();
        api.Polls.Enqueue(new DeviceConnectPollResult
        {
            Kind = DeviceConnectPollKind.Consumed,
            Credential = "dvc_final-secret"
        });
        var credentials = new FakeCredentialService { ThrowOnStore = true };
        var service = CreateService(api, credentials, new FakeBrowserLauncher());

        var failed = false;
        service.StorageFailed += () => failed = true;

        await service.StartAsync("pc", CancellationToken.None);
        await Task.Delay(80);

        Assert.True(failed);
        Assert.Null(credentials.Stored);
        var pollsAfterFailure = api.PollCount;
        await Task.Delay(80);
        Assert.Equal(pollsAfterFailure, api.PollCount);
    }

    [Fact]
    public async Task CancelStopsPollingAndStoresNothing()
    {
        var api = new FakeApiClient();
        var credentials = new FakeCredentialService();
        var service = CreateService(api, credentials, new FakeBrowserLauncher());

        await service.StartAsync("pc", CancellationToken.None);
        service.Cancel();
        await Task.Delay(80);

        Assert.Null(credentials.Stored);
    }

    [Fact]
    public async Task BrowserOpenFailureStillReturnsTheUrlForCopyFallback()
    {
        var api = new FakeApiClient();
        var browser = new FakeBrowserLauncher { OpenResult = false };
        var service = CreateService(api, new FakeCredentialService(), browser);

        var outcome = await service.StartAsync("pc", CancellationToken.None);

        Assert.False(outcome.BrowserOpened);
        Assert.Equal("https://app.syntrack.example/connect/abc", outcome.BrowserUrl);
    }

    [Fact]
    public async Task ExpiredStatusRaisesExpiredAndStoresNoCredential()
    {
        var api = new FakeApiClient();
        api.Polls.Enqueue(new DeviceConnectPollResult { Kind = DeviceConnectPollKind.Expired });
        var credentials = new FakeCredentialService();
        var service = CreateService(api, credentials, new FakeBrowserLauncher());

        var expired = false;
        service.Expired += () => expired = true;

        await service.StartAsync("pc", CancellationToken.None);
        await Task.Delay(80);

        Assert.True(expired);
        Assert.Null(credentials.Stored);
    }

    [Fact]
    public async Task UnknownPollTokenRaisesInvalid()
    {
        var api = new FakeApiClient();
        api.Polls.Enqueue(new DeviceConnectPollResult { Kind = DeviceConnectPollKind.NotFound });
        var service = CreateService(api, new FakeCredentialService(), new FakeBrowserLauncher());

        var invalid = false;
        service.Invalid += () => invalid = true;

        await service.StartAsync("pc", CancellationToken.None);
        await Task.Delay(80);

        Assert.True(invalid);
    }
}
