namespace SynTrack.Client.Tests;

using SynTrack.Client.Models;
using SynTrack.Client.Services;

public class ClientSettingsServiceTests : IDisposable
{
    private readonly string _tempDir = Path.Combine(Path.GetTempPath(), "syntrack-client-tests-" + Guid.NewGuid());

    [Fact]
    public void LoadingSettingsThatWereNeverSavedReturnsDefaults()
    {
        var service = new ClientSettingsService(_tempDir);

        var settings = service.Load();

        Assert.Null(settings.WowPath);
        Assert.False(settings.Autostart);
        Assert.Null(settings.LastSyncAt);
    }

    [Fact]
    public void SavedSettingsRoundTripThroughDisk()
    {
        var service = new ClientSettingsService(_tempDir);

        var lastSyncAt = new DateTimeOffset(2026, 9, 7, 13, 33, 0, TimeSpan.Zero);
        var settings = new ClientSettings
        {
            WowPath = @"C:\Games\World of Warcraft",
            AccountName = "WOW1",
            StartMinimized = true,
            Autostart = false,
            LastSyncAt = lastSyncAt
        };

        service.Save(settings);
        var loaded = service.Load();

        Assert.Equal(settings.WowPath, loaded.WowPath);
        Assert.Equal(settings.AccountName, loaded.AccountName);
        Assert.Equal(settings.StartMinimized, loaded.StartMinimized);
        Assert.Equal(lastSyncAt, loaded.LastSyncAt);
    }

    [Fact]
    public void ACorruptedSettingsFileFallsBackToDefaultsInsteadOfThrowing()
    {
        Directory.CreateDirectory(_tempDir);
        File.WriteAllText(Path.Combine(_tempDir, "settings.json"), "not valid json");

        var service = new ClientSettingsService(_tempDir);
        var settings = service.Load();

        Assert.Null(settings.WowPath);
    }

    [Fact]
    public void APersistedSyncGateSurvivesAReload()
    {
        var service = new ClientSettingsService(_tempDir);

        var gate = new SyncGate();
        gate.RecordSuccess("SynTrackCoreDB", "abc");
        service.SaveSyncGate(gate);

        var reloaded = service.LoadSyncGate();

        Assert.False(reloaded.ShouldUpload("SynTrackCoreDB", "abc"));
        Assert.True(reloaded.ShouldUpload("SynTrackCoreDB", "def"));
    }

    public void Dispose()
    {
        if (Directory.Exists(_tempDir))
        {
            Directory.Delete(_tempDir, recursive: true);
        }
    }
}
