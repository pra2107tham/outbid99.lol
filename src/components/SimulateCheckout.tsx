"use client";

import { useState } from "react";

import { formatMoney } from "@/lib/money";

export function SimulateCheckout({
  slug,
  amountCents,
}: {
  slug: string;
  amountCents: number;
}) {
  const [state, setState] = useState<"idle" | "working" | "error">("idle");

  async function confirm() {
    setState("working");
    try {
      const res = await fetch("/api/dev/complete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug, amountCents }),
      });
      const data = (await res.json()) as { ok: boolean; slug?: string };
      if (!data.ok) {
        setState("error");
        return;
      }
      window.location.href = `/product/${data.slug ?? slug}?claimed=1`;
    } catch {
      setState("error");
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={confirm}
        disabled={state === "working"}
        className="w-full rounded-[2px] bg-ultra px-4 py-3 font-mono text-[11px] uppercase tracking-[0.13em] text-paper transition-colors hover:bg-ink disabled:opacity-60"
      >
        {state === "working" ? "Claiming rank" : `Pay ${formatMoney(amountCents)}`}
      </button>
      {state === "error" ? (
        <p role="alert" className="mt-3 border-l-2 border-signal pl-3 text-[13px]">
          That did not go through. Check the server logs.
        </p>
      ) : null}
    </div>
  );
}
