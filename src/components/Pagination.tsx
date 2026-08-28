import Link from "next/link";

export function Pagination({
  page,
  totalPages,
  basePath,
}: {
  page: number;
  totalPages: number;
  basePath: string;
}) {
  if (totalPages <= 1) return null;
  const href = (p: number) => (p === 1 ? basePath : `${basePath}?page=${p}`);

  // A short window around the current page keeps the control to one line at 360px.
  const windowed: number[] = [];
  for (let p = Math.max(1, page - 2); p <= Math.min(totalPages, page + 2); p++) windowed.push(p);

  const cell =
    "inline-grid h-9 min-w-9 place-items-center rounded-[2px] border px-2 font-mono text-[11px] uppercase tracking-[0.1em]";

  return (
    <nav aria-label="Board pages" className="flex flex-wrap items-center gap-2 py-8">
      {page > 1 ? (
        <Link href={href(page - 1)} className={`${cell} border-rule hover:border-ink`} rel="prev">
          Previous
        </Link>
      ) : (
        <span className={`${cell} border-rule text-ink-40`}>Previous</span>
      )}

      {windowed[0] > 1 ? (
        <>
          <Link href={href(1)} className={`${cell} border-rule hover:border-ink`}>1</Link>
          {windowed[0] > 2 ? <span className="px-1 text-ink-40">…</span> : null}
        </>
      ) : null}

      {windowed.map((p) => (
        <Link
          key={p}
          href={href(p)}
          aria-current={p === page ? "page" : undefined}
          className={`${cell} ${p === page ? "border-ink bg-ink text-paper" : "border-rule hover:border-ink"}`}
        >
          {p}
        </Link>
      ))}

      {windowed[windowed.length - 1] < totalPages ? (
        <>
          {windowed[windowed.length - 1] < totalPages - 1 ? (
            <span className="px-1 text-ink-40">…</span>
          ) : null}
          <Link href={href(totalPages)} className={`${cell} border-rule hover:border-ink`}>
            {totalPages}
          </Link>
        </>
      ) : null}

      {page < totalPages ? (
        <Link href={href(page + 1)} className={`${cell} border-rule hover:border-ink`} rel="next">
          Next
        </Link>
      ) : (
        <span className={`${cell} border-rule text-ink-40`}>Next</span>
      )}
    </nav>
  );
}
