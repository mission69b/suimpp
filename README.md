# suimpp

Machine Payments Protocol (MPP) on Sui — payment method, discovery tooling, and ecosystem hub.

[![CI](https://github.com/mission69b/suimpp/actions/workflows/ci.yml/badge.svg)](https://github.com/mission69b/suimpp/actions/workflows/ci.yml)

## Packages

| Package | Version | Description |
|---------|---------|-------------|
| [`@suimpp/mpp`](packages/mpp) | [![npm](https://img.shields.io/npm/v/@suimpp/mpp)](https://www.npmjs.com/package/@suimpp/mpp) | Sui USDC payment method for MPP — client + server |
| [`@suimpp/discovery`](packages/discovery) | [![npm](https://img.shields.io/npm/v/@suimpp/discovery)](https://www.npmjs.com/package/@suimpp/discovery) | Discovery validation CLI — OpenAPI checks + 402 probe |

## Apps

| App | Domain | Description |
|-----|--------|-------------|
| [`suimpp.dev`](apps/suimpp) | [suimpp.dev](https://suimpp.dev) | Ecosystem hub — server registry, payment explorer, spec, docs |

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
  │    WWW-Authenticate: MPP          │                              │
  │    method="sui" amount="0.01"     │                              │
  │    currency="0xdba...::usdc"      │                              │
  │    recipient="0xabc..."           │                              │
  │                                   │                              │
  │   ┌─ Build TX: split + transfer USDC ───────────────────────────>│
  │   └─ TX confirmed ←──────────────────────────────────────────────│
  │      digest: "Hp4oHHs..."        │                              │
  │                                   │                              │
  │── Retry + credential ───────────>│                              │
  │   {digest, signature}            │                              │
  │                                   │── getTransaction(digest) ──>│
  │                                   │   verify: success, amount,   │
  │                                   │   recipient matches          │
  │                                   │                              │
  │<── 200 OK + response ────────────│                              │
  │    Payment-Receipt: sui:...       │                              │
```

### Server Registration

Any server implementing the MPP protocol with Sui USDC can register on [suimpp.dev](https://suimpp.dev). Registration is validation-gated — no manual approval needed.

```
Provider enters URL at suimpp.dev/register
  │
  ├── 1. Validate (POST /api/validate)
  │     ├── Fetch {url}/openapi.json
  │     │   → Parse OpenAPI 3.x document
  │     │   → Extract endpoints with x-payment-info
  │     │   → Validate schemas, pricing, 402 responses
  │     │
  │     ├── Probe first POST endpoint
  │     │   → Send empty request, expect 402
  │     │   → Parse WWW-Authenticate header
  │     │   → Verify: method=sui, valid USDC type, valid recipient
  │     │
  │     └── Return pass/fail checklist
  │
  ├── 2. Preview
  │     → Server name, endpoint count, price range
  │     → Scrollable endpoint list with pricing
  │
  └── 3. Register (POST /api/register)
        → Re-validates server-side (never trust client)
        → Creates Server record with slug, categories, endpoints
        → Server appears at /servers/{slug}
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

Payments are reported by the gateway (application layer), not by the library directly. This ensures every report includes both on-chain data and HTTP request context.

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
                                        │ suimpp.dev/api/report│
                                        │                     │
                                        │ Match server by URL │
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
    // 3. Single report with all fields
    fetch('https://suimpp.dev/api/report', {
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
