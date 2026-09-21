namespace SynTrack.Client;

using System.Reflection;

/// <summary>
/// Compile-time API/web base URLs. Builds default to the live site;
/// pass <c>-p:SynTrackApiBaseUrl</c> / pack <c>-ApiBaseUrl</c> to point
/// a local pack at <see cref="DevelopmentApiBaseUrl"/> instead.
/// </summary>
public static class ClientEndpoints
{
    public const string DevelopmentApiBaseUrl = "http://localhost:4000/api";
    public const string DevelopmentWebBaseUrl = "http://localhost:5173";

    public const string ProductionApiBaseUrl = "https://syntrack.io/api";
    public const string ProductionWebBaseUrl = "https://syntrack.io";

    public static string ApiBaseUrl { get; } = Read("SynTrackApiBaseUrl", ProductionApiBaseUrl);

    public static string WebBaseUrl { get; } = Read("SynTrackWebBaseUrl", ProductionWebBaseUrl);

    private static string Read(string key, string fallback)
    {
        var value = typeof(ClientEndpoints).Assembly
            .GetCustomAttributes<AssemblyMetadataAttribute>()
            .FirstOrDefault(attribute => attribute.Key == key)?.Value;

        if (string.IsNullOrWhiteSpace(value))
        {
            return fallback;
        }

        return value.Trim().TrimEnd('/');
    }
}
