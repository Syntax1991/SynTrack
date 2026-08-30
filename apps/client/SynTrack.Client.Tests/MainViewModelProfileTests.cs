namespace SynTrack.Client.Tests;

using System.Windows.Threading;
using SynTrack.Client.Models;
using SynTrack.Client.Services;
using SynTrack.Client.ViewModels;

/// <summary>
/// Covers the "Connected as Syntax#21715" identity line: BattleTag must
/// come only from the authenticated GET /api/client/me call, never be
/// fabricated locally, be re-fetched on both startup-if-already-connected
/// and on a fresh approval, and be cleared on sign-out. Deliberately never
/// calls MainViewModel.ConnectCommand - that path calls
/// Process.Start(UseShellExecute) to open the real system browser, which
/// must not happen from a unit test.
/// </summary>
public class MainViewModelProfileTests
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
        private readonly ClientSettings _settings;

        public FakeClientSettingsService(ClientSettings? settings = null) => _settings = settings ?? new ClientSettings();

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

        public FakeCredentialService(string? initial = null) => _stored = initial;

        public void Store(string rawToken) => _stored = rawToken;

        public string? Load() => _stored;

        public void Clear() => _stored = null;
    }

    private sealed class FakeApiClient : ISynTrackApiClient
    {
        public ClientProfileResponse? NextProfile { get; set; }

        public bool ThrowOnGetMe { get; set; }

        public int GetMeCallCount { get; private set; }

        public string? LastTokenUsed { get; private set; }

        public DeviceLinkCreateResponse CreateResponse { get; set; } =
            new() { UserCode = "ABCD-1234", DeviceCode = "deadbeef", ExpiresAt = "2026-08-27T12:10:00Z" };

        public Queue<DeviceLinkStatusResponse> StatusResponses { get; } = new();

        public Task<DeviceLinkCreateResponse> CreateLinkAsync(CancellationToken cancellationToken) =>
            Task.FromResult(CreateResponse);

        public Task<DeviceLinkStatusResponse> PollStatusAsync(string deviceCode, CancellationToken cancellationToken) =>
            Task.FromResult(StatusResponses.Count > 0
                ? StatusResponses.Dequeue()
                : new DeviceLinkStatusResponse { Status = "PENDING" });

        public Task<ClientProfileResponse?> GetMeAsync(string deviceToken, CancellationToken cancellationToken)
        {
            GetMeCallCount++;
            LastTokenUsed = deviceToken;

            if (ThrowOnGetMe)
            {
                throw new HttpRequestException("simulated failure");
            }

            return Task.FromResult(NextProfile);
        }

        public List<ClientCharacterSummary> NextCharacters { get; } = new();

        public int GetCharactersCallCount { get; private set; }

        public Task<IReadOnlyList<ClientCharacterSummary>> GetCharactersAsync(string deviceToken, CancellationToken cancellationToken)
        {
            GetCharactersCallCount++;
            return Task.FromResult<IReadOnlyList<ClientCharacterSummary>>(NextCharacters);
        }

        public Task<SyncStatus> SendImportAsync(
            string deviceToken, string addon, string clientVersion, string observedAt,
            string fileModifiedAt, string contentSha256, string rawBody, CancellationToken cancellationToken) =>
            Task.FromResult(SyncStatus.Synced);
    }

    private static (MainViewModel viewModel, FakeApiClient api, FakeCredentialService credentials, DeviceLinkService deviceLinkService) Build(
        string? existingCredential = null,
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

        return (viewModel, api, credentials, deviceLinkService);
    }

    /// <summary>
    /// MainViewModel marshals every state change back onto its captured
    /// Dispatcher (see _dispatcher.Invoke in RefreshProfileAsync,
    /// OnLinkApproved, etc.) - correct in the real app, where WPF's own
    /// message loop is already pumping. An xUnit test thread has no such
    /// pump running, so a background continuation's Invoke back onto
    /// Dispatcher.CurrentDispatcher would otherwise never be processed.
    /// This drains that dispatcher's queue for a bounded window so
    /// fire-and-forget async work (device-link polling, profile fetches)
    /// gets a chance to actually reach the ViewModel's properties.
    /// </summary>
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

    [Fact]
    public void ASignedOutStartHasNoConnectionAndNoBattleTag()
    {
        var (viewModel, api, _, _) = Build();

        Assert.False(viewModel.Connected);
        Assert.Null(viewModel.BattleTag);
        Assert.Equal(0, api.GetMeCallCount);
    }

    [Fact]
    public void AnAlreadyConnectedStartupFetchesTheProfileAutomatically()
    {
        // NextProfile must be configured before construction: the fake's
        // GetMeAsync returns an already-completed Task, so the
        // constructor's fire-and-forget RefreshProfileAsync call actually
        // runs to completion synchronously during construction itself -
        // setting NextProfile afterward would be too late.
        var (viewModel, api, _, _) = Build(
            existingCredential: "dvc_existing",
            configureApi: fake => fake.NextProfile = new ClientProfileResponse { BattleTag = "Syntax#21715" });

        // Pumping here is still worthwhile defense-in-depth in case that
        // synchronous-completion assumption ever stops holding (e.g. a
        // real HttpClient call would not complete synchronously).
        // awaiting it directly (see RefreshProfileAsync) - give the
        // fire-and-forget task a chance to complete by pumping the
        // dispatcher it marshals its result back onto.
        PumpDispatcher(TimeSpan.FromMilliseconds(500));

        Assert.True(viewModel.Connected);
        Assert.Equal("Syntax#21715", viewModel.BattleTag);
        Assert.Equal("dvc_existing", api.LastTokenUsed);
    }

    [Fact]
    public async Task ApprovingADeviceLinkStoresTheCredentialAndLoadsTheProfile()
    {
        var (viewModel, api, credentials, deviceLinkService) = Build();

        api.StatusResponses.Enqueue(new DeviceLinkStatusResponse { Status = "CONSUMED", Credential = "dvc_final-secret" });
        api.NextProfile = new ClientProfileResponse { BattleTag = "Syntax#21715" };

        Assert.False(viewModel.Connected);
        Assert.Null(viewModel.BattleTag);

        // Deliberately calls DeviceLinkService.StartLinkAsync directly,
        // not MainViewModel.ConnectCommand - the command additionally
        // launches the system browser via Process.Start, which a unit
        // test must never trigger.
        await deviceLinkService.StartLinkAsync(CancellationToken.None);

        // The internal poll loop's Task.Delay(3s) runs regardless of any
        // dispatcher; pumping here just gives OnLinkApproved's
        // _dispatcher.Invoke (fired from that background continuation) a
        // chance to actually reach the ViewModel's properties.
        PumpDispatcher(TimeSpan.FromSeconds(4));

        Assert.True(viewModel.Connected);
        Assert.Equal("dvc_final-secret", credentials.Load());
        Assert.Equal("Syntax#21715", viewModel.BattleTag);
    }

    [Fact]
    public void AFailedProfileFetchLeavesBattleTagNullWithoutThrowing()
    {
        var (viewModel, api, _, _) = Build(
            existingCredential: "dvc_existing",
            configureApi: fake => fake.ThrowOnGetMe = true);

        var exception = Record.Exception(() => PumpDispatcher(TimeSpan.FromMilliseconds(500)));

        Assert.Null(exception);
        Assert.True(viewModel.Connected);
        Assert.Null(viewModel.BattleTag);
        Assert.True(api.GetMeCallCount > 0);
    }

    /// <summary>
    /// The identity line and SavedVariables syncing are independent
    /// features: SyncEngine/SendImportAsync never depends on
    /// ClientProfileService or GetMeAsync at all, so a broken profile
    /// fetch must never be able to affect whether a sync succeeds.
    /// </summary>
    [Fact]
    public async Task AFailedProfileFetchDoesNotPreventSyncFromSucceeding()
    {
        var (viewModel, api, _, _) = Build(
            existingCredential: "dvc_existing",
            configureApi: fake => fake.ThrowOnGetMe = true);

        PumpDispatcher(TimeSpan.FromMilliseconds(500));
        Assert.Null(viewModel.BattleTag);

        await viewModel.SyncNowCommand.ExecuteAsync(null);

        // No WoW path is configured in this fixture, so the sync engine's
        // own ordinary "nothing to sync yet" outcome is WaitingForData -
        // the point is that it reaches that normal outcome at all,
        // unaffected by the earlier profile-fetch failure, rather than
        // being stuck on some auth-tainted or unreachable status.
        Assert.Equal(SyncStatus.WaitingForData, viewModel.SyncStatus);
    }

    [Fact]
    public void DisconnectingClearsBothTheCredentialAndTheBattleTag()
    {
        var (viewModel, _, credentials, _) = Build(
            existingCredential: "dvc_existing",
            configureApi: fake => fake.NextProfile = new ClientProfileResponse { BattleTag = "Syntax#21715" });

        PumpDispatcher(TimeSpan.FromMilliseconds(500));
        Assert.Equal("Syntax#21715", viewModel.BattleTag);

        viewModel.DisconnectCommand.Execute(null);

        Assert.False(viewModel.Connected);
        Assert.Null(viewModel.BattleTag);
        Assert.Null(credentials.Load());
    }
}
