namespace SynTrack.Client.Services;

using System.Security.Cryptography;

public static class ContentHasher
{
    public static string Sha256Hex(byte[] bytes) =>
        Convert.ToHexString(SHA256.HashData(bytes)).ToLowerInvariant();
}

/// <summary>
/// Tracks the last successfully-uploaded content hash per addon so the
/// watcher can skip re-uploading unchanged SavedVariables content, even
/// across debounced file-write events or app restarts (the snapshot is
/// meant to be persisted to disk and reloaded by the caller).
/// </summary>
public sealed class SyncGate
{
    private readonly Dictionary<string, string> _lastHashes = new();

    public bool ShouldUpload(string addon, string hash) =>
        !_lastHashes.TryGetValue(addon, out var last) || last != hash;

    public void RecordSuccess(string addon, string hash) => _lastHashes[addon] = hash;

    public IReadOnlyDictionary<string, string> Snapshot() => _lastHashes;

    public static SyncGate FromSnapshot(IReadOnlyDictionary<string, string> snapshot)
    {
        var gate = new SyncGate();

        foreach (var (addon, hash) in snapshot)
        {
            gate._lastHashes[addon] = hash;
        }

        return gate;
    }
}
