namespace SynTrack.Client.Tests;

public class BrandAssetTests
{
    [Fact]
    public void TheApplicationIconFileExistsAndIsAWindowsIco()
    {
        var icoPath = Path.Combine(AppContext.BaseDirectory, "Assets", "syntrack.ico");

        Assert.True(File.Exists(icoPath), icoPath);
        var header = File.ReadAllBytes(icoPath);
        Assert.True(header.Length > 6);
        Assert.Equal(0, header[0]);
        Assert.Equal(0, header[1]);
        Assert.Equal(1, header[2]);
        Assert.Equal(0, header[3]);
    }
}
