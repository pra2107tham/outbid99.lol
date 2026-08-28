/**
 * outbid99 unit of account.
 *
 * Every payment on the board is a whole number of 99-cent bids. That keeps the
 * arithmetic closed: a total is a multiple of 99c, and the price to outbid it
 * is that total plus one more 99c bid, which is also a multiple of 99c. No
 * rounding drift, and every number on the board ends in a 99c step.
 */
export const BID_UNIT_CENTS = 99;

/** Smallest listing anyone can buy: one bid. */
export const MIN_BID_CENTS = BID_UNIT_CENTS;

/** Number of 99c bids represented by a cent amount. */
export function bids(cents: number): number {
  return Math.round(cents / BID_UNIT_CENTS);
}

/** Cent value of a whole number of bids. */
export function bidsToCents(n: number): number {
  return Math.max(1, Math.floor(n)) * BID_UNIT_CENTS;
}

/** True when an amount is a positive whole number of 99c bids. */
export function isValidBid(cents: number): boolean {
  return (
    Number.isInteger(cents) && cents >= MIN_BID_CENTS && cents % BID_UNIT_CENTS === 0
  );
}

/**
 * Snap an arbitrary cent amount up to the next whole bid. Snapping up rather
 * than down means a buyer never silently gets less than they typed.
 */
export function snapUpToBid(cents: number): number {
  if (!Number.isFinite(cents) || cents <= MIN_BID_CENTS) return MIN_BID_CENTS;
  return Math.ceil(cents / BID_UNIT_CENTS) * BID_UNIT_CENTS;
}

/** The price that takes a rank held at `totalCents`: one bid more. */
export function outbidPrice(totalCents: number): number {
  return snapUpToBid(totalCents + BID_UNIT_CENTS);
}

/** Price to open a rank nobody holds. */
export function openingPrice(): number {
  return MIN_BID_CENTS;
}

/** Parse a user-typed dollar string into cents. Returns null when unparseable. */
export function parseDollarsToCents(input: string): number | null {
  const cleaned = String(input).replace(/[^0-9.]/g, "");
  if (!cleaned) return null;
  const value = Number(cleaned);
  if (!Number.isFinite(value) || value <= 0) return null;
  return Math.round(value * 100);
}

const withCents = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** "$6.93" — always two decimals, because every amount has meaningful cents. */
export function formatMoney(cents: number): string {
  return withCents.format((cents ?? 0) / 100);
}

/** "6.93" — for split-flap tiles that render their own dollar sign. */
export function formatMoneyBare(cents: number): string {
  return formatMoney(cents).replace("$", "");
}
