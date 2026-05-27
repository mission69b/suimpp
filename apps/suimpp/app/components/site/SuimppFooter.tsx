export function SuimppFooter() {
  const links = [
    { l: "GitHub ↗", href: "https://github.com/mission69b/suimpp" },
    { l: "t2000.ai ↗", href: "https://t2000.ai" },
    { l: "mpp.t2000.ai ↗", href: "https://mpp.t2000.ai" },
    { l: "audric.ai ↗", href: "https://audric.ai" },
  ];

  return (
    <footer
      style={{
        borderTop: "1px solid var(--ds-gray-alpha-300)",
        padding: "40px 32px 32px",
      }}
    >
      <div
        className="mx-auto flex flex-wrap items-center justify-between gap-8"
        style={{
          maxWidth: 1080,
          fontSize: 12,
          fontFamily: "var(--font-mono)",
          color: "var(--fg-subtle)",
          letterSpacing: "0.01em",
        }}
      >
        <div className="flex items-center gap-3.5">
          <span
            style={{
              color: "var(--fg)",
              fontFamily: "var(--font-sans)",
              fontWeight: 600,
              letterSpacing: "-0.022em",
            }}
          >
            suimpp
          </span>
          <span style={{ opacity: 0.5 }}>·</span>
          <span>v0.1 draft</span>
          <span style={{ opacity: 0.5 }}>·</span>
          <span>MIT</span>
          <span style={{ opacity: 0.5 }}>·</span>
          <span>© 2026</span>
        </div>
        <div className="flex gap-[18px]">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--fg-subtle)", textDecoration: "none" }}
              className="hover:!text-[var(--fg)] transition-colors"
            >
              {l.l}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
