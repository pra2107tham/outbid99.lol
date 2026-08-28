const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** "12 minutes ago" — deadpan, no "just now" cuteness. */
export function timeAgo(iso: string | null | undefined, now = Date.now()): string {
  if (!iso) return "never";
  const delta = now - Date.parse(iso);
  if (!Number.isFinite(delta)) return "never";
  if (delta < MINUTE) return "less than a minute ago";
  if (delta < HOUR) {
    const m = Math.floor(delta / MINUTE);
    return `${m} minute${m === 1 ? "" : "s"} ago`;
  }
  if (delta < DAY) {
    const h = Math.floor(delta / HOUR);
    return `${h} hour${h === 1 ? "" : "s"} ago`;
  }
  const d = Math.floor(delta / DAY);
  return `${d} day${d === 1 ? "" : "s"} ago`;
}

/** Compact column form for dense rows: "4h", "12d". */
export function shortAge(iso: string | null | undefined, now = Date.now()): string {
  if (!iso) return "—";
  const delta = now - Date.parse(iso);
  if (!Number.isFinite(delta) || delta < 0) return "—";
  if (delta < HOUR) return `${Math.max(1, Math.floor(delta / MINUTE))}m`;
  if (delta < DAY) return `${Math.floor(delta / HOUR)}h`;
  return `${Math.floor(delta / DAY)}d`;
}

export function hoursSince(iso: string | null | undefined, now = Date.now()): number {
  if (!iso) return 0;
  return Math.max(0, Math.floor((now - Date.parse(iso)) / HOUR));
}

const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });
const plain = new Intl.NumberFormat("en-US");

export function formatCount(n: number): string {
  return n >= 10_000 ? compact.format(n) : plain.format(n);
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
}
