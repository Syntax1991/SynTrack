namespace SynTrack.Client.Tests;

using SynTrack.Client.Models;
using SynTrack.Client.Services;

public class SyncEngineTests : IDisposable
{
    private readonly string _tempDir = Path.Combine(Path.GetTempPath(), "syntrack-client-tests-" + Guid.NewGuid());

    private sealed class FakeCredentialService : ICredentialService
    {
        public string? Token { get; set; }

        public void Store(string rawToken) => Token = rawToken;

        public string? Load() => Token;

        public void Clear() => Token = null;
    }

    private sealed class FakeApiClient : ISynTrackApiClient
    {
        public SyncStatus NextResult { get; set; } = SyncStatus.Synced;

        public int SendImportCallCount { get; private set; }

        public Task<DeviceLinkCreateResponse> CreateLinkAsync(CancellationToken cancellationToken) =>
            throw new NotSupportedException();

        public Task<DeviceLinkStatusResponse> PollStatusAsync(string deviceCode, CancellationToken cancellationToken) =>
            throw new NotSupportedException();

        public Task<DeviceConnectStartResponse> StartConnectAsync(string? deviceName, CancellationToken cancellationToken) =>
            throw new NotSupportedException();

        public Task<DeviceConnectPollResult> PollConnectStatusAsync(string pollToken, CancellationToken cancellationToken) =>
            throw new NotSupportedException();

        public Task<ClientProfileFetchResult> GetMeAsync(string deviceToken, CancellationToken cancellationToken) =>
            throw new NotSupportedException();

        public Task<ClientCharactersFetchResult> GetCharactersAsync(string deviceToken, CancellationToken cancellationToken) =>
            throw new NotSupportedException();

        public Task<SyncStatus> SendImportAsync(
            string deviceToken, string addon, string clientVersion, string observedAt,
            string fileModifiedAt, string contentSha256, string rawBody, CancellationToken cancellationToken)
        {
            SendImportCallCount++;
            return Task.FromResult(NextResult);
        }
    }

    private (SyncEngine engine, FakeApiClient api, ClientSettingsService settingsService) BuildEngine(FakeCredentialService credentials)
    {
        var settingsService = new ClientSettingsService(_tempDir);
        var api = new FakeApiClient();
        var engine = new SyncEngine(credentials, api, settingsService, new SyncGate(), "0.1.0");
        return (engine, api, settingsService);
    }

    private string CreateAccount(string accountName, string? coreContent = "SynTrackCoreDB = {}")
    {
        var savedVariablesDir = WowAccountDiscoveryService.SavedVariablesDir(_tempDir, accountName);
        Directory.CreateDirectory(savedVariablesDir);

        if (coreContent is not null)
        {
            File.WriteAllText(Path.Combine(savedVariablesDir, AcceptedFiles.CoreFile), coreContent);
        }

        return savedVariablesDir;
    }

    [Fact]
    public async Task NoWowPathOrAccountReportsWaitingForData()
    {
        var (engine, _, _) = BuildEngine(new FakeCredentialService { Token = "dvc_token" });

        var status = await engine.PerformSyncAsync(new ClientSettings(), CancellationToken.None);

        Assert.Equal(SyncStatus.WaitingForData, status);
    }

    [Fact]
    public async Task NoStoredCredentialReportsAuthenticationRequired()
    {
        var (engine, _, _) = BuildEngine(new FakeCredentialService());
        CreateAccount("Account1");

        var status = await engine.PerformSyncAsync(
            new ClientSettings { WowPath = _tempDir, AccountName = "Account1" },
            CancellationToken.None);

        Assert.Equal(SyncStatus.AuthenticationRequired, status);
    }

    [Fact]
    public async Task AFreshFileIsUploadedAndReportsSynced()
    {
        var (engine, api, _) = BuildEngine(new FakeCredentialService { Token = "dvc_token" });
        CreateAccount("Account1");

        var status = await engine.PerformSyncAsync(
            new ClientSettings { WowPath = _tempDir, AccountName = "Account1" },
            CancellationToken.None);

        Assert.Equal(SyncStatus.Synced, status);
        Assert.Equal(1, api.SendImportCallCount);
    }

    [Fact]
    public async Task AnUnchangedFileIsSkippedOnTheSecondSync()
    {
        var (engine, api, _) = BuildEngine(new FakeCredentialService { Token = "dvc_token" });
        var settings = new ClientSettings { WowPath = _tempDir, AccountName = "Account1" };
        CreateAccount("Account1");

        await engine.PerformSyncAsync(settings, CancellationToken.None);
        var second = await engine.PerformSyncAsync(settings, CancellationToken.None);

        Assert.Equal(SyncStatus.NoChanges, second);
        Assert.Equal(1, api.SendImportCallCount);
    }

    [Fact]
    public async Task ChangedContentIsUploadedAgain()
    {
        var (engine, api, _) = BuildEngine(new FakeCredentialService { Token = "dvc_token" });
        var settings = new ClientSettings { WowPath = _tempDir, AccountName = "Account1" };
        var dir = CreateAccount("Account1");

        await engine.PerformSyncAsync(settings, CancellationToken.None);

        File.WriteAllText(Path.Combine(dir, AcceptedFiles.CoreFile), "SynTrackCoreDB = { changed = true }");
        var second = await engine.PerformSyncAsync(settings, CancellationToken.None);

        Assert.Equal(SyncStatus.Synced, second);
        Assert.Equal(2, api.SendImportCallCount);
    }

    [Fact]
    public async Task AFailedUploadDoesNotMarkTheHashSuccessfulSoItRetriesNextTime()
    {
        var credentials = new FakeCredentialService { Token = "dvc_token" };
        var settingsService = new ClientSettingsService(_tempDir);
        var api = new FakeApiClient { NextResult = SyncStatus.ValidationError };
        var engine = new SyncEngine(credentials, api, settingsService, new SyncGate(), "0.1.0");

        var settings = new ClientSettings { WowPath = _tempDir, AccountName = "Account1" };
        CreateAccount("Account1");

        var first = await engine.PerformSyncAsync(settings, CancellationToken.None);
        Assert.Equal(SyncStatus.ValidationError, first);

        api.NextResult = SyncStatus.Synced;
        var second = await engine.PerformSyncAsync(settings, CancellationToken.None);

        // The hash from the failed attempt was never recorded as
        // successful, so the unchanged content is still uploaded again.
        Assert.Equal(SyncStatus.Synced, second);
        Assert.Equal(2, api.SendImportCallCount);
    }

    [Fact]
    public async Task ProfessionsCanonicalFileIsPreferredOverLegacyDuringSync()
    {
        var (engine, api, _) = BuildEngine(new FakeCredentialService { Token = "dvc_token" });
        var dir = CreateAccount("Account1");
        File.WriteAllText(Path.Combine(dir, AcceptedFiles.ProfessionsCanonicalFile), "ProfessionTrackerDB = { canonical = true }");
        File.WriteAllText(Path.Combine(dir, AcceptedFiles.ProfessionsLegacyFile), "ProfessionTrackerDB = { legacy = true }");

        await engine.PerformSyncAsync(
            new ClientSettings { WowPath = _tempDir, AccountName = "Account1" },
            CancellationToken.None);

        // Core + canonical professions = 2 uploads, never the legacy file too.
        Assert.Equal(2, api.SendImportCallCount);
    }

    public void Dispose()
    {
        if (Directory.Exists(_tempDir))
        {
            Directory.Delete(_tempDir, recursive: true);
        }
    }
}
