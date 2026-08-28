/**
 * Contract checks for the storage layer: the properties the board depends on
 * and that a payment provider retry can quietly break.
 */
import { LocalStore } from "../src/lib/db/local";
import { BID_UNIT_CENTS, outbidPrice, snapUpToBid, isValidBid } from "../src/lib/money";
import { previewPlacement } from "../src/lib/board";

let failed = 0;
function check(name: string, condition: boolean, detail = "") {
  if (condition) console.log(`PASS  ${name}`);
  else { failed++; console.log(`FAIL  ${name} ${detail}`); }
}

async function main() {
const db = new LocalStore();

const seedBoard = await db.getBoard(0, 5);
const leader = seedBoard.rows[0]!;
check("board is sorted by total desc", seedBoard.rows.every((r, i, a) => i === 0 || a[i - 1]!.total_cents >= r.total_cents));
check("ranks start at 1", leader.rank === 1);

const before = leader.total_cents;

// A provider retry replays the same payment id. It must not move the board.
await db.creditPayment({ productId: leader.id, amountCents: BID_UNIT_CENTS, providerPaymentId: "retry-me", email: null });
const afterFirst = (await db.getProductBySlug(leader.slug))!.total_cents;
await db.creditPayment({ productId: leader.id, amountCents: BID_UNIT_CENTS, providerPaymentId: "retry-me", email: null });
const afterRetry = (await db.getProductBySlug(leader.slug))!.total_cents;

check("first credit applies", afterFirst === before + BID_UNIT_CENTS, `${before} -> ${afterFirst}`);
check("replayed payment id is ignored", afterRetry === afterFirst, `${afterFirst} -> ${afterRetry}`);

// Money rules.
check("outbid price is one bid more", outbidPrice(99 * 5) === 99 * 6);
check("snap rounds up to a whole bid", snapUpToBid(1200) === 1287);
check("snap floors at one bid", snapUpToBid(1) === 99);
check("non-multiples are invalid bids", !isValidBid(100) && isValidBid(99) && !isValidBid(0));

// A new listing loses every tie, because it has no earlier payment.
const totals = [{ total_cents: 500, slug: "a", title: "A", first_paid_at: "2020-01-01T00:00:00Z" }];
check("tie goes to the incumbent", previewPlacement(totals, 500).rank === 2);
check("beating the incumbent takes #1", previewPlacement(totals, 501).rank === 1);

// Rank is a head count, never stored.
const product = (await db.getProductBySlug(leader.slug))!;
check("rank of leader is 1", (await db.getRankOf(product)) === 1);

const neighbours = await db.getNeighbours(product);
check("leader has nothing above it", neighbours.above === null);
check("leader has something below it", neighbours.below !== null);

  if (failed) { console.error(`\n${failed} failing check(s)`); process.exit(1); }
  console.log("\nall store checks passed");
}

main().catch((error) => { console.error(error); process.exit(1); });
