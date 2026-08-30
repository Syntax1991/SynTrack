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

    [ObservableProperty]
    private bool _connected;

    /// <summary>
    /// The authenticated identity ("Syntax#21715"), fetched from
    /// GET /api/client/me - never fabricated from local settings. Null
    /// while signed out, while the profile fetch is in flight, or on
    /// fetch failure; the UI just omits the "Connected as" line, it never
    /// shows a placeholder or crashes. This is display data only, not a
    /// credential - see MainViewModelSecurityTests.
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
    /// Null when idle/loading/loaded successfully - set only on an actual
    /// roster fetch failure, and deliberately independent of sync/watcher
    /// health: a broken roster call must never affect whether
    /// SavedVariables continue uploading.
    /// </summary>
    [ObservableProperty]
    private string? _charactersError;

    public ObservableCollection<AccountCandidate> AccountCandidates { get; } = new();

    public ObservableCollection<CharacterRosterEntry> Characters { get; } = new();

    public string SyncStatusLabel => SyncStatus.ToDisplayLabel();

    public string SyncStatusTone => SyncStatus.ToTone();

    /// <summary>User-facing connection state - see the status-language table in the redesign spec.</summary>
    public string ConnectionStatusLabel => IsLinking
        ? "Signing in..."
        : Connected
            ? "Connected"
            : "Signed out";

    public string ConnectionStatusTone => IsLinking
        ? "warning"
        : Connected
            ? "positive"
            : "neutral";

    public string WowDetectionLabel => WowPath is null
        ? "World of Warcraft not found"
        : "World of Warcraft detected";

    /// <summary>
    /// Two states only (no "paused" concept exists in the watcher today) -
    /// deliberately not inventing new watcher business logic just for
    /// presentation, per the "don't rewrite working business logic" rule.
    /// </summary>
    public string WatcherStatusLabel => WowPath is null || AccountName is null
        ? "Waiting for WoW account"
        : "Watching SavedVariables";

    public string WatcherStatusTone => WowPath is null || AccountName is null
        ? "neutral"
        : "positive";

    /// <summary>
    /// True only once loading has finished, no error occurred, and the
    /// roster is genuinely empty - manually re-raised after every mutation
    /// of <see cref="Characters"/> (see RefreshCharactersAsync/Disconnect)
    /// since ObservableCollection.Count changes don't raise PropertyChanged
    /// on their own.
    /// </summary>
    public bool ShowEmptyRosterMessage => !IsLoadingCharacters && CharactersError is null && Characters.Count == 0;

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

        _deviceLinkService.LinkApproved += OnLinkApproved;
        _deviceLinkService.LinkExpired += OnLinkExpired;
        _syncEngine.SyncStatusChanged += HandleSyncEngineStatusChanged;
        _syncEngine.SyncCompleted += OnSyncCompleted;

        // A restored AccountName is already usable by RestartWatcherIfReady
        // below regardless of this call - but the "WoW Account" ComboBox is
        // bound via SelectedValue against AccountCandidates, so without
        // populating that collection here too, a persisted account shows as
        // an empty dropdown on every launch until the user clicks Detect,
        // even though the watcher was already targeting the right account.
        RefreshAccountCandidates();
        RestartWatcherIfReady();

        if (_connected)
        {
            _ = RefreshProfileAsync();
            _ = RefreshCharactersAsync();
        }
    }

    /// <summary>CommunityToolkit-generated hook, fired whenever <see cref="SyncStatus"/> changes.</summary>
    partial void OnSyncStatusChanged(SyncStatus value)
    {
        OnPropertyChanged(nameof(SyncStatusLabel));
        OnPropertyChanged(nameof(SyncStatusTone));
    }

    partial void OnConnectedChanged(bool value)
    {
        OnPropertyChanged(nameof(ConnectionStatusLabel));
        OnPropertyChanged(nameof(ConnectionStatusTone));
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

    partial void OnIsLoadingCharactersChanged(bool value) => OnPropertyChanged(nameof(ShowEmptyRosterMessage));

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

    // SynTrack_Core.lua is an account-wide file: a second character
    // logging out and writing while the first character's sync is
    // still uploading must not be silently dropped, or that second
    // character's data never reaches the backend until some unrelated
    // later event happens to trigger a sync again. See DirtyWhileRunningGate.
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

        try
        {
            var (userCode, verificationUrl) = await _deviceLinkService.StartLinkAsync(CancellationToken.None);
            PendingUserCode = userCode;
            Process.Start(new ProcessStartInfo(verificationUrl) { UseShellExecute = true });
            _logger.Info("Device link requested; verification page opened.");
        }
        finally
        {
            IsLinking = false;
        }
    }

    [RelayCommand]
    private void Disconnect()
    {
        _credentialService.Clear();
        Connected = false;
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
        Connected = true;
        PendingUserCode = null;
        _logger.Info("Device link approved; credential stored.");
        _ = RefreshProfileAsync();
        _ = RefreshCharactersAsync();
    });

    /// <summary>
    /// Loads the authenticated BattleTag from GET /api/client/me. Never
    /// throws - a failed profile fetch (network error, malformed
    /// response, or a device credential that predates raiderAccountId
    /// linkage) just leaves BattleTag null and the UI omits the identity
    /// line, it never blocks or crashes the connected state.
    /// </summary>
    private async Task RefreshProfileAsync()
    {
        var token = _credentialService.Load();

        if (token is null)
        {
            _dispatcher.Invoke(() => BattleTag = null);
            return;
        }

        string? battleTag;

        try
        {
            var profile = await _apiClient.GetMeAsync(token, CancellationToken.None);
            battleTag = profile?.BattleTag;
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.Warn($"Profile fetch failed: {ex.Message}");
            battleTag = null;
        }

        _dispatcher.Invoke(() => BattleTag = battleTag);
    }

    /// <summary>
    /// Loads the character roster from GET /api/client/characters. Never
    /// throws and never touches SyncStatus/watcher state - a broken
    /// roster fetch only ever surfaces as CharactersError, it can never
    /// stop or fail a SavedVariables sync.
    /// </summary>
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

        IReadOnlyList<ClientCharacterSummary> summaries;
        string? error = null;

        try
        {
            summaries = await _apiClient.GetCharactersAsync(token, CancellationToken.None);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.Warn($"Character roster fetch failed: {ex.Message}");
            summaries = Array.Empty<ClientCharacterSummary>();
            error = "Could not load character roster. Automatic SavedVariables sync continues if device authentication remains valid.";
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
        });
    }

    private void OnLinkExpired() => _dispatcher.Invoke(() =>
    {
        PendingUserCode = null;
        _logger.Warn("Device link expired before approval.");
    });

    private void HandleSyncEngineStatusChanged(SyncStatus status) => _dispatcher.Invoke(() =>
    {
        SyncStatus = status;
    });

    private void OnSyncCompleted(DateTimeOffset at) => _dispatcher.Invoke(() =>
    {
        LastSyncAt = at;

        // A successful upload is the one moment new capture data could
        // actually change the roster (item level / last-synced column) -
        // bounded to this event rather than polling, so it can never
        // become a request storm.
        _ = RefreshCharactersAsync();
    });
}
