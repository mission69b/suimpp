import Link from "next/link";

interface SuimppNavProps {
  currentPage?: "spec" | "docs";
}

const LINKS = [
  { id: "spec", label: "Spec", href: "/spec" },
  { id: "docs", label: "Docs", href: "/docs" },
] as const;

export function SuimppNav({ currentPage }: SuimppNavProps) {
  return (
    <nav
      className="sticky top-0 z-30 border-b"
      style={{
        background: "rgba(10,10,10,0.78)",
        backdropFilter: "blur(12px) saturate(140%)",
        WebkitBackdropFilter: "blur(12px) saturate(140%)",
        borderColor: "var(--ds-gray-alpha-300)",
      }}
    >
      <div
        className="mx-auto flex h-[60px] items-center gap-6 px-8"
        style={{ maxWidth: 1080 }}
      >
        <Link
          href="/"
          className="inline-flex items-center gap-2.5"
          style={{ color: "var(--fg)", textDecoration: "none" }}
        >
          <span
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: 16,
              fontWeight: 600,
              color: "var(--fg)",
              letterSpacing: "-0.022em",
            }}
          >
            suimpp
          </span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10.5,
              color: "var(--fg-subtle)",
              letterSpacing: "0.06em",
              padding: "2px 6px",
              border: "1px solid var(--ds-gray-alpha-300)",
              borderRadius: 3,
              textTransform: "uppercase",
            }}
          >
            v0.1
          </span>
        </Link>

        <div className="ml-2 flex items-center gap-[22px]">
          {LINKS.map((l) => {
            const active = l.id === currentPage;
            return (
              <Link
                key={l.id}
                href={l.href}
                style={{
                  fontSize: 13,
                  color: active ? "var(--fg)" : "var(--fg-muted)",
                  fontWeight: 500,
                  letterSpacing: "-0.011em",
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                  transition: "color var(--dur-fast) var(--ease-out)",
                }}
                className="hover:!text-[var(--fg)]"
              >
                {l.label}
              </Link>
            );
          })}
        </div>

        <span className="flex-1" />

        <a
          href="https://github.com/mission69b/suimpp"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: 13,
            color: "var(--fg-muted)",
            fontWeight: 500,
            letterSpacing: "-0.011em",
            textDecoration: "none",
            whiteSpace: "nowrap",
            transition: "color var(--dur-fast) var(--ease-out)",
          }}
          className="hover:!text-[var(--fg)]"
        >
          GitHub&nbsp;↗
        </a>

        <a
          href="https://t2000.ai"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: 12,
            color: "var(--fg-subtle)",
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.01em",
            textDecoration: "none",
            whiteSpace: "nowrap",
            paddingLeft: 12,
            borderLeft: "1px solid var(--ds-gray-alpha-300)",
            transition: "color var(--dur-fast) var(--ease-out)",
          }}
          className="hover:!text-[var(--fg)]"
        >
          t2000.ai&nbsp;↗
        </a>

        <a
          href="https://mpp.t2000.ai"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: 12,
            color: "var(--fg-subtle)",
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.01em",
            textDecoration: "none",
            whiteSpace: "nowrap",
            transition: "color var(--dur-fast) var(--ease-out)",
          }}
          className="hover:!text-[var(--fg)]"
        >
          mpp.t2000.ai&nbsp;↗
        </a>
      </div>
    </nav>
  );
}
