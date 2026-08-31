namespace SynTrack.Client.Services;

using System.Diagnostics;

public interface IBrowserLauncher
{
    bool TryOpen(string url);
}

/// <summary>
/// Opens URLs with the user's default system browser. Never embeds a
/// WebView or collects Battle.net credentials.
/// </summary>
public sealed class SystemBrowserLauncher : IBrowserLauncher
{
    public bool TryOpen(string url)
    {
        try
        {
            Process.Start(new ProcessStartInfo(url) { UseShellExecute = true });
            return true;
        }
        catch
        {
            return false;
        }
    }
}
