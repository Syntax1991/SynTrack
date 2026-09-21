namespace SynTrack.Client.Services;

using System.Diagnostics;
using Microsoft.Win32;
using Windows.ApplicationModel;

/// <summary>
/// Per-user startup. Unpackaged installs use HKCU\...\Run (no admin).
/// MSIX / Store installs use the <c>windows.startupTask</c> declared in
/// the package manifest — Store policy rejects Run-key autostart.
/// </summary>
public sealed class AutoStartService
{
    private const string RunKeyPath = @"Software\Microsoft\Windows\CurrentVersion\Run";
    private const string ValueName = "SynTrackClient";
    public const string StartupTaskId = "SynTrackAutostart";

    public bool IsEnabled()
    {
        if (PackagedApp.IsRunningAsPackaged)
        {
            var task = StartupTask.GetAsync(StartupTaskId).GetAwaiter().GetResult();
            return task.State is StartupTaskState.Enabled or StartupTaskState.EnabledByPolicy;
        }

        using var key = Registry.CurrentUser.OpenSubKey(RunKeyPath, writable: false);
        return key?.GetValue(ValueName) is not null;
    }

    public void SetEnabled(bool enabled)
    {
        if (PackagedApp.IsRunningAsPackaged)
        {
            SetPackagedStartup(enabled);
            return;
        }

        using var key = Registry.CurrentUser.OpenSubKey(RunKeyPath, writable: true)
            ?? Registry.CurrentUser.CreateSubKey(RunKeyPath)!;

        if (enabled)
        {
            var exePath = Environment.ProcessPath ?? Process.GetCurrentProcess().MainModule?.FileName;

            if (exePath is not null)
            {
                key.SetValue(ValueName, $"\"{exePath}\"");
            }
        }
        else
        {
            key.DeleteValue(ValueName, throwOnMissingValue: false);
        }
    }

    private static void SetPackagedStartup(bool enabled)
    {
        var task = StartupTask.GetAsync(StartupTaskId).GetAwaiter().GetResult();

        if (enabled)
        {
            if (task.State == StartupTaskState.Disabled)
            {
                _ = task.RequestEnableAsync().GetAwaiter().GetResult();
            }

            return;
        }

        if (task.State is StartupTaskState.Enabled or StartupTaskState.EnabledByPolicy)
        {
            task.Disable();
        }
    }
}
