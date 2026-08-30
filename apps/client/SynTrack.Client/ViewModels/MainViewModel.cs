namespace SynTrack.Client.ViewModels;

using System.Collections.ObjectModel;
using System.Diagnostics;
using System.Windows;
using System.Windows.Threading;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using Microsoft.Win32;
using SynTrack.Client.Models;
using SynTrack.Client.Services;

public sealed partial class MainViewModel : ObservableObject
{
    private static readonly TimeSpan RosterRefreshDebounce = TimeSpan.FromMilliseconds(750);

    private readonly IWowDiscoveryService _wowDiscovery;
    private readonly IWowAccountDiscoveryService _accountDiscovery;
    private readonly IClientSettingsService _settingsService;
    private readonly ICredentialService _credentialService;
    private readonly ISynTrackApiClient _apiClient;
    private readonly DeviceLinkService _deviceLinkService;
    private readonly SyncEngine _syncEngine;
    private readonly SavedVariablesWatcherService _watcher;
    private readonly AutoStartService _autoStartService;
    private readonly ClientLogger _logger;
    private readonly string _webBaseUrl;
    private readonly Dispatcher _dispatcher;

    private ClientSettings _settings;
    private CancellationTokenSource? _rosterDebounceCts;

    [ObservableProperty]
    private bool _connected;

    [ObservableProperty]
    private AccountHealth _accountHealth = AccountHealth.SignedOut;

    /// <summary>
    /// Authenticated BattleTag from GET /api/client/me when
    /// <see cref="AccountHealth"/> is FullyConnected. Never fabricated.
    /// </summary>
    [ObservableProperty]
    private string? _battleTag;

    [ObservableProperty]
    private SyncStatus _syncStatus = SyncStatus.WaitingForData;

    [ObservableProperty]
    private string? _wowPath;

    [ObservableProperty]
    private string? _accountName;

    [ObservableProperty]
    private DateTimeOffset? _lastSyncAt;

    [ObservableProperty]
    private string? _pendingUserCode;

    [ObservableProperty]
    private bool _isLinking;

    [ObservableProperty]
    private bool _isSyncing;

    [ObservableProperty]
    private bool _startMinimized;

    [ObservableProperty]
    private bool _autostart;

    [ObservableProperty]
    private bool _isLoadingCharacters;

    /// <summary>
    /// Set only on roster network/API failure. Independent of watcher/sync.
    /// </summary>
    [ObservableProperty]
    private string? _charactersError;

    public ObservableCollection<AccountCandidate> AccountCandidates { get; } = new();

    public ObservableCollection<CharacterRosterEntry> Characters { get; } = new();

    public string SyncStatusLabel => SyncStatus.ToDisplayLabel();

    public string SyncStatusTone => SyncStatus.ToTone();

    public string ConnectionStatusLabel => AccountHealth switch
    {
        AccountHealth.SigningIn => "Signing in...",
        AccountHealth.FullyConnected => "Connected",
        AccountHealth.ReconnectRequired => "Reconnect required",
        AccountHealth.ConnectionIssue => "Connection issue",
        _ => "Signed out"
    };

    public string ConnectionStatusTone => AccountHealth switch
    {
        AccountHealth.SigningIn => "warning",
        AccountHealth.FullyConnected => "positive",
        AccountHealth.ReconnectRequired => "warning",
        AccountHealth.ConnectionIssue => "warning",
        _ => "neutral"
    };

    public bool ShowFullyConnectedIdentity =>
        AccountHealth == AccountHealth.FullyConnected && BattleTag is not null;

    public bool ShowReconnectRequired => AccountHealth == AccountHealth.ReconnectRequired;

    public bool ShowConnectionIssue => AccountHealth == AccountHealth.ConnectionIssue;

    public bool ShowConnectedShell =>
        AccountHealth is AccountHealth.FullyConnected
            or AccountHealth.ReconnectRequired
            or AccountHealth.ConnectionIssue;

