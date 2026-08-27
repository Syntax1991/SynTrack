namespace SynTrack.Client.Services;

using System.IO;

/// <summary>
/// Never called with deviceCode, DeviceCredential, RaiderSession values,
/// raw Authorization headers, or raw SavedVariables content - callers
/// pass only status/addon/path-level information.
/// </summary>
public sealed class ClientLogger
{
    private readonly string _logFilePath;
    private readonly object _writeLock = new();

    public ClientLogger(string baseDir)
    {
        Directory.CreateDirectory(baseDir);
        _logFilePath = Path.Combine(baseDir, "client.log");
    }

    public void Info(string message) => Write("INFO", message);

    public void Warn(string message) => Write("WARN", message);

    public void Error(string message) => Write("ERROR", message);

    private void Write(string level, string message)
    {
        var line = $"{DateTimeOffset.UtcNow:o} [{level}] {message}";

        try
        {
            lock (_writeLock)
            {
                File.AppendAllText(_logFilePath, line + Environment.NewLine);
            }
        }
        catch (IOException)
        {
            // Logging must never crash the app - a failed log write is dropped.
        }
    }
}
