namespace SynTrack.Client.Services;

using System.IO;
using SynTrack.Client.Models;

public interface IWowAccountDiscoveryService
{
    IReadOnlyList<AccountCandidate> DiscoverAccounts(string wowPath);
}

public sealed class WowAccountDiscoveryService : IWowAccountDiscoveryService
{
    public IReadOnlyList<AccountCandidate> DiscoverAccounts(string wowPath)
    {
        var accountRoot = WowDiscoveryService.AccountRoot(wowPath);

        if (!Directory.Exists(accountRoot))
        {
            return Array.Empty<AccountCandidate>();
        }

        var accountNames = Directory.GetDirectories(accountRoot)
            .Select(Path.GetFileName)
            .Where(name => name is not null)
            .Select(name => name!);

        return DiscoverCore(accountNames, name => ListSavedVariablesFiles(wowPath, name));
    }

    /// <summary>
    /// <paramref name="listSavedVariablesFiles"/> is injected (rather than
    /// reading the real filesystem here) so the account/addon-precedence
    /// selection logic stays unit-testable without a real WoW install on
    /// disk.
    /// </summary>
    internal static IReadOnlyList<AccountCandidate> DiscoverCore(
        IEnumerable<string> accountNames,
        Func<string, IReadOnlySet<string>> listSavedVariablesFiles)
    {
        var results = new List<AccountCandidate>();

        foreach (var accountName in accountNames)
        {
            var candidate = AcceptedFiles.BuildAccountCandidate(accountName, listSavedVariablesFiles(accountName));

            if (candidate is not null)
            {
                results.Add(candidate);
            }
        }

        return results;
    }

    private static IReadOnlySet<string> ListSavedVariablesFiles(string wowPath, string accountName)
    {
        var directory = SavedVariablesDir(wowPath, accountName);

        if (!Directory.Exists(directory))
        {
            return new HashSet<string>();
        }

        return Directory.GetFiles(directory)
            .Select(Path.GetFileName)
            .Where(name => name is not null)
            .Select(name => name!)
            .ToHashSet();
    }

    public static string SavedVariablesDir(string wowPath, string accountName) =>
        Path.Combine(wowPath, "_retail_", "WTF", "Account", accountName, "SavedVariables");
}
