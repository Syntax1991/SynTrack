namespace SynTrack.Client.Models;

/// <summary>
/// Mirrors GET /api/client/characters. ItemLevel and LastSyncedAt are
/// both nullable on purpose - the backend reports UNKNOWN honestly
/// (never a fabricated 0 or "now") whenever no gear/resource capture has
/// happened yet for a character. See ClientCharactersService on the API
/// side for exactly what each field is sourced from.
/// </summary>
public sealed class ClientCharacterSummary
{
    public required string Id { get; init; }
    public required string Name { get; init; }
    public required string Realm { get; init; }
    public required string ClassName { get; init; }
    public int Level { get; init; }
    public double? ItemLevel { get; init; }
    public DateTimeOffset? LastSyncedAt { get; init; }
}

public sealed class ClientCharactersResponse
{
    public List<ClientCharacterSummary> Items { get; init; } = new();
}
