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
import { InMemoryDigestStore, USDC, sui } from '@suimpp/mpp/server';
import { Mppx } from 'mppx';

const mppx = Mppx.create({
  methods: [
    sui({
      currency: USDC,
      recipient: '0xYOUR_ADDRESS',
      store: new InMemoryDigestStore(), // Use Redis/DB in production.
    }),
  ],
});

export const GET = mppx.charge({ amount: '0.01' })(
  () => Response.json({ data: 'paid content' })
);
```

No webhooks. No Stripe dashboard. No KYC. USDC arrives directly in your wallet.

## Make Payments (Client)

```typescript
import { USDC, sui } from '@suimpp/mpp/client';
import { Mppx } from 'mppx/client';
import { SuiGrpcClient } from '@mysten/sui/grpc';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';

const client = new SuiGrpcClient({
  baseUrl: 'https://fullnode.mainnet.sui.io:443',
  network: 'mainnet',
});
const signer = Ed25519Keypair.deriveKeypair('your mnemonic');

const mppx = Mppx.create({
  methods: [sui({ client, signer, currency: USDC })],
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
  │                          │
  │<── 402 Payment Required ─│
  │    WWW-Authenticate: Payment id="…", realm="…",
  │      method="sui", intent="charge",
  │      request="eyJhbW91bnQi…"   // base64url JSON
  │                          │
  │── USDC transfer on Sui ──│   ~400ms finality
  │   (digest: Hp4oHHs…)     │
  │                          │
  │── Sign personal-message ─│   grief-protection signature
  │   over { challengeId,    │   binds the digest to the
  │     amount, currency,    │   on-chain transaction sender
  │     recipient, digest }  │
  │                          │
  │── GET /resource ────────>│
  │   Authorization: Payment │── verify TX on-chain via gRPC
  │     eyJjaGFsbGVuZ2Ui…    │   • status = success
  │   // base64url:          │   • amount + recipient match
  │   //   { challenge,      │   • signer == on-chain sender
  │   //     payload: {      │   • digest not previously redeemed
  │   //       digest,       │
  │   //       signature }}  │
  │                          │
  │<── 200 OK + data ────────│
  │    Payment-Receipt: eyJtZXRob2Qi…   // base64url JSON
```

No facilitator. No intermediary. The server verifies the Sui transaction directly via gRPC.

The grief-protection signature is **required since `@suimpp/mpp@0.7.0`** — without it, anyone observing a digest on-chain could submit it as their own credential and consume the paid request. The client signs a deterministic message over `{ domain, version, method, intent, challengeId, amount, currency, recipient, digest }` with the same Sui keypair that signed the on-chain transaction; the server verifies the recovered signer equals the transaction sender.

## Server API

### `sui(options)`

Creates a Sui payment method for the server.

```typescript
import { InMemoryDigestStore, USDC, sui } from '@suimpp/mpp/server';

const method = sui({
  currency: USDC,             // Sui coin type + decimals
  recipient: '0xYOUR_ADDR',   // Where payments are sent
  store: new InMemoryDigestStore(), // Required. Use Redis/DB in production.
  rpcUrl: '...',              // Optional: custom gRPC endpoint
  network: 'mainnet',         // Optional: 'mainnet' | 'testnet' | 'devnet'
  onPayment: (report) => {/* … */}, // Optional: emit on-chain context for analytics
});
```

Verification checks (all <strong>MUST</strong> pass before responding 200):
- Transaction succeeded on-chain
- Payment sent to correct recipient (address-normalized comparison)
- Amount >= requested (BigInt precision, no floating-point)
- Payment proof signature matches the transaction sender (**required since 0.7.0**)
- Digest has not been used before according to the required `store`

Any verification failure results in a fresh **402 Payment Required**, not 200/4xx/5xx.

## Client API

### `sui(options)`

Creates a Sui payment method for the client.

```typescript
import { USDC, sui } from '@suimpp/mpp/client';

const method = sui({
  client: grpcClient,            // Any Sui client (SuiGrpcClient, etc.)
  signer: ed25519Keypair,        // Signer from @mysten/sui/cryptography
  currency: USDC,                // Coin type + decimals
  execute: async (tx) => {       // Optional: custom execution (gas sponsor, etc.)
    return myGasManager.execute(tx);
  },
});
```

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `client` | `ClientWithCoreApi` | Yes | Any Sui client implementing the core API |
| `signer` | `Signer` | Yes | Any `Signer` from `@mysten/sui/cryptography` — `Ed25519Keypair` works |
| `currency` | `Currency` | Yes | Single-currency metadata including coin type and decimals |
| `execute` | `(tx: Transaction) => Promise<{ digest: string }>` | No | Override transaction execution (e.g. gas sponsor/manager) |

The client builds a `0x2::coin::send_funds` transaction for the exact payment amount, then signs and broadcasts it (or delegates to `execute` if provided).

## Constants

### Known currencies

The package exports common `Currency` presets and their raw coin type strings.

```typescript
import { SUI_DOLLAR, USDC, USDC_TESTNET } from '@suimpp/mpp';

USDC;         // { type: SUI_USDC_TYPE, decimals: 6 }
USDC_TESTNET; // { type: SUI_USDC_TESTNET_TYPE, decimals: 6 }
SUI_DOLLAR;   // { type: SUI_DOLLAR_TYPE, decimals: 6 }
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
pnpm --filter @suimpp/mpp test    # 29 tests
pnpm --filter @suimpp/mpp typecheck
```

## License

MIT — see [LICENSE](https://github.com/mission69b/suimpp/blob/main/LICENSE)

## x402 dialect (`@suimpp/mpp/x402`)

Scheme `exact` on network `sui:mainnet` — the x402-native dialect over the same
gasless rail. The client **signs but does not submit** (stateless
address-balance form: `withdrawal → redeem_funds → send_funds`, `ValidDuring`
nonce bound to the challenge); the server verifies the signed bytes and
**settles at serve time** — no charge on failure, structurally.

```ts
// Server: emit accepts[] on 402 + settle on X-PAYMENT
import { createX402Requirements, parseX402Header, settleX402Payment } from '@suimpp/mpp/x402';

// Client: sign-only payment
import { buildX402SignedPayment } from '@suimpp/mpp/x402';
const { header } = await buildX402SignedPayment({ requirements, signer });
// retry the request with `X-PAYMENT: <header>`
```

The legacy digest dialect (above) is unchanged and continues to work.
