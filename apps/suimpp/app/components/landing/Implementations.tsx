const ITEMS = [
  {
    title: "mpp.t2000.ai",
    role: "GATEWAY",
    desc: "A live MPP gateway. 40 services. 88 endpoints.",
    href: "https://mpp.t2000.ai",
  },
  {
    title: "@t2000/cli",
    role: "CLIENT",
    desc: "The t2000 Agent Wallet — a CLI client that pays MPP endpoints.",
    href: "https://t2000.ai/agent-wallet",
  },
  {
    title: "Audric",
    role: "CONSUMER",
    desc:
      "A conversational finance app — pays MPP through the t2000 SDK.",
    href: "https://audric.ai",
    soon: true,
  },
];

export function Implementations() {
  return (
    <section style={{ padding: "80px 32px" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <header className="mb-8" style={{ maxWidth: 640 }}>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "var(--fg-subtle)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            // IMPLEMENTATIONS
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
            Built on suimpp.
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
            Known surfaces using the protocol. Building one?{" "}
            <a
              href="https://github.com/mission69b/suimpp/issues"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: "var(--fg)",
                textDecoration: "underline",
                textDecorationColor: "var(--ds-gray-alpha-500)",
                textUnderlineOffset: 3,
              }}
            >
              Open an issue
            </a>
            .
          </p>
        </header>

        <div style={{ borderTop: "1px solid var(--ds-gray-alpha-300)" }}>
          {ITEMS.map((it) => (
            <a
              key={it.title}
              href={it.href}
              target="_blank"
              rel="noopener noreferrer"
              className="grid items-center"
              style={{
                gridTemplateColumns: "1fr 100px 90px",
                gap: 24,
                padding: "20px 4px",
                borderBottom: "1px solid var(--ds-gray-alpha-300)",
                textDecoration: "none",
                color: "var(--fg)",
                transition: "background var(--dur-fast) var(--ease-out)",
              }}
            >
              <div>
                <div className="flex items-center gap-2.5">
                  <span
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontWeight: 600,
                      fontSize: 17,
                      letterSpacing: "-0.022em",
                      color: "var(--fg)",
                    }}
                  >
                    {it.title}
                  </span>
                  {it.soon && (
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 9.5,
                        color: "var(--fg-subtle)",
                        letterSpacing: "0.08em",
                        padding: "2px 7px",
                        border: "1px solid var(--ds-gray-alpha-400)",
                        borderRadius: 3,
                        textTransform: "uppercase",
                      }}
                    >
                      Coming soon
                    </span>
                  )}
                </div>
                <div
                  className="mt-1"
                  style={{
                    fontSize: 13.5,
                    lineHeight: 1.5,
                    color: "var(--fg-muted)",
                    letterSpacing: "-0.011em",
                  }}
                >
                  {it.desc}
                </div>
              </div>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10.5,
                  color: "var(--fg-subtle)",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                {it.role}
              </span>
              <span
                className="text-right"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                  color: "var(--fg-muted)",
                }}
              >
                Open ↗
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
