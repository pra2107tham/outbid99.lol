import { store } from "./db";

export const PAGE_SIZE = 50;

/**
 * Everything the home board needs, in one place so /today and the category
 * boards can reuse the same shape.
 */
export async function getBoardPageData(page: number) {
  const db = store();
  const offset = (page - 1) * PAGE_SIZE;

  const [board, todayTop, stats, activity, categoryStats, summaries] = await Promise.all([
    db.getBoard(offset, PAGE_SIZE),
    db.getTodayBoard(3),
    db.getSiteStats(),
    db.getRecentActivity(8),
    db.getCategoryStats(),
    db.getBoardSummaries(),
  ]);

  return {
    board,
    todayTop,
    stats,
    activity,
    // Slugs that top their own category board get a badge on the main board.
    categoryLeaders: new Set(
      categoryStats.map((c) => c.leader?.slug).filter((s): s is string => Boolean(s)),
    ),
    totals: summaries.map((s) => s.total_cents),
    totalPages: Math.max(1, Math.ceil(board.total / PAGE_SIZE)),
  };
}

export function parsePage(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const n = Number.parseInt(raw ?? "1", 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}
