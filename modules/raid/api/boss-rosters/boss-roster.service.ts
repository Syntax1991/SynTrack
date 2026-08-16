import { AppError } from "../../../../apps/api/src/shared/errors/AppError.js";
import { GuildRosterRepository } from "../../../guild/api/roster/roster.repository.js";
import type { GuildVerificationGuard } from "../../../guild/api/verification/verification.types.js";
import { getSpecById } from "../../shared/catalog/raidSpecializationCatalog.js";
import { RaidSetupRepository } from "../setups/setup.repository.js";
import { RaidBossRosterRepository } from "./boss-roster.repository.js";
import type { RaiderLinkGuard } from "./boss-roster.types.js";

export class RaidBossRosterService {
  constructor(
    private readonly repository:
      RaidBossRosterRepository,

    private readonly rosterRepository:
      GuildRosterRepository,

    private readonly setupRepository:
      RaidSetupRepository,

    private readonly verification:
      GuildVerificationGuard,

    private readonly raiderLink:
      RaiderLinkGuard
  ) {}

  async listForSetup(
    token: string,
    setupId: string
  ) {
    await this.requireLinkedMember(
      token
    );

    const setup =
      await this.setupRepository.findSetupById(
        setupId
      );

    if (!setup || !setup.raidEventId) {
      throw new AppError(
        404,
        "Setup nicht gefunden."
      );
    }

    const [bosses, members] =
      await Promise.all([
        this.repository.findBossesForSetup(
          setup.raidEventId,
          setupId
        ),
        this.rosterRepository.findAll()
      ]);

    return this.enrichBosses(
      bosses,
      members
    );
  }

  async setEntry(
    token: string,
    bossId: string,
    setupId: string,
    memberId: string,
    status: string
  ) {
    await this.verification.requireCurrentOfficer(
      token
    );

    const { boss, setup } =
      await this.requireConsistentBossAndSetup(
        bossId,
        setupId
      );

    const member =
      await this.repository.findMemberById(
        memberId
      );

    if (!member) {
      throw new AppError(
        404,
        "Gildenmitglied nicht gefunden."
      );
    }

    const isSetupMember =
      await this.setupRepository.isSetupMember(
        setup.id,
        memberId
      );

    if (!isSetupMember) {
      throw new AppError(
        400,
        "Dieses Mitglied muss zuerst wieder zum Setup hinzugefügt werden, um die Teilnahme zu ändern."
      );
    }

    await this.repository.upsertEntry(
      boss.id,
      setup.id,
      memberId,
      status
    );

    return this.enrichBossForSetup(
      boss.id,
      setup.id
    );
  }

  async clearEntry(
    token: string,
    bossId: string,
    setupId: string,
    memberId: string
  ) {
    await this.verification.requireCurrentOfficer(
      token
    );

    const { boss, setup } =
      await this.requireConsistentBossAndSetup(
        bossId,
        setupId
      );

    await this.repository.deleteEntry(
      boss.id,
      setup.id,
      memberId
    );

    return this.enrichBossForSetup(
      boss.id,
      setup.id
    );
  }

  /**
   * The member's effective specialization for THIS Setup+Boss
   * composition entry only — never a general "this player's spec"
   * write. Requires an existing lineup entry (a spec describes an
   * existing participation, it doesn't create one) and, when a spec
   * is given, validates it's both a real catalog spec and one that
   * actually belongs to the member's real class — never trusts the
   * frontend's own filtering.
   */
  async setSpec(
    token: string,
    bossId: string,
    setupId: string,
    memberId: string,
    specId: number | null
  ) {
    await this.verification.requireCurrentOfficer(
      token
    );

    const { boss, setup } =
      await this.requireConsistentBossAndSetup(
        bossId,
        setupId
      );

    const member =
      await this.repository.findMemberById(
        memberId
      );

    if (!member) {
      throw new AppError(
        404,
        "Gildenmitglied nicht gefunden."
      );
    }

    const entry =
      await this.repository.findEntry(
        boss.id,
        setup.id,
        memberId
      );

    if (!entry) {
      throw new AppError(
        404,
        "Dieses Mitglied hat noch keinen Eintrag für diesen Boss."
      );
    }

    if (specId !== null) {
      const spec = getSpecById(specId);

      if (
        !spec ||
        spec.className.toLowerCase() !==
          member.className.toLowerCase()
      ) {
        throw new AppError(
          400,
          "Diese Spezialisierung passt nicht zur Klasse dieses Mitglieds."
        );
      }
    }

    await this.repository.updateSpec(
      boss.id,
      setup.id,
      memberId,
      specId
    );

    return this.enrichBossForSetup(
      boss.id,
      setup.id
    );
  }

  private async requireLinkedMember(
    token: string
  ): Promise<void> {
    const member =
      await this.raiderLink.getLinkedMember(
        token
      );

    if (!member) {
      throw new AppError(
        403,
        "Bitte zuerst dein Battle.net-Konto verknüpfen."
      );
    }
  }

  private async requireConsistentBossAndSetup(
    bossId: string,
    setupId: string
  ) {
    const [boss, setup] =
      await Promise.all([
        this.repository.findBossById(
          bossId
        ),
        this.setupRepository.findSetupById(
          setupId
        )
      ]);

    if (!boss) {
      throw new AppError(
        404,
        "Boss nicht gefunden."
      );
    }

    if (!setup) {
      throw new AppError(
        404,
        "Setup nicht gefunden."
      );
    }

    if (
      boss.raidEventId !==
      setup.raidEventId
    ) {
      throw new AppError(
        400,
        "Boss und Setup gehören zu unterschiedlichen Terminen."
      );
    }

    return { boss, setup };
  }

  private async enrichBossForSetup(
    bossId: string,
    setupId: string
  ) {
    const boss =
      await this.repository.findBossWithSetupEntries(
        bossId,
        setupId
      );

    if (!boss) {
      throw new AppError(
        404,
        "Boss nicht gefunden."
      );
    }

    const members =
      await this.rosterRepository.findAll();

    return this.enrichBosses(
      [boss],
      members
    )[0];
  }

  private enrichBosses(
    bosses: Awaited<
      ReturnType<
        RaidBossRosterRepository["findBossesForSetup"]
      >
    >,
    members: Awaited<
      ReturnType<
        GuildRosterRepository["findAll"]
      >
    >
  ) {
    const memberById = new Map(
      members.map((member) => [
        member.id,
        member
      ])
    );

    return bosses.map((boss) => ({
      ...boss,
      rosterEntries:
        boss.rosterEntries.map(
          (entry) => ({
            ...entry,
            member:
              memberById.get(
                entry.memberId
              ) ?? null
          })
        )
    }));
  }
}
