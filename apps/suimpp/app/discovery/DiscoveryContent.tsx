'use client';

import Link from 'next/link';
import { CopyBlock } from '../components/CopyBlock';

const MINIMAL_EXAMPLE = `{
  "openapi": "3.1.0",
  "info": {
    "title": "My API",
    "version": "1.0.0",
    "description": "Example MPP-enabled server",
    "x-guidance": "Use POST /api/search for neural web search. Accepts a JSON body with a 'query' field."
  },
  "paths": {
    "/api/search": {
      "post": {
        "operationId": "search",
        "summary": "Neural web search",
        "x-payment-info": {
          "pricingMode": "fixed",
          "price": "0.010000",
          "protocols": ["mpp"]
        },
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "query": { "type": "string", "minLength": 1 }
                },
                "required": ["query"]
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Successful response",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "results": { "type": "array", "items": { "type": "object" } }
                  }
                }
              }
            }
          },
          "402": { "description": "Payment Required" }
        }
      }
    }
  }
}`;

const PAYMENT_INFO_EXAMPLES = `// Fixed pricing — most common
"x-payment-info": {
  "pricingMode": "fixed",
  "price": "0.010000",
  "protocols": ["mpp"]
}

// Range pricing — server decides within bounds
"x-payment-info": {
  "pricingMode": "range",
  "minPrice": "0.005000",
  "maxPrice": "0.050000",
  "protocols": ["mpp"]
}

// Quote pricing — price set at request time
"x-payment-info": {
  "pricingMode": "quote",
  "protocols": ["mpp"]
}`;

const VALIDATE_COMMAND = `npx @suimpp/discovery check https://mpp.example.com`;

const VALIDATE_OUTPUT = `✓ OpenAPI document found at /openapi.json
✓ 12 payable endpoints detected
✓ 402 challenge response verified
✓ Sui USDC payment method detected
✓ Recipient: 0x76d7...5012
0 errors, 0 warnings`;

const CHALLENGE_EXAMPLE = `HTTP/1.1 402 Payment Required
WWW-Authenticate: MPP method="sui",
  amount="0.01",
  currency="0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC",
  recipient="0xYOUR_SUI_ADDRESS"`;

