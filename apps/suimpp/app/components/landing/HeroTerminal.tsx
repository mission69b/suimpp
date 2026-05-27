export function HeroTerminal() {
  return (
    <div
      style={{
        background: "var(--ds-background-200)",
        border: "1px solid var(--ds-gray-alpha-400)",
        borderRadius: 8,
        overflow: "hidden",
      }}
    >
      <div
        className="flex items-center gap-2"
        style={{
          padding: "10px 14px",
          borderBottom: "1px solid var(--ds-gray-alpha-300)",
          background: "var(--ds-gray-100)",
        }}
      >
        <div className="flex gap-1.5">
          <span
            style={{
              width: 9,
              height: 9,
              borderRadius: "50%",
              background: "#FF5F57",
              display: "inline-block",
            }}
          />
          <span
            style={{
              width: 9,
              height: 9,
              borderRadius: "50%",
              background: "#FEBC2E",
              display: "inline-block",
            }}
          />
          <span
            style={{
              width: 9,
              height: 9,
              borderRadius: "50%",
              background: "#28C840",
              display: "inline-block",
            }}
          />
        </div>
        <span
          className="ml-2"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11.5,
            color: "var(--fg-muted)",
            letterSpacing: "0.01em",
          }}
        >
          mpp · 402 flow
        </span>
        <span className="flex-1" />
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            color: "var(--fg-subtle)",
            letterSpacing: "0.06em",
          }}
        >
          EXAMPLE
        </span>
      </div>

      <pre
        style={{
          margin: 0,
          padding: "18px 18px 22px",
          fontFamily: "var(--font-mono)",
          fontSize: 12,
          lineHeight: 1.75,
          color: "var(--fg)",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        <span style={{ color: "var(--fg-subtle)" }}>$ </span>
        curl -X POST https://mpp.t2000.ai/openai/v1/chat/completions
        {" \\"}
        {"\n  -d "}
        <span style={{ color: "var(--t2k-accent)" }}>
          {`'{"model":"gpt-4o","messages":[{"role":"user","content":"hi"}]}'`}
        </span>
        {"\n\n"}
        <span style={{ color: "var(--ds-amber-700)" }}>HTTP/1.1 402 Payment Required</span>
        {"\n"}
        WWW-Authenticate: Payment id=
        <span style={{ color: "var(--t2k-accent)" }}>{'"a1b2…"'}</span>
        , method=
        <span style={{ color: "var(--t2k-accent)" }}>{'"sui"'}</span>
        , intent=
        <span style={{ color: "var(--t2k-accent)" }}>{'"charge"'}</span>
        {"\n  request="}
        <span style={{ color: "var(--t2k-accent)" }}>{'"eyJhbW91bnQiOiIwLjAxMiI…"'}</span>
        {"\n\n"}
        <span style={{ color: "var(--fg-subtle)" }}>
          ── agent signs PTB · transfers 0.012 USDC on Sui · gasless ──
        </span>
        {"\n\n"}
        <span style={{ color: "var(--ds-green-700)" }}>✓</span>
        {" digest "}
        <span style={{ color: "var(--fg-muted)" }}>Hp4oHHs…</span>
        {" verified · "}
        <span style={{ color: "var(--fg-muted)" }}>380ms</span>
        {"\n"}
        <span style={{ color: "var(--ds-green-700)" }}>HTTP/1.1 200 OK</span>
        {"\nPayment-Receipt: sui:"}
        <span style={{ color: "var(--fg-muted)" }}>eyJkaWdlc3QiOiJIcDRv…</span>
        {"\n"}
        <span style={{ color: "var(--fg-muted)" }}>
          {`{"choices":[{"message":{"content":"Hello!"}}]}`}
        </span>
      </pre>
    </div>
  );
}
