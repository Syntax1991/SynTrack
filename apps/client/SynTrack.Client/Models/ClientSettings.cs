namespace SynTrack.Client.Models;

/// <summary>Non-secret settings only - the DeviceCredential never lives here.</summary>
public sealed class ClientSettings
{
    public string? WowPath { get; set; }
    public string? AccountName { get; set; }
    public bool StartMinimized { get; set; }
    public bool Autostart { get; set; }

    /// <summary>
    /// Last successful client upload. Persisted so a restart does not
    /// fall back to "Never" after a real sync already happened.
    /// </summary>
    public DateTimeOffset? LastSyncAt { get; set; }
}
