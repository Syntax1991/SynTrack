namespace SynTrack.Client.Services;

using System.Runtime.InteropServices;
using System.Text;

/// <summary>
/// Detects whether this process is running inside an MSIX package
/// (Microsoft Store or sideload). Unpackaged EXE / <c>dotnet run</c>
/// always report false.
/// </summary>
public static class PackagedApp
{
    private const int AppModelErrorNoPackage = 15700;

    [DllImport("kernel32.dll", CharSet = CharSet.Unicode, ExactSpelling = true)]
    private static extern int GetCurrentPackageFullName(
        ref int packageFullNameLength,
        StringBuilder? packageFullName);

    public static bool IsRunningAsPackaged
    {
        get
        {
            var length = 0;
            return GetCurrentPackageFullName(ref length, null) != AppModelErrorNoPackage;
        }
    }
}
