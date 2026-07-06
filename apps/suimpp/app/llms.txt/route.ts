export function GET() {
  const content = `# suimpp.dev — the Sui scheme for x402

> An open standard for agent-to-service payments. Settled in USDC on Sui, gasless.

## What is suimpp?

suimpp is the Sui binding for x402-style agent payments over HTTP: standard scheme \`exact\` on network \`sui:mainnet\`. When a server answers 402, the client signs a gasless USDC payment and retries — no keys, no accounts, no subscriptions.

## How it works

1. Agent sends a request to a paid API
2. Server returns 402 Payment Required with x402 payment terms (accepts[])
3. Agent signs a gasless USDC authorization (SIP-58 address-balance withdrawal shape) and retries with the X-PAYMENT header
4. Gateway verifies + submits the payment on Sui (settle-then-serve; sub-second finality)
5. Server returns the API response with the settle receipt in X-PAYMENT-RESPONSE

## Packages

- \`@suimpp/mpp\` — Sui USDC payment scheme (client + server)
  npm: https://www.npmjs.com/package/@suimpp/mpp
- \`@suimpp/discovery\` — OpenAPI validation CLI for paid servers
  npm: https://www.npmjs.com/package/@suimpp/discovery
- \`mppx\` — framework-agnostic protocol SDK
  npm: https://www.npmjs.com/package/mppx

## Pages

- Home: https://suimpp.dev
- Protocol spec: https://suimpp.dev/spec
- Quickstart: https://suimpp.dev/docs

## Implementations

- mpp.t2000.ai — a live x402 gateway (every major AI + data API)
- @t2000/cli — the t2000 Agent Wallet, a CLI client that pays x402 endpoints
- Audric (audric.ai) — private, decentralized AI paying over x402 through the t2000 SDK

## Source

- GitHub: https://github.com/mission69b/suimpp
- License: MIT
`;

  return new Response(content, {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
}