    public bool ShowSignedOutShell =>
        AccountHealth is AccountHealth.SignedOut or AccountHealth.SigningIn;

    public string WowDetectionLabel => WowPath is null
        ? "World of Warcraft not found"
        : "World of Warcraft detected";

    public string WatcherStatusLabel => WowPath is null || AccountName is null
        ? "Waiting for WoW account"
        : "Watching SavedVariables";

    public string WatcherStatusTone => WowPath is null || AccountName is null
        ? "neutral"
        : "positive";

    /// <summary>
    /// True empty roster only when fully connected, load finished, no error,
    /// and the owning account genuinely has zero characters.
    /// </summary>
    public bool ShowEmptyRosterMessage =>
        AccountHealth == AccountHealth.FullyConnected
        && !IsLoadingCharacters
        && CharactersError is null
        && Characters.Count == 0;

    /// <summary>
    /// Roster blocked until Battle.net reconnect binds ownership.
    /// ConnectionIssue uses CharactersError — never conflate network
    /// failure with legacy reconnect messaging.
    /// </summary>
    public bool ShowRosterOwnershipBlocked =>
        AccountHealth == AccountHealth.ReconnectRequired
        && !IsLoadingCharacters
        && Characters.Count == 0;

    public MainViewModel(
        IWowDiscoveryService wowDiscovery,
        IWowAccountDiscoveryService accountDiscovery,
        IClientSettingsService settingsService,
        ICredentialService credentialService,
        ISynTrackApiClient apiClient,
        DeviceLinkService deviceLinkService,
        SyncEngine syncEngine,
        SavedVariablesWatcherService watcher,
        AutoStartService autoStartService,
        ClientLogger logger,
        string webBaseUrl)
    {
        _wowDiscovery = wowDiscovery;
        _accountDiscovery = accountDiscovery;
        _settingsService = settingsService;
        _credentialService = credentialService;
        _apiClient = apiClient;
        _deviceLinkService = deviceLinkService;
        _syncEngine = syncEngine;
        _watcher = watcher;
        _autoStartService = autoStartService;
        _logger = logger;
        _webBaseUrl = webBaseUrl;
        _dispatcher = Application.Current?.Dispatcher ?? Dispatcher.CurrentDispatcher;

        _settings = _settingsService.Load();
        _wowPath = _settings.WowPath;
        _accountName = _settings.AccountName;
        _startMinimized = _settings.StartMinimized;
        _autostart = _settings.Autostart;
        _connected = _credentialService.Load() is not null;
        _accountHealth = _connected ? AccountHealth.ConnectionIssue : AccountHealth.SignedOut;

        _deviceLinkService.LinkApproved += OnLinkApproved;
        _deviceLinkService.LinkExpired += OnLinkExpired;
        _syncEngine.SyncStatusChanged += HandleSyncEngineStatusChanged;
        _syncEngine.SyncCompleted += OnSyncCompleted;

        RefreshAccountCandidates();
        RestartWatcherIfReady();

        if (_connected)
        {
            _ = RefreshProfileAsync();
            ScheduleRosterRefresh();
        }
    }

    partial void OnSyncStatusChanged(SyncStatus value)
    {
        OnPropertyChanged(nameof(SyncStatusLabel));
        OnPropertyChanged(nameof(SyncStatusTone));
    }

    partial void OnConnectedChanged(bool value)
    {
        OnPropertyChanged(nameof(ConnectionStatusLabel));
        OnPropertyChanged(nameof(ConnectionStatusTone));
        OnPropertyChanged(nameof(ShowConnectedShell));
    }

    partial void OnAccountHealthChanged(AccountHealth value)
    {
        Connected = value is AccountHealth.FullyConnected
            or AccountHealth.ReconnectRequired
            or AccountHealth.ConnectionIssue;

        OnPropertyChanged(nameof(ConnectionStatusLabel));
        OnPropertyChanged(nameof(ConnectionStatusTone));
        OnPropertyChanged(nameof(ShowFullyConnectedIdentity));
        OnPropertyChanged(nameof(ShowReconnectRequired));
        OnPropertyChanged(nameof(ShowConnectionIssue));
        OnPropertyChanged(nameof(ShowConnectedShell));
        OnPropertyChanged(nameof(ShowSignedOutShell));
        OnPropertyChanged(nameof(ShowEmptyRosterMessage));
        OnPropertyChanged(nameof(ShowRosterOwnershipBlocked));
    }

