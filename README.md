# mppsui

Machine Payments Protocol (MPP) on Sui — payment method and discovery tooling.

[![CI](https://github.com/mission69b/mppsui/actions/workflows/ci.yml/badge.svg)](https://github.com/mission69b/mppsui/actions/workflows/ci.yml)

## Packages

| Package | Version | Description |
|---------|---------|-------------|
| [`@mppsui/mpp`](packages/mpp) | [![npm](https://img.shields.io/npm/v/@mppsui/mpp)](https://www.npmjs.com/package/@mppsui/mpp) | Sui USDC payment method for MPP — client + server |
| [`@mppsui/discovery`](packages/discovery) | [![npm](https://img.shields.io/npm/v/@mppsui/discovery)](https://www.npmjs.com/package/@mppsui/discovery) | Discovery validation CLI — OpenAPI checks + 402 probe |

## Quick Start

### Accept Payments (Server)

```bash
npm install @mppsui/mpp mppx
```

```typescript
import { sui } from '@mppsui/mpp/server';
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
import { sui } from '@mppsui/mpp/client';
import { Mppx } from 'mppx/client';

const mppx = Mppx.create({
  methods: [sui({ client, signer })],
});

const response = await mppx.fetch('https://api.example.com/resource');
```

### Validate a Server

```bash
npx @mppsui/discovery check mpp.t2000.ai
```

## What is MPP?

The [Machine Payments Protocol](https://mpp.dev) is an open standard by Stripe and Tempo Labs for agent-to-service payments. When a server returns HTTP `402 Payment Required`, the client pays automatically and retries — no API keys, no subscriptions, no human approval.

`@mppsui/mpp` implements Sui USDC as a payment method. `@mppsui/discovery` validates that servers correctly advertise their payment terms via OpenAPI.

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
git tag v0.1.0
git push && git push --tags
# Publish workflow runs automatically
```

## License

MIT
