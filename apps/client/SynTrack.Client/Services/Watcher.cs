namespace SynTrack.Client.Services;

using System.IO;

/// <summary>
/// Waits for a quiet period after the last observed file-change event
/// before treating a file as stable - WoW writes SavedVariables in
/// several small flushes, so acting on the very first change event would
/// race a half-written file.
/// </summary>
public sealed class DebounceGate
{
    private readonly TimeSpan _quietPeriod;
    private DateTimeOffset? _lastEvent;

    public DebounceGate(TimeSpan quietPeriod)
    {
        _quietPeriod = quietPeriod;
    }

    public void RecordEvent(DateTimeOffset now) => _lastEvent = now;

    public bool IsStable(DateTimeOffset now) =>
        _lastEvent is null || now - _lastEvent.Value >= _quietPeriod;
}

/// <summary>
/// WoW briefly holds a lock on SavedVariables while writing. Retries a
/// bounded number of times with a short delay rather than failing the
/// sync outright on the first transient lock error. Never writes to the
/// file - this type is read-only by construction.
/// </summary>
public static class StableFileReader
{
    public static byte[] ReadWithRetry(string path, int attempts, TimeSpan delay)
    {
        Exception? lastError = null;

        for (var attempt = 0; attempt < attempts; attempt++)
        {
            try
            {
                return File.ReadAllBytes(path);
            }
            catch (IOException error)
            {
                lastError = error;
            }
            catch (UnauthorizedAccessException error)
            {
                lastError = error;
            }

            if (attempt + 1 < attempts)
            {
                Thread.Sleep(delay);
            }
        }

        throw lastError ?? new IOException($"Could not read '{path}'.");
    }
}

/// <summary>
/// Watches only the three accepted SavedVariables filenames inside one
/// account's SavedVariables directory - never SynTrack_Guild.lua, never
/// unrelated addon files - and raises <see cref="StableChangeDetected"/>
/// once file-change events have gone quiet for the debounce window.
/// </summary>
public sealed class SavedVariablesWatcherService : IDisposable
{
    private static readonly TimeSpan DebounceWindow = TimeSpan.FromMilliseconds(750);
    private static readonly TimeSpan PollInterval = TimeSpan.FromMilliseconds(200);

    private readonly DebounceGate _debounce = new(DebounceWindow);
    private FileSystemWatcher? _watcher;
    private System.Threading.Timer? _debounceTimer;

    public event Action? StableChangeDetected;

    public void Watch(string savedVariablesDir)
    {
        Stop();

        if (!Directory.Exists(savedVariablesDir))
        {
            return;
        }

        _watcher = new FileSystemWatcher(savedVariablesDir)
        {
            NotifyFilter = NotifyFilters.LastWrite | NotifyFilters.Size | NotifyFilters.FileName,
            IncludeSubdirectories = false
        };

        _watcher.Changed += OnFileSystemEvent;
        _watcher.Created += OnFileSystemEvent;
        _watcher.Renamed += OnFileSystemEvent;
        _watcher.EnableRaisingEvents = true;

        _debounceTimer = new System.Threading.Timer(CheckStable, null, Timeout.Infinite, Timeout.Infinite);

        // Startup scan: treat "watch just started" as an immediate stable
        // change so already-present files get evaluated without waiting
        // for the next real filesystem event.
        _debounce.RecordEvent(DateTimeOffset.UtcNow - DebounceWindow);
        StableChangeDetected?.Invoke();
    }

    private void OnFileSystemEvent(object sender, FileSystemEventArgs e)
    {
        if (e.Name is null || !IsAcceptedFileName(e.Name))
        {
            return;
        }

        _debounce.RecordEvent(DateTimeOffset.UtcNow);
        _debounceTimer?.Change(PollInterval, Timeout.InfiniteTimeSpan);
    }

    private void CheckStable(object? state)
    {
        if (_debounce.IsStable(DateTimeOffset.UtcNow))
        {
            StableChangeDetected?.Invoke();
        }
        else
        {
            _debounceTimer?.Change(PollInterval, Timeout.InfiniteTimeSpan);
        }
    }

    private static bool IsAcceptedFileName(string name) =>
        name == AcceptedFiles.CoreFile
        || name == AcceptedFiles.ProfessionsCanonicalFile
        || name == AcceptedFiles.ProfessionsLegacyFile;

    public void Stop()
    {
        if (_watcher is not null)
        {
            _watcher.Changed -= OnFileSystemEvent;
            _watcher.Created -= OnFileSystemEvent;
            _watcher.Renamed -= OnFileSystemEvent;
            _watcher.Dispose();
            _watcher = null;
        }

        _debounceTimer?.Dispose();
        _debounceTimer = null;
    }

    public void Dispose() => Stop();
}