    partial void OnBattleTagChanged(string? value)
    {
        OnPropertyChanged(nameof(ShowFullyConnectedIdentity));
    }

    partial void OnIsLinkingChanged(bool value)
    {
        OnPropertyChanged(nameof(ConnectionStatusLabel));
        OnPropertyChanged(nameof(ConnectionStatusTone));
    }

    partial void OnWowPathChanged(string? value)
    {
        OnPropertyChanged(nameof(WowDetectionLabel));
        OnPropertyChanged(nameof(WatcherStatusLabel));
        OnPropertyChanged(nameof(WatcherStatusTone));
    }

    partial void OnAccountNameChanged(string? value)
    {
        OnPropertyChanged(nameof(WatcherStatusLabel));
        OnPropertyChanged(nameof(WatcherStatusTone));
    }

    partial void OnIsLoadingCharactersChanged(bool value)
    {
        OnPropertyChanged(nameof(ShowEmptyRosterMessage));
        OnPropertyChanged(nameof(ShowRosterOwnershipBlocked));
    }

    partial void OnCharactersErrorChanged(string? value) => OnPropertyChanged(nameof(ShowEmptyRosterMessage));

    [RelayCommand]
    private void DetectWow()
    {
        var detected = _wowDiscovery.ResolveWowInstall(WowPath);

        if (detected is not null)
        {
            SetWowPath(detected);
        }
    }

    [RelayCommand]
    private void BrowseWow()
    {
        var dialog = new OpenFolderDialog { Title = "Select your World of Warcraft install folder" };

        if (dialog.ShowDialog() == true && dialog.FolderName is not null)
        {
            SetWowPath(dialog.FolderName);
        }
    }

    private void SetWowPath(string path)
    {
        WowPath = path;
        _settings.WowPath = path;
        _settingsService.Save(_settings);
        RefreshAccountCandidates();
        RestartWatcherIfReady();
        _logger.Info("WoW install path updated.");
    }

    private void RefreshAccountCandidates()
    {
        AccountCandidates.Clear();

        if (WowPath is null)
        {
            return;
        }

        var candidates = _accountDiscovery.DiscoverAccounts(WowPath);

        foreach (var candidate in candidates)
        {
            AccountCandidates.Add(candidate);
        }

        _logger.Info($"Account discovery found {candidates.Count} candidate(s).");

        if (candidates.Count == 1 && AccountName is null)
        {
            SelectAccount(candidates[0].AccountName);
        }
    }

    [RelayCommand]
    private void SelectAccount(string accountName)
    {
        AccountName = accountName;
        _settings.AccountName = accountName;
        _settingsService.Save(_settings);
        RestartWatcherIfReady();
        _logger.Info("WoW account selected.");
    }

    private void RestartWatcherIfReady()
    {
        if (WowPath is null || AccountName is null)
        {
            _watcher.Stop();
            return;
        }

        var savedVariablesDir = WowAccountDiscoveryService.SavedVariablesDir(WowPath, AccountName);
        _watcher.StableChangeDetected -= OnStableChangeDetected;
        _watcher.StableChangeDetected += OnStableChangeDetected;
        _watcher.Watch(savedVariablesDir);
        _logger.Info($"Watcher active for account {AccountName} at {savedVariablesDir}");
    }

    private readonly DirtyWhileRunningGate _syncGate = new();

    private void OnStableChangeDetected() => _ = SyncNowAsync();

