namespace SynTrack.Client.Models;

/// <summary>
/// User-visible codeless-connect errors. Deliberately free of exception
/// text, HTTP bodies, URLs and tokens - each one says what happened and
/// what the user can do next.
/// </summary>
public static class ConnectMessages
{
    public const string Unreachable =
        "SynTrack is currently unreachable. Check your internet connection and try again.";

    public const string ServerError =
        "SynTrack could not start the connection. Please try again in a moment.";

    public const string Expired =
        "Sign-in timed out. Complete Battle.net in your browser, or try again.";

    public const string AwaitingApproval =
        "This SynTrack account is awaiting approval. Try again after an admin activates it.";

    public const string NoLongerValid =
        "This connection is no longer valid. Start a new connection.";

    public const string BrowserFailed =
        "Could not open your browser. Copy the sign-in link below, open it manually, then return here.";

    public const string StorageFailed =
        "SynTrack could not save the connection on this PC. Please try again.";

    public static string ForStartFailure(DeviceConnectStartFailure failure) => failure switch
    {
        DeviceConnectStartFailure.Unreachable => Unreachable,
        _ => ServerError
    };
}
