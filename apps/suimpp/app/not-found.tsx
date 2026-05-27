import type { Metadata } from "next";
import Link from "next/link";
import { SuimppNav } from "./components/site/SuimppNav";
import { SuimppFooter } from "./components/site/SuimppFooter";

export const metadata: Metadata = {
  title: "Section not found — suimpp",
  description: "This page isn't part of the v0.1 spec.",
  robots: { index: false },
};

export default function NotFoundPage() {
  return (
    <>
      <SuimppNav />
      <main>
        <section
          className="relative flex items-center justify-center overflow-hidden"
          style={{
            minHeight: "calc(100vh - 60px)",
            padding: "80px 24px",
          }}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1/2"
            style={{
              transform: "translate(-50%,-50%)",
              width: 760,
              height: 360,
              background:
                "radial-gradient(50% 50% at 50% 50%, rgba(0,114,245,0.06) 0%, transparent 70%)",
              filter: "blur(24px)",
            }}
          />

          <div
            className="relative text-center"
            style={{ maxWidth: 640 }}
          >
            <div
              className="mb-3"
              style={{
                fontFamily: "var(--font-sans)",
                fontWeight: 600,
                fontSize: "clamp(96px, 18vw, 200px)",
                lineHeight: 0.9,
                letterSpacing: "-0.05em",
                color: "var(--fg)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              4<span style={{ color: "var(--t2k-accent)" }}>0</span>4
            </div>

            <div className="mb-6 inline-flex items-center gap-2">
              <span
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: 14,
                  fontWeight: 500,
                  color: "var(--fg-muted)",
                  letterSpacing: "-0.022em",
                }}
              >
                suimpp
              </span>
            </div>

            <h1
              style={{
                fontFamily: "var(--font-sans)",
                fontWeight: 600,
                fontSize: "clamp(28px, 4vw, 40px)",
                lineHeight: 1.15,
                letterSpacing: "-0.025em",
                margin: 0,
                color: "var(--fg)",
              }}
            >
              Section not found.
            </h1>

            <p
              className="mx-auto mt-3.5"
              style={{
                fontSize: 16,
                lineHeight: 1.55,
                color: "var(--fg-muted)",
                letterSpacing: "-0.011em",
                maxWidth: 460,
              }}
            >
              This page isn't part of the v0.1 spec. Try the spec index or
              jump back to the home page.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-2.5">
              <Link href="/" className="t2k-btn t2k-btn--lg">
                Go home
              </Link>
              <Link href="/spec" className="t2k-btn t2k-btn--lg">
                Read the spec
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
        </section>
      </main>
      <SuimppFooter />
    </>
  );
}
