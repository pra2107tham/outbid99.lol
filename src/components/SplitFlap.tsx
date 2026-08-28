"use client";

import { useEffect, useRef, useState } from "react";

const FLIP_MS = 260;

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Characters that read as punctuation rather than as a flap on the board. */
const PLAIN = new Set([".", ",", "$", "#", " ", "+", "/"]);

export type FlapVariant = "dark" | "light";

interface FlapProps {
  char: string;
  delayMs: number;
  variant: FlapVariant;
}

function Flap({ char, delayMs, variant }: FlapProps) {
  const committed = useRef(char);
  const isFirstRun = useRef(true);
  const [outgoing, setOutgoing] = useState<string | null>(null);

  useEffect(() => {
    // First run flips in from a blank tile, which is what produces the
    // load cascade. After that, only a genuine value change flips.
    const previous = isFirstRun.current ? " " : committed.current;
    committed.current = char;
    isFirstRun.current = false;

    if (previous === char || prefersReducedMotion()) return;

    setOutgoing(previous);
    const timer = window.setTimeout(
      () => setOutgoing(null),
      delayMs + FLIP_MS * 2 + 60,
    );
    return () => window.clearTimeout(timer);
  }, [char, delayMs]);

  const plain = PLAIN.has(char);
  // While a flip is running the bottom half still shows the old character; the
  // incoming leaf covers it as it lands.
  const bottomChar = outgoing ?? char;

  const classes = [
    "flap",
    variant === "light" ? "flap-light" : "",
    plain ? "flap-plain" : "",
    outgoing !== null ? "flap-animating" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span
      className={classes}
      style={{ ["--flap-delay" as string]: `${delayMs}ms` }}
      aria-hidden="true"
    >
      <span className="flap-half flap-top">
        <span className="flap-glyph">{char}</span>
      </span>
      <span className="flap-half flap-bottom">
        <span className="flap-glyph">{bottomChar}</span>
      </span>
      {outgoing !== null && (
        <>
          <span className="flap-half flap-leaf">
            <span className="flap-glyph">{outgoing}</span>
          </span>
          <span className="flap-half flap-leaf-bottom">
            <span className="flap-glyph">{char}</span>
          </span>
        </>
      )}
    </span>
  );
}

export interface SplitFlapProps {
  /** The value to display, one flap per character. */
  value: string;
  /** Milliseconds before this whole unit starts flipping — used to cascade rows. */
  baseDelay?: number;
  /** Extra delay per character, left to right. */
  stagger?: number;
  className?: string;
  /** Accessible label; the flaps themselves are hidden from assistive tech. */
  label?: string;
  /** "dark" for rank tiles, "light" for money. */
  variant?: FlapVariant;
}

/**
 * The board's one moving part. Renders a value as split-flap tiles that flip
 * into place on load and flip again whenever the value changes. The real text
 * is always in the DOM via the static halves and the visually hidden label, so
 * nothing here is load-bearing for crawlers or screen readers.
 */
export function SplitFlap({
  value,
  baseDelay = 0,
  stagger = 45,
  className = "",
  label,
  variant = "dark",
}: SplitFlapProps) {
  const chars = [...value];
  return (
    <span className={`inline-flex items-stretch gap-[0.05em] ${className}`}>
      <span className="sr-only">{label ?? value}</span>
      {chars.map((char, i) => (
        // Keyed by position, not value: the flap must survive a change to
        // remember the character it is flipping away from.
        <Flap key={i} char={char} delayMs={baseDelay + i * stagger} variant={variant} />
      ))}
    </span>
  );
}
