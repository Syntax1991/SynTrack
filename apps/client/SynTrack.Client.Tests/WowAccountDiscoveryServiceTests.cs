namespace SynTrack.Client.Tests;

using SynTrack.Client.Services;

public class WowAccountDiscoveryServiceTests
{
    [Fact]
    public void ZeroMatchingAccountsProducesAnEmptyList()
    {
        var result = WowAccountDiscoveryService.DiscoverCore(
            new[] { "Account1" },
            _ => new HashSet<string>());

        Assert.Empty(result);
    }

    [Fact]
    public void OneMatchingAccountIsReturnedForAutoSelection()
    {
        var result = WowAccountDiscoveryService.DiscoverCore(
            new[] { "Account1" },
            _ => new HashSet<string> { AcceptedFiles.CoreFile });

        Assert.Single(result);
        Assert.Equal("Account1", result[0].AccountName);
    }

    [Fact]
    public void MultipleMatchingAccountsAreAllReturnedForExplicitSelection()
    {
        var result = WowAccountDiscoveryService.DiscoverCore(
            new[] { "Account1", "Account2" },
            _ => new HashSet<string> { AcceptedFiles.CoreFile });

        Assert.Equal(2, result.Count);
    }

    [Fact]
    public void UnrelatedAccountFoldersAreIgnored()
    {
        var result = WowAccountDiscoveryService.DiscoverCore(
            new[] { "Account1", "Account2" },
            name => name == "Account1"
                ? new HashSet<string> { AcceptedFiles.CoreFile }
                : new HashSet<string> { "UnrelatedAddon.lua" });

        var candidate = Assert.Single(result);
        Assert.Equal("Account1", candidate.AccountName);
    }

    [Fact]
    public void SavedVariablesDirBuildsTheExpectedPath()
    {
        var path = WowAccountDiscoveryService.SavedVariablesDir(@"C:\Games\World of Warcraft", "WOW1");

        Assert.Equal(@"C:\Games\World of Warcraft\_retail_\WTF\Account\WOW1\SavedVariables", path);
    }
}
