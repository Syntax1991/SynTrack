namespace SynTrack.Client.Tests;

using SynTrack.Client.Models;

public class CharacterRosterEntryTests
{
    private static readonly DateTimeOffset Now = new(2026, 8, 30, 12, 0, 0, TimeSpan.Zero);

    [Fact]
    public void NoCaptureEverRecordedFormatsAsNever()
    {
        Assert.Equal("Never", CharacterRosterEntry.FormatRelativeTime(null, Now));
    }

    [Fact]
    public void UnderOneMinuteFormatsAsJustNow()
    {
        var at = Now.AddSeconds(-30);
        Assert.Equal("Just now", CharacterRosterEntry.FormatRelativeTime(at, Now));
    }

    [Fact]
    public void UnderOneHourFormatsAsMinutesAgo()
    {
        var at = Now.AddMinutes(-4);
        Assert.Equal("4 min ago", CharacterRosterEntry.FormatRelativeTime(at, Now));
    }

    [Fact]
    public void UnderOneDayFormatsAsHoursAgo()
    {
        var at = Now.AddHours(-2);
        Assert.Equal("2h ago", CharacterRosterEntry.FormatRelativeTime(at, Now));
    }

    [Fact]
    public void OverOneDayFormatsAsDaysAgo()
    {
        var at = Now.AddDays(-3);
        Assert.Equal("3d ago", CharacterRosterEntry.FormatRelativeTime(at, Now));
    }

    [Fact]
    public void AClockSkewedFutureTimestampDoesNotProduceANegativeLabel()
    {
        var at = Now.AddMinutes(2);
        Assert.Equal("Just now", CharacterRosterEntry.FormatRelativeTime(at, Now));
    }

    [Fact]
    public void FromNeverFabricatesAnItemLevelOrSyncTimeWhenBothAreUnknown()
    {
        var summary = new ClientCharacterSummary
        {
            Id = "char-1",
            Name = "Fresh Alt",
            Realm = "Antonidas",
            ClassName = "Warrior",
            Level = 10,
            ItemLevel = null,
            LastSyncedAt = null
        };

        var entry = CharacterRosterEntry.From(summary, Now);

        Assert.Equal("-", entry.ItemLevelLabel);
        Assert.Equal("Never", entry.LastSyncLabel);
        Assert.False(entry.HasSyncedData);
    }

    [Fact]
    public void FromFormatsAKnownItemLevelToOneDecimalPlace()
    {
        var summary = new ClientCharacterSummary
        {
            Id = "char-1",
            Name = "Synblast",
            Realm = "Antonidas",
            ClassName = "Mage",
            Level = 80,
            ItemLevel = 312.3,
            LastSyncedAt = Now.AddMinutes(-1)
        };

        var entry = CharacterRosterEntry.From(summary, Now);

        Assert.Equal("312.3", entry.ItemLevelLabel);
        Assert.True(entry.HasSyncedData);
    }
}
