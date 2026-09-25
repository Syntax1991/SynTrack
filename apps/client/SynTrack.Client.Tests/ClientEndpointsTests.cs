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
        Assert.False(ClientEndpoints.FellBackToProduction);
    }

    [Fact]
    public void ProductionEndpointsAreTrustedHttpsNonLocalhost()
    {
        Assert.StartsWith("https://", ClientEndpoints.ProductionApiBaseUrl);
        Assert.StartsWith("https://", ClientEndpoints.ProductionWebBaseUrl);
        Assert.True(ClientEndpoints.IsTrustedProductionUrl(ClientEndpoints.ProductionApiBaseUrl));
        Assert.True(ClientEndpoints.IsTrustedProductionUrl(ClientEndpoints.ProductionWebBaseUrl));
    }

    [Theory]
    [InlineData("http://localhost:4000/api")]
    [InlineData("http://localhost:5173")]
    [InlineData("https://localhost:4000/api")]
    [InlineData("https://LOCALHOST/api")]
    [InlineData("https://dev.localhost/api")]
    [InlineData("https://127.0.0.1/api")]
    [InlineData("https://127.1.2.3/api")]
    [InlineData("https://[::1]/api")]
    [InlineData("https://0.0.0.0/api")]
    [InlineData("http://syntrack.io/api")]
    [InlineData("ftp://syntrack.io")]
    [InlineData("syntrack.io/api")]
    [InlineData("not a url")]
    [InlineData("")]
    [InlineData(null)]
    public void DevLoopbackPlainHttpAndInvalidUrlsAreNotTrusted(string? url)
    {
        Assert.False(ClientEndpoints.IsTrustedProductionUrl(url));
    }

    [Fact]
    public void APackagedBuildStampedWithDevEndpointsFallsBackToProduction()
    {
        var resolved = ClientEndpoints.Resolve(
            ClientEndpoints.DevelopmentApiBaseUrl,
            ClientEndpoints.DevelopmentWebBaseUrl,
            isPackaged: true,
            allowInsecure: false);

        Assert.True(resolved.FellBackToProduction);
        Assert.Equal(ClientEndpoints.ProductionApiBaseUrl, resolved.ApiBaseUrl);
        Assert.Equal(ClientEndpoints.ProductionWebBaseUrl, resolved.WebBaseUrl);
    }

    [Fact]
    public void APackagedBuildRejectsEvenOneInsecureEndpoint()
    {
        var resolved = ClientEndpoints.Resolve(
            ClientEndpoints.ProductionApiBaseUrl,
            ClientEndpoints.DevelopmentWebBaseUrl,
            isPackaged: true,
            allowInsecure: false);

        Assert.True(resolved.FellBackToProduction);
        Assert.Equal(ClientEndpoints.ProductionWebBaseUrl, resolved.WebBaseUrl);
    }

    [Fact]
    public void AnUnpackagedDevBuildKeepsItsIntentionalLocalhostOverride()
    {
        var resolved = ClientEndpoints.Resolve(
            ClientEndpoints.DevelopmentApiBaseUrl + "/",
            ClientEndpoints.DevelopmentWebBaseUrl,
            isPackaged: false,
            allowInsecure: false);

        Assert.False(resolved.FellBackToProduction);
        Assert.Equal(ClientEndpoints.DevelopmentApiBaseUrl, resolved.ApiBaseUrl);
        Assert.Equal(ClientEndpoints.DevelopmentWebBaseUrl, resolved.WebBaseUrl);
    }

    [Fact]
    public void AnExplicitInsecureSideloadBuildKeepsLocalhostWhenPackaged()
    {
        var resolved = ClientEndpoints.Resolve(
            ClientEndpoints.DevelopmentApiBaseUrl,
            ClientEndpoints.DevelopmentWebBaseUrl,
            isPackaged: true,
            allowInsecure: true);

        Assert.False(resolved.FellBackToProduction);
        Assert.Equal(ClientEndpoints.DevelopmentApiBaseUrl, resolved.ApiBaseUrl);
    }

    [Fact]
    public void MissingStampedValuesResolveToProduction()
    {
        var resolved = ClientEndpoints.Resolve(null, "  ", isPackaged: true, allowInsecure: false);

        Assert.Equal(ClientEndpoints.ProductionApiBaseUrl, resolved.ApiBaseUrl);
        Assert.Equal(ClientEndpoints.ProductionWebBaseUrl, resolved.WebBaseUrl);
        Assert.False(resolved.FellBackToProduction);
    }

    [Fact]
    public void SanitizeForLogDropsTokenQueryAndFragment()
    {
        var sanitized = ClientEndpoints.SanitizeForLog("https://syntrack.io/client/connect?token=browser-secret#frag");

        Assert.Equal("https://syntrack.io/client/connect", sanitized);
        Assert.DoesNotContain("browser-secret", sanitized);
        Assert.Equal("<invalid-url>", ClientEndpoints.SanitizeForLog("not a url"));
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
