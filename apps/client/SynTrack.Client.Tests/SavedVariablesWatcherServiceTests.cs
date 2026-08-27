namespace SynTrack.Client.Tests;

using SynTrack.Client.Services;

/// <summary>
/// Regression coverage for a real bug found during live acceptance testing:
/// WoW saves SavedVariables via write-to-temp-then-rename (a fresh file is
/// moved into place, backing up the old one to `.bak`), which raises a
/// FileSystemWatcher.Renamed event - not Changed/Created. The watcher
/// originally only subscribed to Changed/Created and silently missed every
/// real WoW save while still reacting fine to synthetic in-place test
/// writes, which is why unit tests using File.WriteAllText alone never
/// caught it.
/// </summary>
public class SavedVariablesWatcherServiceTests : IDisposable
{
    private readonly string _tempDir = Path.Combine(Path.GetTempPath(), "syntrack-watcher-tests-" + Guid.NewGuid());

    public SavedVariablesWatcherServiceTests()
    {
        Directory.CreateDirectory(_tempDir);
    }

    private static async Task<bool> WaitForFiringAsync(Func<int> currentCount, int baseline, TimeSpan timeout)
    {
        var deadline = DateTime.UtcNow + timeout;

        while (DateTime.UtcNow < deadline)
        {
            if (currentCount() > baseline)
            {
                return true;
            }

            await Task.Delay(50);
        }

        return false;
    }

    [Fact]
    public async Task InPlaceOverwriteIsDetected()
    {
        var coreFile = Path.Combine(_tempDir, AcceptedFiles.CoreFile);
        File.WriteAllText(coreFile, "SynTrackCoreDB = { v = 1 }");

        using var watcher = new SavedVariablesWatcherService();
        var fireCount = 0;
        watcher.StableChangeDetected += () => Interlocked.Increment(ref fireCount);

        watcher.Watch(_tempDir);
        await Task.Delay(1200);
        var baseline = fireCount;

        File.WriteAllText(coreFile, "SynTrackCoreDB = { v = 2 }");

        var fired = await WaitForFiringAsync(() => fireCount, baseline, TimeSpan.FromSeconds(5));
        Assert.True(fired, "expected StableChangeDetected after an in-place overwrite");
    }

    [Fact]
    public async Task WriteTempThenRenameIntoPlaceIsDetected()
    {
        // Mirrors WoW's actual save pattern: write the new content to a
        // temp file, move the old file to .bak, then move the temp file
        // into the final name - the final step is a rename, not a write.
        var coreFile = Path.Combine(_tempDir, AcceptedFiles.CoreFile);
        var tempFile = coreFile + ".tmp";
        var bakFile = coreFile + ".bak";
        File.WriteAllText(coreFile, "SynTrackCoreDB = { v = 1 }");

        using var watcher = new SavedVariablesWatcherService();
        var fireCount = 0;
        watcher.StableChangeDetected += () => Interlocked.Increment(ref fireCount);

        watcher.Watch(_tempDir);
        await Task.Delay(1200);
        var baseline = fireCount;

        File.WriteAllText(tempFile, "SynTrackCoreDB = { v = 2 }");
        File.Move(coreFile, bakFile, overwrite: true);
        File.Move(tempFile, coreFile, overwrite: true);

        var fired = await WaitForFiringAsync(() => fireCount, baseline, TimeSpan.FromSeconds(5));
        Assert.True(fired, "expected StableChangeDetected after a write-temp-then-rename save (the real WoW pattern)");
    }

    [Fact]
    public async Task RenamingAnUnrelatedFileIntoTheDirectoryDoesNotFire()
    {
        using var watcher = new SavedVariablesWatcherService();
        var fireCount = 0;
        watcher.StableChangeDetected += () => Interlocked.Increment(ref fireCount);

        watcher.Watch(_tempDir);
        await Task.Delay(1200);
        var baseline = fireCount;

        var unrelatedTemp = Path.Combine(_tempDir, "SynTrack_Guild.lua.tmp");
        var unrelatedFinal = Path.Combine(_tempDir, "SynTrack_Guild.lua");
        File.WriteAllText(unrelatedTemp, "SynTrack_GuildDB = {}");
        File.Move(unrelatedTemp, unrelatedFinal);

        await Task.Delay(1500);
        Assert.Equal(baseline, fireCount);
    }

    public void Dispose()
    {
        if (Directory.Exists(_tempDir))
        {
            Directory.Delete(_tempDir, recursive: true);
        }
    }
}
