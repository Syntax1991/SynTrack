namespace SynTrack.Client.Models;

using System.Globalization;

/// <summary>
/// Display-ready wrapper around <see cref="ClientCharacterSummary"/> -
/// keeps relative-time/label formatting out of the ViewModel and testable
/// on its own. Never fabricates a value: ItemLevelLabel and LastSyncLabel
/// both fall back to an explicit "unknown" label rather than 0 or "now".
/// </summary>
public sealed class CharacterRosterEntry
{
    public required string Name { get; init; }
    public required string Realm { get; init; }
    public required string ClassName { get; init; }
    public required string ItemLevelLabel { get; init; }
    public required string LastSyncLabel { get; init; }
    public required bool HasSyncedData { get; init; }

    public static CharacterRosterEntry From(ClientCharacterSummary summary, DateTimeOffset now) => new()
    {
        Name = summary.Name,
        Realm = summary.Realm,
        ClassName = summary.ClassName,
        ItemLevelLabel = summary.ItemLevel.HasValue ? summary.ItemLevel.Value.ToString("0.0", CultureInfo.InvariantCulture) : "-",
        LastSyncLabel = FormatRelativeTime(summary.LastSyncedAt, now),
        HasSyncedData = summary.LastSyncedAt.HasValue
    };

    /// <summary>
    /// "Just now" / "N min ago" / "Nh ago" / "Nd ago" / "Never" - a small,
    /// deliberately coarse bucketing (not a live-ticking clock) matching
    /// the rest of the client's status language.
    /// </summary>
    internal static string FormatRelativeTime(DateTimeOffset? at, DateTimeOffset now)
    {
        if (at is null)
        {
            return "Never";
        }

        var elapsed = now - at.Value;

        if (elapsed < TimeSpan.Zero)
        {
            elapsed = TimeSpan.Zero;
        }

        if (elapsed < TimeSpan.FromMinutes(1))
        {
            return "Just now";
        }

        if (elapsed < TimeSpan.FromHours(1))
        {
            var minutes = (int)elapsed.TotalMinutes;
            return $"{minutes} min ago";
        }

        if (elapsed < TimeSpan.FromDays(1))
        {
            var hours = (int)elapsed.TotalHours;
            return $"{hours}h ago";
        }

        var days = (int)elapsed.TotalDays;
        return $"{days}d ago";
    }
}
