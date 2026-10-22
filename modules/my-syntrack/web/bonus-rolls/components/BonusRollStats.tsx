import type { BonusRoll } from "../types/bonusRoll.types";

/* Planned / rolled / target hits, and how often a roll with a target paid off. */
export function BonusRollStats({ rolls }: { rolls: BonusRoll[] }) {
  const planned = rolls.filter((roll) => roll.status === "PLANNED").length;
  const rolled = rolls.filter((roll) => roll.status === "ROLLED");
  const targetsHit = rolled.filter((roll) => roll.gotTarget).length;
  const rolledWithTarget = rolled.filter((roll) => roll.targetItem !== null).length;
  const hitRate = rolledWithTarget === 0 ? null : Math.round((targetsHit / rolledWithTarget) * 100);

  const tiles = [
    { label: "Planned", value: String(planned) },
    { label: "Rolled", value: String(rolled.length) },
    { label: "Targets received", value: String(targetsHit) },
    { label: "Target hit rate", value: hitRate === null ? "–" : `${hitRate}%` }
  ];

  return (
    <dl className="bonus-roll-stats">
      {tiles.map((tile) => (
        <div className="bonus-roll-stat" key={tile.label}>
          <dt>{tile.label}</dt>
          <dd>{tile.value}</dd>
        </div>
      ))}
    </dl>
  );
}
