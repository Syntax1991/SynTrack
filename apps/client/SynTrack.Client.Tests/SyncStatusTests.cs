namespace SynTrack.Client.Tests;

using SynTrack.Client.Models;

public class SyncStatusTests
{
    [Fact]
    public void NoStatusCodeMeansTheApiWasUnreachable()
    {
        Assert.Equal(SyncStatus.ApiUnavailable, SyncStatusExtensions.ClassifyImportError(null, ""));
    }

    [Fact]
    public void A401MeansAuthenticationIsRequired()
    {
        Assert.Equal(
            SyncStatus.AuthenticationRequired,
            SyncStatusExtensions.ClassifyImportError(401, "Invalid device credential."));
    }

    [Fact]
    public void AnUnsupportedProtocolMessageIsClassifiedDistinctly()
    {
        Assert.Equal(
            SyncStatus.UnsupportedProtocol,
            SyncStatusExtensions.ClassifyImportError(400, "Unsupported client protocol version \"2\"."));
    }

    [Fact]
    public void AnUnsupportedSchemaMessageIsClassifiedDistinctly()
    {
        Assert.Equal(
            SyncStatus.UnsupportedAddonSchema,
            SyncStatusExtensions.ClassifyImportError(400, "Unsupported addon schema version 99."));
    }

    [Fact]
    public void AnUnreadablePayloadIsClassifiedAsAParseError()
    {
        Assert.Equal(
            SyncStatus.ParseError,
            SyncStatusExtensions.ClassifyImportError(400, "SynTrack SavedVariables could not be read."));
    }

    [Fact]
    public void AnyOther400IsAValidationError()
    {
        Assert.Equal(
            SyncStatus.ValidationError,
            SyncStatusExtensions.ClassifyImportError(400, "The SavedVariables do not contain any characters."));
    }

    [Fact]
    public void NetworkErrorsAreRetriedUpToTheLimit()
    {
        Assert.True(SyncStatusExtensions.ShouldRetry(AttemptOutcome.NetworkError, 1, 3));
        Assert.True(SyncStatusExtensions.ShouldRetry(AttemptOutcome.NetworkError, 2, 3));
        Assert.False(SyncStatusExtensions.ShouldRetry(AttemptOutcome.NetworkError, 3, 3));
    }

    [Fact]
    public void HttpErrorsAreNeverRetried()
    {
        Assert.False(SyncStatusExtensions.ShouldRetry(AttemptOutcome.HttpError, 1, 3));
    }

    [Fact]
    public void SuccessIsNeverRetried()
    {
        Assert.False(SyncStatusExtensions.ShouldRetry(AttemptOutcome.Success, 1, 3));
    }

    [Fact]
    public void EveryStatusHasADistinctNonEmptyLabel()
    {
        var statuses = Enum.GetValues<SyncStatus>();
        var labels = statuses.Select(s => s.ToDisplayLabel()).ToList();

        Assert.Equal(labels.Count, labels.Distinct().Count());
        Assert.All(labels, label => Assert.False(string.IsNullOrWhiteSpace(label)));
    }

    [Fact]
    public void SyncedAndNoChangesAreBothPositive()
    {
        Assert.Equal("positive", SyncStatus.Synced.ToTone());
        Assert.Equal("positive", SyncStatus.NoChanges.ToTone());
    }

    [Fact]
    public void AuthenticationAndApiAvailabilityAreWarningNotError()
    {
        Assert.Equal("warning", SyncStatus.AuthenticationRequired.ToTone());
        Assert.Equal("warning", SyncStatus.ApiUnavailable.ToTone());
    }
}
