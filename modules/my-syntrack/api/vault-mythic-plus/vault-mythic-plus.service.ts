import { CharacterExternalSnapshotRepository } from "../character-external-sync/character-external-snapshot.repository.js";
import { CharacterProfileAuthorityService } from "../character-external-sync/character-profile-authority.service.js";
import type { EffectiveCharacterIdentity } from "../character-external-sync/character-profile-effective-identity.js";
import { resolveEffectiveCharacterIdentities } from "../character-external-sync/character-profile-effective-identity.js";
import { resolveCharacterTrackingProfile } from "../character-tracking/character-tracking-profile.js";
import { isWeeklyGameplayEnabled } from "../character-tracking/domain-applicability.js";
import { getWeeklyPeriod } from "../shared/weekly-period.js";
import { deriveWeeklyGameplayDetail } from "../weekly-gameplay/weekly-gameplay.detail.js";
import { WeeklyGameplayRepository } from "../weekly-gameplay/weekly-gameplay.repository.js";
import type { WeeklyGameplayDomainView } from "../weekly-gameplay/weekly-gameplay.types.js";
import { VaultMythicPlusRepository } from "./vault-mythic-plus.repository.js";
import type {
  VaultDomainProgress,
  VaultGameplayCharacter,
  VaultMythicPlusResponse
} from "./vault-mythic-plus.types.js";

function unknownDomain(label: string): WeeklyGameplayDomainView {
  return {
    state: "UNKNOWN",
    completeCount: 0,
    applicableTotal: 0,
    unknownCount: 1,
    label,
    rawCompleteCount: 0,
    knownUnlockedSlots: 0,
    maxSlots: 0,
    hasUnknownCategories: false,
    unknownCategoryCount: 0,
    unresolvedCategoryLabels: []
  };
}

function toProgress(view: WeeklyGameplayDomainView): VaultDomainProgress {
  return {
    state: view.state,
    completeCount: view.completeCount,
    applicableTotal: view.applicableTotal,
    knownUnlockedSlots: view.knownUnlockedSlots,
    maxSlots: view.maxSlots,
    hasUnknownCategories: view.hasUnknownCategories,
    unresolvedCategoryLabels: view.unresolvedCategoryLabels ?? []
  };
}

function emptySlots() {
  return [1, 2, 3].map((slot) => ({
    slot: slot as 1 | 2 | 3,
    state: "UNKNOWN" as const,
    threshold: null,
    progress: null,
    level: null,
    rewardLabel: null
  }));
}

function unresolvedCharacter(
  character: {
    id: string;
    name: string;
    realm: string;
    region: string;
    className: string;
    level: number;
  },
  trackingProfile: ReturnType<typeof resolveCharacterTrackingProfile>,
  identity: EffectiveCharacterIdentity | undefined
): VaultGameplayCharacter {
  return {
    id: character.id,
    name: character.name,
    realm: character.realm,
    region: character.region,
    className: identity?.className ?? character.className,
    level: identity?.level ?? character.level,
    trackingProfile,
    vault: toProgress(unknownDomain("Vault")),
    mythicPlus: toProgress(unknownDomain("M+")),
    raid: toProgress(unknownDomain("Raid")),
    delves: toProgress(unknownDomain("Delves")),
    mythicPlusSlots: emptySlots(),
    raidSlots: emptySlots(),
    worldSlots: emptySlots(),
    highestKeyLevel: null,
    mythicPlusRunCount: null,
    mythicPlusRuns: [],
    action: "Not captured this week",
    vaultCaptured: false,
    vaultCurrent: false
  };
}

export class VaultMythicPlusService {
  private readonly weeklyGameplayRepository = new WeeklyGameplayRepository();

  constructor(
    private readonly repository: VaultMythicPlusRepository,
    // Constructor-injectable so service-boundary tests can prove the
    // effective level/className path is used without a real Prisma round trip.
    private readonly profileAuthorityService = new CharacterProfileAuthorityService(
      new CharacterExternalSnapshotRepository()
    )
  ) {}

  async getOverview(): Promise<VaultMythicPlusResponse> {
    const period = getWeeklyPeriod();
    const [characters, snapshots] = await Promise.all([
      this.repository.findCharactersWithTags(),
      this.weeklyGameplayRepository.findSnapshotsForPeriod(period.key)
    ]);

    const identityByCharacterId = await resolveEffectiveCharacterIdentities(
      characters,
      this.profileAuthorityService
    );

    const detailByCharacterId = new Map(
      snapshots.map((snapshot) => [
        snapshot.characterId,
        deriveWeeklyGameplayDetail(snapshot)
      ])
    );

    const gameplayCharacters = characters
      .map((character) => {
        const tags = character.tagAssignments.map((assignment) => ({
          id: assignment.tag.id,
          name: assignment.tag.name,
          color: assignment.tag.color
        }));
        const trackingProfile = resolveCharacterTrackingProfile(tags);

        if (!isWeeklyGameplayEnabled(trackingProfile)) {
          return null;
        }

        const identity = identityByCharacterId.get(character.id);
        const detail = detailByCharacterId.get(character.id);

        if (!detail) {
          return unresolvedCharacter(character, trackingProfile, identity);
        }

        return {
          id: character.id,
          name: character.name,
          realm: character.realm,
          region: character.region,
          className: identity?.className ?? character.className,
          level: identity?.level ?? character.level,
          trackingProfile,
          vault: toProgress(detail.gameplay.vault),
          mythicPlus: toProgress(detail.gameplay.mythicPlus),
          raid: toProgress(detail.gameplay.raid),
          delves: toProgress(detail.gameplay.delves),
          mythicPlusSlots: detail.mythicPlusSlots,
          raidSlots: detail.raidSlots,
          worldSlots: detail.worldSlots,
          highestKeyLevel: detail.highestKeyLevel,
          mythicPlusRunCount: detail.mythicPlusRunCount,
          mythicPlusRuns: detail.mythicPlusRuns,
          action: detail.action,
          vaultCaptured: detail.vaultCaptured,
          vaultCurrent: detail.vaultCurrent
        } satisfies VaultGameplayCharacter;
      })
      .filter((character): character is VaultGameplayCharacter => character !== null);

    const attentionCount = gameplayCharacters.filter(
      (character) =>
        character.vault.state === "ATTENTION" ||
        character.vault.state === "IN_PROGRESS" ||
        character.action !== "Vault complete"
    ).length;

    const readyCount = gameplayCharacters.filter(
      (character) => character.action === "Vault complete"
    ).length;

    return {
      period,
      characters: gameplayCharacters,
      summary: {
        characterCount: gameplayCharacters.length,
        attentionCount,
        readyCount
      }
    };
  }
}
