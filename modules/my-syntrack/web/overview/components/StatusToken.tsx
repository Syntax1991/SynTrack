import type { CellToken } from "../utils/overviewCellFormatting";

export function StatusToken({
  token
}: {
  token: CellToken;
}) {
  return (
    <span
      className={`overview-token overview-token-${token.tone}`}
      title={token.title}
    >
      {token.symbol}
    </span>
  );
}
