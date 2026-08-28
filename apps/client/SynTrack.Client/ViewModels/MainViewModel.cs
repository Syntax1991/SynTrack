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

    public ObservableCollection<AccountCandidate> AccountCandidates { get; } = new();

    public string SyncStatusLabel => SyncStatus.ToDisplayLabel();

    public string SyncStatusTone => SyncStatus.ToTone();

    public MainViewModel(
        IWowDiscoveryService wowDiscovery,
        IWowAccountDiscoveryService accountDiscovery,
        IClientSettingsService settingsService,
        ICredentialService credentialService,
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

        RestartWatcherIfReady();
    }

    /// <summary>CommunityToolkit-generated hook, fired whenever <see cref="SyncStatus"/> changes.</summary>
    partial void OnSyncStatusChanged(SyncStatus value)
    {
        OnPropertyChanged(nameof(SyncStatusLabel));
        OnPropertyChanged(nameof(SyncStatusTone));
    }

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
    });

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
    });
}
