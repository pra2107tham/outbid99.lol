import { ImageResponse } from "next/og";

import { ogFonts } from "@/lib/og-fonts";

import { store } from "@/lib/db";
import { formatMoney } from "@/lib/money";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "outbid99 — the leaderboard you buy your way onto";

const PAPER = "#E9EEE7";
const INK = "#0E1C15";
const ULTRA = "#2B3BD1";
const RULE = "#C6CDC3";

export default async function OpengraphImage() {
  const { anton, mono } = await ogFonts();

  let total = 0;
  let listings = 0;
  try {
    const stats = await store().getSiteStats();
    total = stats.total_cents;
    listings = stats.listing_count;
  } catch {
    // An OG image is never worth failing a request over.
  }

  const amount = formatMoney(total);

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
          <div style={{ display: "flex", fontFamily: "Anton", fontSize: 36, letterSpacing: 1 }}>
            OUTBID99
          </div>
          <div style={{ display: "flex", fontSize: 17, letterSpacing: 3, color: "#55625B" }}>
            EVERY LISTING IS AN AD
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            justifyContent: "center",
          }}
        >
          <div style={{ display: "flex", fontSize: 22, letterSpacing: 3, color: "#55625B" }}>
            OUTBID99 HAS MADE
          </div>
          <div
            style={{
              display: "flex",
              fontFamily: "Anton",
              fontSize: 178,
              lineHeight: 1,
              color: ULTRA,
              marginTop: 10,
            }}
          >
            {amount}
          </div>
          <div
            style={{
              display: "flex",
              fontFamily: "Anton",
              fontSize: 48,
              lineHeight: 1.1,
              marginTop: 22,
              textTransform: "uppercase",
            }}
          >
            The leaderboard you buy your way onto
          </div>
        </div>

        <div style={{ display: "flex", height: 1, background: RULE }} />
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
          <div style={{ display: "flex" }}>{listings} LISTINGS · RANKED BY MONEY</div>
          <div style={{ display: "flex" }}>TAKE ANY RANK FOR 99C MORE</div>
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
