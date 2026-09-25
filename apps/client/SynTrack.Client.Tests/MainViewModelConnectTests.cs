namespace SynTrack.Client.Tests;

using System.Windows.Threading;
using SynTrack.Client.Models;
using SynTrack.Client.Services;
using SynTrack.Client.ViewModels;

/// <summary>
/// The signed-out "Continue with Battle.net" flow a Store tester sees:
/// each START / POLL failure maps to a specific, safe message (never the
/// old catch-all "Could not connect this client.", never exception text,
/// URLs or tokens), and Try again always starts a fresh flow.
/// </summary>
public class MainViewModelConnectTests
{
    private const string PollSecret = "poll-secret-7f3a";
    private const string BrowserSecret = "browser-secret-91cd";
    private const string CredentialSecret = "dvc_credential-secret-44aa";

    private sealed class NoWow : IWowDiscoveryService
    {
        public IReadOnlyList<string> CandidateInstallPaths() => Array.Empty<string>();

        public string? ResolveWowInstall(string? configuredPath) => configuredPath;
    }

    private sealed class NoAccounts : IWowAccountDiscoveryService
    {
        public IReadOnlyList<AccountCandidate> DiscoverAccounts(string wowPath) => Array.Empty<AccountCandidate>();
    }

    private sealed class Settings : IClientSettingsService
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

    private sealed class Browser : IBrowserLauncher
    {
        public bool OpenResult { get; set; } = true;

        public int OpenCount { get; private set; }

        public bool TryOpen(string url)
        {
            OpenCount++;
            return OpenResult;
        }
    }

    private sealed class Credentials : ICredentialService
    {
        private string? _stored;

        public bool ThrowOnStore { get; set; }

        public void Store(string rawToken)
        {
            if (ThrowOnStore)
            {
                throw new InvalidOperationException($"dpapi failed for {rawToken}");
            }

            _stored = rawToken;
        }

        public string? Load() => _stored;

        public void Clear() => _stored = null;
    }

    private sealed class Api : ISynTrackApiClient
    {
        public Queue<Func<DeviceConnectStartResponse>> Starts { get; } = new();

        public Queue<DeviceConnectPollResult> Polls { get; } = new();

        public int StartCount { get; private set; }

        public Task<DeviceConnectStartResponse> StartConnectAsync(string? deviceName, CancellationToken cancellationToken)
        {
            StartCount++;
            return Task.FromResult(Starts.Count > 0 ? Starts.Dequeue()() : Valid());
        }

        public Task<DeviceConnectPollResult> PollConnectStatusAsync(string pollToken, CancellationToken cancellationToken) =>
            Task.FromResult(Polls.Count > 0 ? Polls.Dequeue() : new DeviceConnectPollResult { Kind = DeviceConnectPollKind.Pending });

        public Task<ClientProfileFetchResult> GetMeAsync(string deviceToken, CancellationToken cancellationToken) =>
            Task.FromResult(new ClientProfileFetchResult { Health = AccountHealth.FullyConnected, BattleTag = "Tester#1234" });

        public Task<ClientCharactersFetchResult> GetCharactersAsync(string deviceToken, CancellationToken cancellationToken) =>
            Task.FromResult(new ClientCharactersFetchResult { Status = ClientCharactersFetchStatus.Ok });

        public Task<DeviceLinkCreateResponse> CreateLinkAsync(CancellationToken cancellationToken) => throw new NotSupportedException();

        public Task<DeviceLinkStatusResponse> PollStatusAsync(string deviceCode, CancellationToken cancellationToken) => throw new NotSupportedException();

        public Task<SyncStatus> SendImportAsync(string deviceToken, string addon, string clientVersion, string observedAt,
            string fileModifiedAt, string contentSha256, string rawBody, CancellationToken cancellationToken) =>
            Task.FromResult(SyncStatus.Synced);
    }

    private static DeviceConnectStartResponse Valid() => new()
    {
        BrowserUrl = $"https://syntrack.io/client/connect?token={BrowserSecret}",
        PollToken = PollSecret,
        ExpiresAt = DateTimeOffset.UtcNow.AddMinutes(10).ToString("O")
    };

    private sealed record Harness(MainViewModel ViewModel, Api Api, Browser Browser, Credentials Credentials, string LogPath);

