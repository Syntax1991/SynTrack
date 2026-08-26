/*
 * The generic capability kinds a curated specialization claim can carry.
 * Kept to the minimum the currently curated data actually uses -
 * EQUIPMENT_SLOT (armor pieces, weapon handedness, jewelry slots,
 * profession tool/accessory slots) and WEAPON_TYPE (recipe-side only,
 * see profession-equipment-coverage.mapper.ts) are the only kinds any
 * curated table populates today. PROFESSION_GEAR, CRAFT_CATEGORY, and
 * GENERAL exist so a future curated mapping (e.g. "this exact node is
 * Alchemy Tool, not Cooking Tool") has a real kind to declare without a
 * schema change - see docs/architecture/profession-specialization-mapping.md.
 */
export type SpecializationCapabilityKind =
  | "EQUIPMENT_SLOT"
  | "WEAPON_TYPE"
  | "PROFESSION_GEAR"
  | "CRAFT_CATEGORY"
  | "GENERAL";

/*
 * CURATED_VERIFIED is the only provenance value in use: every claim in
 * every profession-specialization-equipment.<profession>.definitions.ts
 * file was authored by a human reading that node's own real,
 * Blizzard-authored description text (or, for future professions, the
 * live WoW specialization UI / a project-owner screenshot) and hand-
 * keying the result against the node's stable Blizzard ID. This is
 * fundamentally different from an INFERRED/derived value - nothing in
 * this file or the mappers that read it parses a node's name or
 * description at runtime to decide a claim. See
 * docs/architecture/profession-specialization-mapping.md for the full
 * distinction and the workflow for adding a new curated entry.
 */
export type SpecializationClaimProvenance =
  "CURATED_VERIFIED";

export type SpecializationEquipmentSlotClaim = {
  provenance: SpecializationClaimProvenance;
  kind: SpecializationCapabilityKind;

  /*
   * Stable internal identity for this exact responsibility - e.g.
   * "leatherworking.equipment.leather.wrist". Two different curated
   * nodes may legitimately share the same slotKey (e.g. two different
   * Profession Tool nodes) while owning two different capabilityKeys -
   * that is precisely the case the old family+slot pairing could not
   * represent (see Section 25 of the task this shipped under). Defaults
   * to `${familyName}:${slotKey}` when not given explicitly, which is
   * exactly the implicit pairing every existing curated table already
   * relied on - so no existing entry needs to change.
   */
  capabilityKey: string;

  /*
   * Presentation-only grouping label, independent of familyName. Domain
   * truth (familyName/familyKey) never changes - "Plate" and "Shield"
   * remain genuinely different families internally - this field exists
   * purely so a curator can say "these families should render under one
   * shared heading" (e.g. Blacksmithing's Plate and Shield claims both
   * set presentationGroup: "Armor"). Defaults to familyName, i.e. "no
   * extra grouping" for every profession that doesn't opt in.
   */
  presentationGroup: string;

  familyKey: "LEATHER" | "MAIL" | "PLATE" | "CLOTH" | null;
  familyName: string;
  slotKey: string;
  slotName: string;
  isBundle: boolean;
};

export type SlotClaimOptions = {
  capabilityKey?: string;
  kind?: SpecializationCapabilityKind;
  presentationGroup?: string;
};

export function slotClaim(
  familyKey: "LEATHER" | "MAIL" | "PLATE" | "CLOTH" | null,
  familyName: string,
  slotKey: string,
  slotName: string,
  isBundle: boolean,
  options?: SlotClaimOptions
): SpecializationEquipmentSlotClaim {
  return {
    provenance: "CURATED_VERIFIED",
    kind: options?.kind ?? "EQUIPMENT_SLOT",
    capabilityKey:
      options?.capabilityKey ??
      `${familyName}:${slotKey}`,
    presentationGroup:
      options?.presentationGroup ??
      familyName,
    familyKey,
    familyName,
    slotKey,
    slotName,
    isBundle
  };
}
