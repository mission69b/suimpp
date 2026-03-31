'use client';

import { useState } from 'react';
import { CopyBlock } from '../components/CopyBlock';

type Track = 'consumer' | 'provider';

export function DocsContent() {
  const [track, setTrack] = useState<Track>('consumer');

  return (
    <article className="space-y-10">
      <header className="space-y-2">
        <h1 className="text-2xl font-medium">Developer Guide</h1>
        <p className="text-sm text-muted max-w-xl leading-relaxed">
          Get started with MPP on Sui — pay for APIs or accept payments on yours.
        </p>
      </header>

      {/* Quickstart */}
      <section className="rounded-lg border border-border bg-surface p-5 space-y-4">
        <div className="text-[10px] uppercase tracking-wider text-muted">
          Quickstart
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <span className="text-xs text-muted">Pay for any API:</span>
            <CopyBlock
              code={`import { Mppx } from 'mppx/client';
import { sui } from '@suimpp/mpp/client';

const mpp = Mppx.create({
  methods: [sui({ client, signer })],
});

const res = await mpp.fetch('https://api.example.com/v1/generate', {
  method: 'POST',
  body: JSON.stringify({ prompt: 'Hello' }),
});`}
            />
          </div>
          <div className="space-y-2">
            <span className="text-xs text-muted">Accept payments:</span>
            <CopyBlock
              code={`import { Mppx } from 'mppx/nextjs';
import { sui } from '@suimpp/mpp/server';

const mpp = Mppx.create({
  methods: [sui({
    currency: SUI_USDC,
    recipient: '0xYOUR_ADDRESS',
  })],
});

export const POST = mpp.charge({ amount: '0.01' })(
  async (req) => Response.json({ ok: true })
);`}
            />
          </div>
        </div>
      </section>

      {/* Track Picker */}
      <div className="flex gap-2">
        <TrackButton
          active={track === 'consumer'}
          onClick={() => setTrack('consumer')}
        >
          Pay for APIs
        </TrackButton>
        <TrackButton
          active={track === 'provider'}
          onClick={() => setTrack('provider')}
        >
          Accept Payments
        </TrackButton>
      </div>

      {/* Consumer Track */}
      {track === 'consumer' && (
        <div className="space-y-10">
          <Step num={1} title="Install">
            <p>
              Install the MPP client library and the Sui payment method:
            </p>
            <CopyBlock lang="bash" code="npm install mppx @suimpp/mpp" />
          </Step>

          <Step num={2} title="Configure your wallet">
            <p>
              Create an mppx client with your Sui keypair. The client handles 402
              challenges automatically — when a server requires payment, it pays
              with your USDC and retries.
            </p>
            <CopyBlock
              code={`import { Mppx } from 'mppx/client';
import { sui } from '@suimpp/mpp/client';
import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';

const client = new SuiClient({ url: getFullnodeUrl('mainnet') });
const signer = Ed25519Keypair.deriveKeypair('your mnemonic');

const mpp = Mppx.create({
  methods: [sui({ client, signer })],
});`}
            />
          </Step>

          <Step num={3} title="Make a payment">
            <p>
              Use <Code>mpp.fetch()</Code> just like <Code>fetch()</Code>. If the
              API returns 402, payment happens transparently:
            </p>
            <CopyBlock
              code={`const response = await mpp.fetch(
  'https://mpp.t2000.ai/openai/v1/chat/completions',
  {
    method: 'POST',
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: 'Hello' }],
    }),
  }
);

const data = await response.json();`}
            />
          </Step>

          <Step num={4} title="Custom execution (optional)">
            <p>
              Override transaction execution for gas sponsorship, multi-sig, or
              custom signing flows:
            </p>
            <CopyBlock
              code={`const mpp = Mppx.create({
  methods: [sui({
    client,
    signer,
    execute: async (tx) => {
      // Custom gas management, sponsored transactions, etc.
      const result = await myCustomExecutor(tx);
      return { digest: result.digest };
    },
  })],
});`}
            />
          </Step>

          <Step num={5} title="What happens under the hood">
            <div className="rounded-lg border border-border bg-surface p-4 font-mono text-xs space-y-2 text-muted">
              <div className="flex gap-3">
                <span className="text-muted shrink-0">1.</span>
                <span>Client sends <Code>POST /v1/chat/completions</Code></span>
              </div>
              <div className="flex gap-3">
                <span className="text-muted shrink-0">2.</span>
                <span>Server returns <Code>402</Code> + <Code>WWW-Authenticate: MPP method=&quot;sui&quot;, amount=&quot;0.03&quot;, ...</Code></span>
              </div>
              <div className="flex gap-3">
                <span className="text-muted shrink-0">3.</span>
                <span>Client builds &amp; executes USDC transfer on Sui (~400ms)</span>
              </div>
              <div className="flex gap-3">
                <span className="text-muted shrink-0">4.</span>
                <span>Client retries with <Code>Authorization: MPP digest=&quot;...&quot;</Code></span>
              </div>
              <div className="flex gap-3">
                <span className="text-muted shrink-0">5.</span>
                <span>Server verifies on-chain, delivers response</span>
              </div>
            </div>
          </Step>

          <Step num={6} title="Browse servers">
            <p>
              Explore MPP servers accepting Sui USDC on the{' '}
              <a href="/servers" className="text-accent hover:underline">
                server directory
              </a>
              . Each server lists its endpoints, pricing, and capabilities.
              View the protocol specification in the{' '}
              <a href="/spec" className="text-accent hover:underline">
                charge method spec
              </a>
              .
            </p>
          </Step>
        </div>
      )}

      {/* Provider Track */}
      {track === 'provider' && (
        <div className="space-y-10">
          <Step num={1} title="Install">
            <p>
              Add the MPP server library and the Sui payment method to your API:
            </p>
            <CopyBlock lang="bash" code="npm install mppx @suimpp/mpp" />
          </Step>

          <Step num={2} title="Set up charging">
            <p>
              Create an mppx server with your Sui address as the payment
              recipient. USDC arrives directly in your wallet — no intermediary:
            </p>
            <CopyBlock
              code={`import { Mppx } from 'mppx/nextjs'; // or 'mppx/server'
import { sui, SUI_USDC_TYPE } from '@suimpp/mpp/server';

const mpp = Mppx.create({
  methods: [
    sui({
      currency: SUI_USDC_TYPE,
      recipient: '0xYOUR_SUI_ADDRESS',
      registryUrl: 'https://suimpp.dev/api/report',
      serverUrl: 'https://your-server.com',
    }),
  ],
});`}
            />
            <Callout>
              The <Code>registryUrl</Code> and <Code>serverUrl</Code> options are
              optional. When set, verified payments are automatically reported
              to <a href="/" className="text-accent hover:underline">suimpp.dev</a> for
              ecosystem-wide tracking.
            </Callout>
          </Step>

          <Step num={3} title="Protect your endpoints">
            <p>
              Wrap route handlers with <Code>mpp.charge()</Code>. Unauthenticated
              requests get a 402 challenge. Paid requests pass through to your handler:
            </p>
            <CopyBlock
              title="Next.js App Router"
              code={`export const POST = mpp.charge({ amount: '0.01' })(
  async (request) => {
    const body = await request.json();
    const result = await generateImage(body.prompt);
    return Response.json(result);
  }
);`}
            />
          </Step>

          <Step num={4} title="Dynamic pricing">
            <p>
              Use <Code>chargeCustom()</Code> for pricing based on the request:
            </p>
            <CopyBlock
              code={`export const POST = mpp.chargeCustom(async (request) => {
  const body = await request.json();
  const price = body.model === 'gpt-4o' ? '0.03' : '0.01';

  return {
    amount: price,
    handler: async () => {
      const result = await callUpstreamAPI(body);
      return Response.json(result);
    },
  };
});`}
            />
          </Step>

          <Step num={5} title="Express / Hono / any framework">
            <p>
              The server library works with any HTTP framework. Use the
              generic <Code>mppx/server</Code> import:
            </p>
            <CopyBlock
              title="Express example"
              code={`import { Mppx } from 'mppx/server';
import { sui, SUI_USDC_TYPE } from '@suimpp/mpp/server';
import express from 'express';

const mpp = Mppx.create({
  methods: [sui({ currency: SUI_USDC_TYPE, recipient: '0x...' })],
});

const app = express();

app.post('/api/generate', mpp.charge({ amount: '0.01' })(
  async (req, res) => {
    const result = await generate(req.body);
    res.json(result);
  }
));`}
            />
          </Step>

          <Step num={6} title="Verification details">
            <p>
              Verification is automatic and peer-to-peer. When a client submits
              a payment credential, the server:
            </p>
            <ul className="mt-2 space-y-1.5 text-sm text-muted">
              <li className="flex gap-2">
                <span className="text-muted/60">•</span>
                Queries the Sui RPC for the transaction
              </li>
              <li className="flex gap-2">
                <span className="text-muted/60">•</span>
                Confirms it succeeded on-chain
              </li>
              <li className="flex gap-2">
                <span className="text-muted/60">•</span>
                Verifies payment went to your address
              </li>
              <li className="flex gap-2">
                <span className="text-muted/60">•</span>
                Checks amount {'>='} requested (BigInt precision)
              </li>
            </ul>
            <p className="mt-3">
              No webhooks. No callback URLs. No dashboard. See the full
              verification logic in the{' '}
              <a href="/spec" className="text-accent hover:underline">
                charge method spec
              </a>
              .
            </p>
          </Step>

          <Step num={7} title="Register your server">
            <p>
              Register on{' '}
              <a href="/servers" className="text-accent hover:underline">
                suimpp.dev
              </a>{' '}
              to make your server discoverable. We validate your OpenAPI spec
              and start tracking payments automatically.
            </p>
            <a
              href="https://github.com/mission69b/suimpp/issues/new?title=Register+server&template=register-server.md"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-3 text-xs px-4 py-2 rounded-md border border-accent text-accent hover:bg-accent hover:text-bg transition-colors"
            >
              Register your server →
            </a>
          </Step>
        </div>
      )}

      {/* Links */}
      <section className="border-t border-border pt-8 space-y-2">
        {[
          { href: '/spec', label: 'Sui charge method spec' },
          { href: '/servers', label: 'Browse servers' },
          {
            href: 'https://www.npmjs.com/package/@suimpp/mpp',
            label: 'npm: @suimpp/mpp',
          },
          {
            href: 'https://www.npmjs.com/package/mppx',
            label: 'npm: mppx',
          },
          { href: 'https://mpp.dev', label: 'MPP Protocol' },
          { href: 'https://github.com/mission69b/suimpp', label: 'GitHub' },
        ].map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="flex items-center gap-2 text-xs text-muted hover:text-text transition-colors"
          >
            <span className="text-muted">→</span>
            {link.label}
          </a>
        ))}
      </section>
    </article>
  );
}

function TrackButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
        active
          ? 'bg-surface border border-text/20 text-text'
          : 'border border-border text-muted hover:text-text hover:border-border'
      }`}
    >
      {children}
    </button>
  );
}

function Step({
  num,
  title,
  children,
}: {
  num: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-medium flex items-center gap-2">
        <span className="text-muted text-xs font-mono">{num}.</span>
        {title}
      </h3>
      <div className="text-sm text-muted leading-relaxed space-y-3">
        {children}
      </div>
    </section>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="text-text bg-surface px-1.5 py-0.5 rounded border border-border text-xs font-mono">
      {children}
    </code>
  );
}

function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-3 rounded-lg border border-accent/20 bg-accent/5 px-4 py-3 text-xs text-muted leading-relaxed">
      {children}
    </div>
  );
}