export function DiscoveryContent() {
  return (
    <article className="space-y-12">
      <header className="space-y-3">
        <h1 className="text-2xl font-medium">Discovery Spec</h1>
        <p className="text-sm text-muted max-w-xl leading-relaxed">
          How to make your MPP server discoverable by agents. Publish an OpenAPI
          document, return proper 402 challenges, and validate with our CLI.
        </p>
      </header>

      <Section id="why" title="Why This Matters">
        <p>
          If agents can&apos;t discover your API, they can&apos;t call it. Discovery turns your endpoint
          from merely deployed to reliably invocable. When your OpenAPI metadata and runtime
          402 behavior agree, agents succeed on the first pass — fewer failures, less debugging,
          more real traffic.
        </p>
        <div className="mt-4 space-y-2">
          <Bullet>
            Publish an OpenAPI document at <code>/openapi.json</code> as the canonical machine-readable contract.
          </Bullet>
          <Bullet>
            Treat runtime 402 challenge behavior as the final source of truth.
          </Bullet>
          <Bullet>
            Validate with <code>@suimpp/discovery</code> before registering.
          </Bullet>
        </div>
      </Section>

      <Section id="openapi" title="OpenAPI Document">
        <p>
          Your server must serve an OpenAPI 3.x document at <code>GET /openapi.json</code>.
          This is how agents and the suimpp registry discover your endpoints and pricing.
        </p>

        <div className="mt-4 space-y-3">
          <h3 className="text-sm font-medium text-text">Required fields</h3>
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-surface">
                  <th className="text-left px-4 py-2 font-medium text-muted/80 border-b border-border">Field</th>
                  <th className="text-left px-4 py-2 font-medium text-muted/80 border-b border-border">Location</th>
                  <th className="text-left px-4 py-2 font-medium text-muted/80 border-b border-border">Purpose</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['openapi', 'Root', 'Must be "3.0.x" or "3.1.x"'],
                  ['info.title', 'Root', 'Human-readable server name'],
                  ['info.version', 'Root', 'API version string'],
                  ['info.x-guidance', 'Root', 'Agent instructions — how to use your API'],
                  ['x-payment-info', 'Per operation', 'Pricing and protocol info (see below)'],
                  ['responses.402', 'Per operation', 'Declares that endpoint requires payment'],
                  ['requestBody.schema', 'Per operation', 'Input schema for agent invocation'],
                  ['responses.200.schema', 'Per operation', 'Output schema for agent parsing'],
                ].map(([field, loc, purpose]) => (
                  <tr key={field} className="border-b border-border/50 last:border-0">
                    <td className="px-4 py-2 font-mono text-text">{field}</td>
                    <td className="px-4 py-2 text-muted">{loc}</td>
                    <td className="px-4 py-2 text-muted">{purpose}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-sm font-medium text-text mb-3">Minimal valid example</h3>
          <CopyBlock title="/openapi.json" code={MINIMAL_EXAMPLE} />
        </div>
      </Section>

      <Section id="payment-info" title="x-payment-info">
        <p>
          Every paid operation must include an <code>x-payment-info</code> object.
          This tells agents the pricing model and which payment protocols are accepted.
        </p>

        <div className="mt-4 rounded-lg border border-border overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-surface">
                <th className="text-left px-4 py-2 font-medium text-muted/80 border-b border-border">Field</th>
                <th className="text-left px-4 py-2 font-medium text-muted/80 border-b border-border">Required</th>
                <th className="text-left px-4 py-2 font-medium text-muted/80 border-b border-border">Description</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['protocols', 'Yes', 'Array of accepted protocols, e.g. ["mpp"]'],
                ['pricingMode', 'Yes', '"fixed", "range", or "quote"'],
                ['price', 'If fixed', 'Exact price as string (e.g. "0.010000")'],
                ['minPrice', 'If range', 'Minimum price for range pricing'],
                ['maxPrice', 'If range', 'Maximum price for range pricing'],
              ].map(([field, req, desc]) => (
                <tr key={field} className="border-b border-border/50 last:border-0">
                  <td className="px-4 py-2 font-mono text-text">{field}</td>
                  <td className="px-4 py-2 text-muted">{req}</td>
                  <td className="px-4 py-2 text-muted">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4">
          <CopyBlock title="Pricing modes" code={PAYMENT_INFO_EXAMPLES} />
        </div>

        <div className="mt-4 rounded-lg border border-border bg-surface p-4 space-y-1">
          <div className="text-xs font-medium text-text">Important</div>
          <div className="text-xs text-muted leading-relaxed">
            For fixed pricing, use <code className="text-text bg-bg px-1 py-0.5 rounded border border-border text-[11px] font-mono">price</code> (not &quot;amount&quot;).
            The 402 challenge uses <code className="text-text bg-bg px-1 py-0.5 rounded border border-border text-[11px] font-mono">amount</code>,
            but the OpenAPI spec uses <code className="text-text bg-bg px-1 py-0.5 rounded border border-border text-[11px] font-mono">price</code>.
          </div>
        </div>
      </Section>

      <Section id="402" title="402 Challenge Behavior">
        <p>
          When a client calls a paid endpoint without credentials, your server must return
          HTTP 402 with a <code>WWW-Authenticate</code> header:
        </p>

        <CopyBlock title="Response" code={CHALLENGE_EXAMPLE} />

        <div className="mt-4 space-y-2">
          <Bullet>
            <code>method=&quot;sui&quot;</code> — identifies the Sui charge method
          </Bullet>
          <Bullet>
            <code>amount</code> — human-readable USDC amount (e.g. &quot;0.01&quot; = 1 cent)
          </Bullet>
          <Bullet>
            <code>currency</code> — fully qualified USDC coin type on Sui
          </Bullet>
          <Bullet>
            <code>recipient</code> — your Sui address (0x-prefixed, 64 hex chars)
          </Bullet>
        </div>

        <p className="mt-4">
          The validator probes your first payable endpoint, expects a 402, and verifies
          the header matches your OpenAPI metadata. This is the final source of truth.
        </p>
      </Section>

      <Section id="schemas" title="Request & Response Schemas">
        <p>
          Each payable operation should define input and output schemas. Without them, agents
          can&apos;t construct requests or parse responses reliably.
        </p>

        <div className="mt-4 space-y-2">
          <Bullet>
            <strong>Input schema:</strong> Define <code>requestBody.content[&quot;application/json&quot;].schema</code> with
            typed properties and required fields.
          </Bullet>
          <Bullet>
            <strong>Output schema:</strong> Define <code>responses.200.content[&quot;application/json&quot;].schema</code> so
            agents know what to expect.
          </Bullet>
          <Bullet>
            <strong>Guidance:</strong> Add <code>info.x-guidance</code> at the top level to explain how
            an agent should use your API at a high level.
          </Bullet>
        </div>

        <p className="mt-4">
          Missing schemas produce warnings during validation. They won&apos;t block registration
          but will hurt discoverability and agent success rates.
        </p>
      </Section>

      <Section id="validate" title="Validate Before Registering">
        <p>
          Use the <code>@suimpp/discovery</code> CLI to check your server before registering:
        </p>

        <CopyBlock title="Terminal" code={VALIDATE_COMMAND} />

        <div className="mt-4">
          <CopyBlock title="Output" code={VALIDATE_OUTPUT} />
        </div>

        <p className="mt-4">
          The validator runs two phases:
        </p>
        <ol className="mt-2 space-y-3">
          <li className="flex gap-3">
            <span className="shrink-0 w-6 h-6 rounded-full bg-border text-muted text-xs font-mono flex items-center justify-center">1</span>
            <div>
              <span className="text-text font-medium text-sm">OpenAPI Discovery</span>
              <div className="mt-1 text-xs text-muted">
                Fetches <code className="text-text bg-surface px-1 py-0.5 rounded border border-border text-[11px] font-mono">/openapi.json</code>,
                validates structure, extracts endpoints with <code className="text-text bg-surface px-1 py-0.5 rounded border border-border text-[11px] font-mono">x-payment-info</code>.
              </div>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="shrink-0 w-6 h-6 rounded-full bg-border text-muted text-xs font-mono flex items-center justify-center">2</span>
            <div>
              <span className="text-text font-medium text-sm">Endpoint Probe</span>
              <div className="mt-1 text-xs text-muted">
                Sends a request to the first payable endpoint, expects 402, verifies
                <code className="text-text bg-surface px-1 py-0.5 rounded border border-border text-[11px] font-mono">WWW-Authenticate</code> header
                has <code className="text-text bg-surface px-1 py-0.5 rounded border border-border text-[11px] font-mono">method=sui</code>,
                valid USDC type, and valid recipient.
              </div>
            </div>
          </li>
        </ol>
      </Section>

      <Section id="errors" title="Common Errors">
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-surface">
                <th className="text-left px-4 py-2 font-medium text-muted/80 border-b border-border">Error</th>
                <th className="text-left px-4 py-2 font-medium text-muted/80 border-b border-border">Cause</th>
                <th className="text-left px-4 py-2 font-medium text-muted/80 border-b border-border">Fix</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Not Found', 'No document at /openapi.json', 'Serve your OpenAPI doc at the root path'],
                ['No payable endpoints', 'Missing x-payment-info', 'Add x-payment-info to each paid operation'],
                ['No 402 response', 'Endpoint doesn\'t return 402', 'Return 402 with WWW-Authenticate for unauthenticated requests'],
                ['WWW-Authenticate missing', 'Header not set on 402', 'Add WWW-Authenticate with method, amount, currency, recipient'],
                ['Invalid recipient', 'Malformed Sui address', 'Use a valid 0x-prefixed, 64 hex char address'],
                ['Schema missing', 'No requestBody or response schema', 'Add typed schemas for agent compatibility'],
              ].map(([error, cause, fix]) => (
                <tr key={error} className="border-b border-border/50 last:border-0">
                  <td className="px-4 py-2 font-mono text-error">{error}</td>
                  <td className="px-4 py-2 text-muted">{cause}</td>
                  <td className="px-4 py-2 text-muted">{fix}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section id="precedence" title="Discovery Precedence">
        <p>
          suimpp uses two sources to verify your server. Both must agree:
        </p>
        <div className="mt-4 rounded-lg border border-border overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-surface">
                <th className="text-left px-4 py-2 font-medium text-muted/80 border-b border-border">Priority</th>
                <th className="text-left px-4 py-2 font-medium text-muted/80 border-b border-border">Source</th>
                <th className="text-left px-4 py-2 font-medium text-muted/80 border-b border-border">Location</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border/50">
                <td className="px-4 py-2 font-mono text-text">1</td>
                <td className="px-4 py-2 text-muted">OpenAPI document</td>
                <td className="px-4 py-2 font-mono text-muted">/openapi.json</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-text">2</td>
                <td className="px-4 py-2 text-muted">402 API response</td>
                <td className="px-4 py-2 font-mono text-muted">WWW-Authenticate header</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Section>

      {/* CTA */}
      <section className="rounded-lg border border-border bg-surface p-6 space-y-3">
        <h3 className="text-sm font-medium">Ready to register?</h3>
        <p className="text-xs text-muted leading-relaxed">
          Once your server passes validation, register it on suimpp.dev to appear
          in the server catalog and start tracking payments automatically.
        </p>
        <div className="flex gap-4 pt-1">
          <Link
            href="/register"
            className="text-xs px-4 py-2 rounded-md bg-accent text-bg font-medium hover:bg-accent-hover transition-colors"
          >
            Register Server
          </Link>
          <a
            href="https://www.npmjs.com/package/@suimpp/discovery"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs px-4 py-2 rounded-md border border-border text-muted hover:text-text hover:border-accent/50 transition-colors"
          >
            Validation CLI
          </a>
        </div>
      </section>

      {/* Links */}
      <section className="border-t border-border pt-8 space-y-2">
        {[
          { href: '/spec', label: 'Sui Charge Method Spec' },
          { href: '/register', label: 'Register your server' },
          { href: '/docs', label: 'Developer guide' },
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

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="space-y-3">
      <h2 className="text-lg font-medium">{title}</h2>
      <div className="text-sm text-muted leading-relaxed [&_code]:text-text [&_code]:bg-surface [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:border [&_code]:border-border [&_code]:text-xs [&_code]:font-mono">
        {children}
      </div>
    </section>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 text-xs text-muted leading-relaxed [&_code]:text-text [&_code]:bg-surface [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:border [&_code]:border-border [&_code]:text-[11px] [&_code]:font-mono">
      <span className="text-muted/60 shrink-0 mt-0.5">•</span>
      <span>{children}</span>
    </div>
  );
}
