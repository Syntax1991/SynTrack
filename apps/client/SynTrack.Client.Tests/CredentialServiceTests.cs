namespace SynTrack.Client.Tests;

using SynTrack.Client.Services;

public class CredentialServiceTests : IDisposable
{
    private readonly string _tempDir = Path.Combine(Path.GetTempPath(), "syntrack-client-tests-" + Guid.NewGuid());

    [Fact]
    public void NoCredentialFileMeansLoadReturnsNull()
    {
        var service = new DpapiCredentialService(_tempDir);

        Assert.Null(service.Load());
    }

    [Fact]
    public void AStoredCredentialCanBeLoadedBackUnchanged()
    {
        var service = new DpapiCredentialService(_tempDir);

        service.Store("dvc_secret-token");

        Assert.Equal("dvc_secret-token", service.Load());
    }

    [Fact]
    public void TheCredentialFileNeverContainsThePlaintextToken()
    {
        var service = new DpapiCredentialService(_tempDir);
        service.Store("dvc_secret-token");

        var fileBytes = File.ReadAllBytes(Path.Combine(_tempDir, "device-credential.bin"));
        var fileContents = System.Text.Encoding.UTF8.GetString(fileBytes);

        Assert.DoesNotContain("dvc_secret-token", fileContents);
    }

    [Fact]
    public void ClearingRemovesTheStoredCredential()
    {
        var service = new DpapiCredentialService(_tempDir);
        service.Store("dvc_secret-token");

        service.Clear();

        Assert.Null(service.Load());
    }

    [Fact]
    public void ANewServiceInstanceCanStillReadAPreviouslyStoredCredential()
    {
        // Simulates restarting the client: a fresh service instance backed
        // by the same app-data directory must still decrypt the credential.
        new DpapiCredentialService(_tempDir).Store("dvc_secret-token");

        var afterRestart = new DpapiCredentialService(_tempDir);

        Assert.Equal("dvc_secret-token", afterRestart.Load());
    }

    public void Dispose()
    {
        if (Directory.Exists(_tempDir))
        {
            Directory.Delete(_tempDir, recursive: true);
        }
    }
}
