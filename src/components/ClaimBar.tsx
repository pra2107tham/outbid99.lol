"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { CATEGORIES } from "@/lib/categories";
import {
  BID_UNIT_CENTS, MIN_BID_CENTS, formatMoney, parseDollarsToCents, snapUpToBid,
} from "@/lib/money";

/**
 * Always-visible claim bar. It prices the rank in the browser from the board's
 * running totals, so typing an amount shows the position it buys with no round
 * trip. The server prices it again before anyone is charged.
 */
export function ClaimBar({ totals }: { totals: number[] }) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");

  const parsed = parseDollarsToCents(amount);
  const charge = parsed === null ? null : snapUpToBid(parsed);

  const placement = useMemo(() => {
    if (charge === null) return null;
    // A new listing has no first payment yet, so it loses every tie: it lands
    // below everything already sitting on the same number.
    let rank = 1;
    for (const total of totals) {
      if (total >= charge) rank++;
      else break;
    }
    const above = rank >= 2 ? totals[rank - 2] : null;
    return { rank, gap: above === null ? 0 : Math.max(0, above - charge) };
  }, [charge, totals]);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (url.trim()) params.set("url", url.trim());
    if (category) params.set("category", category);
    params.set("amount", String(charge ?? MIN_BID_CENTS));
    router.push(`/claim?${params.toString()}`);
  }

  return (
    <div className="sticky top-0 z-40 -mx-5 border-b border-ink bg-paper/95 px-5 backdrop-blur sm:-mx-8 sm:px-8">
      <form onSubmit={submit} className="flex flex-wrap items-end gap-x-3 gap-y-3 py-3">
        <div className="min-w-[180px] flex-[2]">
          <label
            htmlFor="claim-url"
            className="block font-mono text-[10px] uppercase tracking-[0.13em] text-ink-40"
          >
            Your URL
          </label>
          <input
            id="claim-url"
            name="url"
            type="url"
            inputMode="url"
            required
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            className="mt-1 w-full rounded-[2px] border border-rule bg-paper-2 px-2.5 py-2 text-[13px] placeholder:text-ink-40 focus:border-ink"
          />
        </div>

        <div className="min-w-[150px] flex-1">
          <label
            htmlFor="claim-category"
            className="block font-mono text-[10px] uppercase tracking-[0.13em] text-ink-40"
          >
            Category
          </label>
          <select
            id="claim-category"
            name="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1 w-full rounded-[2px] border border-rule bg-paper-2 px-2.5 py-2 text-[13px] focus:border-ink"
          >
            <option value="">Pick one</option>
            {CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="w-[120px]">
          <label
            htmlFor="claim-amount"
            className="block font-mono text-[10px] uppercase tracking-[0.13em] text-ink-40"
          >
            Amount
          </label>
          <div className="mt-1 flex items-center rounded-[2px] border border-rule bg-paper-2 focus-within:border-ink">
            <span className="pl-2.5 text-[13px] text-ink-40">$</span>
            <input
              id="claim-amount"
              name="amount"
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.99"
              className="tnum w-full bg-transparent px-1.5 py-2 text-[13px] placeholder:text-ink-40 focus:outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          className="rounded-[2px] bg-ultra px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.13em] text-paper transition-colors hover:bg-ink"
        >
          Claim rank
        </button>
      </form>

      <p className="pb-2.5 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-60">
        {placement && charge !== null ? (
          <>
            <span className="text-ink">
              {formatMoney(charge)} puts you at #{placement.rank}.
            </span>{" "}
            {placement.gap > 0
              ? `${formatMoney(placement.gap)} from #${placement.rank - 1}.`
              : "Top of the board."}
            {parsed !== null && parsed !== charge
              ? ` Rounded up to the next 99-cent bid.`
              : ""}
          </>
        ) : (
          <>Bids are whole 99-cent steps. Minimum {formatMoney(BID_UNIT_CENTS)}.</>
        )}
      </p>
    </div>
  );
}
