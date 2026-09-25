namespace SynTrack.Client;

using System.Net;
using System.Reflection;

/// <summary>
/// Compile-time API/web base URLs. Builds default to the live site;
/// pass <c>-p:SynTrackApiBaseUrl</c> / pack <c>-ApiBaseUrl</c> to point
/// a local build at <see cref="DevelopmentApiBaseUrl"/> instead.
///
/// A packaged (MSIX / Store) process never talks to a localhost or plain
/// HTTP endpoint unless the build was explicitly stamped with
/// <c>SynTrackAllowInsecureEndpoints=true</c> (pack.ps1
/// <c>-AllowInsecureEndpoints</c>, local sideload tests only) - a
/// Store package built with dev endpoints fell over on every
/// certification machine with "Could not connect this client."
/// </summary>
public static class ClientEndpoints
{
    public const string DevelopmentApiBaseUrl = "http://localhost:4000/api";
    public const string DevelopmentWebBaseUrl = "http://localhost:5173";

    public const string ProductionApiBaseUrl = "https://syntrack.io/api";
    public const string ProductionWebBaseUrl = "https://syntrack.io";

    private static readonly Lazy<ResolvedEndpoints> Resolved = new(() => Resolve(
        ReadMetadata("SynTrackApiBaseUrl"),
        ReadMetadata("SynTrackWebBaseUrl"),
        Services.PackagedApp.IsRunningAsPackaged,
        string.Equals(ReadMetadata("SynTrackAllowInsecureEndpoints"), "true", StringComparison.OrdinalIgnoreCase)));

    public static string ApiBaseUrl => Resolved.Value.ApiBaseUrl;

    public static string WebBaseUrl => Resolved.Value.WebBaseUrl;

    /// <summary>
    /// True when the stamped endpoints were rejected for this packaged
    /// process and the production endpoints are used instead.
    /// </summary>
    public static bool FellBackToProduction => Resolved.Value.FellBackToProduction;

    /// <summary>
    /// Absolute HTTPS URL whose host is not localhost / loopback. The
    /// only shape a Store / packaged production build may call.
    /// </summary>
    public static bool IsTrustedProductionUrl(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)
            || !Uri.TryCreate(value.Trim(), UriKind.Absolute, out var uri))
        {
            return false;
        }

        if (uri.Scheme != Uri.UriSchemeHttps || string.IsNullOrEmpty(uri.Host))
        {
            return false;
        }

        return !IsLoopbackHost(uri);
    }

    public static ResolvedEndpoints Resolve(
        string? stampedApi,
        string? stampedWeb,
        bool isPackaged,
        bool allowInsecure)
    {
        var api = Normalize(stampedApi) ?? ProductionApiBaseUrl;
        var web = Normalize(stampedWeb) ?? ProductionWebBaseUrl;

        if (isPackaged && !allowInsecure
            && (!IsTrustedProductionUrl(api) || !IsTrustedProductionUrl(web)))
        {
            return new ResolvedEndpoints(ProductionApiBaseUrl, ProductionWebBaseUrl, FellBackToProduction: true);
        }

        return new ResolvedEndpoints(api, web, FellBackToProduction: false);
    }

    /// <summary>
    /// scheme://host[:port]/path with any query / fragment dropped, so a
    /// URL carrying a browser or poll token can be logged safely.
    /// </summary>
    public static string SanitizeForLog(string? url)
    {
        if (string.IsNullOrWhiteSpace(url) || !Uri.TryCreate(url, UriKind.Absolute, out var uri))
        {
            return "<invalid-url>";
        }

        return uri.GetLeftPart(UriPartial.Path);
    }

    private static bool IsLoopbackHost(Uri uri)
    {
        if (uri.IsLoopback
            || string.Equals(uri.Host, "localhost", StringComparison.OrdinalIgnoreCase)
            || uri.Host.EndsWith(".localhost", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        return IPAddress.TryParse(uri.IdnHost.Trim('[', ']'), out var address)
            && (IPAddress.IsLoopback(address) || address.Equals(IPAddress.Any) || address.Equals(IPAddress.IPv6Any));
    }

    private static string? Normalize(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim().TrimEnd('/');

    private static string? ReadMetadata(string key) =>
        typeof(ClientEndpoints).Assembly
            .GetCustomAttributes<AssemblyMetadataAttribute>()
            .FirstOrDefault(attribute => attribute.Key == key)?.Value;
}

public sealed record ResolvedEndpoints(string ApiBaseUrl, string WebBaseUrl, bool FellBackToProduction);
