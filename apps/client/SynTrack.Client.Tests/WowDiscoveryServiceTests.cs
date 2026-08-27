namespace SynTrack.Client.Tests;

using SynTrack.Client.Services;

public class WowDiscoveryServiceTests
{
    [Fact]
    public void ConfiguredPathWinsWhenItExistsEvenIfUncommon()
    {
        var candidates = new WowDiscoveryService().CandidateInstallPaths();
        const string configured = @"E:\Custom\WoW";

        var resolved = WowDiscoveryService.ResolveWowInstallCore(
            configured,
            candidates,
            path => path == configured);

        Assert.Equal(configured, resolved);
    }

    [Fact]
    public void FallsBackToTheFirstExistingCommonCandidate()
    {
        var candidates = new WowDiscoveryService().CandidateInstallPaths();
        var second = candidates[1];

        var resolved = WowDiscoveryService.ResolveWowInstallCore(null, candidates, path => path == second);

        Assert.Equal(second, resolved);
    }

    [Fact]
    public void ConfiguredPathIsIgnoredWhenItNoLongerExists()
    {
        var candidates = new WowDiscoveryService().CandidateInstallPaths();
        var first = candidates[0];

        var resolved = WowDiscoveryService.ResolveWowInstallCore(
            @"E:\Gone\WoW",
            candidates,
            path => path == first);

        Assert.Equal(first, resolved);
    }

    [Fact]
    public void ReturnsNullWhenNothingExists()
    {
        var candidates = new WowDiscoveryService().CandidateInstallPaths();

        var resolved = WowDiscoveryService.ResolveWowInstallCore(null, candidates, _ => false);

        Assert.Null(resolved);
    }

    [Fact]
    public void AccountRootPointsAtRetailWtfAccount()
    {
        var accountRoot = WowDiscoveryService.AccountRoot(@"C:\Games\World of Warcraft");

        Assert.Equal(@"C:\Games\World of Warcraft\_retail_\WTF\Account", accountRoot);
    }
}
