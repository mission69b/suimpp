/* eslint-disable react/no-unescaped-entities */
import Link from "next/link";

export function DocsContent() {
  return (
    <div className="su-doc--solo">
      <article className="su-prose">
        <div className="mb-4 flex items-center gap-2.5">
          <span className="su-tag">
            <span className="dot" />
            v0.1
          </span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "var(--fg-subtle)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            // QUICKSTART
          </span>
        </div>

        <h1>Build a Sui-MPP server or client.</h1>
        <p
          style={{
            marginTop: 8,
            color: "var(--fg-muted)",
            fontSize: 17,
            lineHeight: 1.55,
          }}
        >
          <code>@suimpp/mpp</code> ships the protocol.{" "}
          <code>@suimpp/discovery</code> validates it. Ten lines to running.
          Full reference on{" "}
          <a
            href="https://github.com/mission69b/suimpp"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
          .
        </p>

        <h2>Install</h2>
        <pre>
          <code>npm install @suimpp/mpp mppx</code>
        </pre>
        <p>The validation CLI is invoked via <code>npx</code> — no install needed:</p>
        <pre>
          <code>npx @suimpp/discovery check mpp.t2000.ai</code>
        </pre>

        <h2>Accept payments (server)</h2>
        <p>
          Wrap any HTTP handler. The library issues 402 challenges, verifies
          digests, checks the grief-protection signature, and defends against
          replay.
        </p>
        <pre>
          <code>{`import { Mppx } from 'mppx/nextjs';
import { InMemoryDigestStore, USDC, sui } from '@suimpp/mpp/server';

const mppx = Mppx.create({
  realm: 'api.example.com',
  methods: [sui({
    currency: USDC,
    recipient: '0xYOUR_ADDRESS',
    network: 'mainnet',
    store: new InMemoryDigestStore(), // Use Redis or Postgres in production.
  })],
});

export const POST = mppx.charge({ amount: '0.01' })(
  async () => Response.json({ data: 'paid content' })
);`}</code>
        </pre>
        <p>
          <code>@suimpp/mpp</code> exports <code>USDC</code>,{" "}
          <code>USDC_TESTNET</code>, and <code>SUI_DOLLAR</code> currency
          presets. Sui's gasless tier is handled automatically when the
          canonical USDC type is used.
        </p>
        <blockquote>
          The grief-protection signature is required since{" "}
          <code>@suimpp/mpp@0.7</code>. Servers MUST reject any credential
          whose recovered signer address does not match the on-chain
          transaction sender. The library handles this for you.
        </blockquote>

        <h2>Make payments (client)</h2>
        <p>
          Drop-in replacement for <code>fetch()</code>. Settles 402 challenges
          on Sui and retries automatically — signing the on-chain transfer and
          the grief-protection proof with the same keypair.
        </p>
        <pre>
          <code>{`import { Mppx } from 'mppx/client';
import { USDC, sui } from '@suimpp/mpp/client';

const mppx = Mppx.create({
  methods: [sui({ client, signer, currency: USDC })],
});

const response = await mppx.fetch('https://api.example.com/resource');`}</code>
        </pre>

        <h2>Validate a server</h2>
        <p>
          Before pointing agents at an endpoint, validate it. Discovery
          fetches the OpenAPI, probes a paid route, and reports violations.
        </p>
        <pre>
          <code>{`$ npx @suimpp/discovery check mpp.t2000.ai

✓ OpenAPI document found at /openapi.json
✓ 88 payable endpoints detected
✓ 402 challenge response verified
✓ Sui USDC payment method detected
✓ Recipient: 0x7032...09d2f
0 errors, 0 warnings`}</code>
        </pre>

        <h3>Programmatic check</h3>
        <p>Same check, as a function. Works in CI:</p>
        <pre>
          <code>{`import { check } from '@suimpp/discovery';

const result = await check('https://mpp.example.com');

result.ok          // true if no errors (warnings allowed)
result.discovery   // OpenAPI parse: title, endpoints, issues
result.probe       // 402 probe: status, recipient, currency
result.summary     // { totalIssues, errors, warnings }`}</code>
        </pre>

        <h2>Payment reporting</h2>
        <p>
          Opt-in. The library emits on-chain context via the{" "}
          <code>onPayment</code> callback. Your gateway adds HTTP context
          (which endpoint was called) and POSTs the joined record to any
          registry:
        </p>
        <pre>
          <code>{`import { InMemoryDigestStore, USDC, sui } from '@suimpp/mpp/server';
import type { PaymentReport } from '@suimpp/mpp/server';

const pendingReports = new Map<string, PaymentReport>();

const mppx = Mppx.create({
  realm: 'api.example.com',
  methods: [sui({
    currency: USDC,
    recipient: TREASURY_ADDRESS,
    network: 'mainnet',
    store: new InMemoryDigestStore(),
    onPayment: (report) => {
      pendingReports.set(report.digest, report);
    },
  })],
});

// After charge() returns, enrich with HTTP context and POST to your registry.
// See the full pattern in the README.`}</code>
        </pre>

        <h2>Going further</h2>
        <ul>
          <li>
            <Link href="/spec">The v0.1 protocol spec</Link> — exact wire format,
            verification rules, security considerations.
          </li>
          <li>
            <a
              href="https://github.com/mission69b/suimpp"
              target="_blank"
              rel="noopener noreferrer"
            >
              github.com/mission69b/suimpp
            </a>{" "}
            — source, issues, full README, release notes.
          </li>
          <li>
            <a
              href="https://mpp.t2000.ai"
              target="_blank"
              rel="noopener noreferrer"
            >
              mpp.t2000.ai
            </a>{" "}
            — a live MPP gateway. Browse the catalog, see its 402 challenges,
            copy curl examples.
          </li>
        </ul>
      </article>
    </div>
  );
}
