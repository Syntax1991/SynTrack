namespace SynTrack.Client.Tests;

using SynTrack.Client;
using SynTrack.Client.Services;

public class ClientEndpointsTests
{
    [Fact]
    public void DefaultBuildStampsTheLiveSynTrackSite()
    {
        Assert.Equal(ClientEndpoints.ProductionApiBaseUrl, ClientEndpoints.ApiBaseUrl);
        Assert.Equal(ClientEndpoints.ProductionWebBaseUrl, ClientEndpoints.WebBaseUrl);
    }
}

public class PackagedAppTests
{
    [Fact]
    public void TheTestHostIsNotAnMsixPackage()
    {
        Assert.False(PackagedApp.IsRunningAsPackaged);
    }
}
