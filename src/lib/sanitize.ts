/**
 * Everything on a product page originates from somebody else's HTML, so it is
 * all treated as hostile text: entities decoded once, tags and control
 * characters stripped, length capped. React escapes on render, but this keeps
 * junk out of the database, out of <title>, and out of OG images too.
 */

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
  mdash: "—", ndash: "–", hellip: "…", rsquo: "’",
  lsquo: "‘", ldquo: "“", rdquo: "”", trade: "™",
  reg: "®", copy: "©",
};

function decodeEntities(input: string): string {
  return input.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (_match, body: string) => {
    if (body[0] === "#") {
      const code =
        body[1] === "x" || body[1] === "X"
          ? Number.parseInt(body.slice(2), 16)
          : Number.parseInt(body.slice(1), 10);
      if (!Number.isFinite(code) || code < 32 || code > 0x10ffff) return "";
      try {
        return String.fromCodePoint(code);
      } catch {
        return "";
      }
    }
    return NAMED_ENTITIES[body.toLowerCase()] ?? "";
  });
}

/**
 * Control characters, bidi overrides and zero-width joiners: invisible in a
 * rendered row, and all capable of making a title read as something other
 * than what it is.
 */
const CONTROL_CHARS = new RegExp(
  "[" +
    "\u0000-\u0008\u000B\u000C\u000E-\u001F" +
    "\u007F-\u009F" +
    "\u200B-\u200F\u2028\u2029\u202A-\u202E" +
    "\u2066-\u2069\uFEFF" +
  "]",
  "g",
);

const COMBINING_MARKS = new RegExp("[\u0300-\u036F]", "g");

/** Strip tags, decode entities, collapse whitespace, cap length. */
export function cleanText(input: string | null | undefined, maxLength = 300): string {
  if (!input) return "";
  let text = String(input);
  // Drop whole script/style bodies before the generic tag strip, so their
  // contents never survive as visible text.
  text = text.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, " ");
  text = text.replace(/<[^>]*>/g, " ");
  text = decodeEntities(text);
  // A second strip: an entity-encoded tag only looks like one after decoding.
  text = text.replace(/<[^>]*>/g, " ");
  text = text.replace(CONTROL_CHARS, " ");
  text = text.replace(/\s+/g, " ").trim();
  if (text.length > maxLength) text = `${text.slice(0, maxLength - 1).trimEnd()}…`;
  return text;
}

/** Only http(s) survives, so a javascript: or data: URL can never be rendered. */
export function safeHttpUrl(input: string | null | undefined): string | null {
  if (!input) return null;
  try {
    const url = new URL(String(input).trim());
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (!url.hostname.includes(".")) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function domainOf(input: string): string {
  try {
    return new URL(input).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

const RESERVED = new Set([
  "about", "rules", "terms", "privacy", "claim", "today", "categories",
  "category", "product", "go", "api", "admin", "sitemap", "robots", "new",
]);

/** URL-safe slug derived from the domain, with reserved paths pushed aside. */
export function slugify(input: string, maxLength = 60): string {
  const base = input
    .toLowerCase()
    .normalize("NFKD")
    .replace(COMBINING_MARKS, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLength)
    .replace(/-+$/g, "");
  if (!base) return "listing";
  return RESERVED.has(base) ? `${base}-listing` : base;
}
