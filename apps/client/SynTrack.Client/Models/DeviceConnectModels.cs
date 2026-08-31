namespace SynTrack.Client.Models;

/// <summary>
/// POST /api/client/connect — WPF START contract from PR #19.
/// pollToken must never leave the connection service.
/// </summary>
public sealed class DeviceConnectStartResponse
{
    public required string BrowserUrl { get; init; }
    public required string PollToken { get; init; }
    public required string ExpiresAt { get; init; }
}

public enum DeviceConnectPollKind
{
    Pending,
    Expired,
    Consumed,
    ConsumedWithoutCredential,
    NotFound
}

/// <summary>
/// POST /api/client/connect/status — credential is present only on the
/// first CONSUMED poll. A later CONSUMED has no credential.
/// </summary>
public sealed class DeviceConnectPollResult
{
    public required DeviceConnectPollKind Kind { get; init; }
    public string? Credential { get; init; }
}

public sealed class DeviceConnectStartOutcome
{
    public required string BrowserUrl { get; init; }
    public required DateTimeOffset ExpiresAt { get; init; }
    public required bool BrowserOpened { get; init; }
}
