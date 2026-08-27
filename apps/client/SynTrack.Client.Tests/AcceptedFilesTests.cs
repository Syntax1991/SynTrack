namespace SynTrack.Client.Tests;

using SynTrack.Client.Services;

public class AcceptedFilesTests
{
    private static HashSet<string> Set(params string[] files) => files.ToHashSet();

    [Fact]
    public void PrefersTheCanonicalProfessionsFileWhenBothExist()
    {
        var files = Set(AcceptedFiles.ProfessionsCanonicalFile, AcceptedFiles.ProfessionsLegacyFile);

        Assert.Equal(AcceptedFiles.ProfessionsCanonicalFile, AcceptedFiles.ResolveProfessionsFile(files));
    }

    [Fact]
    public void FallsBackToTheLegacyFileWhenCanonicalIsAbsent()
    {
        var files = Set(AcceptedFiles.ProfessionsLegacyFile);

        Assert.Equal(AcceptedFiles.ProfessionsLegacyFile, AcceptedFiles.ResolveProfessionsFile(files));
    }

    [Fact]
    public void ReturnsNullWhenNeitherProfessionsFileExists()
    {
        var files = Set(AcceptedFiles.CoreFile);

        Assert.Null(AcceptedFiles.ResolveProfessionsFile(files));
    }

    [Fact]
    public void AnAccountWithOnlyCoreDataIsStillACandidate()
    {
        var files = Set(AcceptedFiles.CoreFile);
        var candidate = AcceptedFiles.BuildAccountCandidate("Account1", files);

        Assert.NotNull(candidate);
        Assert.True(candidate!.HasCore);
        Assert.Null(candidate.ProfessionsFile);
    }

    [Fact]
    public void AnAccountWithNoAcceptedFilesIsNotACandidate()
    {
        var files = Set("SynTrack_Guild.lua", "SomeOtherAddon.lua");

        Assert.Null(AcceptedFiles.BuildAccountCandidate("Account1", files));
    }

    [Fact]
    public void SynTrackGuildAloneNeverProducesACandidate()
    {
        var files = Set("SynTrack_Guild.lua");

        Assert.Null(AcceptedFiles.BuildAccountCandidate("Account1", files));
    }
}
