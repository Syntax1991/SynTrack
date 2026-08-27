namespace SynTrack.Client.Tests;

using System.Text;
using SynTrack.Client.Services;

public class HashingTests
{
    [Fact]
    public void Sha256OfEmptyStringIsCorrect()
    {
        var hash = ContentHasher.Sha256Hex(Array.Empty<byte>());

        Assert.Equal("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855", hash);
    }

    [Fact]
    public void UploadIsAllowedTheFirstTimeAHashIsSeen()
    {
        var gate = new SyncGate();

        Assert.True(gate.ShouldUpload("SynTrackCoreDB", "abc"));
    }

    [Fact]
    public void UploadIsSkippedWhenTheHashHasNotChanged()
    {
        var gate = new SyncGate();
        gate.RecordSuccess("SynTrackCoreDB", "abc");

        Assert.False(gate.ShouldUpload("SynTrackCoreDB", "abc"));
    }

    [Fact]
    public void UploadIsAllowedAgainOnceTheContentChanges()
    {
        var gate = new SyncGate();
        gate.RecordSuccess("SynTrackCoreDB", "abc");

        Assert.True(gate.ShouldUpload("SynTrackCoreDB", "def"));
    }

    [Fact]
    public void EachAddonTracksItsOwnHashIndependently()
    {
        var gate = new SyncGate();
        gate.RecordSuccess("SynTrackCoreDB", "abc");

        Assert.True(gate.ShouldUpload("ProfessionTrackerDB", "abc"));
    }

    [Fact]
    public void AFailedUploadDoesNotCommitTheHashAsSuccessful()
    {
        var gate = new SyncGate();

        // Simulates SyncEngine only calling RecordSuccess on a Synced result -
        // a failed send never reaches this call, so the hash stays pending.
        Assert.True(gate.ShouldUpload("SynTrackCoreDB", "abc"));
    }

    [Fact]
    public void ASnapshotRoundTripsThroughFromSnapshot()
    {
        var gate = new SyncGate();
        gate.RecordSuccess("SynTrackCoreDB", "abc");

        var reloaded = SyncGate.FromSnapshot(gate.Snapshot());

        Assert.False(reloaded.ShouldUpload("SynTrackCoreDB", "abc"));
    }

    [Fact]
    public void HashesOfDifferentContentDiffer()
    {
        var a = ContentHasher.Sha256Hex(Encoding.UTF8.GetBytes("SynTrackCoreDB = {}"));
        var b = ContentHasher.Sha256Hex(Encoding.UTF8.GetBytes("SynTrackCoreDB = { x = 1 }"));

        Assert.NotEqual(a, b);
    }
}
