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

    /// <summary>
    /// Server clock (HTTP Date header) at the time of the response, used to
    /// turn expiresAt into a local deadline immune to local clock skew.
    /// </summary>
    [System.Text.Json.Serialization.JsonIgnore]
    public DateTimeOffset? ServerDate { get; init; }
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

/// <summary>
/// Why START failed, as far as the UI needs to know. Never carries a raw
/// exception message, response body or token-bearing URL.
/// </summary>
public enum DeviceConnectStartFailure
{
    /// <summary>DNS / TCP / TLS failure or timeout - the service was not reached.</summary>
    Unreachable,

    /// <summary>5xx / 429 - reached, but it could not start a connection right now.</summary>
    ServerError,

    /// <summary>Other 4xx - the service refused this request.</summary>
    Rejected,

    /// <summary>2xx whose body is not the START contract (HTML, bad JSON, missing fields).</summary>
    InvalidResponse
}

public sealed class DeviceConnectStartException : Exception
{
    public DeviceConnectStartException(DeviceConnectStartFailure failure, int? statusCode = null)
        : base($"Connection start failed: {failure}{(statusCode is null ? string.Empty : $" (HTTP {statusCode})")}.")
    {
        Failure = failure;
        StatusCode = statusCode;
    }

    public DeviceConnectStartFailure Failure { get; }

    public int? StatusCode { get; }
}
