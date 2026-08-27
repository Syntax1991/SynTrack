namespace SynTrack.Client.Models;

public sealed class DeviceLinkCreateResponse
{
    public required string UserCode { get; init; }
    public required string DeviceCode { get; init; }
    public required string ExpiresAt { get; init; }
}

/// <summary>
/// Mirrors the backend's DeviceLinkStatusResult discriminated union -
/// Credential is present only on the exact CONSUMED response that issues
/// it, never retrievable again afterward.
/// </summary>
public sealed class DeviceLinkStatusResponse
{
    public required string Status { get; init; }
    public string? Credential { get; init; }
}
