namespace SynTrack.Client.Services;

using System.IO;
using System.Text.Json;
using SynTrack.Client.Models;

public interface IClientSettingsService
{
    ClientSettings Load();
    void Save(ClientSettings settings);
    SyncGate LoadSyncGate();
    void SaveSyncGate(SyncGate gate);
}

/// <summary>
/// Non-secret settings only, persisted as plain JSON under the app-data
/// directory - the DeviceCredential is deliberately never stored here
/// (see DpapiCredentialService).
/// </summary>
public sealed class ClientSettingsService : IClientSettingsService
{
    private static readonly JsonSerializerOptions JsonOptions = new() { WriteIndented = true };

    private readonly string _baseDir;

    public ClientSettingsService(string baseDir)
    {
        _baseDir = baseDir;
    }

    private string SettingsPath => Path.Combine(_baseDir, "settings.json");

    private string SyncGatePath => Path.Combine(_baseDir, "sync-gate.json");

    public ClientSettings Load()
    {
        try
        {
            var json = File.ReadAllText(SettingsPath);
            return JsonSerializer.Deserialize<ClientSettings>(json) ?? new ClientSettings();
        }
        catch
        {
            return new ClientSettings();
        }
    }

    public void Save(ClientSettings settings)
    {
        Directory.CreateDirectory(_baseDir);
        File.WriteAllText(SettingsPath, JsonSerializer.Serialize(settings, JsonOptions));
    }

    public SyncGate LoadSyncGate()
    {
        try
        {
            var json = File.ReadAllText(SyncGatePath);
            var snapshot = JsonSerializer.Deserialize<Dictionary<string, string>>(json);
            return snapshot is null ? new SyncGate() : SyncGate.FromSnapshot(snapshot);
        }
        catch
        {
            return new SyncGate();
        }
    }

    public void SaveSyncGate(SyncGate gate)
    {
        Directory.CreateDirectory(_baseDir);
        File.WriteAllText(SyncGatePath, JsonSerializer.Serialize(gate.Snapshot(), JsonOptions));
    }
}
