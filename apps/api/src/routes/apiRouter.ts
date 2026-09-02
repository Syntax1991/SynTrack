import { Router } from "express";
import { guildAuditRouter } from "../../../../modules/guild/api/audit/audit.routes.js";
import { guildOfficerNoteRouter } from "../../../../modules/guild/api/officer-notes/officer-note.routes.js";
import { guildRequirementRouter } from "../../../../modules/guild/api/requirements/requirement.routes.js";
import { guildRosterRouter } from "../../../../modules/guild/api/roster/roster.routes.js";
import { guildRosterImportRouter } from "../../../../modules/guild/api/roster-import/roster-import.routes.js";
import { guildTeamRouter } from "../../../../modules/guild/api/teams/team.routes.js";
import { guildVerificationRouter } from "../../../../modules/guild/api/verification/verification.routes.js";
import { guildWeeklyProgressRouter } from "../../../../modules/guild/api/weekly-progress/weekly-progress.routes.js";
import { lootWishlistRouter } from "../../../../modules/loot/api/wishlist/wishlist.routes.js";
import { lootDroptimizerRouter } from "../../../../modules/loot/api/droptimizer/droptimizer.routes.js";
import { characterRouter } from "../../../../modules/my-syntrack/api/characters/character.routes.js";
import { overviewRouter } from "../../../../modules/my-syntrack/api/overview/overview.routes.js";
import { tagRouter } from "../../../../modules/my-syntrack/api/tags/tag.routes.js";
import { gearReadinessRouter } from "../../../../modules/my-syntrack/api/gear-readiness/gear-readiness.routes.js";
import { raidTaskRouter } from "../../../../modules/my-syntrack/api/raid-tasks/raid-task.routes.js";
import { weeklyChecklistRouter } from "../../../../modules/my-syntrack/api/weekly-checklist/weekly-checklist.routes.js";
import { seasonChecklistRouter } from "../../../../modules/my-syntrack/api/season-checklist/season-checklist.routes.js";
import { vaultMythicPlusRouter } from "../../../../modules/my-syntrack/api/vault-mythic-plus/vault-mythic-plus.routes.js";
import { trackerDefinitionRouter } from "../../../../modules/my-syntrack/api/trackers/tracker-definition.routes.js";
import { trackerValueRouter } from "../../../../modules/my-syntrack/api/trackers/tracker-value.routes.js";
import { trackerScopeProfileRouter } from "../../../../modules/my-syntrack/api/trackers/tracker-scope-profile.routes.js";
import { addonImportRouter } from "../../../../modules/data-platform/api/integrations/addon/addon-import.routes.js";
import { battleNetIntegrationRouter } from "../../../../modules/data-platform/api/integrations/battlenet/battlenet.routes.js";
import { raiderAuthRouter } from "../../../../modules/data-platform/api/raider-auth/raider-auth.routes.js";
import { deviceLinkRouter } from "../../../../modules/data-platform/api/device-auth/device-link.routes.js";
import { clientImportRouter } from "../../../../modules/data-platform/api/client-import/client-import.routes.js";
import { clientProfileRouter } from "../../../../modules/data-platform/api/client-profile/client-profile.routes.js";
import { clientCharactersRouter } from "../../../../modules/data-platform/api/client-characters/client-characters.routes.js";
import { settingsTrustRouter } from "../../../../modules/data-platform/api/settings-trust/settings-trust.routes.js";
import { guildRaiderLinkRouter } from "../../../../modules/guild/api/raider-link/raider-link.routes.js";
import { professionDetailRouter } from "../../../../modules/professions/api/details/profession-detail.routes.js";
import { professionRouter } from "../../../../modules/professions/api/profession.routes.js";
import { specializationRouter } from "../../../../modules/professions/api/specializations/specialization.routes.js";

export const apiRouter =
  Router();

apiRouter.get(
  "/health",
  (
    _request,
    response
  ) => {
    response.json({
      ok: true,
      service:
        "SynTrack API",
      timestamp:
        new Date()
          .toISOString()
    });
  }
);

apiRouter.use(
  "/overview",
  overviewRouter
);

apiRouter.use(
  "/weekly-checklist",
  weeklyChecklistRouter
);

apiRouter.use(
  "/season-checklist",
  seasonChecklistRouter
);

apiRouter.use(
  "/vault-mythic-plus",
  vaultMythicPlusRouter
);

apiRouter.use(
  "/raid-tasks",
  raidTaskRouter
);

apiRouter.use(
  "/gear-readiness",
  gearReadinessRouter
);

apiRouter.use(
  "/tracker-definitions",
  trackerDefinitionRouter
);

apiRouter.use(
  "/tracker-values",
  trackerValueRouter
);

apiRouter.use(
  "/tracker-scopes",
  trackerScopeProfileRouter
);

apiRouter.use(
  "/characters",
  specializationRouter
);

apiRouter.use(
  "/characters",
  characterRouter
);

apiRouter.use(
  "/tags",
  tagRouter
);

apiRouter.use(
  "/professions",
  professionRouter
);

apiRouter.use(
  "/profession-details",
  professionDetailRouter
);

apiRouter.use(
  "/guild/verification",
  guildVerificationRouter
);

apiRouter.use(
  "/guild/teams",
  guildTeamRouter
);

apiRouter.use(
  "/guild/roster",
  guildRosterRouter
);

apiRouter.use(
  "/guild/audit",
  guildAuditRouter
);

apiRouter.use(
  "/guild/roster-import",
  guildRosterImportRouter
);

apiRouter.use(
  "/guild/requirements",
  guildRequirementRouter
);

apiRouter.use(
  "/guild/officer-notes",
  guildOfficerNoteRouter
);

apiRouter.use(
  "/guild/weekly-progress",
  guildWeeklyProgressRouter
);

apiRouter.use(
  "/loot/wishlist",
  lootWishlistRouter
);

apiRouter.use(
  "/loot/droptimizer",
  lootDroptimizerRouter
);

apiRouter.use(
  "/integrations/addon",
  addonImportRouter
);

apiRouter.use(
  "/integrations/battlenet",
  battleNetIntegrationRouter
);

apiRouter.use(
  "/auth/raider",
  raiderAuthRouter
);

apiRouter.use(
  "/guild/raider-link",
  guildRaiderLinkRouter
);

apiRouter.use(
  "/client",
  deviceLinkRouter
);

apiRouter.use(
  "/client",
  clientImportRouter
);

apiRouter.use(
  "/client",
  clientProfileRouter
);

apiRouter.use(
  "/client",
  clientCharactersRouter
);

apiRouter.use(
  "/settings",
  settingsTrustRouter
);
