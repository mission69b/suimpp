# suimpp

Machine Payments Protocol (MPP) on Sui — payment method, discovery tooling, and ecosystem hub.

[![CI](https://github.com/mission69b/suimpp/actions/workflows/ci.yml/badge.svg)](https://github.com/mission69b/suimpp/actions/workflows/ci.yml)

## Packages

| Package | Version | Description |
|---------|---------|-------------|
| [`@suimpp/mpp`](packages/mpp) | [![npm](https://img.shields.io/npm/v/@suimpp/mpp)](https://www.npmjs.com/package/@suimpp/mpp) | Sui USDC payment method for MPP — client + server |
| [`@suimpp/discovery`](packages/discovery) | [![npm](https://img.shields.io/npm/v/@suimpp/discovery)](https://www.npmjs.com/package/@suimpp/discovery) | Discovery validation CLI — OpenAPI checks + 402 probe |

## Apps

| App | Description |
|-----|-------------|
| [`suimpp.dev`](apps/suimpp) | Ecosystem hub — server catalog, live payment feed, docs |

## Quick Start

### Accept Payments (Server)

```bash
npm install @suimpp/mpp mppx
```

```typescript
import { sui } from '@suimpp/mpp/server';
import { Mppx } from 'mppx';

const mppx = Mppx.create({
  methods: [sui({
    currency: '0xdba...::usdc::USDC',
    recipient: '0xYOUR_ADDRESS',
  })],
});

export const GET = mppx.charge({ amount: '0.01' })(
  () => Response.json({ data: 'paid content' })
);
```

### Make Payments (Client)

```typescript
import { sui } from '@suimpp/mpp/client';
import { Mppx } from 'mppx/client';

const mppx = Mppx.create({
  methods: [sui({ client, signer })],
});

const response = await mppx.fetch('https://api.example.com/resource');
```

### Validate a Server

```bash
npx @suimpp/discovery check mpp.t2000.ai
```

## What is MPP?

The [Machine Payments Protocol](https://mpp.dev) is an open standard by Stripe and Tempo Labs for agent-to-service payments. When a server returns HTTP `402 Payment Required`, the client pays automatically and retries — no API keys, no subscriptions, no human approval.

`@suimpp/mpp` implements Sui USDC as a payment method. `@suimpp/discovery` validates that servers correctly advertise their payment terms via OpenAPI.

## Development

```bash
pnpm install
pnpm build
pnpm test
pnpm typecheck
```

## Release

```bash
# Bump versions in package.json files
git add -A && git commit -m "📦 build: bump versions"
git tag v0.3.0
git push && git push --tags
# Publish workflow runs automatically
```

## License

MIT
