import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));

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

  it("the Vault/weekly-gameplay module has no reference to the MYTHIC_PLUS external-snapshot domain or BLIZZARD source", () => {
    const weeklyGameplayDir = join(here, "..", "weekly-gameplay");
    const filesToCheck = [
      "weekly-gameplay.detail.ts",
      "weekly-gameplay.vault.ts",
      "weekly-gameplay.highest.ts",
      "weekly-gameplay.deriver.ts",
      "mythic-plus-season-progress.service.ts"
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
});
