namespace SynTrack.Client.Services;

using System.IO;
using System.Security.Cryptography;
using System.Text;

public interface ICredentialService
{
    void Store(string rawToken);
    string? Load();
    void Clear();
}

/// <summary>
/// The final DeviceCredential is encrypted with Windows DPAPI
/// (CurrentUser scope) before ever touching disk - it is never written
/// to the plain settings.json, never logged, and this is the only place
/// that ever holds the decrypted raw value.
/// </summary>
public sealed class DpapiCredentialService : ICredentialService
{
    private readonly string _filePath;

    public DpapiCredentialService(string baseDir)
    {
        _filePath = Path.Combine(baseDir, "device-credential.bin");
    }

    public void Store(string rawToken)
    {
        var plainBytes = Encoding.UTF8.GetBytes(rawToken);
        var encrypted = ProtectedData.Protect(plainBytes, optionalEntropy: null, DataProtectionScope.CurrentUser);

        var directory = Path.GetDirectoryName(_filePath);
        if (directory is not null)
        {
            Directory.CreateDirectory(directory);
        }

        File.WriteAllBytes(_filePath, encrypted);
    }

    public string? Load()
    {
        if (!File.Exists(_filePath))
        {
            return null;
        }

        try
        {
            var encrypted = File.ReadAllBytes(_filePath);
            var plain = ProtectedData.Unprotect(encrypted, optionalEntropy: null, DataProtectionScope.CurrentUser);
            return Encoding.UTF8.GetString(plain);
        }
        catch (CryptographicException)
        {
            return null;
        }
    }

    public void Clear()
    {
        if (File.Exists(_filePath))
        {
            File.Delete(_filePath);
        }
    }
}
