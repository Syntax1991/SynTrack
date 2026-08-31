namespace SynTrack.Client.Services;

using System.Net.Http;
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
        TimeSpan? pollInterval = null)
    {
        _apiClient = apiClient;
        _credentialService = credentialService;
        _browserLauncher = browserLauncher;
        _pollInterval = pollInterval ?? TimeSpan.FromSeconds(2);
    }

    public string? BrowserUrl => _browserUrl;

    public async Task<DeviceConnectStartOutcome> StartAsync(
        string? deviceName,
        CancellationToken cancellationToken)
    {
        Cancel();

        var created = await _apiClient.StartConnectAsync(deviceName, cancellationToken);
        _pollToken = created.PollToken;
        _browserUrl = created.BrowserUrl;
        _expiresAt = DateTimeOffset.Parse(
            created.ExpiresAt,
            null,
            System.Globalization.DateTimeStyles.RoundtripKind);

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

            if (DateTimeOffset.UtcNow >= _expiresAt)
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
            catch (OperationCanceledException)
            {
                return;
            }
            catch (HttpRequestException)
            {
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
