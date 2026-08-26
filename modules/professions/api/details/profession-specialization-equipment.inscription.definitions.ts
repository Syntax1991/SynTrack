import { slotClaim } from "./profession-specialization-equipment.types.js";
import type { SpecializationEquipmentSlotClaim } from "./profession-specialization-equipment.types.js";

/*
 * Inscription - Blueprints tree only (addon:106192 root), and only its
 * non-colliding leaves. Every claim below ties one specialization node to
 * the ONE equipment slot its own Blizzard-authored text names, verified
 * against real captured EQUIPMENT_SLOT capabilities (Off Hand, Ranged,
 * Two-Hand - see addon-import.recipe-output-capability.ts):
 *   - addon:106189 ("Bows"): "carve bows" -> RANGED
 *   - addon:106190 ("Staves"): "carve staves" -> TWO_HAND
 *   - addon:106191 ("Field Research"): "carve weapons" -> bundle of the
 *     above two (the only two weapon types Inscription crafts)
 *   - addon:106188 ("Lamps and Lanterns"): "carve codices" -> OFF_HAND
 *     (Inscription's codices are Blizzard-classified off-hand relic-type
 *     items; Inscription has exactly 3 captured OFF_HAND recipes and this
 *     is the only Blueprints node describing codices)
 *
 * Deliberately NOT curated, and left for a future explicit decision rather
 * than a silent guess:
 *   - addon:106184/106185/106186 ("Chef's Rolling Pin" / "Alchemist's
 *     Mixing Rod" / "Scribe's Quill"): all three read as crafting a
 *     PROFESSION_TOOL for a different profession (Cooking/Alchemy/
 *     Inscription), but all three claim the SAME captured slot key
 *     (PROFESSION_TOOL) - the current mapper design (one specific node
 *     per family+slot pair, "specific beats bundle") has no rule for THREE
 *     equally-specific nodes sharing a pair; curating any one of them
 *     would silently hide investment in the other two whenever a
 *     character has more than one at once. This needs an explicit
 *     multi-specific-per-pair design, not a workaround.
 *   - addon:106346..106358 ("Darkmoon Curiosity" tree - Rot/Blood/Hunt/
 *     Void Dominions and Sigils): each element's Dominion/Sigil/base node
 *     is genuinely Trinket-slot (7 captured TRINKET recipes confirm it),
 *     but the tree has 4 elements x 2-3 nodes each, all claiming the SAME
 *     TRINKET slot - the exact same multi-specific-per-pair gap as above,
 *     at larger scale.
 *   - addon:106187 ("Market Research", "profession equipment" /
 *     sub-specialization): no PROFESSION_ACCESSORY capability is even
 *     captured for Inscription, and the node's own text does not name a
 *     specific slot the way Bows/Staves/Lamps and Lanterns do - left
 *     unmapped rather than guessed.
 *   - Perfected Products tree (Ciphers/Milling/Inks/Vantus Runes/
 *     Contracts/Missives) and Calm Hands (general Multicraft/
 *     Resourcefulness/Ingenuity bonus): every leaf ties to a RECIPE_GROUP
 *     only, never an EQUIPMENT_SLOT - the same data gap as Alchemy/
 *     Engineering's tool trees/Jewelcrafting's gem trees.
 */
export const inscriptionSpecializationEquipmentNodes: Record<
  string,
  SpecializationEquipmentSlotClaim[]
> = {
  "addon:106188": [
    slotClaim(null, "Weapon", "OFF_HAND", "Off Hand", false)
  ], // Lamps and Lanterns (codices)

  "addon:106189": [
    slotClaim(null, "Weapon", "RANGED", "Ranged", false)
  ], // Bows

  "addon:106190": [
    slotClaim(null, "Weapon", "TWO_HAND", "Two-Hand", false)
  ], // Staves

  "addon:106191": [
    slotClaim(null, "Weapon", "RANGED", "Ranged", true),
    slotClaim(null, "Weapon", "TWO_HAND", "Two-Hand", true)
  ] // Field Research (bundle: bows and staves)
};
