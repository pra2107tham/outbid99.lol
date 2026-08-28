import { readFile } from "node:fs/promises";
import path from "node:path";

let cached: { anton: Buffer; mono: Buffer } | null = null;

/**
 * Fonts for the OG images, read from disk rather than fetched. The
 * `new URL(..., import.meta.url)` pattern resolves to a bundled asset path that
 * fetch cannot parse during prerender, and a runtime fetch to Google would put
 * a third party in the path of every social card. next.config.ts traces these
 * files into the serverless bundle.
 */
export async function ogFonts(): Promise<{ anton: Buffer; mono: Buffer }> {
  if (cached) return cached;
  const dir = path.join(process.cwd(), "src", "assets");
  const [anton, mono] = await Promise.all([
    readFile(path.join(dir, "Anton-Regular.ttf")),
    readFile(path.join(dir, "PlexMono-SemiBold.ttf")),
  ]);
  cached = { anton, mono };
  return cached;
}
