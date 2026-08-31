namespace SynTrack.Client.Tests;

using System.Windows.Threading;
using SynTrack.Client.Models;
using SynTrack.Client.Services;
using SynTrack.Client.ViewModels;

/// <summary>
/// Covers account health: FullyConnected + BattleTag, legacy Reconnect required,
/// temporary profile failure preserving credential, and unauthorized sign-out.
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

    private sealed class OpenBrowserLauncher : IBrowserLauncher
    {
        public bool TryOpen(string url) => true;
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
        public ClientProfileFetchResult NextProfile { get; set; } =
            new() { Health = AccountHealth.ConnectionIssue };

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

        public DeviceConnectStartResponse ConnectStart { get; set; } =
            new()
            {
                BrowserUrl = "https://app.syntrack.example/connect/abc",
                PollToken = "poll-secret",
                ExpiresAt = DateTimeOffset.UtcNow.AddMinutes(10).ToString("O")
            };

        public Queue<DeviceConnectPollResult> ConnectPolls { get; } = new();

        public Task<DeviceConnectStartResponse> StartConnectAsync(string? deviceName, CancellationToken cancellationToken) =>
            Task.FromResult(ConnectStart);

        public Task<DeviceConnectPollResult> PollConnectStatusAsync(string pollToken, CancellationToken cancellationToken) =>
            Task.FromResult(ConnectPolls.Count > 0
                ? ConnectPolls.Dequeue()
                : new DeviceConnectPollResult { Kind = DeviceConnectPollKind.Pending });

        public Task<ClientProfileFetchResult> GetMeAsync(string deviceToken, CancellationToken cancellationToken)
        {
            GetMeCallCount++;
            LastTokenUsed = deviceToken;

            if (ThrowOnGetMe)
            {
                throw new HttpRequestException("simulated failure");
            }

            return Task.FromResult(NextProfile);
        }

        public ClientCharactersFetchResult NextCharacters { get; set; } =
            new() { Status = ClientCharactersFetchStatus.Ok };

        public int GetCharactersCallCount { get; private set; }

        public Task<ClientCharactersFetchResult> GetCharactersAsync(string deviceToken, CancellationToken cancellationToken)
        {
            GetCharactersCallCount++;
            return Task.FromResult(NextCharacters);
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

        return (viewModel, api, credentials, deviceLinkService);
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

    [Fact]
    public void ASignedOutStartHasNoConnectionAndNoBattleTag()
    {
        var (viewModel, api, _, _) = Build();

        Assert.False(viewModel.Connected);
        Assert.Equal(AccountHealth.SignedOut, viewModel.AccountHealth);
        Assert.Null(viewModel.BattleTag);
        Assert.Equal(0, api.GetMeCallCount);
    }

    [Fact]
    public void AnAlreadyConnectedStartupFetchesTheProfileAutomatically()
    {
        var (viewModel, api, _, _) = Build(
            existingCredential: "dvc_existing",
            configureApi: fake => fake.NextProfile = new ClientProfileFetchResult
            {
                Health = AccountHealth.FullyConnected,
                BattleTag = "Syntax#21715"
            });

        PumpDispatcher(TimeSpan.FromMilliseconds(500));

        Assert.True(viewModel.Connected);
        Assert.Equal(AccountHealth.FullyConnected, viewModel.AccountHealth);
        Assert.Equal("Syntax#21715", viewModel.BattleTag);
        Assert.Equal("Connected", viewModel.ConnectionStatusLabel);
        Assert.Equal("dvc_existing", api.LastTokenUsed);
    }

    [Fact]
    public void LegacyCredentialShowsReconnectRequiredNotHealthyConnected()
    {
        var (viewModel, _, credentials, _) = Build(
            existingCredential: "dvc_legacy",
            configureApi: fake => fake.NextProfile = new ClientProfileFetchResult
            {
                Health = AccountHealth.ReconnectRequired
            });

        PumpDispatcher(TimeSpan.FromMilliseconds(500));

        Assert.True(viewModel.Connected);
        Assert.Equal(AccountHealth.ReconnectRequired, viewModel.AccountHealth);
        Assert.Equal("Reconnect required", viewModel.ConnectionStatusLabel);
        Assert.Null(viewModel.BattleTag);
        Assert.Equal("dvc_legacy", credentials.Load());
        Assert.False(viewModel.ShowEmptyRosterMessage);
        Assert.True(viewModel.ShowReconnectRequired);
        Assert.False(viewModel.ShowFullyConnectedIdentity);
        Assert.NotEqual("Connected", viewModel.ConnectionStatusLabel);
    }

    [Fact]
    public async Task ApprovingADeviceLinkStoresTheCredentialAndLoadsTheProfile()
    {
        var (viewModel, api, credentials, deviceLinkService) = Build();

        api.StatusResponses.Enqueue(new DeviceLinkStatusResponse { Status = "CONSUMED", Credential = "dvc_final-secret" });
        api.NextProfile = new ClientProfileFetchResult
        {
            Health = AccountHealth.FullyConnected,
            BattleTag = "Syntax#21715"
        };

        Assert.False(viewModel.Connected);
        Assert.Null(viewModel.BattleTag);

        await deviceLinkService.StartLinkAsync(CancellationToken.None);

        PumpDispatcher(TimeSpan.FromSeconds(4));

        Assert.True(viewModel.Connected);
        Assert.Equal("dvc_final-secret", credentials.Load());
        Assert.Equal("Syntax#21715", viewModel.BattleTag);
        Assert.Equal(AccountHealth.FullyConnected, viewModel.AccountHealth);
    }

    [Fact]
    public void ATemporaryProfileFailurePreservesCredentialAndShowsConnectionIssue()
    {
        var (viewModel, api, credentials, _) = Build(
            existingCredential: "dvc_existing",
            configureApi: fake => fake.ThrowOnGetMe = true);

        var exception = Record.Exception(() => PumpDispatcher(TimeSpan.FromMilliseconds(500)));

        Assert.Null(exception);
        Assert.True(viewModel.Connected);
        Assert.Equal(AccountHealth.ConnectionIssue, viewModel.AccountHealth);
        Assert.Equal("Connection issue", viewModel.ConnectionStatusLabel);
        Assert.Null(viewModel.BattleTag);
        Assert.Equal("dvc_existing", credentials.Load());
        Assert.True(api.GetMeCallCount > 0);
    }

    [Fact]
    public void UnauthorizedProfileClearsCredentialAndSignsOut()
    {
        var (viewModel, _, credentials, _) = Build(
            existingCredential: "dvc_revoked",
            configureApi: fake => fake.NextProfile = new ClientProfileFetchResult
            {
                Health = AccountHealth.SignedOut
            });

        PumpDispatcher(TimeSpan.FromMilliseconds(500));

        Assert.False(viewModel.Connected);
        Assert.Equal(AccountHealth.SignedOut, viewModel.AccountHealth);
        Assert.Null(credentials.Load());
    }

    [Fact]
    public async Task AFailedProfileFetchDoesNotPreventSyncFromSucceeding()
    {
        var (viewModel, api, _, _) = Build(
            existingCredential: "dvc_existing",
            configureApi: fake => fake.ThrowOnGetMe = true);

        PumpDispatcher(TimeSpan.FromMilliseconds(500));
        Assert.Null(viewModel.BattleTag);

        await viewModel.SyncNowCommand.ExecuteAsync(null);

        Assert.Equal(SyncStatus.WaitingForData, viewModel.SyncStatus);
    }

    [Fact]
    public void DisconnectingClearsBothTheCredentialAndTheBattleTag()
    {
        var (viewModel, _, credentials, _) = Build(
            existingCredential: "dvc_existing",
            configureApi: fake => fake.NextProfile = new ClientProfileFetchResult
            {
                Health = AccountHealth.FullyConnected,
                BattleTag = "Syntax#21715"
            });

        PumpDispatcher(TimeSpan.FromMilliseconds(500));
        Assert.Equal("Syntax#21715", viewModel.BattleTag);

        viewModel.DisconnectCommand.Execute(null);

        Assert.False(viewModel.Connected);
        Assert.Equal(AccountHealth.SignedOut, viewModel.AccountHealth);
        Assert.Null(viewModel.BattleTag);
        Assert.Null(credentials.Load());
    }
}
