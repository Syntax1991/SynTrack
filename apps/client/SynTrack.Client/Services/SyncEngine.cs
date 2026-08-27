namespace SynTrack.Client.Services;

using System.IO;
using SynTrack.Client.Models;

/// <summary>
/// Runs one full check-and-upload pass for the configured WoW account:
/// reads whichever accepted SavedVariables files exist, skips any whose
/// content hash hasn't changed, and uploads the rest through the
/// authenticated /api/client/import transport. Shared by both the file
/// watcher and the manual "Sync Now" action.
/// </summary>
public sealed class SyncEngine
{
    private const int ReadRetryAttempts = 5;
    private static readonly TimeSpan ReadRetryDelay = TimeSpan.FromMilliseconds(200);
    private const int NetworkRetryAttempts = 3;

    private readonly ICredentialService _credentialService;
    private readonly ISynTrackApiClient _apiClient;
    private readonly IClientSettingsService _settingsService;
    private readonly SyncGate _syncGate;
    private readonly string _clientVersion;
    private readonly TimeProvider _timeProvider;

    public event Action<SyncStatus>? SyncStatusChanged;

    public event Action<DateTimeOffset>? SyncCompleted;

    public SyncEngine(
        ICredentialService credentialService,
        ISynTrackApiClient apiClient,
        IClientSettingsService settingsService,
        SyncGate syncGate,
        string clientVersion,
        TimeProvider? timeProvider = null)
    {
        _credentialService = credentialService;
        _apiClient = apiClient;
        _settingsService = settingsService;
        _syncGate = syncGate;
        _clientVersion = clientVersion;
        _timeProvider = timeProvider ?? TimeProvider.System;
    }

    public async Task<SyncStatus> PerformSyncAsync(ClientSettings settings, CancellationToken cancellationToken)
    {
        if (settings.WowPath is null || settings.AccountName is null)
        {
            return Report(SyncStatus.WaitingForData);
        }

        var deviceToken = _credentialService.Load();

        if (deviceToken is null)
        {
            return Report(SyncStatus.AuthenticationRequired);
        }

        var savedVariablesDir = WowAccountDiscoveryService.SavedVariablesDir(settings.WowPath, settings.AccountName);
        var targets = BuildTargets(savedVariablesDir);

        Report(SyncStatus.Syncing);

        var anyChanged = false;
        SyncStatus? failure = null;

        foreach (var (addon, fileName) in targets)
        {
            var filePath = Path.Combine(savedVariablesDir, fileName);

            if (!File.Exists(filePath))
            {
                continue;
            }

            byte[] bytes;

            try
            {
                bytes = StableFileReader.ReadWithRetry(filePath, ReadRetryAttempts, ReadRetryDelay);
            }
            catch (IOException)
            {
                failure = SyncStatus.ApiUnavailable;
                continue;
            }

            var hash = ContentHasher.Sha256Hex(bytes);

            if (!_syncGate.ShouldUpload(addon, hash))
            {
                continue;
            }

            anyChanged = true;

            var content = System.Text.Encoding.UTF8.GetString(bytes);
            var observedAt = _timeProvider.GetUtcNow().ToString("o");
            var fileModifiedAt = File.GetLastWriteTimeUtc(filePath).ToString("o");

            var result = await SendWithBoundedRetryAsync(
                deviceToken,
                addon,
                observedAt,
                fileModifiedAt,
                hash,
                content,
                cancellationToken);

            if (result == SyncStatus.Synced)
            {
                _syncGate.RecordSuccess(addon, hash);
                _settingsService.SaveSyncGate(_syncGate);
            }
            else
            {
                failure = result;
            }
        }

        var finalStatus = failure ?? (anyChanged ? SyncStatus.Synced : SyncStatus.NoChanges);
        Report(finalStatus);

        if (finalStatus == SyncStatus.Synced)
        {
            SyncCompleted?.Invoke(_timeProvider.GetUtcNow());
        }

        return finalStatus;
    }

    private async Task<SyncStatus> SendWithBoundedRetryAsync(
        string deviceToken,
        string addon,
        string observedAt,
        string fileModifiedAt,
        string contentSha256,
        string content,
        CancellationToken cancellationToken)
    {
        var attemptNumber = 0;

        while (true)
        {
            attemptNumber++;

            var status = await _apiClient.SendImportAsync(
                deviceToken,
                addon,
                _clientVersion,
                observedAt,
                fileModifiedAt,
                contentSha256,
                content,
                cancellationToken);

            var outcome = status switch
            {
                SyncStatus.Synced => AttemptOutcome.Success,
                SyncStatus.ApiUnavailable => AttemptOutcome.NetworkError,
                _ => AttemptOutcome.HttpError
            };

            if (!SyncStatusExtensions.ShouldRetry(outcome, attemptNumber, NetworkRetryAttempts))
            {
                return status;
            }

            await Task.Delay(TimeSpan.FromSeconds(2), cancellationToken);
        }
    }

    internal static List<(string Addon, string FileName)> BuildTargets(string savedVariablesDir)
    {
        var targets = new List<(string, string)> { ("SynTrackCoreDB", AcceptedFiles.CoreFile) };

        var filesPresent = Directory.Exists(savedVariablesDir)
            ? Directory.GetFiles(savedVariablesDir)
                .Select(Path.GetFileName)
                .Where(name => name is not null)
                .Select(name => name!)
                .ToHashSet()
            : new HashSet<string>();

        var professionsFile = AcceptedFiles.ResolveProfessionsFile(filesPresent);

        if (professionsFile is not null)
        {
            targets.Add(("ProfessionTrackerDB", professionsFile));
        }

        return targets;
    }

    private SyncStatus Report(SyncStatus status)
    {
        SyncStatusChanged?.Invoke(status);
        return status;
    }
}
