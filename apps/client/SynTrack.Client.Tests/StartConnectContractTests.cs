namespace SynTrack.Client.Tests;

using System.Net;
using System.Text;
using SynTrack.Client.Models;
using SynTrack.Client.Services;

/// <summary>
/// START (POST /client/connect) must never crash on a broken production
/// response - every failure becomes a typed, message-free
/// <see cref="DeviceConnectStartException"/>.
/// </summary>
public class StartConnectContractTests
{
    private const string ProductionApi = "https://syntrack.io/api";

    private const string ValidBody =
        "{\"browserUrl\":\"https://syntrack.io/client/connect?token=browser-secret\",\"pollToken\":\"poll-secret\",\"expiresAt\":\"2026-09-25T12:10:00.000Z\"}";

    private sealed class DelayingHandler : HttpMessageHandler
    {
        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            await Task.Delay(TimeSpan.FromSeconds(30), cancellationToken);
            return new HttpResponseMessage(HttpStatusCode.OK);
        }
    }

    private static SynTrackApiClient Client(Func<HttpRequestMessage, HttpResponseMessage> respond) =>
        new(new HttpClient(new FakeHttpMessageHandler(respond)), ProductionApi);

    private static HttpResponseMessage Json(HttpStatusCode status, string body, string contentType = "application/json") =>
        new(status) { Content = new StringContent(body, Encoding.UTF8, contentType) };

    private static async Task<DeviceConnectStartException> StartFails(SynTrackApiClient client) =>
        await Assert.ThrowsAsync<DeviceConnectStartException>(
            () => client.StartConnectAsync("CertificationTest", CancellationToken.None));

    [Fact]
    public async Task AValid2xxResponseIsReturnedWithTheServerDate()
    {
        var serverDate = new DateTimeOffset(2026, 9, 25, 12, 0, 0, TimeSpan.Zero);
        var client = Client(_ =>
        {
            var response = Json(HttpStatusCode.OK, ValidBody);
            response.Headers.Date = serverDate;
            return response;
        });

        var started = await client.StartConnectAsync("CertificationTest", CancellationToken.None);

        Assert.Equal("https://syntrack.io/client/connect?token=browser-secret", started.BrowserUrl);
        Assert.Equal("poll-secret", started.PollToken);
        Assert.Equal(serverDate, started.ServerDate);
    }

    [Fact]
    public async Task ANetworkFailureIsUnreachable()
    {
        var error = await StartFails(Client(_ => throw new HttpRequestException("No such host is known. (syntrack.io:443)")));

        Assert.Equal(DeviceConnectStartFailure.Unreachable, error.Failure);
        Assert.DoesNotContain("syntrack.io", error.Message);
    }

    [Fact]
    public async Task AnHttpClientTimeoutIsUnreachableNotACancellation()
    {
        var client = new SynTrackApiClient(
            new HttpClient(new DelayingHandler()) { Timeout = TimeSpan.FromMilliseconds(50) },
            ProductionApi);

        var error = await StartFails(client);

        Assert.Equal(DeviceConnectStartFailure.Unreachable, error.Failure);
    }

    [Fact]
    public async Task ACallerCancellationStillPropagatesAsCancellation()
    {
        var client = new SynTrackApiClient(new HttpClient(new DelayingHandler()), ProductionApi);
        using var cts = new CancellationTokenSource(TimeSpan.FromMilliseconds(50));

        await Assert.ThrowsAnyAsync<OperationCanceledException>(
            () => client.StartConnectAsync("CertificationTest", cts.Token));
    }

    [Theory]
    [InlineData(HttpStatusCode.InternalServerError)]
    [InlineData(HttpStatusCode.BadGateway)]
    [InlineData(HttpStatusCode.ServiceUnavailable)]
    [InlineData(HttpStatusCode.TooManyRequests)]
    public async Task A5xxOr429IsAServerError(HttpStatusCode status)
    {
        var error = await StartFails(Client(_ => Json(status, "{\"error\":\"Ein interner Serverfehler ist aufgetreten.\"}")));

        Assert.Equal(DeviceConnectStartFailure.ServerError, error.Failure);
        Assert.Equal((int)status, error.StatusCode);
        Assert.DoesNotContain("Serverfehler", error.Message);
    }

    [Theory]
    [InlineData(HttpStatusCode.BadRequest)]
    [InlineData(HttpStatusCode.NotFound)]
    [InlineData(HttpStatusCode.Forbidden)]
    public async Task Other4xxAreRejected(HttpStatusCode status)
    {
        var error = await StartFails(Client(_ => Json(status, "{\"error\":\"nope\"}")));

        Assert.Equal(DeviceConnectStartFailure.Rejected, error.Failure);
    }

    [Theory]
    [InlineData("<html><body>502 Bad Gateway</body></html>", "text/html")]
    [InlineData("{not json", "application/json")]
    [InlineData("", "application/json")]
    [InlineData("null", "application/json")]
    [InlineData("{\"pollToken\":\"poll-secret\",\"expiresAt\":\"2026-09-25T12:10:00Z\"}", "application/json")]
    [InlineData("{\"browserUrl\":\"https://syntrack.io/client/connect?token=t\",\"expiresAt\":\"2026-09-25T12:10:00Z\"}", "application/json")]
    [InlineData("{\"browserUrl\":\"https://syntrack.io/client/connect?token=t\",\"pollToken\":\"\",\"expiresAt\":\"2026-09-25T12:10:00Z\"}", "application/json")]
    [InlineData("{\"browserUrl\":\"https://syntrack.io/client/connect?token=t\",\"pollToken\":\"p\",\"expiresAt\":\"tomorrow-ish\"}", "application/json")]
    [InlineData("{\"browserUrl\":\"/client/connect?token=t\",\"pollToken\":\"p\",\"expiresAt\":\"2026-09-25T12:10:00Z\"}", "application/json")]
    [InlineData("{\"browserUrl\":\"http://syntrack.io/client/connect?token=t\",\"pollToken\":\"p\",\"expiresAt\":\"2026-09-25T12:10:00Z\"}", "application/json")]
    [InlineData("{\"browserUrl\":\"javascript:alert(1)\",\"pollToken\":\"p\",\"expiresAt\":\"2026-09-25T12:10:00Z\"}", "application/json")]
    public async Task AMalformed2xxBodyIsAnInvalidResponse(string body, string contentType)
    {
        var error = await StartFails(Client(_ => Json(HttpStatusCode.OK, body, contentType)));

        Assert.Equal(DeviceConnectStartFailure.InvalidResponse, error.Failure);
    }

    [Fact]
    public async Task AnHttpBrowserUrlIsAcceptedForAnIntentionalHttpDevApi()
    {
        var client = new SynTrackApiClient(
            new HttpClient(new FakeHttpMessageHandler(_ => Json(HttpStatusCode.OK,
                "{\"browserUrl\":\"http://localhost:5173/client/connect?token=t\",\"pollToken\":\"p\",\"expiresAt\":\"2026-09-25T12:10:00Z\"}"))),
            "http://localhost:4000/api");

        var started = await client.StartConnectAsync("DEV", CancellationToken.None);

        Assert.Equal("http://localhost:5173/client/connect?token=t", started.BrowserUrl);
    }
}
