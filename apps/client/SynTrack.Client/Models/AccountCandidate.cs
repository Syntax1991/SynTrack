namespace SynTrack.Client.Models;

/// <summary>
/// Client Phase 1 never watches or uploads SynTrack_Guild.lua - guild data
/// stays on the existing manual import path.
/// </summary>
public sealed record AccountCandidate(string AccountName, bool HasCore, string? ProfessionsFile);
