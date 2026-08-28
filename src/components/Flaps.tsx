import { SplitFlap } from "./SplitFlap";
import { formatMoneyBare } from "@/lib/money";

/** The rank numeral. The largest type on any board, and the only thing that moves. */
export function RankFlap({
  rank,
  baseDelay = 0,
  className = "text-[34px]",
}: {
  rank: number;
  baseDelay?: number;
  className?: string;
}) {
  return (
    <SplitFlap
      value={String(rank)}
      baseDelay={baseDelay}
      className={`display ${className}`}
      label={`Rank ${rank}`}
    />
  );
}

/** A money amount rendered as flaps. Reserved for the hero rows. */
export function MoneyFlap({
  cents,
  baseDelay = 0,
  className = "text-[28px]",
}: {
  cents: number;
  baseDelay?: number;
  className?: string;
}) {
  return (
    <SplitFlap
      value={`$${formatMoneyBare(cents)}`}
      baseDelay={baseDelay}
      variant="light"
      className={`display text-ultra ${className}`}
      label={`$${formatMoneyBare(cents)} paid`}
    />
  );
}
