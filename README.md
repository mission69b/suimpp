# suimpp

Machine Payments Protocol (MPP) on Sui — payment method, discovery tooling, and spec.

[![CI](https://github.com/mission69b/suimpp/actions/workflows/ci.yml/badge.svg)](https://github.com/mission69b/suimpp/actions/workflows/ci.yml)

## Packages

| Package | Version | Description |
|---------|---------|-------------|
| [`@suimpp/mpp`](packages/mpp) | [![npm](https://img.shields.io/npm/v/@suimpp/mpp)](https://www.npmjs.com/package/@suimpp/mpp) | Sui USDC payment method for MPP — client + server |
| [`@suimpp/discovery`](packages/discovery) | [![npm](https://img.shields.io/npm/v/@suimpp/discovery)](https://www.npmjs.com/package/@suimpp/discovery) | Discovery validation CLI — OpenAPI checks + 402 probe |

## Apps

| App | Domain | Description |
|-----|--------|-------------|
| [`suimpp.dev`](apps/suimpp) | [suimpp.dev](https://suimpp.dev) | Spec + docs for MPP on Sui (RFC-style protocol reference) |

## Quick Start

### Accept Payments (Server)

```bash
npm install @suimpp/mpp mppx
```

```typescript
import { InMemoryDigestStore, USDC, sui } from '@suimpp/mpp/server';
import { Mppx } from 'mppx';

const mppx = Mppx.create({
  methods: [sui({
    currency: USDC,
    recipient: '0xYOUR_ADDRESS',
    store: new InMemoryDigestStore(), // Use Redis/DB in production.
  })],
});

export const GET = mppx.charge({ amount: '0.01' })(
  () => Response.json({ data: 'paid content' })
);
```

### Make Payments (Client)

```typescript
import { USDC, sui } from '@suimpp/mpp/client';
import { Mppx } from 'mppx/client';

const mppx = Mppx.create({
  methods: [sui({ client, signer, currency: USDC })],
});

const response = await mppx.fetch('https://api.example.com/resource');
```

`@suimpp/mpp` exports `USDC`, `USDC_TESTNET`, and `SUI_DOLLAR`
currency presets. The SDK handles gasless tier behavior automatically.

### Validate a Server

```bash
npx @suimpp/discovery check mpp.t2000.ai
```

## What is MPP?

The [Machine Payments Protocol](https://mpp.dev) is an open standard by Stripe and Tempo Labs for agent-to-service payments. When a server returns HTTP `402 Payment Required`, the client pays automatically and retries — no API keys, no subscriptions, no human approval.

`@suimpp/mpp` implements Sui USDC as a payment method. `@suimpp/discovery` validates that servers correctly advertise their payment terms via OpenAPI.

---

## How It Works

### Payment Flow

```
Agent                              Server                           Sui
  │                                   │                              │
  │── POST /api/resource ────────────>│                              │
  │                                   │                              │
  │<── 402 Payment Required ─────────│                              │
  │    WWW-Authenticate: Payment      │                              │
  │      id="a1b2…",                  │                              │
  │      realm="api.example.com",     │                              │
  │      method="sui",                │                              │
  │      intent="charge",             │                              │
  │      request="eyJhbW91bnQi…"      │  // base64url JSON:
  │                                   │  //   { amount, currency, recipient }
  │                                   │                              │
  │   ┌─ Build PTB: split + transfer USDC ───────────────────────────>│
  │   └─ TX confirmed ←──────────────────────────────────────────────│
  │      digest: "Hp4oHHs..."        │                              │
  │                                   │                              │
  │── Sign personal-message proof ────│  // grief-protection sig over
  │   { challengeId, amount,         │  //   { domain, version, method,
  │     currency, recipient, digest } │  //     intent, challengeId, amount,
  │                                   │  //     currency, recipient, digest }
  │                                   │                              │
  │── Retry with Authorization ──────>│                              │
  │   Authorization: Payment eyJjaGFs… // base64url:
  │                                   │   { challenge, payload:
  │                                   │     { digest, signature } }
  │                                   │── getTransaction(digest) ──>│
  │                                   │   verify: success, amount,   │
  │                                   │   recipient, signer = sender │
  │                                   │                              │
  │<── 200 OK + response ────────────│                              │
  │    Payment-Receipt: eyJtZXRob2Qi… // base64url:
  │                                   //   { method, reference, status, timestamp }
```

### Server Validation

Any server implementing the MPP protocol with Sui USDC can be validated by anyone — no central registry, no manual approval. Use `@suimpp/discovery` locally or in CI:

```bash
npx @suimpp/discovery check <url>
```

**What gets validated:**

| Check | Source | Required |
|-------|--------|----------|
| OpenAPI document at `/openapi.json` | `@suimpp/discovery` fetch | Yes |
| Endpoints with `x-payment-info` | OpenAPI parse | Yes (at least 1) |
| 402 challenge on live probe | HTTP request | Yes |
| `method=sui` in WWW-Authenticate | 402 response | Yes |
| Valid USDC coin type | 402 response | Yes |
| Valid Sui recipient address | 402 response | Yes |
| Request/response schemas | OpenAPI parse | Warning only |

### Payment Reporting

Payments are reported by the gateway (application layer), not by the library directly. This ensures every report includes both on-chain data and HTTP request context. The destination is configurable — point it at any analytics endpoint you control.

```
  @suimpp/mpp (library)                 Gateway (application)
  ─────────────────────                 ─────────────────────
  verify() runs after                   charge() middleware wraps
  on-chain check:                       the HTTP handler:
                                        
  ┌─────────────────────┐               ┌─────────────────────┐
  │ Extract from chain: │  onPayment()  │ Extract from HTTP:  │
  │  • digest           │──────────────>│  • service name     │
  │  • sender address   │  (by digest)  │  • endpoint path    │
  │  • amount           │               │  • server URL       │
  │  • recipient        │               │                     │
  │  • currency         │               │ Merge on-chain +    │
  │  • network          │               │ request context     │
  └─────────────────────┘               └──────────┬──────────┘
                                                   │
                                        POST /api/report
                                        (all fields in one request)
                                                   │
                                                   ▼
                                        ┌─────────────────────┐
                                        │ Your analytics      │
                                        │ endpoint            │
                                        │                     │
                                        │ Dedupe by digest    │
                                        │ Store payment       │
                                        └─────────────────────┘
```

**Why this pattern?** The `verify()` callback has on-chain data (transaction sender, digest, amount, recipient) but no HTTP context (which endpoint was called). The gateway's charge wrapper has HTTP context but no on-chain data. The `onPayment` callback bridges the two layers using the digest as the join key.

**Implementation:**

```typescript
import { InMemoryDigestStore, USDC, sui } from '@suimpp/mpp/server';
import type { PaymentReport } from '@suimpp/mpp/server';

// 1. Library emits on-chain data via callback
const pendingReports = new Map<string, PaymentReport>();

const mppx = Mppx.create({
  methods: [sui({
    currency: USDC,
    recipient: TREASURY_ADDRESS,
    store: new InMemoryDigestStore(), // Use Redis/DB in production.
    network: 'mainnet',
    onPayment: (report) => {
      pendingReports.set(report.digest, report);
    },
  })],
});

// 2. After charge() returns, gateway enriches with request context
const response = await mppx.charge({ amount })(handler)(request);

if (response.status !== 402) {
  const digest = parseDigest(response.headers.get('Payment-Receipt'));
  const report = digest ? pendingReports.get(digest) : undefined;
  if (report) {
    pendingReports.delete(digest);
    // 3. Single report with all fields, sent to whichever analytics
    //    endpoint you control. There's no central registry to call.
    fetch(YOUR_REPORTING_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        ...report,           // digest, sender, recipient, amount, currency, network
        serverUrl: SERVER_URL,
        service: 'openai',
        endpoint: '/openai/v1/chat/completions',
      }),
    }).catch(() => {});
  }
}
```

### Discovery Validation

`@suimpp/discovery` validates that a server correctly implements the MPP protocol:

```typescript
import { check } from '@suimpp/discovery';

const result = await check('https://mpp.example.com');

result.ok              // true if no errors (warnings allowed)
result.discovery       // OpenAPI parse: title, endpoints, issues
result.probe           // 402 probe: status, recipient, currency
result.summary         // { totalIssues, errors, warnings }
```

**Phase 1 — OpenAPI Discovery:**
- Fetches `{origin}/openapi.json`
- Validates OpenAPI 3.x structure
- Extracts endpoints with `x-payment-info` extensions
- Reports: missing schemas, invalid pricing, missing 402 responses

**Phase 2 — Endpoint Probe:**
- Sends an empty POST to the first payable endpoint
- Expects HTTP 402 with `WWW-Authenticate` header
- Validates: `method=sui`, USDC coin type, valid Sui recipient address

```bash
# CLI usage
npx @suimpp/discovery check mpp.t2000.ai

# Output:
# ✓ OpenAPI document found at /openapi.json
# ✓ 88 payable endpoints detected
# ✓ 402 challenge response verified
# ✓ Sui USDC payment method detected
# ✓ Recipient: 0x76d7...5012
# 0 errors, 0 warnings
```

---

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
git tag v0.4.0
git push && git push --tags
# CI: build → typecheck → test → publish to npm → GitHub Release
```

## License

MIT
