namespace SynTrack.Client.Services;

using System.Globalization;
using System.Net.Http;
using System.Text.Json;
using SynTrack.Client.Models;

/// <summary>
/// Codeless desktop connection: START + POLL against PR #19.
/// pollToken lives only in this instance's memory. The DeviceCredential
/// is written to <see cref="ICredentialService"/> (DPAPI) before the
/// token is cleared, and is never returned to the ViewModel.
/// </summary>
public sealed class DeviceConnectionService
{
    private readonly ISynTrackApiClient _apiClient;
    private readonly ICredentialService _credentialService;
    private readonly IBrowserLauncher _browserLauncher;
    private readonly TimeSpan _pollInterval;
    private readonly Func<DateTimeOffset> _utcNow;

    private string? _pollToken;
    private string? _browserUrl;
    private DateTimeOffset _expiresAt;
    private CancellationTokenSource? _pollCts;

    public event Action? Completed;
    public event Action? Expired;
    public event Action? ConsumedWithoutCredential;
    public event Action? Invalid;
    public event Action? StorageFailed;

    public DeviceConnectionService(
        ISynTrackApiClient apiClient,
        ICredentialService credentialService,
        IBrowserLauncher browserLauncher,
        TimeSpan? pollInterval = null,
        Func<DateTimeOffset>? utcNow = null)
    {
        _apiClient = apiClient;
        _credentialService = credentialService;
        _browserLauncher = browserLauncher;
        _pollInterval = pollInterval ?? TimeSpan.FromSeconds(2);
        _utcNow = utcNow ?? (() => DateTimeOffset.UtcNow);
    }

    /// <summary>
    /// Longest local polling window accepted from a server response, so a
    /// bogus expiresAt can never turn into (near-)infinite polling.
    /// </summary>
    internal static readonly TimeSpan MaxPollWindow = TimeSpan.FromMinutes(30);

    public string? BrowserUrl => _browserUrl;

    public async Task<DeviceConnectStartOutcome> StartAsync(
        string? deviceName,
        CancellationToken cancellationToken)
    {
        Cancel();

        var created = await _apiClient.StartConnectAsync(deviceName, cancellationToken);

        if (string.IsNullOrWhiteSpace(created.PollToken) || string.IsNullOrWhiteSpace(created.BrowserUrl)
            || !DateTimeOffset.TryParse(created.ExpiresAt, CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind, out _))
        {
            throw new DeviceConnectStartException(DeviceConnectStartFailure.InvalidResponse);
        }
        _pollToken = created.PollToken;
        _browserUrl = created.BrowserUrl;
        _expiresAt = ComputeLocalDeadline(created, _utcNow());

        var opened = _browserLauncher.TryOpen(created.BrowserUrl);

        _pollCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        _ = PollUntilResolvedAsync(_pollCts.Token);

        return new DeviceConnectStartOutcome
        {
            BrowserUrl = created.BrowserUrl,
            ExpiresAt = _expiresAt,
            BrowserOpened = opened
        };
    }

    public bool TryOpenBrowserAgain()
    {
        return _browserUrl is not null && _browserLauncher.TryOpen(_browserUrl);
    }

    public void Cancel()
    {
        _pollCts?.Cancel();
        _pollCts?.Dispose();
        _pollCts = null;
        _pollToken = null;
    }

    private async Task PollUntilResolvedAsync(CancellationToken cancellationToken)
    {
        while (!cancellationToken.IsCancellationRequested)
        {
            var token = _pollToken;

            if (token is null)
            {
                return;
            }

            if (_utcNow() >= _expiresAt)
            {
                _pollToken = null;
                Expired?.Invoke();
                return;
            }

            DeviceConnectPollResult result;

            try
            {
                result = await _apiClient.PollConnectStatusAsync(token, cancellationToken);
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
            {
                return;
            }
            catch (Exception ex) when (ex is HttpRequestException
                or OperationCanceledException // HttpClient.Timeout
                or JsonException              // HTML / garbled body from a proxy
                or NotSupportedException)     // wrong content type
            {
                // Transient: keep polling until the server resolves the
                // request or the local deadline passes.
                await DelayOrReturn(cancellationToken);
                continue;
            }

            switch (result.Kind)
            {
                case DeviceConnectPollKind.Pending:
                    await DelayOrReturn(cancellationToken);
                    continue;

                case DeviceConnectPollKind.Expired:
                    _pollToken = null;
                    Expired?.Invoke();
                    return;

                case DeviceConnectPollKind.NotFound:
                    _pollToken = null;
                    Invalid?.Invoke();
                    return;

                case DeviceConnectPollKind.ConsumedWithoutCredential:
                    _pollToken = null;
                    ConsumedWithoutCredential?.Invoke();
                    return;

                case DeviceConnectPollKind.Consumed:
                    PersistCredentialThenStop(result.Credential);
                    return;

                default:
                    _pollToken = null;
                    Invalid?.Invoke();
                    return;
            }
        }
    }

    private void PersistCredentialThenStop(string? credential)
    {
        if (credential is null)
        {
            _pollToken = null;
            ConsumedWithoutCredential?.Invoke();
            return;
        }

        try
        {
            _credentialService.Store(credential);
        }
        catch
        {
            _pollToken = null;
            StorageFailed?.Invoke();
            return;
        }

        _pollToken = null;
        Completed?.Invoke();
    }

    /// <summary>
    /// expiresAt is server time. When the response carried a Date header
    /// the deadline is "now + (expiresAt - serverDate)", so a skewed local
    /// clock neither expires the connection instantly nor polls forever.
    /// </summary>
    internal static DateTimeOffset ComputeLocalDeadline(DeviceConnectStartResponse created, DateTimeOffset localNow)
    {
        var expiresAt = DateTimeOffset.Parse(created.ExpiresAt, CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind);

        var window = created.ServerDate is { } serverDate
            ? expiresAt - serverDate
            : expiresAt - localNow;

        if (window < TimeSpan.Zero)
        {
            window = TimeSpan.Zero;
        }
        else if (window > MaxPollWindow)
        {
            window = MaxPollWindow;
        }

        return localNow + window;
    }

    private async Task DelayOrReturn(CancellationToken cancellationToken)
    {
        try
        {
            await Task.Delay(_pollInterval, cancellationToken);
        }
        catch (OperationCanceledException)
        {
        }
    }
}
