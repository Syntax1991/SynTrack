namespace SynTrack.Client;

using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Net.Http;
using System.Windows;
using SynTrack.Client.Services;
using SynTrack.Client.ViewModels;
using SynTrack.Client.Views;

public partial class App : Application
{
    private const string ApiBaseUrl = "http://localhost:4000/api";
    private const string WebBaseUrl = "http://localhost:5173";

    private HttpClient? _httpClient;
    private TrayService? _trayService;
    private MainWindow? _mainWindow;
    private SavedVariablesWatcherService? _watcher;
    private SingleInstanceGuard? _instanceGuard;

    protected override void OnStartup(StartupEventArgs e)
    {
        base.OnStartup(e);

        var appDataDir = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
            "SynTrack",
            "Client");

        var logger = new ClientLogger(appDataDir);

        var hostModule = Process.GetCurrentProcess().MainModule?.FileName ?? "unknown";

        var hostType = hostModule.EndsWith("dotnet.exe", StringComparison.OrdinalIgnoreCase)
            ? "dotnet-hosted"
            : "exe";

        var clientVersion = GetType().Assembly.GetName().Version?.ToString() ?? "0.1.0";

        logger.Info(
            $"SynTrack Client starting. pid={Environment.ProcessId} host={hostType} version={clientVersion} assemblyDir={AppContext.BaseDirectory}");

        // A raw SynTrack.Client.exe double-click landing as a second,
        // uncoordinated process while a dotnet.exe-hosted instance was
        // already running (two watchers, ambiguous logging, unclear import
        // ownership) was observed live - the mutex identity is fixed
        // regardless of which of the two hosting styles launched it.
        _instanceGuard = new SingleInstanceGuard();

        if (!_instanceGuard.IsFirstInstance)
        {
            logger.Info("Another SynTrack Client instance is already running; exiting.");
            _instanceGuard.Dispose();
            Shutdown();
            return;
        }

        var settingsService = new ClientSettingsService(appDataDir);
        var credentialService = new DpapiCredentialService(appDataDir);
        var wowDiscovery = new WowDiscoveryService();
        var accountDiscovery = new WowAccountDiscoveryService();
        var autoStartService = new AutoStartService();

        _httpClient = new HttpClient();
        var apiClient = new SynTrackApiClient(_httpClient, ApiBaseUrl);
        var deviceLinkService = new DeviceLinkService(apiClient, credentialService, WebBaseUrl);

        var syncGate = settingsService.LoadSyncGate();
        var syncEngine = new SyncEngine(credentialService, apiClient, settingsService, syncGate, clientVersion);

        _watcher = new SavedVariablesWatcherService();

        var viewModel = new MainViewModel(
            wowDiscovery,
            accountDiscovery,
            settingsService,
            credentialService,
            apiClient,
            deviceLinkService,
            syncEngine,
            _watcher,
            autoStartService,
            logger,
            WebBaseUrl);

        _mainWindow = new MainWindow(viewModel);

        _trayService = new TrayService(SystemIcons.Application);
        _trayService.SyncNowRequested += () => viewModel.SyncNowCommand.Execute(null);
        _trayService.OpenSynTrackRequested += () => viewModel.OpenSynTrackCommand.Execute(null);
        _trayService.SettingsRequested += ShowMainWindow;
        _trayService.ExitRequested += ExitApplication;

        if (viewModel.StartMinimized)
        {
            _mainWindow.WindowState = WindowState.Minimized;
            _mainWindow.ShowInTaskbar = false;
            _mainWindow.Hide();
        }
        else
        {
            _mainWindow.Show();
        }

        logger.Info("SynTrack Client startup complete.");
    }

    private void ShowMainWindow()
    {
        if (_mainWindow is null)
        {
            return;
        }

        _mainWindow.ShowInTaskbar = true;
        _mainWindow.Show();
        _mainWindow.WindowState = WindowState.Normal;
        _mainWindow.Activate();
    }

    private void ExitApplication()
    {
        if (_mainWindow is not null)
        {
            _mainWindow.AllowClose = true;
            _mainWindow.Close();
        }

        _watcher?.Dispose();
        _trayService?.Dispose();
        _httpClient?.Dispose();
        _instanceGuard?.Dispose();
        Shutdown();
    }
}
