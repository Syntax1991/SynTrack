namespace SynTrack.Client.Services;

/// <summary>
/// A live-tested real defect: a raw `SynTrack.Client.exe` double-click landed
/// as a second, separate process while a `dotnet.exe SynTrack.Client.dll`
/// instance was already running the same app, with no coordination between
/// them - two watchers, ambiguous logging, unclear which one performed a
/// given import. The mutex name is a fixed application identity, never
/// derived from the process/executable name, so both hosting styles (the
/// raw exe and dotnet.exe hosting the framework-dependent DLL) are
/// recognized as the same application.
/// </summary>
public sealed class SingleInstanceGuard : IDisposable
{
    private const string MutexName = "SynTrack.Client.SingleInstance";

    private readonly Mutex _mutex;
    private readonly bool _isFirstInstance;

    public SingleInstanceGuard() : this(MutexName)
    {
    }

    /// <summary>Internal test seam - production code always uses the fixed application-wide name.</summary>
    internal SingleInstanceGuard(string mutexName)
    {
        _mutex = new Mutex(initiallyOwned: false, mutexName);

        try
        {
            _isFirstInstance = _mutex.WaitOne(TimeSpan.Zero);
        }
        catch (AbandonedMutexException)
        {
            // The previous owning instance exited (or crashed) without
            // releasing - we still now hold it, so this is a legitimate
            // first instance, not a rejection.
            _isFirstInstance = true;
        }
    }

    public bool IsFirstInstance => _isFirstInstance;

    public void Dispose()
    {
        if (_isFirstInstance)
        {
            _mutex.ReleaseMutex();
        }

        _mutex.Dispose();
    }
}