    [RelayCommand]
    private async Task SyncNowAsync()
    {
        if (!_syncGate.TryEnter())
        {
            return;
        }

        IsSyncing = true;

        try
        {
            do
            {
                _logger.Info("Sync starting.");
                await _syncEngine.PerformSyncAsync(_settings, CancellationToken.None);
            }
            while (_syncGate.ShouldRunAgain());
        }
        finally
        {
            IsSyncing = false;
            _syncGate.Exit();
        }
    }

    [RelayCommand]
    private async Task ConnectAsync()
    {
        if (IsLinking)
        {
            return;
        }

        IsLinking = true;
        AccountHealth = AccountHealth.SigningIn;

        try
        {
            var (userCode, verificationUrl) = await _deviceLinkService.StartLinkAsync(CancellationToken.None);
            PendingUserCode = userCode;
            Process.Start(new ProcessStartInfo(verificationUrl) { UseShellExecute = true });
            _logger.Info("Device link requested; verification page opened.");
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.Warn($"Device link failed to start: {ex.Message}");
            AccountHealth = _credentialService.Load() is null
                ? AccountHealth.SignedOut
                : AccountHealth.ConnectionIssue;
        }
        finally
        {
            IsLinking = false;
        }
    }

    /// <summary>
    /// One-time Battle.net reconnect for legacy unowned credentials.
    /// Clears the local DPAPI credential first, then opens the browser flow.
    /// </summary>
    [RelayCommand]
    private async Task ReconnectAsync()
    {
        _credentialService.Clear();
        BattleTag = null;
        Characters.Clear();
        CharactersError = null;
        AccountHealth = AccountHealth.SignedOut;
        OnPropertyChanged(nameof(ShowEmptyRosterMessage));
        _logger.Info("Legacy credential cleared; starting Battle.net reconnect.");
        await ConnectAsync();
    }

    [RelayCommand]
    private async Task RetryProfileAsync()
    {
        await RefreshProfileAsync();
        ScheduleRosterRefresh();
    }

    [RelayCommand]
    private void Disconnect()
    {
        _credentialService.Clear();
        Connected = false;
        AccountHealth = AccountHealth.SignedOut;
        PendingUserCode = null;
        BattleTag = null;
        Characters.Clear();
        CharactersError = null;
        OnPropertyChanged(nameof(ShowEmptyRosterMessage));
        _logger.Info("Device disconnected.");
    }

    [RelayCommand]
    private void OpenSynTrack()
    {
        Process.Start(new ProcessStartInfo(_webBaseUrl) { UseShellExecute = true });
    }

    partial void OnStartMinimizedChanged(bool value)
    {
        _settings.StartMinimized = value;
        _settingsService.Save(_settings);
    }

    partial void OnAutostartChanged(bool value)
    {
        _settings.Autostart = value;
        _settingsService.Save(_settings);
        _autoStartService.SetEnabled(value);
    }

    private void OnLinkApproved() => _dispatcher.Invoke(() =>
    {
        PendingUserCode = null;
        _logger.Info("Device link approved; credential stored.");
        _ = RefreshProfileAsync();
        ScheduleRosterRefresh();
    });

    private async Task RefreshProfileAsync()
    {
        var token = _credentialService.Load();

        if (token is null)
        {
            _dispatcher.Invoke(() =>
            {
                BattleTag = null;
                AccountHealth = AccountHealth.SignedOut;
            });
            return;
        }

        ClientProfileFetchResult result;

        try
        {
            result = await _apiClient.GetMeAsync(token, CancellationToken.None);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.Warn($"Profile fetch failed: {ex.Message}");
            result = new ClientProfileFetchResult { Health = AccountHealth.ConnectionIssue };
        }

        _dispatcher.Invoke(() =>
        {
            if (result.Health == AccountHealth.SignedOut)
            {
                // Auth invalid/revoked — clear local credential and return to signed-out.
                _credentialService.Clear();
                BattleTag = null;
                AccountHealth = AccountHealth.SignedOut;
                Characters.Clear();
                CharactersError = null;
                OnPropertyChanged(nameof(ShowEmptyRosterMessage));
                _logger.Warn("Device credential rejected; signed out.");
                return;
            }

            BattleTag = result.BattleTag;
            AccountHealth = result.Health;
        });
    }

