namespace SynTrack.Client.Tests;

using System.Windows.Threading;
using SynTrack.Client.Models;
using SynTrack.Client.Services;
using SynTrack.Client.ViewModels;

/// <summary>
/// Character roster: loads after auth, refreshes after sync (debounced),
/// true-empty vs ownership/network blocked states, and roster failures
/// never stop the watcher/sync pipeline.
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

    private sealed class OpenBrowserLauncher : IBrowserLauncher
    {
        public bool TryOpen(string url) => true;
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
        public ClientProfileFetchResult NextProfile { get; set; } =
            new() { Health = AccountHealth.FullyConnected, BattleTag = "Syntax#21715" };

        public ClientCharactersFetchResult NextCharacters { get; set; } =
            new() { Status = ClientCharactersFetchStatus.Ok };

        public bool ThrowOnGetCharacters { get; set; }

        public int GetCharactersCallCount { get; private set; }

        public Task<DeviceLinkCreateResponse> CreateLinkAsync(CancellationToken cancellationToken) =>
            throw new NotSupportedException();

        public Task<DeviceLinkStatusResponse> PollStatusAsync(string deviceCode, CancellationToken cancellationToken) =>
            throw new NotSupportedException();

        public Task<DeviceConnectStartResponse> StartConnectAsync(string? deviceName, CancellationToken cancellationToken) =>
            throw new NotSupportedException();

        public Task<DeviceConnectPollResult> PollConnectStatusAsync(string pollToken, CancellationToken cancellationToken) =>
            throw new NotSupportedException();

        public Task<ClientProfileFetchResult> GetMeAsync(string deviceToken, CancellationToken cancellationToken) =>
            Task.FromResult(NextProfile);

        public Task<ClientCharactersFetchResult> GetCharactersAsync(string deviceToken, CancellationToken cancellationToken)
        {
            GetCharactersCallCount++;

            if (ThrowOnGetCharacters)
            {
                throw new HttpRequestException("simulated failure");
            }

            return Task.FromResult(NextCharacters);
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
        var deviceConnectionService = new DeviceConnectionService(
            api,
            credentials,
            new OpenBrowserLauncher(),
            TimeSpan.FromMilliseconds(20));
        var syncEngine = new SyncEngine(credentials, api, settingsService, new SyncGate(), "0.0.0-test");
        var logger = new ClientLogger(Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString()));

        var viewModel = new MainViewModel(
            new FakeWowDiscoveryService(),
            new FakeWowAccountDiscoveryService(),
            settingsService,
            credentials,
            api,
            deviceLinkService,
            deviceConnectionService,
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
            configureApi: fake =>
            {
                fake.NextCharacters = new ClientCharactersFetchResult
                {
                    Status = ClientCharactersFetchStatus.Ok,
                    Items = new[]
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
                    }
                };
            });

        // Debounce is 750ms + profile/roster dispatch
        PumpDispatcher(TimeSpan.FromSeconds(2));

        Assert.Single(viewModel.Characters);
        Assert.Equal("Synblast", viewModel.Characters[0].Name);
        Assert.Null(viewModel.CharactersError);
        Assert.True(viewModel.AccountHealth == AccountHealth.FullyConnected);
        Assert.False(viewModel.ShowEmptyRosterMessage);
    }

    [Fact]
    public void TrueZeroRosterShowsEmptyStateOnlyWhenFullyConnected()
    {
        var (viewModel, _) = Build(
            existingCredential: "dvc_existing",
            configureApi: fake =>
            {
                fake.NextCharacters = new ClientCharactersFetchResult
                {
                    Status = ClientCharactersFetchStatus.Ok,
                    Items = Array.Empty<ClientCharacterSummary>()
                };
            });

        PumpDispatcher(TimeSpan.FromSeconds(2));

        Assert.Empty(viewModel.Characters);
        Assert.True(viewModel.ShowEmptyRosterMessage);
        Assert.False(viewModel.ShowRosterOwnershipBlocked);
    }

    [Fact]
    public void LegacyCredentialBlocksRosterWithReconnectNotFalseEmpty()
    {
        var (viewModel, _) = Build(
            existingCredential: "dvc_legacy",
            configureApi: fake =>
            {
                fake.NextProfile = new ClientProfileFetchResult
                {
                    Health = AccountHealth.ReconnectRequired
                };
                fake.NextCharacters = new ClientCharactersFetchResult
                {
                    Status = ClientCharactersFetchStatus.LegacyReconnectRequired
                };
            });

        PumpDispatcher(TimeSpan.FromSeconds(2));

        Assert.Equal(AccountHealth.ReconnectRequired, viewModel.AccountHealth);
        Assert.Equal("Reconnect required", viewModel.ConnectionStatusLabel);
        Assert.Null(viewModel.BattleTag);
        Assert.Empty(viewModel.Characters);
        Assert.Null(viewModel.CharactersError);
        Assert.False(viewModel.ShowEmptyRosterMessage);
        Assert.True(viewModel.ShowRosterOwnershipBlocked);
    }

    [Fact]
    public void ARosterFetchFailureSetsCharactersErrorWithoutThrowingAndWithoutAffectingSync()
    {
        var (viewModel, api) = Build(
            existingCredential: "dvc_existing",
            configureApi: fake => fake.ThrowOnGetCharacters = true);

        var exception = Record.Exception(() => PumpDispatcher(TimeSpan.FromSeconds(2)));

        Assert.Null(exception);
        Assert.Empty(viewModel.Characters);
        Assert.NotNull(viewModel.CharactersError);
        Assert.True(api.GetCharactersCallCount > 0);
        Assert.False(viewModel.ShowEmptyRosterMessage);
        Assert.False(viewModel.ShowRosterOwnershipBlocked);
    }

    [Fact]
    public void ATransientRosterFailureKeepsTheLastKnownGoodRoster()
    {
        var (viewModel, api) = Build(
            existingCredential: "dvc_existing",
            configureApi: fake =>
            {
                fake.NextCharacters = new ClientCharactersFetchResult
                {
                    Status = ClientCharactersFetchStatus.Ok,
                    Items = new[]
                    {
                        new ClientCharacterSummary
                        {
                            Id = "char-1",
                            Name = "Synblast",
                            Realm = "Antonidas",
                            ClassName = "Mage",
                            Level = 80
                        }
                    }
                };
            });

        PumpDispatcher(TimeSpan.FromSeconds(2));
        Assert.Single(viewModel.Characters);

        api.NextCharacters = new ClientCharactersFetchResult
        {
            Status = ClientCharactersFetchStatus.TemporaryFailure
        };

        viewModel.RetryProfileCommand.Execute(null);
        PumpDispatcher(TimeSpan.FromSeconds(2));

        Assert.Single(viewModel.Characters);
        Assert.Equal("Synblast", viewModel.Characters[0].Name);
        Assert.NotNull(viewModel.CharactersError);
        Assert.Equal(AccountHealth.FullyConnected, viewModel.AccountHealth);
        Assert.False(viewModel.ShowEmptyRosterMessage);
    }

    [Fact]
    public void ASyncCompletedRefreshThatFailsDoesNotClearALoadedRoster()
    {
        var (viewModel, api) = Build(
            existingCredential: "dvc_existing",
            configureApi: fake =>
            {
                fake.NextCharacters = new ClientCharactersFetchResult
                {
                    Status = ClientCharactersFetchStatus.Ok,
                    Items = new[]
                    {
                        new ClientCharacterSummary
                        {
                            Id = "char-1",
                            Name = "Synblast",
                            Realm = "Antonidas",
                            ClassName = "Mage",
                            Level = 80
                        }
                    }
                };
            });

        PumpDispatcher(TimeSpan.FromSeconds(2));
        Assert.Single(viewModel.Characters);

        api.ThrowOnGetCharacters = true;
        viewModel.RetryProfileCommand.Execute(null);
        PumpDispatcher(TimeSpan.FromSeconds(2));

        Assert.Single(viewModel.Characters);
        Assert.NotNull(viewModel.CharactersError);
    }

    [Fact]
    public async Task ARosterFetchFailureDoesNotPreventSyncFromSucceeding()
    {
        var (viewModel, _) = Build(
            existingCredential: "dvc_existing",
            configureApi: fake => fake.ThrowOnGetCharacters = true);

        PumpDispatcher(TimeSpan.FromSeconds(2));

        await viewModel.SyncNowCommand.ExecuteAsync(null);

        Assert.Equal(SyncStatus.WaitingForData, viewModel.SyncStatus);
    }

    [Fact]
    public void DisconnectingClearsTheRosterAndAnyRosterError()
    {
        var (viewModel, _) = Build(
            existingCredential: "dvc_existing",
            configureApi: fake =>
            {
                fake.NextCharacters = new ClientCharactersFetchResult
                {
                    Status = ClientCharactersFetchStatus.Ok,
                    Items = new[]
                    {
                        new ClientCharacterSummary
                        {
                            Id = "char-1",
                            Name = "Synblast",
                            Realm = "Antonidas",
                            ClassName = "Mage",
                            Level = 80
                        }
                    }
                };
            });

        PumpDispatcher(TimeSpan.FromSeconds(2));
        Assert.Single(viewModel.Characters);

        viewModel.DisconnectCommand.Execute(null);

        Assert.Empty(viewModel.Characters);
        Assert.Null(viewModel.CharactersError);
    }
}
