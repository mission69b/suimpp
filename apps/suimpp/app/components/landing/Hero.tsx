import Link from "next/link";
import { HeroTerminal } from "./HeroTerminal";

export function Hero() {
  return (
    <section
      style={{
        padding: "80px 32px 72px",
        borderBottom: "1px solid var(--ds-gray-alpha-300)",
      }}
    >
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <div className="mb-6 flex items-center gap-2.5">
          <span className="su-tag">
            <span className="dot" />
            v0.1 · draft
          </span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "var(--fg-subtle)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            // MACHINE PAYMENTS PROTOCOL · ON SUI
          </span>
        </div>

        <div className="grid items-center gap-10 lg:gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <div>
            <h1
              style={{
                fontFamily: "var(--font-sans)",
                fontWeight: 600,
                fontSize: "clamp(36px, 4.8vw, 56px)",
                lineHeight: 1.05,
                letterSpacing: "-0.035em",
                margin: 0,
                color: "var(--fg)",
              }}
            >
              An open standard for
              <br />
              <span style={{ color: "var(--fg-muted)" }}>
                agent-to-service payments.
              </span>
            </h1>

            <p
              className="mt-6"
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 17,
                lineHeight: 1.55,
                color: "var(--fg-muted)",
                letterSpacing: "-0.011em",
              }}
            >
              An open standard by{" "}
              <ProtoLink href="https://stripe.com">Stripe</ProtoLink> and{" "}
              <ProtoLink href="https://tempo.io">Tempo Labs</ProtoLink>. When a
              server returns 402, the client pays in USDC and retries — no
              keys, no accounts, no subscriptions. suimpp brings it to Sui.
            </p>

            <div className="mt-8 flex flex-wrap gap-2.5">
              <Link href="/spec" className="t2k-btn t2k-btn--lg">
                Read the spec
              </Link>
              <Link href="/docs" className="t2k-btn t2k-btn--lg">
                Quickstart →
              </Link>
              <a
                href="https://github.com/mission69b/suimpp"
                target="_blank"
                rel="noopener noreferrer"
                className="t2k-btn t2k-btn--lg"
              >
                GitHub ↗
              </a>
            </div>
          </div>

          <HeroTerminal />
        </div>
      </div>
    </section>
  );
}

function ProtoLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        color: "var(--fg)",
        textDecoration: "underline",
        textDecorationColor: "var(--ds-gray-alpha-500)",
        textUnderlineOffset: 3,
      }}
    >
      {children}
    </a>
  );
}
