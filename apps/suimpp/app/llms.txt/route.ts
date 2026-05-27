export function GET() {
  const content = `# suimpp.dev — Machine Payments Protocol on Sui

> An open standard for agent-to-service payments. Settled in USDC on Sui.

## What is MPP on Sui?

The Machine Payments Protocol (MPP) is an open standard by Stripe and Tempo Labs for autonomous agent-to-service payments over HTTP. The Sui binding (suimpp) defines how MPP challenges are settled on Sui using USDC.

## How it works

1. Agent sends a request to an MPP-enabled API
2. Server returns 402 Payment Required with a WWW-Authenticate: Payment header
3. Agent settles the payment in USDC on Sui (sub-second finality, gasless via sponsored transactions)
4. Agent retries with an Authorization: Payment header carrying the digest + grief-protection signature
5. Server verifies the on-chain payment and returns the API response

## Packages

- \`@suimpp/mpp\` — Sui USDC payment method (client + server)
  npm: https://www.npmjs.com/package/@suimpp/mpp
- \`@suimpp/discovery\` — OpenAPI validation CLI for MPP servers
  npm: https://www.npmjs.com/package/@suimpp/discovery
- \`mppx\` — Framework-agnostic MPP protocol SDK
  npm: https://www.npmjs.com/package/mppx

## Pages

- Home: https://suimpp.dev
- v0.1 protocol spec: https://suimpp.dev/spec
- Quickstart: https://suimpp.dev/docs

## Implementations

- mpp.t2000.ai — a live MPP gateway (40 services, 88 endpoints)
- @t2000/cli — the t2000 Agent Wallet, a CLI client that pays MPP endpoints
- Audric (coming soon) — a conversational finance app paying MPP through the t2000 SDK

## Source

- GitHub: https://github.com/mission69b/suimpp
- License: MIT
`;

  return new Response(content, {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
}
