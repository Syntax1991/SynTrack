namespace SynTrack.Client.Tests;

using SynTrack.Client.Models;
using SynTrack.Client.Services;
using SynTrack.Client.ViewModels;

/// <summary>
/// Reproduces a real defect: a persisted AccountName was already usable by
/// RestartWatcherIfReady on startup, but the "WoW Account" ComboBox binds
/// via SelectedValue against AccountCandidates - a collection that was only
/// ever populated from SetWowPath (manual Detect/Browse), never from the
/// constructor. A returning user with a valid persisted account saw an
/// empty dropdown until clicking Detect again, even though the watcher was
/// already correctly targeting their account the whole time.
/// </summary>
public class MainViewModelAccountRestoreTests
{
    private sealed class FakeWowDiscoveryService : IWowDiscoveryService
    {
        public IReadOnlyList<string> CandidateInstallPaths() => Array.Empty<string>();

        public string? ResolveWowInstall(string? configuredPath) => configuredPath;
    }

    private sealed class FakeWowAccountDiscoveryService : IWowAccountDiscoveryService
    {
        public IReadOnlyList<AccountCandidate> DiscoverAccounts(string wowPath) =>
            new[] { new AccountCandidate("470469221#1", true, "SynTrack_Professions.lua") };
    }

    private sealed class FakeClientSettingsService : IClientSettingsService
    {
        private readonly ClientSettings _settings;

        public FakeClientSettingsService(ClientSettings settings) => _settings = settings;

        public ClientSettings Load() => _settings;

        public void Save(ClientSettings settings)
        {
        }

        public SyncGate LoadSyncGate() => new();

        public void SaveSyncGate(SyncGate gate)
        {
        }
    }

    private sealed class FakeCredentialService : ICredentialService
    {
        public void Store(string rawToken)
        {
        }

        public string? Load() => null;

        public void Clear()
        {
        }
    }

    private sealed class FakeApiClient : ISynTrackApiClient
    {
        public Task<DeviceLinkCreateResponse> CreateLinkAsync(CancellationToken cancellationToken) =>
            throw new NotSupportedException();

        public Task<DeviceLinkStatusResponse> PollStatusAsync(string deviceCode, CancellationToken cancellationToken) =>
            throw new NotSupportedException();

        public Task<ClientProfileResponse?> GetMeAsync(string deviceToken, CancellationToken cancellationToken) =>
            Task.FromResult<ClientProfileResponse?>(null);

        public Task<IReadOnlyList<ClientCharacterSummary>> GetCharactersAsync(string deviceToken, CancellationToken cancellationToken) =>
            Task.FromResult<IReadOnlyList<ClientCharacterSummary>>(Array.Empty<ClientCharacterSummary>());

        public Task<SyncStatus> SendImportAsync(
            string deviceToken, string addon, string clientVersion, string observedAt,
            string fileModifiedAt, string contentSha256, string rawBody, CancellationToken cancellationToken) =>
            throw new NotSupportedException();
    }

    private static MainViewModel BuildViewModel(ClientSettings persistedSettings)
    {
        var settingsService = new FakeClientSettingsService(persistedSettings);
        var credentialService = new FakeCredentialService();
        var apiClient = new FakeApiClient();
        var deviceLinkService = new DeviceLinkService(apiClient, credentialService, "https://app.syntrack.example");
        var syncEngine = new SyncEngine(credentialService, apiClient, settingsService, new SyncGate(), "0.0.0-test");
        var logger = new ClientLogger(Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString()));

        return new MainViewModel(
            new FakeWowDiscoveryService(),
            new FakeWowAccountDiscoveryService(),
            settingsService,
            credentialService,
            apiClient,
            deviceLinkService,
            syncEngine,
            new SavedVariablesWatcherService(),
            new AutoStartService(),
            logger,
            "https://app.syntrack.example");
    }

    [Fact]
    public void APersistedAccountIsPopulatedIntoAccountCandidatesOnStartup()
    {
        var viewModel = BuildViewModel(new ClientSettings
        {
            WowPath = "C:/Games/World of Warcraft",
            AccountName = "470469221#1"
        });

        Assert.Contains(viewModel.AccountCandidates, candidate => candidate.AccountName == "470469221#1");
    }

    [Fact]
    public void APersistedAccountNameStillMatchesAResolvedCandidateAfterStartup()
    {
        var viewModel = BuildViewModel(new ClientSettings
        {
            WowPath = "C:/Games/World of Warcraft",
            AccountName = "470469221#1"
        });

        // This is exactly what the ComboBox's SelectedValue binding needs:
        // AccountName must equal one of AccountCandidates' AccountName
        // values, not just be a "correct" string in isolation.
        Assert.Equal(viewModel.AccountName, Assert.Single(viewModel.AccountCandidates).AccountName);
    }

    [Fact]
    public void NoWowPathYetLeavesAccountCandidatesEmptyWithoutThrowing()
    {
        var viewModel = BuildViewModel(new ClientSettings());

        Assert.Empty(viewModel.AccountCandidates);
    }
}
