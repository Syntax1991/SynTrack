namespace SynTrack.Client.Tests;

using System.Windows.Threading;
using SynTrack.Client.Models;
using SynTrack.Client.Services;
using SynTrack.Client.ViewModels;

/// <summary>
/// Covers the character roster panel: loaded automatically alongside the
/// profile on startup-if-already-connected and on approval, cleared on
/// sign-out, and a failed fetch must surface only as CharactersError -
/// never throw, and never affect sync/watcher state.
/// </summary>
public class MainViewModelCharactersTests
{
    private sealed class FakeWowDiscoveryService : IWowDiscoveryService
    {
        public IReadOnlyList<string> CandidateInstallPaths() => Array.Empty<string>();

        public string? ResolveWowInstall(string? configuredPath) => configuredPath;
    }

    private sealed class FakeWowAccountDiscoveryService : IWowAccountDiscoveryService
    {
        public IReadOnlyList<AccountCandidate> DiscoverAccounts(string wowPath) => Array.Empty<AccountCandidate>();
    }

    private sealed class FakeClientSettingsService : IClientSettingsService
    {
        private readonly ClientSettings _settings = new();

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
        private string? _stored;

        public FakeCredentialService(string? initial) => _stored = initial;

        public void Store(string rawToken) => _stored = rawToken;

        public string? Load() => _stored;

        public void Clear() => _stored = null;
    }

    private sealed class FakeApiClient : ISynTrackApiClient
    {
        public List<ClientCharacterSummary> NextCharacters { get; } = new();

        public bool ThrowOnGetCharacters { get; set; }

        public int GetCharactersCallCount { get; private set; }

        public Task<DeviceLinkCreateResponse> CreateLinkAsync(CancellationToken cancellationToken) =>
            throw new NotSupportedException();

        public Task<DeviceLinkStatusResponse> PollStatusAsync(string deviceCode, CancellationToken cancellationToken) =>
            throw new NotSupportedException();

        public Task<ClientProfileResponse?> GetMeAsync(string deviceToken, CancellationToken cancellationToken) =>
            Task.FromResult<ClientProfileResponse?>(null);

        public Task<IReadOnlyList<ClientCharacterSummary>> GetCharactersAsync(string deviceToken, CancellationToken cancellationToken)
        {
            GetCharactersCallCount++;

            if (ThrowOnGetCharacters)
            {
                throw new HttpRequestException("simulated failure");
            }

            return Task.FromResult<IReadOnlyList<ClientCharacterSummary>>(NextCharacters);
        }

        public Task<SyncStatus> SendImportAsync(
            string deviceToken, string addon, string clientVersion, string observedAt,
            string fileModifiedAt, string contentSha256, string rawBody, CancellationToken cancellationToken) =>
            Task.FromResult(SyncStatus.Synced);
    }

    private static void PumpDispatcher(TimeSpan duration)
    {
        var frame = new DispatcherFrame();

        var timer = new DispatcherTimer(DispatcherPriority.Background)
        {
            Interval = duration
        };

        timer.Tick += (_, _) =>
        {
            frame.Continue = false;
            timer.Stop();
        };

        timer.Start();
        Dispatcher.PushFrame(frame);
    }

    private static (MainViewModel viewModel, FakeApiClient api) Build(
        string? existingCredential,
        Action<FakeApiClient>? configureApi = null)
    {
        var settingsService = new FakeClientSettingsService();
        var credentials = new FakeCredentialService(existingCredential);
        var api = new FakeApiClient();
        configureApi?.Invoke(api);
        var deviceLinkService = new DeviceLinkService(api, credentials, "https://app.syntrack.example");
        var syncEngine = new SyncEngine(credentials, api, settingsService, new SyncGate(), "0.0.0-test");
        var logger = new ClientLogger(Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString()));

        var viewModel = new MainViewModel(
            new FakeWowDiscoveryService(),
            new FakeWowAccountDiscoveryService(),
            settingsService,
            credentials,
            api,
            deviceLinkService,
            syncEngine,
            new SavedVariablesWatcherService(),
            new AutoStartService(),
            logger,
            "https://app.syntrack.example");

        return (viewModel, api);
    }

    [Fact]
    public void ASignedOutStartHasAnEmptyRosterAndNeverCallsTheRosterEndpoint()
    {
        var (viewModel, api) = Build(existingCredential: null);

        Assert.Empty(viewModel.Characters);
        Assert.Equal(0, api.GetCharactersCallCount);
    }

    [Fact]
    public void AnAlreadyConnectedStartupLoadsTheRoster()
    {
        var (viewModel, api) = Build(
            existingCredential: "dvc_existing",
            configureApi: fake => fake.NextCharacters.AddRange(new[]
            {
                new ClientCharacterSummary
                {
                    Id = "char-1",
                    Name = "Synblast",
                    Realm = "Antonidas",
                    ClassName = "Mage",
                    Level = 80,
                    ItemLevel = 312.3,
                    LastSyncedAt = DateTimeOffset.UtcNow
                }
            }));

        PumpDispatcher(TimeSpan.FromMilliseconds(500));

        Assert.Single(viewModel.Characters);
        Assert.Equal("Synblast", viewModel.Characters[0].Name);
        Assert.Null(viewModel.CharactersError);
    }

    [Fact]
    public void ARosterFetchFailureSetsCharactersErrorWithoutThrowingAndWithoutAffectingSync()
    {
        var (viewModel, api) = Build(
            existingCredential: "dvc_existing",
            configureApi: fake => fake.ThrowOnGetCharacters = true);

        var exception = Record.Exception(() => PumpDispatcher(TimeSpan.FromMilliseconds(500)));

        Assert.Null(exception);
        Assert.Empty(viewModel.Characters);
        Assert.NotNull(viewModel.CharactersError);
        Assert.True(api.GetCharactersCallCount > 0);
    }

    [Fact]
    public async Task ARosterFetchFailureDoesNotPreventSyncFromSucceeding()
    {
        var (viewModel, _) = Build(
            existingCredential: "dvc_existing",
            configureApi: fake => fake.ThrowOnGetCharacters = true);

        PumpDispatcher(TimeSpan.FromMilliseconds(500));

        await viewModel.SyncNowCommand.ExecuteAsync(null);

        // No WoW path configured in this fixture - see the equivalent
        // profile-fetch-failure test for why WaitingForData, not Synced,
        // is the correct "reached its ordinary outcome" assertion here.
        Assert.Equal(SyncStatus.WaitingForData, viewModel.SyncStatus);
    }

    [Fact]
    public void DisconnectingClearsTheRosterAndAnyRosterError()
    {
        var (viewModel, _) = Build(
            existingCredential: "dvc_existing",
            configureApi: fake => fake.NextCharacters.Add(new ClientCharacterSummary
            {
                Id = "char-1",
                Name = "Synblast",
                Realm = "Antonidas",
                ClassName = "Mage",
                Level = 80
            }));

        PumpDispatcher(TimeSpan.FromMilliseconds(500));
        Assert.Single(viewModel.Characters);

        viewModel.DisconnectCommand.Execute(null);

        Assert.Empty(viewModel.Characters);
        Assert.Null(viewModel.CharactersError);
    }
}
