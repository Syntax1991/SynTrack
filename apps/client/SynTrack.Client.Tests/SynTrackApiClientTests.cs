namespace SynTrack.Client.Tests;

using System.Net;
using SynTrack.Client.Models;
using SynTrack.Client.Services;

public class SynTrackApiClientTests
{
    private static SynTrackApiClient CreateClient(FakeHttpMessageHandler handler) =>
        new(new HttpClient(handler), "http://localhost:4000/api");

    [Fact]
    public async Task SendImportAddsTheAuthorizationHeader()
    {
        var handler = new FakeHttpMessageHandler(_ => new HttpResponseMessage(HttpStatusCode.OK));
        var client = CreateClient(handler);

        await client.SendImportAsync("dvc_token", "SynTrackCoreDB", "0.1.0", "a", "b", "c", "body", CancellationToken.None);

        Assert.Equal("Bearer", handler.LastRequest!.Headers.Authorization!.Scheme);
        Assert.Equal("dvc_token", handler.LastRequest.Headers.Authorization.Parameter);
    }

    [Fact]
    public async Task SendImportKeepsTheRawTextPlainBodyUnchanged()
    {
        var handler = new FakeHttpMessageHandler(_ => new HttpResponseMessage(HttpStatusCode.OK));
        var client = CreateClient(handler);

        const string rawBody = "SynTrackCoreDB = { [\"format\"] = \"syntrack-saved-variables\" }";

        await client.SendImportAsync("dvc_token", "SynTrackCoreDB", "0.1.0", "a", "b", "c", rawBody, CancellationToken.None);

        Assert.Equal(rawBody, handler.LastRequestBody);
        Assert.StartsWith("text/plain", handler.LastRequest!.Content!.Headers.ContentType!.MediaType);
    }

    [Fact]
    public async Task SendImportCarriesAllSixAllowlistedMetadataHeaders()
    {
        var handler = new FakeHttpMessageHandler(_ => new HttpResponseMessage(HttpStatusCode.OK));
        var client = CreateClient(handler);

        await client.SendImportAsync(
            "dvc_token",
            "SynTrackCoreDB",
            "0.1.0",
            "2026-08-27T12:00:00Z",
            "2026-08-27T11:59:00Z",
            "abc123",
            "body",
            CancellationToken.None);

        var headers = handler.LastRequest!.Headers;

        Assert.Equal("1", headers.GetValues("X-SynTrack-Protocol-Version").Single());
        Assert.Equal("SynTrackCoreDB", headers.GetValues("X-SynTrack-Addon").Single());
        Assert.Equal("0.1.0", headers.GetValues("X-SynTrack-Client-Version").Single());
        Assert.Equal("2026-08-27T12:00:00Z", headers.GetValues("X-SynTrack-Observed-At").Single());
        Assert.Equal("2026-08-27T11:59:00Z", headers.GetValues("X-SynTrack-File-Modified-At").Single());
        Assert.Equal("abc123", headers.GetValues("X-SynTrack-Content-SHA256").Single());
    }

    [Fact]
    public async Task ASuccessfulResponseIsClassifiedAsSynced()
    {
        var handler = new FakeHttpMessageHandler(_ => new HttpResponseMessage(HttpStatusCode.OK));
        var client = CreateClient(handler);

        var status = await client.SendImportAsync("dvc_token", "SynTrackCoreDB", "0.1.0", "a", "b", "c", "body", CancellationToken.None);

        Assert.Equal(SyncStatus.Synced, status);
    }

    [Fact]
    public async Task A401ResponseIsClassifiedAsAuthenticationRequired()
    {
        var handler = new FakeHttpMessageHandler(_ => new HttpResponseMessage(HttpStatusCode.Unauthorized)
        {
            Content = new StringContent("Invalid device credential.")
        });

        var client = CreateClient(handler);

        var status = await client.SendImportAsync("dvc_token", "SynTrackCoreDB", "0.1.0", "a", "b", "c", "body", CancellationToken.None);

        Assert.Equal(SyncStatus.AuthenticationRequired, status);
    }

    [Fact]
    public async Task ANetworkFailureIsClassifiedAsApiUnavailable()
    {
        var handler = new FakeHttpMessageHandler(_ => throw new HttpRequestException("connect failed"));
        var client = CreateClient(handler);

        var status = await client.SendImportAsync("dvc_token", "SynTrackCoreDB", "0.1.0", "a", "b", "c", "body", CancellationToken.None);

        Assert.Equal(SyncStatus.ApiUnavailable, status);
    }

    [Fact]
    public async Task CreateLinkPostsToTheLinkEndpointAndParsesTheResponse()
    {
        var handler = new FakeHttpMessageHandler(_ => new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent(
                "{\"userCode\":\"ABCD-1234\",\"deviceCode\":\"deadbeef\",\"expiresAt\":\"2026-08-27T12:10:00Z\"}",
                System.Text.Encoding.UTF8,
                "application/json")
        });

        var client = CreateClient(handler);
        var result = await client.CreateLinkAsync(CancellationToken.None);

        Assert.Equal("ABCD-1234", result.UserCode);
        Assert.Equal("deadbeef", result.DeviceCode);
        Assert.EndsWith("/client/link", handler.LastRequest!.RequestUri!.ToString());
    }

    [Fact]
    public async Task PollStatusSendsTheDeviceCodeInTheRequestBody()
    {
        var handler = new FakeHttpMessageHandler(_ => new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent("{\"status\":\"PENDING\"}", System.Text.Encoding.UTF8, "application/json")
        });

        var client = CreateClient(handler);
        await client.PollStatusAsync("deadbeef", CancellationToken.None);

        Assert.Contains("deadbeef", handler.LastRequestBody);
        Assert.EndsWith("/client/link/status", handler.LastRequest!.RequestUri!.ToString());
    }
}
