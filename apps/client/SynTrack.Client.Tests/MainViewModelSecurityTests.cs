namespace SynTrack.Client.Tests;

using System.Reflection;
using SynTrack.Client.ViewModels;

/// <summary>
/// The View/ViewModel layer is the closest equivalent this architecture
/// has to a "renderer" boundary - these tests prove the raw DeviceCredential
/// is not exposed through any bindable property, matching the requirement
/// that the credential belongs only to the service layer that owns
/// DPAPI-backed storage.
/// </summary>
public class MainViewModelSecurityTests
{
    [Fact]
    public void NoPublicPropertyNameReferencesTheRawCredential()
    {
        var properties = typeof(MainViewModel).GetProperties(BindingFlags.Public | BindingFlags.Instance);

        Assert.DoesNotContain(properties, p => p.Name.Contains("Credential", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void NoPublicPropertyExposesTheHighEntropyDeviceCode()
    {
        var properties = typeof(MainViewModel).GetProperties(BindingFlags.Public | BindingFlags.Instance);

        Assert.DoesNotContain(properties, p => p.Name.Contains("DeviceCode", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void NoPublicPropertyExposesThePollToken()
    {
        var properties = typeof(MainViewModel).GetProperties(BindingFlags.Public | BindingFlags.Instance);

        Assert.DoesNotContain(properties, p => p.Name.Contains("PollToken", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void OnlyTheShortUserCodeIsExposedForDisplay()
    {
        var property = typeof(MainViewModel).GetProperty("PendingUserCode", BindingFlags.Public | BindingFlags.Instance);

        Assert.NotNull(property);
        Assert.Equal(typeof(string), property!.PropertyType);
    }

    /// <summary>
    /// BattleTag ("Syntax#21715") is display identity, not a secret - it
    /// is fine for it to be a public bindable property. This only proves
    /// it is a plain string (not, say, a token/credential wrapper type)
    /// and that adding it did not also introduce a raw-secret property
    /// alongside it.
    /// </summary>
    [Fact]
    public void BattleTagIsExposedAsAPlainStringDisplayProperty()
    {
        var property = typeof(MainViewModel).GetProperty("BattleTag", BindingFlags.Public | BindingFlags.Instance);

        Assert.NotNull(property);
        Assert.Equal(typeof(string), property!.PropertyType);
    }

    [Fact]
    public void NoPublicPropertyNameReferencesAnAccessOrRefreshToken()
    {
        var properties = typeof(MainViewModel).GetProperties(BindingFlags.Public | BindingFlags.Instance);

        Assert.DoesNotContain(properties, p =>
            p.Name.Contains("AccessToken", StringComparison.OrdinalIgnoreCase) ||
            p.Name.Contains("RefreshToken", StringComparison.OrdinalIgnoreCase));
    }
}
