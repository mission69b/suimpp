'use client';

import { CopyBlock } from '../components/CopyBlock';

export function SpecContent() {
  return (
    <article className="space-y-12">
      <header className="space-y-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-medium">Sui Charge Method</h1>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-border text-muted">
            v1.0
          </span>
        </div>
        <p className="text-sm text-muted max-w-xl leading-relaxed">
          The <code className="text-text bg-surface px-1.5 py-0.5 rounded border border-border text-xs">sui</code> charge
          method enables on-chain USDC micropayments on the Sui network for the Machine Payments Protocol (MPP).
        </p>
      </header>

      {/* Overview */}
      <Section id="overview" title="Overview">
        <p>
          MPP uses HTTP 402 Payment Required to negotiate payments between clients and servers.
          The <code>sui</code> charge method implements this negotiation using USDC transfers on
          the Sui blockchain, providing sub-second finality and trustless verification.
        </p>
        <div className="grid sm:grid-cols-4 gap-4 mt-4">
          {[
            { label: 'Network', value: 'Sui (mainnet)' },
            { label: 'Currency', value: 'USDC' },
            { label: 'Finality', value: '~400ms' },
            { label: 'Verification', value: 'Peer-to-peer' },
          ].map((item) => (
            <div key={item.label} className="rounded-lg border border-border bg-surface p-3 space-y-1">
              <div className="text-[10px] uppercase tracking-wider text-muted/60">{item.label}</div>
              <div className="text-xs font-medium">{item.value}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* Flow */}
      <Section id="flow" title="Protocol Flow">
        <p>
          Every MPP payment follows a four-step request-challenge-pay-verify cycle:
        </p>
        <ol className="mt-4 space-y-4">
          <FlowStep num={1} title="Request">
            Client sends a standard HTTP request to the server endpoint.
          </FlowStep>
          <FlowStep num={2} title="Challenge (402)">
            Server responds with <code>402 Payment Required</code> and
            a <code>WWW-Authenticate</code> header containing the charge method, amount, currency, and recipient address.
          </FlowStep>
          <FlowStep num={3} title="Pay">
            Client parses the challenge, builds a Sui transaction transferring the
            requested USDC amount to the recipient, executes it on-chain, and
            retries the original request with the transaction digest as a credential.
          </FlowStep>
          <FlowStep num={4} title="Verify &amp; Deliver">
            Server queries the Sui RPC, confirms the transaction succeeded, verifies the
            payment amount and recipient, then returns the API response.
          </FlowStep>
        </ol>
      </Section>

      {/* Challenge Format */}
      <Section id="challenge" title="Challenge Format">
        <p>
          When a server requires payment, it responds with <code>402</code> and a challenge
          encoded in the <code>WWW-Authenticate</code> header:
        </p>
        <CopyBlock
          title="Response Header"
          code={`HTTP/1.1 402 Payment Required
WWW-Authenticate: MPP method="sui",
  amount="0.01",
  currency="0xdba346...::usdc::USDC",
  recipient="0xYOUR_SUI_ADDRESS"`}
        />
        <div className="mt-4">
          <Table
            headers={['Parameter', 'Type', 'Description']}
            rows={[
              ['method', 'string', '"sui" — identifies this charge method'],
              ['amount', 'string', 'Human-readable amount (e.g. "0.01" = 1 cent USDC)'],
              ['currency', 'string', 'Sui coin type — fully qualified Move type'],
              ['recipient', 'string', 'Sui address to receive payment (0x-prefixed, 64 hex chars)'],
            ]}
          />
        </div>
      </Section>

      {/* Credential Format */}
      <Section id="credential" title="Credential Format">
        <p>
          After executing the on-chain payment, the client retries the request with
          the credential in the <code>Authorization</code> header:
        </p>
        <CopyBlock
          title="Retry Request Header"
          code={`Authorization: MPP method="sui", digest="<TX_DIGEST>"`}
        />
        <div className="mt-4">
          <Table
            headers={['Parameter', 'Type', 'Description']}
            rows={[
              ['method', 'string', '"sui" — matches the challenge method'],
              ['digest', 'string', 'Sui transaction digest (Base58-encoded, 44 chars)'],
            ]}
          />
        </div>
      </Section>

      {/* Method Schema */}
      <Section id="schema" title="Method Schema">
        <p>
          The <code>sui</code> charge method is defined using the <code>mppx</code> Method schema:
        </p>
        <CopyBlock
          title="method.ts"
          lang="TypeScript"
          code={`import { Method, z } from 'mppx';

export const suiCharge = Method.from({
  intent: 'charge',
  name: 'sui',
  schema: {
    credential: {
      payload: z.object({
        digest: z.string(),
      }),
    },
    request: z.object({
      amount: z.string(),
      currency: z.string(),
      recipient: z.string(),
    }),
  },
});`}
        />
      </Section>

      {/* Verification */}
      <Section id="verification" title="Server Verification">
        <p>
          When the server receives a credential, it performs four verification steps:
        </p>
        <ol className="mt-4 space-y-4">
          <FlowStep num={1} title="Fetch transaction">
            Query the Sui RPC with <code>getTransaction</code> using the provided digest.
            Include <code>balanceChanges</code> in the response.
          </FlowStep>
          <FlowStep num={2} title="Check success">
            Verify <code>status.success === true</code>. Reject failed or pending transactions.
          </FlowStep>
          <FlowStep num={3} title="Find payment">
            Scan <code>balanceChanges</code> for an entry where:
            <ul className="mt-1.5 ml-4 space-y-1 text-muted">
              <li>• <code>coinType</code> matches the requested currency</li>
              <li>• <code>address</code> matches the recipient (normalized)</li>
              <li>• <code>amount</code> is positive (incoming transfer)</li>
            </ul>
          </FlowStep>
          <FlowStep num={4} title="Check amount">
            Convert the challenge <code>amount</code> to raw units using the currency&apos;s
            decimals (USDC = 6). Verify the transferred amount {'>='} requested amount.
          </FlowStep>
        </ol>
        <CopyBlock
          title="Verification logic (simplified)"
          lang="TypeScript"
          code={`const tx = await client.getTransaction({ digest, include: { balanceChanges: true } });

if (!tx.status.success) throw new Error('Transaction failed');

const payment = tx.balanceChanges.find(
  (bc) =>
    bc.coinType === currency &&
    normalize(bc.address) === normalize(recipient) &&
    BigInt(bc.amount) > 0n,
);

if (!payment) throw new Error('Payment not found');

const transferredRaw = BigInt(payment.amount);
const requestedRaw = parseAmountToRaw(amount, 6); // USDC = 6 decimals
if (transferredRaw < requestedRaw) throw new Error('Underpaid');`}
        />
      </Section>

      {/* Client Payment */}
      <Section id="client-payment" title="Client Payment">
        <p>
          When a client receives a 402 challenge, it builds and executes a Sui transaction:
        </p>
        <CopyBlock
          title="Payment construction"
          lang="TypeScript"
          code={`import { Transaction, coinWithBalance } from '@mysten/sui/transactions';

const tx = new Transaction();
tx.setSender(walletAddress);

const amountRaw = parseAmountToRaw(challenge.amount, 6);
const payment = coinWithBalance({ balance: amountRaw, type: challenge.currency });
tx.transferObjects([payment], challenge.recipient);

const result = await client.signAndExecuteTransaction({ transaction: tx });
// Credential: { digest: result.digest }`}
        />
        <p className="mt-4">
          The <code>coinWithBalance</code> helper automatically splits coins from the
          sender&apos;s balance. The transaction digest becomes the credential&apos;s
          proof of payment.
        </p>
      </Section>

      {/* Currency */}
      <Section id="currency" title="USDC on Sui">
        <p>
          The canonical USDC coin type on Sui mainnet:
        </p>
        <CopyBlock
          code="0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC"
        />
        <div className="mt-4">
          <Table
            headers={['Property', 'Value']}
            rows={[
              ['Decimals', '6'],
              ['1 USDC', '1,000,000 raw units'],
              ['$0.01', '10,000 raw units'],
              ['Min practical', '$0.000001 (1 raw unit)'],
              ['Issuer', 'Circle (native issuance on Sui)'],
            ]}
          />
        </div>
      </Section>

      {/* Amount Parsing */}
      <Section id="amounts" title="Amount Parsing">
        <p>
          Amounts in challenges and credentials are human-readable strings (e.g. <code>&quot;0.01&quot;</code>).
          Both client and server must convert to raw units for on-chain operations:
        </p>
        <CopyBlock
          title="parseAmountToRaw"
          lang="TypeScript"
          code={`function parseAmountToRaw(amount: string, decimals: number): bigint {
  const [whole = '0', frac = ''] = amount.split('.');
  const paddedFrac = frac.padEnd(decimals, '0').slice(0, decimals);
  return BigInt(whole + paddedFrac);
}

// Examples:
// parseAmountToRaw("0.01", 6)  → 10000n
// parseAmountToRaw("1",    6)  → 1000000n
// parseAmountToRaw("0.5",  6)  → 500000n`}
        />
      </Section>

      {/* Security */}
      <Section id="security" title="Security Considerations">
        <div className="space-y-4">
          <SecurityItem title="Replay protection">
            Each transaction digest is unique. Servers should track used digests to prevent
            replay. Alternatively, the on-chain finality and balance-change check makes
            double-spending impossible.
          </SecurityItem>
          <SecurityItem title="Amount precision">
            Always use <code>BigInt</code> for amount comparisons. Floating-point arithmetic
            can produce rounding errors that allow underpayment.
          </SecurityItem>
          <SecurityItem title="Address normalization">
            Always normalize Sui addresses (lowercase, 0x prefix, zero-padded to 64 hex chars)
            before comparison. Use <code>normalizeSuiAddress()</code> from <code>@mysten/sui/utils</code>.
          </SecurityItem>
          <SecurityItem title="Transaction finality">
            Sui provides immediate finality. No confirmation wait is needed — if the RPC
            returns the transaction with <code>success: true</code>, the payment is irreversible.
          </SecurityItem>
          <SecurityItem title="RPC trust">
            Verification depends on a trusted Sui RPC endpoint. Use official fullnodes
            or run your own for production deployments.
          </SecurityItem>
        </div>
      </Section>

      {/* Packages */}
      <Section id="packages" title="Reference Implementation">
        <p>The official TypeScript implementation:</p>
        <div className="mt-4 space-y-3">
          <PackageLink
            name="@suimpp/mpp"
            description="Sui USDC charge method (client + server)"
            href="https://www.npmjs.com/package/@suimpp/mpp"
          />
          <PackageLink
            name="mppx"
            description="MPP protocol SDK (framework-agnostic)"
            href="https://www.npmjs.com/package/mppx"
          />
          <PackageLink
            name="@suimpp/discovery"
            description="Server validation CLI"
            href="https://www.npmjs.com/package/@suimpp/discovery"
          />
        </div>
      </Section>

      {/* Links */}
      <section className="border-t border-border pt-8 space-y-2">
        {[
          { href: '/discovery', label: 'Discovery spec — OpenAPI & validation' },
          { href: '/agent', label: 'Use APIs with MPP' },
          { href: '/register', label: 'Register your server' },
          { href: '/docs', label: 'Developer guide' },
          { href: '/servers', label: 'Browse servers' },
          { href: 'https://mpp.dev', label: 'MPP Protocol' },
          { href: 'https://github.com/mission69b/suimpp', label: 'GitHub' },
        ].map((link) => (
          <a
            key={link.href}
            href={link.href}
            target={link.href.startsWith('/') ? undefined : '_blank'}
            rel={link.href.startsWith('/') ? undefined : 'noopener noreferrer'}
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

function FlowStep({ num, title, children }: { num: number; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="shrink-0 w-6 h-6 rounded-full bg-border text-muted text-xs font-mono flex items-center justify-center">
        {num}
      </span>
      <div>
        <span className="text-text font-medium text-sm">{title}</span>
        <div className="mt-1 text-sm text-muted leading-relaxed [&_code]:text-text [&_code]:bg-surface [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:border [&_code]:border-border [&_code]:text-xs [&_code]:font-mono">
          {children}
        </div>
      </div>
    </li>
  );
}

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-surface">
            {headers.map((h) => (
              <th key={h} className="text-left px-4 py-2 font-medium text-muted/80 border-b border-border">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-border/50 last:border-0">
              {row.map((cell, j) => (
                <td key={j} className={`px-4 py-2 ${j === 0 ? 'font-mono text-text' : 'text-muted'}`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SecurityItem({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4 space-y-1">
      <div className="text-xs font-medium text-text">{title}</div>
      <div className="text-xs text-muted leading-relaxed [&_code]:text-text [&_code]:bg-bg [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:border [&_code]:border-border [&_code]:text-[11px] [&_code]:font-mono">
        {children}
      </div>
    </div>
  );
}

function PackageLink({ name, description, href }: { name: string; description: string; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between rounded-lg border border-border bg-surface p-4 hover:border-accent/30 transition-colors group"
    >
      <div>
        <span className="font-mono text-sm text-text">{name}</span>
        <p className="text-xs text-muted mt-0.5">{description}</p>
      </div>
      <span className="text-muted group-hover:text-accent transition-colors">→</span>
    </a>
  );
}
