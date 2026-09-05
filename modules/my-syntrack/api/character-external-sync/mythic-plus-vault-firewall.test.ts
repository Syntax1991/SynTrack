import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const seasonChecklistDir = join(here, "..", "season-checklist");

const mythicPlusFiles = [
  "blizzard-mythic-plus.normalizer.ts",
  "character-mythic-plus-refresh.service.ts",
  "character-mythic-plus-authority.service.ts",
  "character-mythic-plus-addon-fallback.repository.ts",
  "character-mythic-plus-refresh.controller.ts",
  "character-mythic-plus-refresh.routes.ts"
].map((file) => join(here, file));

/*
 * Phase D8's Great Vault firewall, enforced structurally rather than
 * only by convention: the new BLIZZARD/MYTHIC_PLUS pipeline must be
 * physically incapable of writing to, or reading from,
 * CharacterWeeklyGameplaySnapshot/CharacterWeeklyVaultActivity/
 * CharacterWeeklyMythicPlusCapture (current-week addon state that Great
 * Vault math depends on) - a static import-graph check, so a future edit
 * that accidentally wires the two together fails a test immediately
 * rather than depending on someone noticing in review.
 */
describe("Mythic+ / Great Vault firewall", () => {
  it("no BLIZZARD MYTHIC_PLUS source file imports the weekly-gameplay module (Vault/current-week gameplay)", () => {
    for (const filePath of mythicPlusFiles) {
      const importLines = readFileSync(filePath, "utf8")
        .split("\n")
        .filter((line) => /^\s*import\b/.test(line));

      for (const line of importLines) {
        expect(line).not.toMatch(/weekly-gameplay/);
        expect(line).not.toMatch(/CharacterWeeklyGameplaySnapshot/);
        expect(line).not.toMatch(/CharacterWeeklyVaultActivity/);
        expect(line).not.toMatch(/CharacterWeeklyMythicPlusCapture/);
      }
    }
  });

  it("no BLIZZARD MYTHIC_PLUS source file touches prisma directly except the dedicated addon-fallback/snapshot repositories", () => {
    const filesAllowedToTouchPrisma = new Set([
      join(here, "character-mythic-plus-addon-fallback.repository.ts")
    ]);

    for (const filePath of mythicPlusFiles) {
      if (filesAllowedToTouchPrisma.has(filePath)) {
        continue;
      }

      const importLines = readFileSync(filePath, "utf8")
        .split("\n")
        .filter((line) => /^\s*import\b/.test(line));

      for (const line of importLines) {
        expect(line).not.toMatch(/prismaClient/);
      }
    }
  });

  it("the actual Vault-computation files have no reference to the MYTHIC_PLUS external-snapshot domain or BLIZZARD source", () => {
    // mythic-plus-season-progress.service.ts is DELIBERATELY excluded here
    // (Phase D.2): it is the one legitimate crossover point that reads
    // BLIZZARD/MYTHIC_PLUS season data for Resilient Keystone evidence.
    // The files below are the actual Vault slot/threshold/current-week
    // computation - they must never gain this dependency.
    const weeklyGameplayDir = join(here, "..", "weekly-gameplay");
    const filesToCheck = [
      "weekly-gameplay.detail.ts",
      "weekly-gameplay.vault.ts",
      "weekly-gameplay.highest.ts",
      "weekly-gameplay.deriver.ts"
    ];

    for (const file of filesToCheck) {
      const importLines = readFileSync(join(weeklyGameplayDir, file), "utf8")
        .split("\n")
        .filter((line) => /^\s*import\b/.test(line));

      for (const line of importLines) {
        expect(line).not.toMatch(/character-external-sync/);
        expect(line).not.toMatch(/EXTERNAL_DOMAIN_MYTHIC_PLUS/);
        expect(line).not.toMatch(/CharacterExternalSnapshot/);
      }
    }
  });

  it("mythic-plus-season-progress.service.ts may read BLIZZARD/MYTHIC_PLUS season data, but never Vault-specific identifiers", () => {
    // The one deliberate, scoped crossover (Phase D.2): season-wide
    // Resilient Keystone evidence is allowed to read the MYTHIC_PLUS
    // external snapshot, but must never reference Vault-specific models -
    // this is the precise invariant Phase D8/D.2 actually require (no
    // Vault crossover), not "never touch character-external-sync at all".
    const filePath = join(here, "..", "weekly-gameplay", "mythic-plus-season-progress.service.ts");
    const content = readFileSync(filePath, "utf8");

    expect(content).toMatch(/EXTERNAL_DOMAIN_MYTHIC_PLUS/);
    expect(content).not.toMatch(/CharacterWeeklyVaultActivity/);
    expect(content).not.toMatch(/vaultActivities/);
    expect(content).not.toMatch(/VaultActivitySlot/);
  });

  it("Phase F1's season Mythic+ rating read path has no import route into Vault/current-week M+ state", () => {
    // season-mythic-plus-rating-effective.ts wires the SEASONAL rating
    // tracker into the checklist's mythicPlus goal; season-checklist.service.ts
    // is the file that now calls it. Neither may *import* the Vault models
    // or current-week capture/highest concepts that the firewall above
    // already protects for the refresh pipeline itself. (Import lines only,
    // like the checks above - the effective file's own doc comment names
    // these models by way of explicitly disclaiming the relationship.)
    const filesToCheck = ["season-mythic-plus-rating-effective.ts", "season-checklist.service.ts"];

    for (const file of filesToCheck) {
      const importLines = readFileSync(join(seasonChecklistDir, file), "utf8")
        .split("\n")
        .filter((line) => /^\s*import\b/.test(line));

      for (const line of importLines) {
        expect(line).not.toMatch(/CharacterWeeklyVaultActivity/);
        expect(line).not.toMatch(/CharacterWeeklyGameplaySnapshot/);
        expect(line).not.toMatch(/CharacterWeeklyMythicPlusCapture/);
        expect(line).not.toMatch(/vaultActivities/);
        expect(line).not.toMatch(/VaultActivitySlot/);
      }
    }
  });
});
