namespace SynTrack.Client.Tests;

using System.Globalization;
using SynTrack.Client.Models;

public class LastSyncDisplayTests
{
    private static readonly TimeZoneInfo Cet = TimeZoneInfo.CreateCustomTimeZone(
        "Test-CET",
        TimeSpan.FromHours(2),
        "Test CET",
        "Test CET");

    [Fact]
    public void AMissingTimestampFormatsAsNever()
    {
        Assert.Equal(
            "Last sync: Never",
            LastSyncDisplay.Format(null, Cet, CultureInfo.GetCultureInfo("de-DE")));
    }

    [Fact]
    public void UtcIsConvertedToTheSystemTimezoneAndRenderedIn24HourClock()
    {
        var utc = new DateTimeOffset(2026, 9, 7, 13, 33, 0, TimeSpan.Zero);

        var label = LastSyncDisplay.Format(utc, Cet, CultureInfo.GetCultureInfo("de-DE"));

        Assert.Equal("Last sync: 07.09.2026 15:33", label);
        Assert.DoesNotContain("PM", label, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("AM", label, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void EnUsCultureStillUsesA24HourClockInsteadOfAmPm()
    {
        var utc = new DateTimeOffset(2026, 9, 7, 13, 33, 0, TimeSpan.Zero);

        var label = LastSyncDisplay.Format(utc, Cet, CultureInfo.GetCultureInfo("en-US"));

        Assert.Equal("Last sync: 9/7/2026 15:33", label);
        Assert.DoesNotContain("PM", label, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void LatestIgnoresNullCandidatesAndKeepsTheNewestRealTimestamp()
    {
        var older = new DateTimeOffset(2026, 9, 4, 10, 0, 0, TimeSpan.Zero);
        var newer = new DateTimeOffset(2026, 9, 7, 13, 20, 0, TimeSpan.Zero);

        var latest = LastSyncDisplay.Latest(
            older,
            new DateTimeOffset?[] { null, newer, older.AddHours(-2) });

        Assert.Equal(newer, latest);
    }

    [Fact]
    public void LatestStaysNullWhenNothingHasEverSynced()
    {
        Assert.Null(LastSyncDisplay.Latest(null, new DateTimeOffset?[] { null, null }));
    }
}
