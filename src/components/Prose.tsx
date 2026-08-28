export function Prose({
  title,
  lede,
  updated,
  children,
}: {
  title: string;
  lede?: string;
  updated?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-[1180px] px-5 sm:px-8">
      <section className="border-b border-ink py-8 sm:py-10">
        <h1 className="display text-[clamp(34px,7vw,62px)] leading-none">{title}</h1>
        {lede ? (
          <p className="mt-4 max-w-[64ch] text-[16px] leading-relaxed text-ink-60">{lede}</p>
        ) : null}
        {updated ? (
          <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.13em] text-ink-40">
            Last updated {updated}
          </p>
        ) : null}
      </section>
      <div className="max-w-[68ch] py-10 [&_a]:text-ultra [&_a]:underline [&_a]:underline-offset-4 [&_h2]:display [&_h2]:mt-10 [&_h2]:border-b [&_h2]:border-rule [&_h2]:pb-2 [&_h2]:text-[19px] [&_h2]:leading-none [&_li]:mt-2 [&_li]:text-[15px] [&_li]:leading-relaxed [&_ol]:mt-4 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mt-4 [&_p]:text-[15px] [&_p]:leading-relaxed [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:pl-5">
        {children}
      </div>
    </div>
  );
}
