namespace SynTrack.Client.Models;

/// <summary>
/// Deliberately not a single generic "sync failed" flag - each state is
/// shown distinctly in the UI so the user knows what to do next
/// (relink vs. wait vs. update the client).
/// </summary>
public enum SyncStatus
{
    WaitingForData,
    NewDataDetected,
    Syncing,
    Synced,
    NoChanges,
    AuthenticationRequired,
    ApiUnavailable,
    UnsupportedProtocol,
    UnsupportedAddonSchema,
    ParseError,
    ValidationError
}

public enum AttemptOutcome
{
    Success,
    NetworkError,
    HttpError
}

public static class SyncStatusExtensions
{
    public static string ToDisplayLabel(this SyncStatus status) => status switch
    {
        SyncStatus.WaitingForData => "Waiting for WoW data",
        SyncStatus.NewDataDetected => "New data detected",
        SyncStatus.Syncing => "Syncing...",
        SyncStatus.Synced => "Synced",
        SyncStatus.NoChanges => "No changes",
        SyncStatus.AuthenticationRequired => "Authentication required",
        SyncStatus.ApiUnavailable => "SynTrack is unavailable",
        SyncStatus.UnsupportedProtocol => "Client update required",
        SyncStatus.UnsupportedAddonSchema => "Addon update required",
        SyncStatus.ParseError => "Could not read addon data",
        SyncStatus.ValidationError => "Addon data was rejected",
        _ => status.ToString()
    };

    public static string ToTone(this SyncStatus status) => status switch
    {
        SyncStatus.Synced => "positive",
        SyncStatus.NoChanges => "positive",
        SyncStatus.Syncing => "progress",
        SyncStatus.WaitingForData => "neutral",
        SyncStatus.NewDataDetected => "neutral",
        SyncStatus.AuthenticationRequired => "warning",
        SyncStatus.ApiUnavailable => "warning",
        _ => "error"
    };

    /// <summary>
    /// Maps the backend's HTTP status/message back to one of the specific
    /// client sync states. A null status means the request never reached
    /// the server at all (offline/DNS/connect failure).
    /// </summary>
    public static SyncStatus ClassifyImportError(int? statusCode, string message)
    {
        if (statusCode is null)
        {
            return SyncStatus.ApiUnavailable;
        }

        if (statusCode == 401)
        {
            return SyncStatus.AuthenticationRequired;
        }

        if (message.Contains("protocol version", StringComparison.OrdinalIgnoreCase))
        {
            return SyncStatus.UnsupportedProtocol;
        }

        if (message.Contains("schema version", StringComparison.OrdinalIgnoreCase))
        {
            return SyncStatus.UnsupportedAddonSchema;
        }

        if (message.Contains("could not be read", StringComparison.OrdinalIgnoreCase))
        {
            return SyncStatus.ParseError;
        }

        return SyncStatus.ValidationError;
    }

    /// <summary>
    /// A bounded, deliberately narrow retry policy: only transient network
    /// failures are retried (a validation/schema/auth rejection will never
    /// succeed by retrying, so it fails fast instead).
    /// </summary>
    public static bool ShouldRetry(AttemptOutcome outcome, int attemptNumber, int maxAttempts) =>
        outcome == AttemptOutcome.NetworkError && attemptNumber < maxAttempts;
}
