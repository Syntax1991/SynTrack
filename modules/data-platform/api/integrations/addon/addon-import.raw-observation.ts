import { recordIngestObservation } from "../../ingest-observation/ingest-observation.writer.js";
import { asString, asTable } from "./addon-import.lua-utils.js";
import type { LuaTable } from "./addon-import.types.js";

/*
 * Phase G3B: captures the raw ADDON/GEAR domain slice - the exact
 * `modules.gear` Lua table for each character, before
 * normalizeGearSnapshot() (addon-import.gear.normalizer.ts) transforms
 * it - so real captures can be compared against what G3A stopped
 * persisting (itemLink/quality/enchantId/gemIds/uniqueCategoryCount).
 * This walks the SAME raw root table normalizeCharacter()
 * (addon-import.character.normalizer.ts) walks, deliberately kept
 * separate from it: normalizers stay pure, and this capture is entirely
 * best-effort (recordIngestObservation never throws) so it can never
 * affect what gets normalized or persisted.
 */
export function captureRawAddonGearObservations(root: LuaTable): void {
  const characterTable = asTable(root.characters);

  if (!characterTable) {
    return;
  }

  for (const value of Object.values(characterTable)) {
    const character = asTable(value);

    if (!character) {
      continue;
    }

    const gearModule = asTable(asTable(character.modules)?.gear);

    if (!gearModule) {
      continue;
    }

    recordIngestObservation({
      source: "ADDON",
      domain: "GEAR",
      characterName: asString(character.name),
      realmSlug: asString(character.realm),
      region: asString(character.region),
      payload: gearModule
    });
  }
}
