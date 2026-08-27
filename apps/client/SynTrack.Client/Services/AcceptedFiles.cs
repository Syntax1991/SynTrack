namespace SynTrack.Client.Services;

using SynTrack.Client.Models;

public static class AcceptedFiles
{
    public const string CoreFile = "SynTrack_Core.lua";
    public const string ProfessionsCanonicalFile = "SynTrack_Professions.lua";
    public const string ProfessionsLegacyFile = "ProfessionTracker.lua";

    /// <summary>
    /// The canonical file always wins when both are present - hash
    /// deduplication alone is not a reason to treat both as sources, and
    /// uploading both merely because both exist would double-import
    /// profession data.
    /// </summary>
    public static string? ResolveProfessionsFile(IReadOnlySet<string> filesPresent)
    {
        if (filesPresent.Contains(ProfessionsCanonicalFile))
        {
            return ProfessionsCanonicalFile;
        }

        if (filesPresent.Contains(ProfessionsLegacyFile))
        {
            return ProfessionsLegacyFile;
        }

        return null;
    }

    public static AccountCandidate? BuildAccountCandidate(string accountName, IReadOnlySet<string> filesPresent)
    {
        var professionsFile = ResolveProfessionsFile(filesPresent);
        var hasCore = filesPresent.Contains(CoreFile);

        if (!hasCore && professionsFile is null)
        {
            return null;
        }

        return new AccountCandidate(accountName, hasCore, professionsFile);
    }
}
