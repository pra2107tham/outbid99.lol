import { NextResponse } from "next/server";

import { store } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Single poll target for the live counter and the activity list. */
export async function GET() {
  try {
    const db = store();
    const [stats, activity] = await Promise.all([
      db.getSiteStats(),
      db.getRecentActivity(8),
    ]);
    return NextResponse.json(
      { stats, activity },
      { headers: { "cache-control": "no-store" } },
    );
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
}
