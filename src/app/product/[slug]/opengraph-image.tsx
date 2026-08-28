import { ImageResponse } from "next/og";

import { ogFonts } from "@/lib/og-fonts";

import { categoryName } from "@/lib/categories";
import { store } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { cleanText } from "@/lib/sanitize";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "outbid99 listing";

const PAPER = "#E9EEE7";
const INK = "#0E1C15";
const ULTRA = "#2B3BD1";
const RULE = "#C6CDC3";

/** A single split-flap tile, seam and all. */
function Flap({ char, size: fontSize }: { char: string; size: number }) {
  return (
    <div
      style={{
        display: "flex",
        position: "relative",
        width: fontSize * 0.74,
        height: fontSize * 1.04,
        background: INK,
        color: PAPER,
        borderRadius: 2,
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Anton",
        fontSize,
        lineHeight: 1,
      }}
    >
      {char}
      <div
        style={{
          display: "flex",
          position: "absolute",
          left: 0,
          right: 0,
          top: "50%",
          height: 2,
          background: "rgba(233,238,231,0.24)",
        }}
      />
    </div>
  );
}

export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { anton, mono } = await ogFonts();

  const db = store();
  const product = await db.getProductBySlug(slug);
  const rank = product ? await db.getRankOf(product) : 0;

  const title = cleanText(product?.title ?? "Not listed", 46) || "Not listed";
  const amount = formatMoney(product?.total_cents ?? 0);
  const rankChars = [...String(rank || 0)];
  const rankSize = rankChars.length > 2 ? 190 : 250;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          background: PAPER,
          color: INK,
          padding: 56,
          fontFamily: "PlexMono",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", fontFamily: "Anton", fontSize: 34, letterSpacing: 1 }}>
            OUTBID99
          </div>
          <div style={{ display: "flex", fontSize: 17, letterSpacing: 3, color: "#55625B" }}>
            PAID PLACEMENT
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flex: 1,
            alignItems: "center",
            gap: 48,
            marginTop: 28,
          }}
        >
          <div style={{ display: "flex", gap: 8 }}>
            {rankChars.map((char, i) => (
              <Flap key={i} char={char} size={rankSize} />
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <div
              style={{
                display: "flex",
                fontFamily: "Anton",
                fontSize: title.length > 24 ? 62 : 82,
                lineHeight: 1.02,
                textTransform: "uppercase",
              }}
            >
              {title}
            </div>
            <div style={{ display: "flex", fontSize: 22, color: "#55625B", marginTop: 18 }}>
              {product ? categoryName(product.category_slug) : "outbid99.lol"}
            </div>
            <div
              style={{
                display: "flex",
                fontFamily: "Anton",
                fontSize: 76,
                color: ULTRA,
                marginTop: 14,
              }}
            >
              {amount}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", height: 1, background: RULE, marginTop: 20 }} />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 18,
            fontSize: 19,
            letterSpacing: 1.5,
            color: "#55625B",
          }}
        >
          <div style={{ display: "flex" }}>outbid99.lol</div>
          <div style={{ display: "flex" }}>RANK IS LIFETIME DOLLARS PAID</div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Anton", data: anton, style: "normal", weight: 400 },
        { name: "PlexMono", data: mono, style: "normal", weight: 600 },
      ],
    },
  );
}
