import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AdminPanel } from "@/components/AdminPanel";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * Removal console. The page only exists when ADMIN_SECRET is configured, and
 * the secret is typed in here — it is never embedded in the page.
 */
export default function AdminPage() {
  if (!process.env.ADMIN_SECRET) notFound();

  return (
    <div className="mx-auto max-w-[560px] px-5 py-14 sm:px-8">
      <h1 className="display text-[38px] leading-none">Remove a listing</h1>
      <p className="mt-4 text-[14px] leading-relaxed text-ink-60">
        Takes a listing off every board. Money already paid is not refunded — that is
        what the terms say and it is what happens here.
      </p>
      <div className="mt-8">
        <AdminPanel />
      </div>
    </div>
  );
}