    private static Harness Build()
    {
        var settings = new Settings();
        var credentials = new Credentials();
        var api = new Api();
        var browser = new Browser();
        var logDir = Path.Combine(Path.GetTempPath(), "syntrack-connect-tests", Guid.NewGuid().ToString());

        var viewModel = new MainViewModel(
            new NoWow(),
            new NoAccounts(),
            settings,
            credentials,
            api,
            new DeviceLinkService(api, credentials, "https://syntrack.io"),
            new DeviceConnectionService(api, credentials, browser, TimeSpan.FromMilliseconds(10)),
            new SyncEngine(credentials, api, settings, new SyncGate(), "0.0.0-test"),
            new SavedVariablesWatcherService(),
            new AutoStartService(),
            new ClientLogger(logDir),
            "https://syntrack.io");

        return new Harness(viewModel, api, browser, credentials, Path.Combine(logDir, "client.log"));
    }

    private static void PumpDispatcher(TimeSpan duration)
    {
        var frame = new DispatcherFrame();
        var timer = new DispatcherTimer(DispatcherPriority.Background) { Interval = duration };
        timer.Tick += (_, _) =>
        {
            frame.Continue = false;
            timer.Stop();
        };
        timer.Start();
        Dispatcher.PushFrame(frame);
    }

    private static void AssertNoSecrets(Harness harness)
    {
        // SignInBrowserUrl carries the browser token by design (Copy link);
        // everything rendered as text must not.
        var visible = string.Join("\n", harness.ViewModel.ConnectError, harness.ViewModel.ConnectionStatusLabel);
        var log = File.Exists(harness.LogPath) ? File.ReadAllText(harness.LogPath) : string.Empty;

        foreach (var secret in new[] { PollSecret, BrowserSecret, CredentialSecret })
        {
            Assert.DoesNotContain(secret, visible);
            Assert.DoesNotContain(secret, log);
        }
    }

    [Fact]
    public void AnUnreachableServiceShowsTheSpecificNetworkMessage()
    {
        var harness = Build();
        harness.Api.Starts.Enqueue(() => throw new DeviceConnectStartException(DeviceConnectStartFailure.Unreachable));

        harness.ViewModel.ConnectCommand.Execute(null);

        Assert.Equal(ConnectMessages.Unreachable, harness.ViewModel.ConnectError);
        Assert.Equal(AccountHealth.SignedOut, harness.ViewModel.AccountHealth);
        Assert.Null(harness.ViewModel.SignInBrowserUrl);
        Assert.Equal(0, harness.Browser.OpenCount);
        Assert.Contains("category=Unreachable", File.ReadAllText(harness.LogPath));
        AssertNoSecrets(harness);
    }

    [Theory]
    [InlineData(DeviceConnectStartFailure.ServerError, 503)]
    [InlineData(DeviceConnectStartFailure.InvalidResponse, 200)]
    [InlineData(DeviceConnectStartFailure.Rejected, 400)]
    public void ServerSideStartFailuresShowTheTemporaryServerMessage(DeviceConnectStartFailure failure, int status)
    {
        var harness = Build();
        harness.Api.Starts.Enqueue(() => throw new DeviceConnectStartException(failure, status));

        harness.ViewModel.ConnectCommand.Execute(null);

        Assert.Equal(ConnectMessages.ServerError, harness.ViewModel.ConnectError);
        Assert.Contains($"status={status}", File.ReadAllText(harness.LogPath));
        AssertNoSecrets(harness);
    }

    [Fact]
    public void AnUnexpectedExceptionNeverSurfacesItsMessage()
    {
        var harness = Build();
        harness.Api.Starts.Enqueue(() => throw new InvalidOperationException($"boom {PollSecret} at https://syntrack.io/?token={BrowserSecret}"));

        harness.ViewModel.ConnectCommand.Execute(null);

        Assert.Equal(ConnectMessages.ServerError, harness.ViewModel.ConnectError);
        Assert.DoesNotContain("boom", File.ReadAllText(harness.LogPath));
        AssertNoSecrets(harness);
    }

