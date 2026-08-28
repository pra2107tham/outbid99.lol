"use client";

import { useMemo, useState } from "react";

import { SplitFlap } from "./SplitFlap";
import { Favicon } from "./Bits";
import { CATEGORIES } from "@/lib/categories";
import {
  BID_UNIT_CENTS, MIN_BID_CENTS, bids, formatMoney, formatMoneyBare,
  parseDollarsToCents, snapUpToBid,
} from "@/lib/money";

interface Scraped {
  ok: boolean;
  url: string;
  domain: string;
  title: string;
  description: string;
  faviconUrl: string | null;
  screenshotUrl: string | null;
  error?: string;
}

export interface ClaimFlowProps {
  totals: number[];
  initialUrl: string;
  initialCategory: string;
  initialAmountCents: number;
}

const field =
  "mt-1 w-full rounded-[2px] border border-rule bg-paper-2 px-3 py-2.5 text-[14px] placeholder:text-ink-40 focus:border-ink";
const label = "block font-mono text-[10px] uppercase tracking-[0.13em] text-ink-40";

export function ClaimFlow({
  totals,
  initialUrl,
  initialCategory,
  initialAmountCents,
}: ClaimFlowProps) {
  const [url, setUrl] = useState(initialUrl);
  const [category, setCategory] = useState(initialCategory);
  const [amount, setAmount] = useState(
    initialAmountCents ? (initialAmountCents / 100).toFixed(2) : "",
  );
  const [email, setEmail] = useState("");

  const [scraped, setScraped] = useState<Scraped | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [looking, setLooking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsed = parseDollarsToCents(amount);
  const charge = parsed === null ? MIN_BID_CENTS : snapUpToBid(parsed);
  const rounded = parsed !== null && parsed !== charge;

  const placement = useMemo(() => {
    let rank = 1;
    for (const total of totals) {
      if (total >= charge) rank++;
      else break;
    }
    const above = rank >= 2 ? totals[rank - 2] : null;
    return { rank, gap: above === null ? 0 : Math.max(0, above - charge) };
  }, [charge, totals]);

  async function lookup() {
    if (!url.trim()) {
      setError("Put in a URL first.");
      return;
    }
    setLooking(true);
    setError(null);
    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = (await res.json()) as Scraped;
      setScraped(data);
      setTitle(data.title || "");
      setDescription(data.description || "");
      if (data.url) setUrl(data.url);
      // A failed lookup is never fatal. The fields become editable and the
      // payment carries on.
      if (!data.ok && data.error) setError(data.error);
    } catch {
      setScraped({
        ok: false, url, domain: "", title: "", description: "",
        faviconUrl: null, screenshotUrl: null, error: "Lookup failed.",
      });
      setError("Could not reach that URL. Fill the fields in yourself.");
    } finally {
      setLooking(false);
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!url.trim()) return setError("Put in a URL.");
    if (!category) return setError("Pick a category.");
    if (charge < MIN_BID_CENTS) return setError("The minimum is one 99-cent bid.");

    setSubmitting(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          url: url.trim(),
          category,
          amountCents: charge,
          email: email.trim() || null,
          title,
          description,
          faviconUrl: scraped?.faviconUrl ?? null,
          screenshotUrl: scraped?.screenshotUrl ?? null,
        }),
      });
      const data = (await res.json()) as { ok: boolean; checkoutUrl?: string; error?: string };
      if (!data.ok || !data.checkoutUrl) {
        setError(data.error ?? "Could not start checkout.");
        setSubmitting(false);
        return;
      }
      setClaimed(true);
      window.location.href = data.checkoutUrl;
    } catch {
      setError("Could not start checkout. Try again.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-x-12 gap-y-10 lg:grid-cols-[1fr_360px]">
      <div className="min-w-0 max-w-[62ch]">
        <div>
          <label className={label} htmlFor="url">
            The URL you are listing
          </label>
          <div className="mt-1 flex gap-2">
            <input
              id="url"
              type="url"
              inputMode="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className={`${field} mt-0`}
            />
            <button
              type="button"
              onClick={lookup}
              disabled={looking}
              className="shrink-0 rounded-[2px] border border-ink px-4 font-mono text-[11px] uppercase tracking-[0.13em] transition-colors hover:bg-ink hover:text-paper disabled:opacity-50"
            >
              {looking ? "Reading" : "Read it"}
            </button>
          </div>
          <p className="mt-2 text-[12px] leading-relaxed text-ink-60">
            We read the page for a title, description and icon. If that fails you can type
            them in — it never blocks the payment.
          </p>
        </div>

        {scraped ? (
          <div className="mt-8 border-t-2 border-ink pt-4">
            <div className="flex items-center gap-2.5">
              <Favicon src={scraped.faviconUrl} domain={scraped.domain || "?"} size={24} />
              <p className="font-mono text-[10px] uppercase tracking-[0.13em] text-ink-40">
                {scraped.ok ? "Read from the page" : "Could not read the page — fill these in"}
              </p>
            </div>

            <div className="mt-4">
              <label className={label} htmlFor="title">Title</label>
              <input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={90}
                className={field}
                placeholder="What it is called"
              />
            </div>

            <div className="mt-4">
              <label className={label} htmlFor="description">Description</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={240}
                rows={3}
                className={`${field} resize-y`}
                placeholder="One flat sentence about what it does"
              />
              <p className="mt-1 text-right font-mono text-[10px] text-ink-40">
                {description.length}/240
              </p>
            </div>
          </div>
        ) : null}

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="category">Category</label>
            <select
              id="category"
              required
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={field}
            >
              <option value="">Pick one</option>
              {CATEGORIES.map((c) => (
                <option key={c.slug} value={c.slug}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={label} htmlFor="amount">Amount in dollars</label>
            <input
              id="amount"
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.99"
              className={`${field} tnum`}
            />
          </div>
        </div>

        <div className="mt-4">
          <label className={label} htmlFor="email">
            Email — this is what owns the listing
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={field}
          />
          <p className="mt-2 text-[12px] leading-relaxed text-ink-60">
            There are no accounts. Whatever email is on the payment owns the listing. It is
            never shown on the board.
          </p>
        </div>

        {error ? (
          <p
            role="alert"
            className="mt-6 border-l-2 border-signal pl-3 text-[13px] leading-relaxed text-ink"
          >
            {error}
          </p>
        ) : null}
      </div>

      <aside className="min-w-0 lg:sticky lg:top-6 lg:self-start">
        <div className="border-t-2 border-ink pt-4">
          <p className={label}>You would be</p>
          <div className="mt-3">
            <SplitFlap
              value={`#${placement.rank}`}
              className="display text-[64px]"
              label={`Rank ${placement.rank}`}
            />
          </div>

          <dl className="mt-6 space-y-4">
            <div className="flex items-baseline justify-between gap-4">
              <dt className="font-mono text-[10px] uppercase tracking-[0.13em] text-ink-40">
                You pay
              </dt>
              <dd className="display text-[26px] leading-none text-ultra">
                {formatMoney(charge)}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <dt className="font-mono text-[10px] uppercase tracking-[0.13em] text-ink-40">
                That is
              </dt>
              <dd className="tnum text-[13px]">
                {bids(charge)} bid{bids(charge) === 1 ? "" : "s"} at{" "}
                {formatMoney(BID_UNIT_CENTS)}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <dt className="font-mono text-[10px] uppercase tracking-[0.13em] text-ink-40">
                Gap to #{Math.max(1, placement.rank - 1)}
              </dt>
              <dd className="tnum text-[13px]">
                {placement.rank === 1 ? "Top of the board" : formatMoney(placement.gap)}
              </dd>
            </div>
          </dl>

          {rounded ? (
            <p className="mt-4 text-[12px] leading-relaxed text-ink-60">
              Rounded up from ${formatMoneyBare(parsed ?? 0)} to the next whole 99-cent bid.
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="mt-6 w-full rounded-[2px] bg-ultra px-4 py-3 font-mono text-[11px] uppercase tracking-[0.13em] text-paper transition-colors hover:bg-ink disabled:opacity-60"
          >
            {claimed ? "Rank claimed" : submitting ? "Claiming rank" : "Claim rank"}
          </button>

          <p className="mt-3 text-[12px] leading-relaxed text-ink-60">
            Payment is final once the listing is live. You hold the position until somebody
            pays more than you.
          </p>
        </div>
      </aside>
    </form>
  );
}
