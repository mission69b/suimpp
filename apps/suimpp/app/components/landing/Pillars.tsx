const ITEMS = [
  {
    n: "01",
    title: "HTTP 402.",
    desc:
      "402 Payment Required. The server names the price, recipient, and currency in one header.",
  },
  {
    n: "02",
    title: "USDC on Sui. Gasless.",
    desc:
      "Clients pay in USDC. The SDK handles Sui's gasless tier — no SUI needed.",
  },
  {
    n: "03",
    title: "Discoverable.",
    desc:
      "Servers advertise prices in their OpenAPI doc. Tooling validates the contract before clients call.",
  },
];

export function Pillars() {
  return (
    <section
      style={{
        padding: "80px 32px",
        borderBottom: "1px solid var(--ds-gray-alpha-300)",
      }}
    >
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <header className="mb-10" style={{ maxWidth: 640 }}>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "var(--fg-subtle)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            // THE PROTOCOL
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
            Three rules.
          </h2>
        </header>

        <div
          className="grid grid-cols-1 md:grid-cols-3"
          style={{ borderTop: "1px solid var(--ds-gray-alpha-300)" }}
        >
          {ITEMS.map((it, i) => (
            <div
              key={it.n}
              style={{
                padding: "28px 24px",
                borderRight:
                  i < ITEMS.length - 1
                    ? "1px solid var(--ds-gray-alpha-300)"
                    : "none",
                borderBottom: "1px solid var(--ds-gray-alpha-300)",
              }}
              className="md:!border-b-0"
            >
              <div
                className="mb-3"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  color: "var(--fg-subtle)",
                  letterSpacing: "0.06em",
                }}
              >
                {it.n}
              </div>
              <h3
                style={{
                  fontFamily: "var(--font-sans)",
                  fontWeight: 600,
                  fontSize: 19,
                  lineHeight: 1.2,
                  letterSpacing: "-0.022em",
                  margin: 0,
                  color: "var(--fg)",
                }}
              >
                {it.title}
              </h3>
              <p
                className="mt-2.5"
                style={{
                  fontSize: 14.5,
                  lineHeight: 1.6,
                  color: "var(--fg-muted)",
                  letterSpacing: "-0.011em",
                }}
              >
                {it.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
