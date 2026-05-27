import Link from "next/link";

const DIAGRAM = `Agent                              Server                           Sui
  │                                   │                              │
  │── POST /api/resource ────────────>│                              │
  │                                   │                              │
  │<── 402 Payment Required ─────────│                              │
  │    WWW-Authenticate: Payment      │                              │
  │      method="sui"                 │                              │
  │      request="<base64>"           │                              │
  │                                   │                              │
  │   ┌─ Build PTB: split + transfer USDC ─────────────────────────>│
  │   └─ TX confirmed ←──────────────────────────────────────────────│
  │      digest: "Hp4oHHs..."        │                              │
  │                                   │                              │
  │── Retry + Authorization ────────>│                              │
  │   Payment <base64({              │                              │
  │     challenge, payload: {        │                              │
  │       digest, signature           │                              │
  │     }})>                          │                              │
  │                                   │── getTransaction(digest) ──>│
  │                                   │   verify: success,           │
  │                                   │   recipient + amount match,  │
  │                                   │   signature → sender         │
  │                                   │                              │
  │<── 200 OK + Payment-Receipt ─────│                              │`;

export function HowItWorks() {
  return (
    <section
      style={{
        padding: "80px 32px",
        borderBottom: "1px solid var(--ds-gray-alpha-300)",
      }}
    >
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <header className="mb-7" style={{ maxWidth: 640 }}>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "var(--fg-subtle)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            // PAYMENT FLOW
          </span>
          <h2
            className="mt-3"
            style={{
              fontFamily: "var(--font-sans)",
              fontWeight: 600,
              fontSize: 32,
              lineHeight: 1.15,
              letterSpacing: "-0.022em",
              margin: "12px 0 0",
              color: "var(--fg)",
            }}
          >
            One round trip.
          </h2>
          <p
            className="mt-3"
            style={{
              fontSize: 15,
              lineHeight: 1.6,
              color: "var(--fg-muted)",
              letterSpacing: "-0.011em",
              maxWidth: 560,
            }}
          >
            Request → 402. Pay. Retry with the digest and a grief-protection
            signature. 200 OK.
          </p>
        </header>

        <pre className="su-diagram" style={{ margin: 0 }}>
          {DIAGRAM}
        </pre>

        <p
          className="mt-3.5"
          style={{
            fontSize: 13,
            lineHeight: 1.6,
            color: "var(--fg-subtle)",
            letterSpacing: "-0.011em",
            fontFamily: "var(--font-mono)",
          }}
        >
          Full normative details in{" "}
          <Link
            href="/spec"
            style={{
              color: "var(--fg)",
              textDecoration: "underline",
              textDecorationColor: "var(--ds-gray-alpha-500)",
              textUnderlineOffset: 3,
            }}
          >
            the spec
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
