import type { CellToken } from "../types/cellToken";

/*
 * Shared across Overview, Characters, and Weeklies: a single symbol +
 * tone + tooltip replaces repeated pill text, so ready/attention/
 * progress/unknown/not-tracked stay visually distinct everywhere.
 */
export function StatusToken({
  token
}: {
  token: CellToken;
}) {
  return (
    <span
      className={`matrix-token matrix-token-${token.tone}`}
      title={token.title}
    >
      {token.symbol}
    </span>
  );
}
