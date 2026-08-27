namespace SynTrack.Client.Services;

using System.Net.Http;

/// <summary>
/// Owns the high-entropy deviceCode for the lifetime of one pending link
/// request - it never reaches the ViewModel/View, which only ever see the
/// short human-readable userCode. The final DeviceCredential is written
/// straight to <see cref="ICredentialService"/> the moment it is issued
/// and is never returned to the caller.
/// </summary>
public sealed class DeviceLinkService
{
    private readonly ISynTrackApiClient _apiClient;
    private readonly ICredentialService _credentialService;
    private readonly string _webBaseUrl;

    public event Action? LinkApproved;

    public event Action? LinkExpired;

    public DeviceLinkService(ISynTrackApiClient apiClient, ICredentialService credentialService, string webBaseUrl)
    {
        _apiClient = apiClient;
        _credentialService = credentialService;
        _webBaseUrl = webBaseUrl.TrimEnd('/');
    }

    public async Task<(string UserCode, string VerificationUrl)> StartLinkAsync(CancellationToken cancellationToken)
    {
        var created = await _apiClient.CreateLinkAsync(cancellationToken);
        var verificationUrl = $"{_webBaseUrl}/settings?linkDevice={created.UserCode}";

        _ = PollUntilResolvedAsync(created.DeviceCode, cancellationToken);

        return (created.UserCode, verificationUrl);
    }

    private async Task PollUntilResolvedAsync(string deviceCode, CancellationToken cancellationToken)
    {
        while (!cancellationToken.IsCancellationRequested)
        {
            await Task.Delay(TimeSpan.FromSeconds(3), cancellationToken);

            Models.DeviceLinkStatusResponse response;

            try
            {
                response = await _apiClient.PollStatusAsync(deviceCode, cancellationToken);
            }
            catch (HttpRequestException)
            {
                continue;
            }

            switch (response.Status)
            {
                case "PENDING":
                case "APPROVED":
                    continue;

                case "CONSUMED":
                    if (response.Credential is not null)
                    {
                        _credentialService.Store(response.Credential);
                        LinkApproved?.Invoke();
                    }

                    return;

                case "EXPIRED":
                    LinkExpired?.Invoke();
                    return;

                default:
                    return;
            }
        }
    }
}
