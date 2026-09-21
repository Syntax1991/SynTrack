import { useMemo, useState } from "react";
import { EntityIcon } from "../../shared/components/ProfessionIcons";
import { SynTrackTooltip } from "../../shared/components/SynTrackTooltip";
import { getItemQualityColor } from "../../details/utils/professionItemQuality.helpers";
import {
  DEFAULT_PUBLIC_CRAFTER_SHARE_FILTERS,
  filterPublicCrafterShareCard,
  parseMinItemLevel
} from "../crafterShareFilter";
import { getPublicCrafterShareCraftLabel } from "../crafterSharePresentation";
import type { PublicCrafterShareCard } from "../types/crafterShare.types";
import { PublicCrafterShareFiltersControl } from "./PublicCrafterShareFiltersControl";
import { PublicCrafterShareTooltip } from "./PublicCrafterShareTooltip";

export function PublicCrafterShareBody({
  card
}: {
  card: PublicCrafterShareCard;
}) {
  const [query, setQuery] = useState(
    DEFAULT_PUBLIC_CRAFTER_SHARE_FILTERS.query
  );
  const [quality, setQuality] = useState(
    DEFAULT_PUBLIC_CRAFTER_SHARE_FILTERS.quality
  );
  const [minItemLevelInput, setMinItemLevelInput] = useState("");

  const filters = useMemo(
    () => ({
      query,
      quality,
      minItemLevel: parseMinItemLevel(minItemLevelInput)
    }),
    [query, quality, minItemLevelInput]
  );

  const filtered = filterPublicCrafterShareCard(card, filters);

  return (
    <>
      <h1>{card.battleTag ?? "Crafter"}</h1>
      <p>
        Armor, weapons, and jewelry this warband can craft. Q is the
        quality they can reach (same as Find Craft). Conc means
        concentration is needed. "Not max" means even best captured
        materials cannot hit the last quality step.
      </p>

      <PublicCrafterShareFiltersControl
        filters={filters}
        minItemLevelInput={minItemLevelInput}
        onMinItemLevelInputChange={setMinItemLevelInput}
        onQualityChange={setQuality}
        onQueryChange={setQuery}
      />

      {card.characters.length === 0 ? (
        <p className="crafter-share-empty">
          No proven crafts captured yet.
        </p>
      ) : filtered.characters.length === 0 ? (
        <p className="crafter-share-empty">
          No crafts match these filters.
        </p>
      ) : (
        filtered.characters.map((character) => (
          <section
            className="crafter-share-character"
            key={`${character.name}-${character.realm}`}
          >
            <h2>
              {character.name}
              <span>
                {character.realm} · {character.className}
              </span>
            </h2>

            {character.professions.map((profession) => (
              <div key={profession.name}>
                <h3>{profession.name}</h3>
                <ul>
                  {profession.recipes.map((recipe) => (
                    <li key={`${recipe.name}-${recipe.slotName ?? ""}`}>
                      <SynTrackTooltip
                        content={
                          <PublicCrafterShareTooltip recipe={recipe} />
                        }
                      >
                        <span className="crafter-share-recipe-name">
                          <EntityIcon
                            iconUrl={recipe.iconUrl}
                            kind="recipe"
                            name={recipe.name}
                            qualityColor={getItemQualityColor(
                              recipe.itemQuality
                            )}
                          />
                          <span
                            style={{
                              color:
                                getItemQualityColor(recipe.itemQuality) ??
                                undefined
                            }}
                          >
                            {recipe.name}
                          </span>
                        </span>
                      </SynTrackTooltip>
                      {recipe.slotName ? (
                        <span className="crafter-share-slot">
                          {recipe.slotName}
                        </span>
                      ) : null}
                      <span
                        className={`crafter-share-status is-${recipe.craftStatus.toLowerCase()}`}
                      >
                        {getPublicCrafterShareCraftLabel(recipe)}
                        {recipe.itemLevel !== null
                          ? ` · ${recipe.itemLevel}`
                          : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        ))
      )}
    </>
  );
}
