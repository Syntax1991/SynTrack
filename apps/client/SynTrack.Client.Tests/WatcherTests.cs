namespace SynTrack.Client.Tests;

using SynTrack.Client.Services;

public class WatcherTests
{
    [Fact]
    public void AGateWithNoEventsIsImmediatelyStable()
    {
        var gate = new DebounceGate(TimeSpan.FromMilliseconds(500));

        Assert.True(gate.IsStable(DateTimeOffset.UtcNow));
    }

    [Fact]
    public void AGateIsUnstableImmediatelyAfterAnEvent()
    {
        var gate = new DebounceGate(TimeSpan.FromMilliseconds(500));
        var now = DateTimeOffset.UtcNow;
        gate.RecordEvent(now);

        Assert.False(gate.IsStable(now));
    }

    [Fact]
    public void AGateBecomesStableOnceTheQuietPeriodElapses()
    {
        var gate = new DebounceGate(TimeSpan.FromMilliseconds(100));
        var eventTime = DateTimeOffset.UtcNow;
        gate.RecordEvent(eventTime);

        Assert.True(gate.IsStable(eventTime + TimeSpan.FromMilliseconds(150)));
    }

    [Fact]
    public void ANewEventResetsTheQuietPeriod()
    {
        var gate = new DebounceGate(TimeSpan.FromMilliseconds(100));
        var first = DateTimeOffset.UtcNow;
        gate.RecordEvent(first);

        var second = first + TimeSpan.FromMilliseconds(150);
        gate.RecordEvent(second);

        Assert.False(gate.IsStable(second));
    }

    [Fact]
    public void ReadingAnImmediatelyAvailableFileSucceedsOnTheFirstAttempt()
    {
        var path = Path.GetTempFileName();

        try
        {
            File.WriteAllText(path, "hello");

            var bytes = StableFileReader.ReadWithRetry(path, 3, TimeSpan.FromMilliseconds(1));

            Assert.Equal("hello", System.Text.Encoding.UTF8.GetString(bytes));
        }
        finally
        {
            File.Delete(path);
        }
    }

    [Fact]
    public void ReadingAMissingFileExhaustsRetriesAndThrows()
    {
        var missing = Path.Combine(Path.GetTempPath(), Guid.NewGuid() + ".lua");

        Assert.ThrowsAny<IOException>(() =>
            StableFileReader.ReadWithRetry(missing, 2, TimeSpan.FromMilliseconds(1)));
    }
}
