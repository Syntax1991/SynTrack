namespace SynTrack.Client.Tests;

using SynTrack.Client.Services;

/// <summary>
/// Each test uses its own unique mutex name (never the real production name)
/// so tests never contend with each other or with a real running client.
///
/// Windows mutex ownership is per-thread, not per-handle: two Mutex objects
/// referencing the same name acquired on the SAME thread both succeed
/// (recursive ownership), which does not exercise real contention - two
/// separate client processes never share a thread. Tests that need genuine
/// contention hold the first guard on a background thread instead.
/// </summary>
public class SingleInstanceGuardTests
{
    private static string UniqueName() => $"SynTrack.Client.Tests.{Guid.NewGuid()}";

    [Fact]
    public void AFreshGuardIsTheFirstInstance()
    {
        var name = UniqueName();
        using var guard = new SingleInstanceGuard(name);

        Assert.True(guard.IsFirstInstance);
    }

    [Fact]
    public void ASecondInstanceOnAnotherThreadIsRejectedWhileTheFirstIsStillHeld()
    {
        var name = UniqueName();
        using var firstAcquired = new ManualResetEventSlim();
        using var releaseFirst = new ManualResetEventSlim();
        SingleInstanceGuard? first = null;

        var holderThread = new Thread(() =>
        {
            first = new SingleInstanceGuard(name);
            firstAcquired.Set();
            releaseFirst.Wait();
            first.Dispose();
        });

        holderThread.Start();
        firstAcquired.Wait();

        try
        {
            using var second = new SingleInstanceGuard(name);

            Assert.True(first!.IsFirstInstance);
            Assert.False(second.IsFirstInstance);
        }
        finally
        {
            releaseFirst.Set();
            holderThread.Join();
        }
    }

    [Fact]
    public void DisposingTheFirstInstancePermitsALaterInstanceToAcquire()
    {
        var name = UniqueName();

        var first = new SingleInstanceGuard(name);
        Assert.True(first.IsFirstInstance);
        first.Dispose();

        using var second = new SingleInstanceGuard(name);
        Assert.True(second.IsFirstInstance);
    }

    [Fact]
    public void ARejectedInstanceDisposingItselfDoesNotReleaseTheRealOwnersLock()
    {
        var name = UniqueName();
        using var firstAcquired = new ManualResetEventSlim();
        using var releaseFirst = new ManualResetEventSlim();
        SingleInstanceGuard? first = null;

        var holderThread = new Thread(() =>
        {
            first = new SingleInstanceGuard(name);
            firstAcquired.Set();
            releaseFirst.Wait();
            first.Dispose();
        });

        holderThread.Start();
        firstAcquired.Wait();

        try
        {
            var second = new SingleInstanceGuard(name);
            Assert.False(second.IsFirstInstance);
            second.Dispose();

            using var third = new SingleInstanceGuard(name);
            Assert.False(third.IsFirstInstance);
        }
        finally
        {
            releaseFirst.Set();
            holderThread.Join();
        }
    }

    [Fact]
    public void AnAbandonedMutexFromACrashedInstanceIsStillRecoveredAsAFirstInstance()
    {
        var name = UniqueName();

        var thread = new Thread(() =>
        {
            // Simulates a previous instance that acquired the guard and
            // then crashed/exited without ever disposing it.
            _ = new SingleInstanceGuard(name);
        });

        thread.Start();
        thread.Join();

        using var recovered = new SingleInstanceGuard(name);

        Assert.True(recovered.IsFirstInstance);
    }
}
