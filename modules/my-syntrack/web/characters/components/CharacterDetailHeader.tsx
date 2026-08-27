import { Link } from "react-router-dom";
import { getClassColor } from "../../../../../apps/web/src/shared/utils/classColors";
import type { CharacterWeeklyState } from "../../overview/types/overview.types";

type CharacterDetailHeaderProps = {
  character: CharacterWeeklyState["character"];
};

/*
 * Compact identity header - not another giant profile card. Region is
 * folded into realm context rather than given its own line, and
 * source/last-sync are omitted (CharacterWeeklyState doesn't carry
 * them, and they weren't proven genuinely useful here).
 */
export function CharacterDetailHeader({
  character
}: CharacterDetailHeaderProps) {
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
        {character.className}
        {" · "}
        {character.realm}
        {" · Level "}
        {character.level}
      </p>
    </header>
  );
}
