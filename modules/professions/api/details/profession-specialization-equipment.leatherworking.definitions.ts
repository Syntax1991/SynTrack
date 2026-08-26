import { slotClaim } from "./profession-specialization-equipment.types.js";
import type { SpecializationEquipmentSlotClaim } from "./profession-specialization-equipment.types.js";

/*
 * Hand-verified, ID-keyed mapping from a stable specialization NODE KEY
 * (Blizzard-issued, addon:<externalNodeId>, captured in
 * ProfessionSpecializationNode.key) to the concrete armor family + slot
 * combination(s) that node's Specialization Knowledge investment actually
 * improves.
 *
 * This table was built ONCE by reading each node's real, Blizzard-authored
 * name and description directly against the current MIDNIGHT Leatherworking
 * specialization trees in dev.db (Lasting Leather = LEATHER,
 * Safeguarding Scales = MAIL) - not by pattern-matching text at runtime.
 * Nothing in this file, or in the mapper that reads it, inspects a node's
 * name or description to decide family or slot; an unmapped node key
 * simply contributes no claim (UNKNOWN), regardless of how suggestive its
 * name looks. This is the direct fix for the deleted fuzzy slot mapper's
 * failure mode ("Wonderful Wristguards" matching a generic "wristguard"
 * alias with no armor-type awareness).
 *
 * Two nodes per tree ("Embroidered Ensembles" / "Advanced Armor" and
 * "Securely Shaped" / "Bolstered Bulwarks") are genuine multi-slot bundle
 * perks in the live game data (Blizzard's own description text names all
 * four slots they improve), marked isBundle so the mapper can prefer the
 * more specific single-slot node for display when a character has invested
 * in both.
 */
export const leatherworkingSpecializationEquipmentNodes: Record<
  string,
  SpecializationEquipmentSlotClaim[]
> = {
  // Lasting Leather (addon:2915:1157) - LEATHER
  "addon:107879": [
    slotClaim("LEATHER", "Leather", "FEET", "Feet", false)
  ], // Tasteful Treads

  "addon:107880": [
    slotClaim("LEATHER", "Leather", "WAIST", "Waist", false)
  ], // Sturdy Sashes

  "addon:107881": [
    slotClaim("LEATHER", "Leather", "HANDS", "Hands", false)
  ], // Grand Gloves

  "addon:107882": [
    slotClaim("LEATHER", "Leather", "LEGS", "Legs", false)
  ], // Toughened Tassets

  "addon:107883": [
    slotClaim("LEATHER", "Leather", "HANDS", "Hands", true),
    slotClaim("LEATHER", "Leather", "FEET", "Feet", true),
    slotClaim("LEATHER", "Leather", "LEGS", "Legs", true),
    slotClaim("LEATHER", "Leather", "WAIST", "Waist", true)
  ], // Embroidered Ensembles (bundle)

  "addon:107884": [
    slotClaim("LEATHER", "Leather", "WRIST", "Wrist", false)
  ], // Wonderful Wristguards

  "addon:107885": [
    slotClaim("LEATHER", "Leather", "SHOULDER", "Shoulder", false)
  ], // Mighty Mantles

  "addon:107886": [
    slotClaim("LEATHER", "Leather", "HEAD", "Head", false)
  ], // Capable Caps

  "addon:107887": [
    slotClaim("LEATHER", "Leather", "CHEST", "Chest", false)
  ], // Terrific Tunics

  "addon:107888": [
    slotClaim("LEATHER", "Leather", "CHEST", "Chest", true),
    slotClaim("LEATHER", "Leather", "HEAD", "Head", true),
    slotClaim("LEATHER", "Leather", "SHOULDER", "Shoulder", true),
    slotClaim("LEATHER", "Leather", "WRIST", "Wrist", true)
  ], // Securely Shaped (bundle)

  // Safeguarding Scales (addon:2915:1159) - MAIL
  "addon:107983": [
    slotClaim("MAIL", "Mail", "FEET", "Feet", false)
  ], // Talented Talons

  "addon:107984": [
    slotClaim("MAIL", "Mail", "WAIST", "Waist", false)
  ], // Bettering Bands

  "addon:107985": [
    slotClaim("MAIL", "Mail", "HANDS", "Hands", false)
  ], // Cutting Claws

  "addon:107986": [
    slotClaim("MAIL", "Mail", "LEGS", "Legs", false)
  ], // Fantastic Faulds

  "addon:107987": [
    slotClaim("MAIL", "Mail", "HANDS", "Hands", true),
    slotClaim("MAIL", "Mail", "FEET", "Feet", true),
    slotClaim("MAIL", "Mail", "LEGS", "Legs", true),
    slotClaim("MAIL", "Mail", "WAIST", "Waist", true)
  ], // Advanced Armor (bundle)

  "addon:107988": [
    slotClaim("MAIL", "Mail", "WRIST", "Wrist", false)
  ], // Balanced Bracers

  "addon:107989": [
    slotClaim("MAIL", "Mail", "SHOULDER", "Shoulder", false)
  ], // Powerful Plumes

  "addon:107990": [
    slotClaim("MAIL", "Mail", "HEAD", "Head", false)
  ], // Versatile Visages

  "addon:107991": [
    slotClaim("MAIL", "Mail", "CHEST", "Chest", false)
  ], // Valuable Vests

  "addon:107992": [
    slotClaim("MAIL", "Mail", "CHEST", "Chest", true),
    slotClaim("MAIL", "Mail", "HEAD", "Head", true),
    slotClaim("MAIL", "Mail", "SHOULDER", "Shoulder", true),
    slotClaim("MAIL", "Mail", "WRIST", "Wrist", true)
  ] // Bolstered Bulwarks (bundle)
};
