import { useState } from "react";
import {
  getClassColor,
  getClassInitials,
  getCraftStatusGlyph,
  getFamilyGlyph
} from "./professionIcons.helpers";

/*
 * Real WoW icons: an item's iconUrl (resolved from its craftedItemId via
 * Blizzard's Item Media API) and a specialization node's iconUrl
 * (resolved from its spellId via Blizzard's Spell Media API) are
 * resolved and cached server-side (see
 * modules/professions/api/icons/profession-icon-resolution.service.ts)
 * and arrive here as a plain URL or null - never a name-derived guess.
 * EntityIcon renders that URL directly, and falls back to the neutral
 * placeholder both when SynTrack has no iconUrl yet AND when the image
 * itself fails to load (a dead/expired URL should never render as a
 * broken-image box).
 */
export function EntityIcon({
  kind,
  iconUrl,
  name,
  qualityColor = null
}: {
  kind: "recipe" | "specialization";
  iconUrl: string | null;
  name: string;
  qualityColor?: string | null;
}) {
  const [
    hasLoadError,
    setHasLoadError
  ] = useState(false);

  if (
    !iconUrl ||
    hasLoadError
  ) {
    return (
      <FallbackEntityIcon
        kind={kind}
      />
    );
  }

  return (
    <img
      alt=""
      className={
        `syntrack-icon syntrack-icon-entity ${kind}`
      }
      loading="lazy"
      onError={
        () =>
          setHasLoadError(true)
      }
      src={iconUrl}
      style={
        qualityColor
          ? {
              borderColor:
                qualityColor
            }
          : undefined
      }
      title={name}
    />
  );
}

export function ClassIcon({
  className
}: {
  className: string;
}) {
  return (
    <span
      className="syntrack-icon syntrack-icon-class"
      style={
        {
          "--syntrack-icon-color":
            getClassColor(
              className
            )
        } as never
      }
      title={className}
    >
      {
        getClassInitials(
          className
        )
      }
    </span>
  );
}

export function FamilyIcon({
  familyName
}: {
  familyName: string;
}) {
  return (
    <span
      className="syntrack-icon syntrack-icon-family"
      title={familyName}
    >
      {
        getFamilyGlyph(
          familyName
        )
      }
    </span>
  );
}

/*
 * The neutral placeholder shown identically for every entity of that
 * kind, used only when EntityIcon has no real iconUrl to render (or that
 * URL fails to load). Never varies by name - true fallback, not a
 * guessed icon.
 */
export function FallbackEntityIcon({
  kind
}: {
  kind: "recipe" | "specialization";
}) {
  return (
    <span
      className={
        `syntrack-icon syntrack-icon-fallback ${kind}`
      }
      title={
        kind === "recipe"
          ? "No verified item icon captured yet"
          : "No verified node icon captured yet"
      }
    >
      {kind === "recipe" ? "◆" : "✦"}
    </span>
  );
}

export function CraftStatusIcon({
  status
}: {
  status: string;
}) {
  return (
    <span
      className={
        `syntrack-icon syntrack-icon-craft-status ${status.toLowerCase()}`
      }
    >
      {
        getCraftStatusGlyph(
          status
        )
      }
    </span>
  );
}
