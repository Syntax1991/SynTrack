/*
 * Live acceptance must set this from a real embellished item's
 * uniqueCategoryId (C_Item.GetItemUniquenessByID). Until then the
 * deriver cannot prove "0 embellishments" and must stay UNKNOWN.
 */
export const EMBELLISHMENT_UNIQUE_CATEGORY_ID: number | null = null;
