import { useState } from "react";

/**
 * All of it is local, non-persisted display state — never a write to
 * RaidBossRosterEntry/RaidSetupMember/RaidCooldownAssignment. Grouped
 * into one hook because CooldownRosterPanel (which mutates it) and
 * CooldownPlanArea (which filters PLAN with it) are siblings under
 * TimelineGrid and need the exact same state, not two copies.
 */
export function useCooldownPlannerSelection() {
  const [
    selectedMemberId,
    setSelectedMemberId
  ] = useState<string | null>(null);

  const [
    hiddenMemberIds,
    setHiddenMemberIds
  ] = useState<Set<string>>(
    () => new Set()
  );

  const toggleHiddenMember = (
    memberId: string
  ) => {
    setHiddenMemberIds((current) => {
      const next = new Set(current);

      if (next.has(memberId)) {
        next.delete(memberId);
      }
      else {
        next.add(memberId);
      }

      return next;
    });
  };

  const [
    hiddenSpellIdsByMember,
    setHiddenSpellIdsByMember
  ] = useState<
    Map<string, Set<number>>
  >(() => new Map());

  const toggleSpellVisibility = (
    memberId: string,
    spellId: number
  ) => {
    setHiddenSpellIdsByMember(
      (current) => {
        const next = new Map(current);
        const existing = new Set(
          next.get(memberId)
        );

        if (existing.has(spellId)) {
          existing.delete(spellId);
        }
        else {
          existing.add(spellId);
        }

        next.set(memberId, existing);

        return next;
      }
    );
  };

  return {
    selectedMemberId,
    setSelectedMemberId,
    hiddenMemberIds,
    toggleHiddenMember,
    hiddenSpellIdsByMember,
    toggleSpellVisibility
  };
}