    private void ScheduleRosterRefresh()
    {
        _rosterDebounceCts?.Cancel();
        _rosterDebounceCts = new CancellationTokenSource();
        var token = _rosterDebounceCts.Token;
        _ = DebouncedRefreshCharactersAsync(token);
    }

    private async Task DebouncedRefreshCharactersAsync(CancellationToken cancellationToken)
    {
        try
        {
            await Task.Delay(RosterRefreshDebounce, cancellationToken);
        }
        catch (OperationCanceledException)
        {
            return;
        }

        await RefreshCharactersAsync();
    }

    private async Task RefreshCharactersAsync()
    {
        var token = _credentialService.Load();

        if (token is null)
        {
            _dispatcher.Invoke(() =>
            {
                Characters.Clear();
                CharactersError = null;
                OnPropertyChanged(nameof(ShowEmptyRosterMessage));
            });

            return;
        }

        _dispatcher.Invoke(() => IsLoadingCharacters = true);

        ClientCharactersFetchResult fetch;
        string? error = null;
        IReadOnlyList<ClientCharacterSummary> summaries = Array.Empty<ClientCharacterSummary>();

        try
        {
            fetch = await _apiClient.GetCharactersAsync(token, CancellationToken.None);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.Warn($"Character roster fetch failed: {ex.Message}");
            fetch = new ClientCharactersFetchResult { Status = ClientCharactersFetchStatus.TemporaryFailure };
        }

        switch (fetch.Status)
        {
            case ClientCharactersFetchStatus.Ok:
                summaries = fetch.Items;
                break;

            case ClientCharactersFetchStatus.LegacyReconnectRequired:
                // Align with profile: never green Connected + empty roster for legacy.
                _dispatcher.Invoke(() =>
                {
                    BattleTag = null;
                    AccountHealth = AccountHealth.ReconnectRequired;
                    Characters.Clear();
                    CharactersError = null;
                    IsLoadingCharacters = false;
                    OnPropertyChanged(nameof(ShowEmptyRosterMessage));
                    OnPropertyChanged(nameof(ShowRosterOwnershipBlocked));
                });
                return;

            case ClientCharactersFetchStatus.Unauthorized:
                _dispatcher.Invoke(() =>
                {
                    _credentialService.Clear();
                    BattleTag = null;
                    AccountHealth = AccountHealth.SignedOut;
                    Characters.Clear();
                    CharactersError = null;
                    IsLoadingCharacters = false;
                    OnPropertyChanged(nameof(ShowEmptyRosterMessage));
                });
                return;

            case ClientCharactersFetchStatus.TemporaryFailure:
                error = "Could not load character roster. Automatic SavedVariables sync continues if device authentication remains valid.";
                break;
        }

        var now = DateTimeOffset.UtcNow;
        var entries = summaries.Select(summary => CharacterRosterEntry.From(summary, now)).ToList();

        _dispatcher.Invoke(() =>
        {
            Characters.Clear();

            foreach (var entry in entries)
            {
                Characters.Add(entry);
            }

            CharactersError = error;
            IsLoadingCharacters = false;
            OnPropertyChanged(nameof(ShowEmptyRosterMessage));
        });
    }

    private void OnLinkExpired() => _dispatcher.Invoke(() =>
    {
        PendingUserCode = null;
        if (_credentialService.Load() is null)
        {
            AccountHealth = AccountHealth.SignedOut;
        }

        _logger.Warn("Device link expired before approval.");
    });

    private void HandleSyncEngineStatusChanged(SyncStatus status) => _dispatcher.Invoke(() =>
    {
        SyncStatus = status;
    });

    private void OnSyncCompleted(DateTimeOffset at) => _dispatcher.Invoke(() =>
    {
        LastSyncAt = at;
        ScheduleRosterRefresh();
    });
}
