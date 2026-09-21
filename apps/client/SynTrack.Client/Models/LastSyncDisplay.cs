namespace SynTrack.Client.Models;

using System.Globalization;

/// <summary>
/// Sidebar last-sync label. Converts the stored UTC timestamp to the
/// machine's local timezone and always renders a 24-hour clock, instead
/// of WPF's default en-US 12-hour <c>{0:g}</c> binding.
/// </summary>
internal static class LastSyncDisplay
{
    public static string Format(
        DateTimeOffset? at,
        TimeZoneInfo timeZone,
        CultureInfo culture)
    {
        if (at is null)
        {
            return "Last sync: Never";
        }

        var local = TimeZoneInfo.ConvertTime(at.Value, timeZone);
        var date = local.ToString("d", culture);
        var time = local.ToString("HH:mm", CultureInfo.InvariantCulture);
        return $"Last sync: {date} {time}";
    }

    /// <summary>
    /// Picks the newest real timestamp. Null candidates are ignored so a
    /// character without capture does not wipe a known last sync.
    /// </summary>
    public static DateTimeOffset? Latest(
        DateTimeOffset? current,
        IEnumerable<DateTimeOffset?> candidates)
    {
        var latest = current;

        foreach (var candidate in candidates)
        {
            if (candidate is not { } value)
            {
                continue;
            }

            if (latest is null || value > latest.Value)
            {
                latest = value;
            }
        }

        return latest;
    }
}
