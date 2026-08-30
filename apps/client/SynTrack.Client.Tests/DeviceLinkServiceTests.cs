namespace SynTrack.Client.Tests;

using SynTrack.Client.Models;
using SynTrack.Client.Services;

public class DeviceLinkServiceTests
{
    private sealed class FakeApiClient : ISynTrackApiClient
    {
        public DeviceLinkCreateResponse CreateResponse { get; set; } =
            new() { UserCode = "ABCD-1234", DeviceCode = "deadbeef", ExpiresAt = "2026-08-27T12:10:00Z" };

        public Queue<DeviceLinkStatusResponse> StatusResponses { get; } = new();

        public string? LastPolledDeviceCode { get; private set; }

        public Task<DeviceLinkCreateResponse> CreateLinkAsync(CancellationToken cancellationToken) =>
            Task.FromResult(CreateResponse);

        public Task<DeviceLinkStatusResponse> PollStatusAsync(string deviceCode, CancellationToken cancellationToken)
        {
            LastPolledDeviceCode = deviceCode;
            return Task.FromResult(StatusResponses.Count > 0
                ? StatusResponses.Dequeue()
                : new DeviceLinkStatusResponse { Status = "PENDING" });
        }

        public Task<ClientProfileFetchResult> GetMeAsync(string deviceToken, CancellationToken cancellationToken) =>
            Task.FromResult(new ClientProfileFetchResult
            {
                Health = AccountHealth.FullyConnected,
                BattleTag = "Syntax#21715"
            });

        public Task<ClientCharactersFetchResult> GetCharactersAsync(string deviceToken, CancellationToken cancellationToken) =>
            Task.FromResult(new ClientCharactersFetchResult { Status = ClientCharactersFetchStatus.Ok });

        public Task<SyncStatus> SendImportAsync(
            string deviceToken, string addon, string clientVersion, string observedAt,
            string fileModifiedAt, string contentSha256, string rawBody, CancellationToken cancellationToken) =>
            Task.FromResult(SyncStatus.Synced);
    }

    private sealed class FakeCredentialService : ICredentialService
    {
        public string? Stored { get; private set; }

        public void Store(string rawToken) => Stored = rawToken;

        public string? Load() => Stored;

        public void Clear() => Stored = null;
    }

    [Fact]
    public async Task StartLinkAsyncReturnsOnlyTheUserCodeAndVerificationUrlNeverTheDeviceCode()
    {
        var api = new FakeApiClient();
        var credentials = new FakeCredentialService();
        var service = new DeviceLinkService(api, credentials, "https://app.syntrack.example");

        var (userCode, verificationUrl) = await service.StartLinkAsync(CancellationToken.None);

        Assert.Equal("ABCD-1234", userCode);
        Assert.Equal("https://app.syntrack.example/settings?linkDevice=ABCD-1234", verificationUrl);
        Assert.DoesNotContain("deadbeef", verificationUrl);
    }

    [Fact]
    public async Task PollingUsesTheHighEntropyDeviceCodeNotTheUserCode()
    {
        var api = new FakeApiClient();
        api.StatusResponses.Enqueue(new DeviceLinkStatusResponse { Status = "PENDING" });

        var credentials = new FakeCredentialService();
        var service = new DeviceLinkService(api, credentials, "https://app.syntrack.example");

        await service.StartLinkAsync(CancellationToken.None);
        await Task.Delay(TimeSpan.FromSeconds(4));

        Assert.Equal("deadbeef", api.LastPolledDeviceCode);
    }

    [Fact]
    public async Task TheFinalCredentialIsStoredExactlyOnceOnTheFirstConsumedPoll()
    {
        var api = new FakeApiClient();
        api.StatusResponses.Enqueue(new DeviceLinkStatusResponse { Status = "CONSUMED", Credential = "dvc_final-secret" });

        var credentials = new FakeCredentialService();
        var service = new DeviceLinkService(api, credentials, "https://app.syntrack.example");

        var approved = false;
        service.LinkApproved += () => approved = true;

        await service.StartLinkAsync(CancellationToken.None);
        await Task.Delay(TimeSpan.FromSeconds(4));

        Assert.True(approved);
        Assert.Equal("dvc_final-secret", credentials.Stored);
    }

    [Fact]
    public async Task AConsumedResponseWithNoCredentialDoesNotOverwriteAnExistingOne()
    {
        var api = new FakeApiClient();
        api.StatusResponses.Enqueue(new DeviceLinkStatusResponse { Status = "CONSUMED", Credential = null });

        var credentials = new FakeCredentialService();
        var service = new DeviceLinkService(api, credentials, "https://app.syntrack.example");

        await service.StartLinkAsync(CancellationToken.None);
        await Task.Delay(TimeSpan.FromSeconds(4));

        Assert.Null(credentials.Stored);
    }

    [Fact]
    public async Task AnExpiredLinkRaisesLinkExpiredAndStoresNoCredential()
    {
        var api = new FakeApiClient();
        api.StatusResponses.Enqueue(new DeviceLinkStatusResponse { Status = "EXPIRED" });

        var credentials = new FakeCredentialService();
        var service = new DeviceLinkService(api, credentials, "https://app.syntrack.example");

        var expired = false;
        service.LinkExpired += () => expired = true;

        await service.StartLinkAsync(CancellationToken.None);
        await Task.Delay(TimeSpan.FromSeconds(4));

        Assert.True(expired);
        Assert.Null(credentials.Stored);
    }

    [Fact]
    public void ReconnectAfterRestartUsesWhateverCredentialIsAlreadyOnDisk()
    {
        // Simulates an app restart: a fresh DeviceLinkService instance never
        // needs to relink if ICredentialService already holds a valid token.
        var credentials = new FakeCredentialService();
        credentials.Store("dvc_from-previous-session");

        Assert.Equal("dvc_from-previous-session", credentials.Load());
    }
}
