import { lookup } from "node:dns/promises";
import net from "node:net";

import { cleanText, domainOf, safeHttpUrl } from "./sanitize";

export interface ScrapeResult {
  ok: boolean;
  url: string;
  domain: string;
  title: string;
  description: string;
  faviconUrl: string | null;
  screenshotUrl: string | null;
  /** Set when the fetch failed. The claim flow shows editable fields instead. */
  error?: string;
}

const TIMEOUT_MS = 6000;
const MAX_BYTES = 512 * 1024;
const USER_AGENT = "outbid99-bot/1.0 (+https://outbid99.lol/rules)";

/**
 * Block anything that resolves inside the network the server is sitting on.
 * Without this, the scrape endpoint is an SSRF probe: anyone could point it at
 * a metadata endpoint or an internal admin page and read the title back out of
 * the claim preview.
 */
function isPrivateAddress(ip: string): boolean {
  const version = net.isIP(ip);
  if (version === 4) {
    const [a, b] = ip.split(".").map(Number);
    if (a === 10 || a === 127 || a === 0) return true;
    if (a === 169 && b === 254) return true;           // link-local, incl. cloud metadata
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true; // carrier-grade NAT
    return false;
  }
  if (version === 6) {
    const normalised = ip.toLowerCase();
    if (normalised === "::1" || normalised === "::") return true;
    if (normalised.startsWith("fe80")) return true;                 // link-local
    if (/^f[cd]/.test(normalised)) return true;                     // unique local
    // IPv4-mapped addresses get the v4 rules applied to the mapped part.
    const mapped = normalised.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isPrivateAddress(mapped[1]!);
    return false;
  }
  return true;
}

const ALLOW_PRIVATE = process.env.OUTBID99_ALLOW_PRIVATE_SCRAPE === "1";

async function resolvesToPublicAddress(hostname: string): Promise<boolean> {
  if (ALLOW_PRIVATE) return true;
  try {
    const results = await lookup(hostname, { all: true });
    if (!results.length) return false;
    return results.every((r) => !isPrivateAddress(r.address));
  } catch {
    return false;
  }
}

/** Last two labels, so example.com and www.example.com match but evil.com does not. */
function registrableDomain(hostname: string): string {
  const parts = hostname.toLowerCase().replace(/^www\./, "").split(".");
  return parts.length <= 2 ? parts.join(".") : parts.slice(-2).join(".");
}

function attr(tag: string, name: string): string | null {
  const match = tag.match(
    new RegExp(`${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"),
  );
  if (!match) return null;
  return match[2] ?? match[3] ?? match[4] ?? null;
}

function findMeta(html: string, keys: string[]): string | null {
  const tags = html.match(/<meta\b[^>]*>/gi) ?? [];
  for (const tag of tags) {
    const key = (attr(tag, "property") ?? attr(tag, "name") ?? "").toLowerCase();
    if (keys.includes(key)) {
      const content = attr(tag, "content");
      if (content && content.trim()) return content;
    }
  }
  return null;
}

function findIcon(html: string, base: URL): string | null {
  const links = html.match(/<link\b[^>]*>/gi) ?? [];
  let best: string | null = null;
  for (const tag of links) {
    const rel = (attr(tag, "rel") ?? "").toLowerCase();
    if (!rel.includes("icon")) continue;
    const href = attr(tag, "href");
    if (!href) continue;
    try {
      const resolved = new URL(href, base).toString();
      // Prefer an explicit apple-touch-icon: they are reliably square and large.
      if (rel.includes("apple-touch")) return resolved;
      best = best ?? resolved;
    } catch {
      // Unresolvable href, keep looking.
    }
  }
  return best;
}

/**
 * Fetch a listing's page and pull out what the board needs. Never throws: a
 * failure comes back as ok:false so the claim flow can fall back to editable
 * fields rather than blocking a payment on somebody else's server being down.
 */
export async function scrapeUrl(input: string): Promise<ScrapeResult> {
  const safe = safeHttpUrl(input);
  const fallbackDomain = safe ? domainOf(safe) : "";

  const failure = (error: string): ScrapeResult => ({
    ok: false,
    url: safe ?? input,
    domain: fallbackDomain,
    title: fallbackDomain,
    description: "",
    faviconUrl: null,
    screenshotUrl: null,
    error,
  });

  if (!safe) return failure("That is not a valid http or https URL.");

  const requested = new URL(safe);

  if (!(await resolvesToPublicAddress(requested.hostname))) {
    return failure("That host is not reachable from the public internet.");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(requested, {
      redirect: "follow",
      signal: controller.signal,
      headers: { "user-agent": USER_AGENT, accept: "text/html,*/*" },
    });

    if (!response.ok) {
      return failure(`That URL returned ${response.status}.`);
    }

    // A listing has to point at the domain it claims. Following a redirect to
    // somewhere else entirely is how a cheap listing becomes a link to
    // something we never saw.
    const finalUrl = new URL(response.url || requested.toString());
    if (registrableDomain(finalUrl.hostname) !== registrableDomain(requested.hostname)) {
      return failure(
        `That URL redirects to ${finalUrl.hostname}, which is a different domain.`,
      );
    }

    if (
      finalUrl.hostname !== requested.hostname &&
      !(await resolvesToPublicAddress(finalUrl.hostname))
    ) {
      return failure("That URL redirects somewhere not publicly reachable.");
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (contentType && !contentType.includes("html")) {
      return failure("That URL does not serve an HTML page.");
    }

    // Cap what we read: a listing page should not be able to exhaust memory.
    const reader = response.body?.getReader();
    let html = "";
    if (reader) {
      const decoder = new TextDecoder();
      let received = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        received += value.byteLength;
        html += decoder.decode(value, { stream: true });
        if (received >= MAX_BYTES) {
          await reader.cancel();
          break;
        }
      }
    } else {
      html = (await response.text()).slice(0, MAX_BYTES);
    }

    const domain = domainOf(finalUrl.toString());
    const rawTitle =
      findMeta(html, ["og:title", "twitter:title"]) ??
      html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ??
      domain;

    const rawDescription =
      findMeta(html, ["description", "og:description", "twitter:description"]) ?? "";

    const ogImage = findMeta(html, ["og:image", "og:image:url", "twitter:image"]);
    const icon = findIcon(html, finalUrl);

    return {
      ok: true,
      url: finalUrl.toString(),
      domain,
      title: cleanText(rawTitle, 90) || domain,
      description: cleanText(rawDescription, 240),
      faviconUrl: icon ? safeHttpUrl(icon) : null,
      screenshotUrl: ogImage ? safeHttpUrl(new URL(ogImage, finalUrl).toString()) : null,
    };
  } catch (error) {
    const aborted = error instanceof Error && error.name === "AbortError";
    return failure(aborted ? "That URL took too long to respond." : "Could not reach that URL.");
  } finally {
    clearTimeout(timer);
  }
}
