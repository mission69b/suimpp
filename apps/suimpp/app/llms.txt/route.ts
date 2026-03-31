export function GET() {
  const content = `# suimpp.dev — Machine Payments on Sui

> The open protocol for AI agents to pay for APIs with USDC on Sui.

## What is MPP on Sui?

Machine Payments Protocol (MPP) enables AI agents to pay for API access with Sui USDC.
No API keys. No subscriptions. Agents pay per request via on-chain micropayments.

## How it works

1. Agent sends a request to an MPP-enabled API
2. Server returns 402 Payment Required with a WWW-Authenticate challenge
3. Agent pays the requested amount in USDC on Sui (~400ms finality)
4. Server verifies the on-chain payment and returns the API response

## Packages

- \`@suimpp/mpp\` — Sui USDC payment method for the MPP protocol
  npm: https://www.npmjs.com/package/@suimpp/mpp
- \`@suimpp/discovery\` — Discovery validation CLI for MPP servers
  npm: https://www.npmjs.com/package/@suimpp/discovery
- \`mppx\` — MPP client/server SDK (protocol-level)
  npm: https://www.npmjs.com/package/mppx

## Links

- Protocol spec: https://mpp.dev
- GitHub: https://github.com/mission69b/suimpp
- First server: https://mpp.t2000.ai (40 services, 88 endpoints)
- Server catalog: https://suimpp.dev/servers
- MPPscan: https://mppscan.com
`;

  return new Response(content, {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
}
