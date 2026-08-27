namespace SynTrack.Client.Services;

using System.Drawing;
using System.Windows.Forms;

/// <summary>
/// WPF has no native tray-icon API, so this uses WinForms' NotifyIcon
/// (a supported, common interop pattern) purely for the tray surface -
/// the rest of the application stays WPF/XAML.
/// </summary>
public sealed class TrayService : IDisposable
{
    private readonly NotifyIcon _notifyIcon;

    public event Action? SyncNowRequested;

    public event Action? OpenSynTrackRequested;

    public event Action? SettingsRequested;

    public event Action? ExitRequested;

    public TrayService(Icon icon)
    {
        var menu = new ContextMenuStrip();

        var title = menu.Items.Add("SynTrack");
        title.Enabled = false;

        menu.Items.Add(new ToolStripSeparator());
        menu.Items.Add("Sync now", null, (_, _) => SyncNowRequested?.Invoke());
        menu.Items.Add("Open SynTrack", null, (_, _) => OpenSynTrackRequested?.Invoke());
        menu.Items.Add("Settings", null, (_, _) => SettingsRequested?.Invoke());
        menu.Items.Add(new ToolStripSeparator());
        menu.Items.Add("Exit", null, (_, _) => ExitRequested?.Invoke());

        _notifyIcon = new NotifyIcon
        {
            Icon = icon,
            Text = "SynTrack",
            Visible = true,
            ContextMenuStrip = menu
        };

        _notifyIcon.DoubleClick += (_, _) => SettingsRequested?.Invoke();
    }

    public void Dispose()
    {
        _notifyIcon.Visible = false;
        _notifyIcon.Dispose();
    }
}
