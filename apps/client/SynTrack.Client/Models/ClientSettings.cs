namespace SynTrack.Client.Models;

/// <summary>Non-secret settings only - the DeviceCredential never lives here.</summary>
public sealed class ClientSettings
{
    public string? WowPath { get; set; }
    public string? AccountName { get; set; }
    public bool StartMinimized { get; set; }
    public bool Autostart { get; set; }
}
