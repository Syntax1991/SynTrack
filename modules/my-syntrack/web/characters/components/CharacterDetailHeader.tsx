import { Link } from "react-router-dom";
import { getClassColor } from "../../../../../apps/web/src/shared/utils/classColors";
import type { CharacterWeeklyState } from "../../overview/types/overview.types";
import type { TagView } from "../../tags/types/tag.types";

type CharacterDetailHeaderProps = {
  character: CharacterWeeklyState["character"];
  tags: TagView[];
};

/*
 * Compact identity header - not another giant profile card. Region is
 * folded into realm context rather than given its own line, and
 * source/last-sync are omitted (CharacterWeeklyState doesn't carry
 * them, and they weren't proven genuinely useful here).
 *
 * Phase F2: activeSpec/guild are the two newly-available Blizzard public
 * profile facts with an obvious, low-clutter fit in this existing
 * subline/tags pattern (a familiar WoW UI convention: "Restoration
 * Shaman", then a guild line matching the tags line already here).
 * race/faction/averageItemLevel/equippedItemLevel are available on the
 * same character object but deliberately NOT rendered here - there's no
 * existing slot for them without forcing new visual clutter (see the
 * Phase F2 report).
 */
export function CharacterDetailHeader({
  character,
  tags
}: CharacterDetailHeaderProps) {
  const classLabel = character.activeSpec
    ? `${character.activeSpec} ${character.className}`
    : character.className;

  return (
    <header className="character-detail-header">
      <Link
        className="character-detail-back"
        to="/characters"
      >
        ← Characters
      </Link>

      <h1
        style={{
          color: getClassColor(
            character.className
          )
        }}
      >
        {character.name}
      </h1>

      <p className="character-detail-subline">
        {classLabel}
        {" · "}
        {character.realm}
        {" · Level "}
        {character.level}
      </p>

      {character.guild && (
        <p className="character-detail-guild">
          {character.guild.name}
        </p>
      )}

      {tags.length > 0 && (
        <p className="character-detail-tags">
          {tags
            .map((tag) => tag.name)
            .join(", ")}
        </p>
      )}
    </header>
  );
}
