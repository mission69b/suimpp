const PKGS = [
  {
    name: "@suimpp/mpp",
    ver: "npm",
    desc: "Sui USDC payment method for x402. Client and server.",
    install: "npm install @suimpp/mpp mppx",
    href: "https://www.npmjs.com/package/@suimpp/mpp",
  },
  {
    name: "@suimpp/discovery",
    ver: "npm",
    desc:
      "Validation CLI. Checks a server's OpenAPI advertisement and probes the live 402.",
    install: "npx @suimpp/discovery check <url>",
    href: "https://www.npmjs.com/package/@suimpp/discovery",
  },
];

export function Packages() {
  return (
    <section
      style={{
        padding: "80px 32px",
        borderBottom: "1px solid var(--ds-gray-alpha-300)",
      }}
    >
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
            // PACKAGES
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
            The reference implementation.
          </h2>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PKGS.map((p) => (
            <a
              key={p.name}
              href={p.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col gap-3"
              style={{
                padding: "24px",
                border: "1px solid var(--ds-gray-alpha-400)",
                borderRadius: 6,
                background: "var(--ds-background-200)",
                textDecoration: "none",
                color: "var(--fg)",
                transition: "border-color var(--dur-fast) var(--ease-out)",
              }}
            >
              <div className="flex justify-between items-center">
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 15,
                    fontWeight: 500,
                    color: "var(--fg)",
                    letterSpacing: "0.005em",
                  }}
                >
                  {p.name}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 10,
                    color: "var(--fg-subtle)",
                    letterSpacing: "0.06em",
                    padding: "2px 7px",
                    background: "var(--ds-gray-alpha-100)",
                    borderRadius: 3,
                    textTransform: "uppercase",
                  }}
                >
                  {p.ver} ↗
                </span>
              </div>
              <p
                style={{
                  fontSize: 13.5,
                  lineHeight: 1.55,
                  color: "var(--fg-muted)",
                  margin: 0,
                  letterSpacing: "-0.011em",
                }}
              >
                {p.desc}
              </p>
              <code
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                  color: "var(--fg)",
                  background: "var(--ds-background-100)",
                  border: "1px solid var(--ds-gray-alpha-300)",
                  borderRadius: 4,
                  padding: "8px 10px",
                }}
              >
                {p.install}
              </code>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