    [Fact]
    public void ABrowserFailureStaysRecoverableWithOpenAgainAndCopyLink()
    {
        var harness = Build();
        harness.Browser.OpenResult = false;

        harness.ViewModel.ConnectCommand.Execute(null);

        Assert.Equal(ConnectMessages.BrowserFailed, harness.ViewModel.ConnectError);
        Assert.Equal(AccountHealth.SigningIn, harness.ViewModel.AccountHealth);
        Assert.NotNull(harness.ViewModel.SignInBrowserUrl);

        harness.Browser.OpenResult = true;
        harness.ViewModel.OpenBrowserAgainCommand.Execute(null);

        Assert.Null(harness.ViewModel.ConnectError);
        Assert.Equal(2, harness.Browser.OpenCount);
        AssertNoSecrets(harness);
    }

    [Fact]
    public void TryAgainStartsAFreshFlowAndSuccessClearsTheOldError()
    {
        var harness = Build();
        harness.Api.Starts.Enqueue(() => throw new DeviceConnectStartException(DeviceConnectStartFailure.Unreachable));

        harness.ViewModel.ConnectCommand.Execute(null);
        Assert.Equal(ConnectMessages.Unreachable, harness.ViewModel.ConnectError);

        harness.ViewModel.ConnectCommand.Execute(null);

        Assert.Equal(2, harness.Api.StartCount);
        Assert.Null(harness.ViewModel.ConnectError);
        Assert.Equal(AccountHealth.SigningIn, harness.ViewModel.AccountHealth);
        Assert.Equal(1, harness.Browser.OpenCount);
    }

    [Fact]
    public void AConsumedPollConnectsAndLoadsTheBattleTag()
    {
        var harness = Build();
        harness.Api.Polls.Enqueue(new DeviceConnectPollResult { Kind = DeviceConnectPollKind.Consumed, Credential = CredentialSecret });

        harness.ViewModel.ConnectCommand.Execute(null);
        PumpDispatcher(TimeSpan.FromMilliseconds(500));

        Assert.Equal(CredentialSecret, harness.Credentials.Load());
        Assert.Null(harness.ViewModel.ConnectError);
        Assert.Equal(AccountHealth.FullyConnected, harness.ViewModel.AccountHealth);
        Assert.Equal("Tester#1234", harness.ViewModel.BattleTag);
        AssertNoSecrets(harness);
    }

    [Theory]
    [InlineData(DeviceConnectPollKind.NotFound)]
    [InlineData(DeviceConnectPollKind.ConsumedWithoutCredential)]
    public void AnInvalidOrAlreadyUsedConnectionAsksForANewOne(DeviceConnectPollKind kind)
    {
        var harness = Build();
        harness.Api.Polls.Enqueue(new DeviceConnectPollResult { Kind = kind });

        harness.ViewModel.ConnectCommand.Execute(null);
        PumpDispatcher(TimeSpan.FromMilliseconds(300));

        Assert.Equal(ConnectMessages.NoLongerValid, harness.ViewModel.ConnectError);
        Assert.Equal(AccountHealth.SignedOut, harness.ViewModel.AccountHealth);
        AssertNoSecrets(harness);
    }

    [Fact]
    public void AnExpiredConnectionShowsTheExpiredMessage()
    {
        var harness = Build();
        harness.Api.Polls.Enqueue(new DeviceConnectPollResult { Kind = DeviceConnectPollKind.Expired });

        harness.ViewModel.ConnectCommand.Execute(null);
        PumpDispatcher(TimeSpan.FromMilliseconds(300));

        Assert.Equal(ConnectMessages.Expired, harness.ViewModel.ConnectError);
        Assert.Equal(AccountHealth.SignedOut, harness.ViewModel.AccountHealth);
    }

    [Fact]
    public void ACredentialStorageFailureShowsASafeMessageWithoutTheCredential()
    {
        var harness = Build();
        harness.Credentials.ThrowOnStore = true;
        harness.Api.Polls.Enqueue(new DeviceConnectPollResult { Kind = DeviceConnectPollKind.Consumed, Credential = CredentialSecret });

        harness.ViewModel.ConnectCommand.Execute(null);
        PumpDispatcher(TimeSpan.FromMilliseconds(300));

        Assert.Equal(ConnectMessages.StorageFailed, harness.ViewModel.ConnectError);
        Assert.Null(harness.Credentials.Load());
        AssertNoSecrets(harness);
    }
}

