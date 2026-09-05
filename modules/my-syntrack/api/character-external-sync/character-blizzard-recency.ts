/*
 * Phase F1 corrective review: a fresh, successful Blizzard API fetch
 * (CharacterExternalSnapshot.fetchedAt) only proves SynTrack polled the
 * endpoint recently - it says nothing about whether the character's
 * underlying state has changed since. Blizzard's Character Profile
 * response separately reports `last_login_timestamp`, its own attested
 * fact about when the character was last actually played - this is the
 * signal that answers "is Blizzard's observation behind a newer one the
 * addon already captured", independent of how recently we polled.
 *
 * This function is the single shared point where that comparison
 * happens, reused across Equipment/Profile/Mythic+ (Professions has no
 * addon-side observation timestamp today - CharacterProfession carries
 * no updatedAt column - so it cannot apply this guard; see the Phase F1
 * corrective review report's documented gap).
 */
export function isBlizzardObservationBehindAddon(
  blizzardLastLoginAt: Date | null,
  addonObservedAt: Date | null
): boolean {
  if (!blizzardLastLoginAt || !addonObservedAt) {
    return false;
  }

  return addonObservedAt.getTime() > blizzardLastLoginAt.getTime();
}
