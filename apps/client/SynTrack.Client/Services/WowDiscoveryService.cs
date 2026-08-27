namespace SynTrack.Client.Services;

using System.IO;

public interface IWowDiscoveryService
{
    IReadOnlyList<string> CandidateInstallPaths();
    string? ResolveWowInstall(string? configuredPath);
}

public sealed class WowDiscoveryService : IWowDiscoveryService
{
    /// <summary>
    /// Known common install locations, in priority order. Deliberately
    /// not just the default Program Files (x86) path - many players move
    /// their WoW install to a game drive or a custom Battle.net install
    /// directory.
    /// </summary>
    public IReadOnlyList<string> CandidateInstallPaths() => new[]
    {
        @"C:\Program Files (x86)\World of Warcraft",
        @"C:\Program Files\World of Warcraft",
        @"C:\Games\World of Warcraft",
        @"D:\Games\World of Warcraft",
        @"D:\World of Warcraft"
    };

    public string? ResolveWowInstall(string? configuredPath) =>
        ResolveWowInstallCore(configuredPath, CandidateInstallPaths(), Directory.Exists);

    /// <summary>
    /// Resolution order: an explicitly configured path wins if it still
    /// exists, then the first existing common install path, otherwise
    /// null (the caller must fall back to a manual Browse dialog).
    /// <paramref name="exists"/> is injected so this stays unit-testable
    /// without touching the real filesystem.
    /// </summary>
    internal static string? ResolveWowInstallCore(
        string? configuredPath,
        IReadOnlyList<string> candidates,
        Func<string, bool> exists)
    {
        if (configuredPath is not null && exists(configuredPath))
        {
            return configuredPath;
        }

        foreach (var candidate in candidates)
        {
            if (exists(candidate))
            {
                return candidate;
            }
        }

        return null;
    }

    public static string AccountRoot(string wowPath) =>
        Path.Combine(wowPath, "_retail_", "WTF", "Account");
}
