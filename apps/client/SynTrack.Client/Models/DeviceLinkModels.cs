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

/// <summary>
/// Mirrors GET /api/client/me. BattleTag is null both when the
/// authenticated device credential predates raiderAccountId linkage and
/// when the linked RaiderAccount has none on file - the client treats
/// both the same way (no identity line shown), never as an error.
/// </summary>
public sealed class ClientProfileResponse
{
    public string? BattleTag { get; init; }
}
