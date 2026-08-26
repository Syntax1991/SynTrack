import { slotClaim } from "./profession-specialization-equipment.types.js";
import type { SpecializationEquipmentSlotClaim } from "./profession-specialization-equipment.types.js";

/*
 * Tailoring - Sin'dorei Finery tree only (addon:104216 root). Same
 * verification method as Blacksmithing: e.g. addon:104207 ("Outfit
 * Essentials") reads "Gain +$ev1 $en1 when crafting cloth Robes, Trousers,
 * and Cloaks" - a direct, Blizzard-authored 1:1 match to the
 * CHEST/LEGS/BACK slot enum. Tailoring's other trees (Fabric Specialist,
 * Nimble Needlework, Fiber Arts) are general crafting-bonus trees with no
 * per-slot claim to make and are left uncurated, same as Leatherworking's
 * "Learned Leatherworker" and Blacksmithing's "The Old Ways"/
 * "Craftsmithing".
 */
export const tailoringSpecializationEquipmentNodes: Record<
  string,
  SpecializationEquipmentSlotClaim[]
> = {
  "addon:104204": [
    slotClaim("CLOTH", "Cloth", "BACK", "Back", false)
  ], // Cloaks

  "addon:104205": [
    slotClaim("CLOTH", "Cloth", "LEGS", "Legs", false)
  ], // Trousers

  "addon:104206": [
    slotClaim("CLOTH", "Cloth", "CHEST", "Chest", false)
  ], // Robes

  "addon:104207": [
    slotClaim("CLOTH", "Cloth", "CHEST", "Chest", true),
    slotClaim("CLOTH", "Cloth", "LEGS", "Legs", true),
    slotClaim("CLOTH", "Cloth", "BACK", "Back", true)
  ], // Outfit Essentials (bundle: robes, trousers, cloaks)

  "addon:104208": [
    slotClaim("CLOTH", "Cloth", "SHOULDER", "Shoulder", false)
  ], // Shoulders

  "addon:104209": [
    slotClaim("CLOTH", "Cloth", "WRIST", "Wrist", false)
  ], // Bracers

  "addon:104210": [
    slotClaim("CLOTH", "Cloth", "WAIST", "Waist", false)
  ], // Belts

  "addon:104211": [
    slotClaim("CLOTH", "Cloth", "WAIST", "Waist", true),
    slotClaim("CLOTH", "Cloth", "WRIST", "Wrist", true),
    slotClaim("CLOTH", "Cloth", "SHOULDER", "Shoulder", true)
  ], // Elegant Accessories (bundle: belts, bracers, shoulders)

  "addon:104212": [
    slotClaim("CLOTH", "Cloth", "HEAD", "Head", false)
  ], // Hats

  "addon:104213": [
    slotClaim("CLOTH", "Cloth", "HANDS", "Hands", false)
  ], // Gloves

  "addon:104214": [
    slotClaim("CLOTH", "Cloth", "FEET", "Feet", false)
  ], // Boots

  "addon:104215": [
    slotClaim("CLOTH", "Cloth", "FEET", "Feet", true),
    slotClaim("CLOTH", "Cloth", "HANDS", "Hands", true),
    slotClaim("CLOTH", "Cloth", "HEAD", "Head", true)
  ] // Head-to-Toes (bundle: boots, gloves, hats)
};
