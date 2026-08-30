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
/// Healthy-connection states the desktop client must distinguish.
/// Never treat legacy (unowned credential) as FullyConnected.
/// </summary>
public enum AccountHealth
{
    SignedOut,
    SigningIn,
    FullyConnected,
    ReconnectRequired,
    ConnectionIssue
}

/// <summary>Result of GET /api/client/me including transport outcome.</summary>
public sealed class ClientProfileFetchResult
{
    public required AccountHealth Health { get; init; }
    public string? BattleTag { get; init; }
}

/// <summary>DTO body of GET /api/client/me.</summary>
public sealed class ClientProfileResponse
{
    public string? IdentityStatus { get; init; }
    public string? BattleTag { get; init; }
}

public enum ClientCharactersFetchStatus
{
    Ok,
    LegacyReconnectRequired,
    Unauthorized,
    TemporaryFailure
}

public sealed class ClientCharactersFetchResult
{
    public required ClientCharactersFetchStatus Status { get; init; }
    public IReadOnlyList<ClientCharacterSummary> Items { get; init; } = Array.Empty<ClientCharacterSummary>();
}
