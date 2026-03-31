# @suimpp/mpp

Sui USDC payment method for the [Machine Payments Protocol (MPP)](https://mpp.dev). Accept and make payments on any API — the first MPP implementation on Sui.

[![npm](https://img.shields.io/npm/v/@suimpp/mpp)](https://www.npmjs.com/package/@suimpp/mpp)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

**[Website](https://suimpp.dev)** · **[GitHub](https://github.com/mission69b/suimpp)** · **[SDK](https://www.npmjs.com/package/@t2000/sdk)** · **[CLI](https://www.npmjs.com/package/@t2000/cli)**

> **Migrated from `@mppsui/mpp`.** If you were using the old package, switch your imports to `@suimpp/mpp`.

## What is MPP?

The [Machine Payments Protocol](https://mpp.dev) is an open standard by Stripe and Tempo Labs for agent-to-service payments. When a server returns HTTP `402 Payment Required`, the client pays automatically and retries — no API keys, no subscriptions, no human approval.

`@suimpp/mpp` adds **Sui USDC** as a payment method. It works with any MPP-compatible client or server via the `mppx` SDK.

## Installation

```bash
npm install @suimpp/mpp mppx
```

## Accept Payments (Server)

Add payments to any API in 5 lines:

```typescript
import { sui } from '@suimpp/mpp/server';
import { Mppx } from 'mppx';

const SUI_USDC = '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC';

const mppx = Mppx.create({
  methods: [sui({ currency: SUI_USDC, recipient: '0xYOUR_ADDRESS' })],
});

export const GET = mppx.charge({ amount: '0.01' })(
  () => Response.json({ data: 'paid content' })
);
```

No webhooks. No Stripe dashboard. No KYC. USDC arrives directly in your wallet.

## Make Payments (Client)

```typescript
import { sui } from '@suimpp/mpp/client';
import { Mppx } from 'mppx/client';
import { SuiGrpcClient } from '@mysten/sui/grpc';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';

const client = new SuiGrpcClient({
  baseUrl: 'https://fullnode.mainnet.sui.io:443',
  network: 'mainnet',
});
const signer = Ed25519Keypair.deriveKeypair('your mnemonic');

const mppx = Mppx.create({
  methods: [sui({ client, signer })],
});

const response = await mppx.fetch('https://api.example.com/resource');
// If the API returns 402, mppx pays automatically via Sui USDC.
```

## With t2000 SDK

If you're using the [t2000 SDK](https://www.npmjs.com/package/@t2000/sdk), payments are even simpler:

```typescript
import { T2000 } from '@t2000/sdk';

const agent = await T2000.create({ pin: 'my-secret' });

const result = await agent.pay({
  url: 'https://api.example.com/generate',
  body: { prompt: 'a sunset' },
  maxPrice: 0.05,
});
// Handles 402 → pay → retry automatically.
// Safeguards enforced (max per tx, daily limits).
```

### CLI

```bash
t2000 pay https://api.example.com/data --max-price 0.10

t2000 pay https://api.example.com/analyze \
  --method POST \
  --data '{"text":"hello"}' \
  --max-price 0.05
```

## How It Works

```
Agent                    API Server
  │                          │
  │── GET /resource ────────>│
  │<── 402 Payment Required ─│
  │    {amount, currency,    │
  │     recipient}           │
  │                          │
  │── USDC transfer on Sui ──│  (~400ms finality)
  │                          │
  │── GET /resource ────────>│
  │   + payment credential   │── verify TX on-chain via gRPC
  │   (Sui tx digest)        │
  │<── 200 OK + data ────────│
```

No facilitator. No intermediary. The server verifies the Sui transaction directly via gRPC.

## Server API

### `sui(options)`

Creates a Sui payment method for the server.

```typescript
import { sui } from '@suimpp/mpp/server';

const method = sui({
  currency: SUI_USDC,         // Sui coin type (e.g. USDC)
  recipient: '0xYOUR_ADDR',   // Where payments are sent
  decimals: 6,                // Optional: currency decimals (default: 6)
  rpcUrl: '...',              // Optional: custom gRPC endpoint
  network: 'mainnet',         // Optional: 'mainnet' | 'testnet' | 'devnet'
  registryUrl: 'https://suimpp.dev/api/report', // Optional: report payments to suimpp.dev
});
```

Verification checks:
- Transaction succeeded on-chain
- Payment sent to correct recipient (address-normalized comparison)
- Amount >= requested (BigInt precision, no floating-point)

## Client API

### `sui(options)`

Creates a Sui payment method for the client.

```typescript
import { sui } from '@suimpp/mpp/client';

const method = sui({
  client: grpcClient,            // Any Sui client (SuiGrpcClient, etc.)
  signer: ed25519Keypair,        // Signer from @mysten/sui/cryptography
  decimals: 6,                   // Optional: currency decimals (default: 6)
  execute: async (tx) => {       // Optional: custom execution (gas sponsor, etc.)
    return myGasManager.execute(tx);
  },
});
```

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `client` | `ClientWithCoreApi` | Yes | Any Sui client implementing the core API |
| `signer` | `Signer` | Yes | Any `Signer` from `@mysten/sui/cryptography` — `Ed25519Keypair` works |
| `decimals` | `number` | No | Decimal places for the currency (default: 6) |
| `execute` | `(tx: Transaction) => Promise<{ digest: string }>` | No | Override transaction execution (e.g. gas sponsor/manager) |

The client uses the [`coinWithBalance`](https://sdk.mystenlabs.com/sui/transaction-building/intents) intent to automatically resolve, merge, and split coins for the exact payment amount, then signs and broadcasts the transaction (or delegates to `execute` if provided).

## Constants

### `SUI_USDC_TYPE`

The Sui coin type for Circle-issued USDC on mainnet.

```typescript
import { SUI_USDC_TYPE } from '@suimpp/mpp';
// '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC'
```

## Utilities

### `parseAmountToRaw(amount, decimals)`

Converts a string amount to BigInt raw units without floating-point math.

```typescript
parseAmountToRaw('0.01', 6);  // 10000n
parseAmountToRaw('1.50', 6);  // 1500000n
```

## Why Sui?

MPP is chain-agnostic. We chose Sui because agent payments need:

| | Sui |
|---|---|
| **Finality** | ~400ms |
| **Gas** | <$0.001 per payment |
| **USDC** | Circle-issued, native |
| **Verification** | Direct gRPC — no facilitator |

## Testing

```bash
pnpm --filter @suimpp/mpp test    # 13 tests
pnpm --filter @suimpp/mpp typecheck
```

## License

MIT — see [LICENSE](https://github.com/mission69b/suimpp/blob/main/LICENSE)
