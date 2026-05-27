/* eslint-disable react/no-unescaped-entities */

const TOC = [
  {
    group: "OVERVIEW",
    items: [
      { id: "preamble", label: "Preamble" },
      { id: "terminology", label: "Terminology" },
      { id: "scope", label: "Scope" },
    ],
  },
  {
    group: "PROTOCOL",
    items: [
      { id: "challenge", label: "1. The 402 challenge" },
      { id: "credential", label: "2. The Payment credential" },
      { id: "settlement", label: "3. Settlement on Sui" },
      { id: "verification", label: "4. Verification" },
    ],
  },
  {
    group: "DISCOVERY",
    items: [
      { id: "openapi", label: "5. OpenAPI advertisement" },
      { id: "extension", label: "6. x-payment-info" },
    ],
  },
  {
    group: "OPERATIONAL",
    items: [
      { id: "reporting", label: "7. Payment reporting" },
      { id: "errors", label: "8. Errors" },
      { id: "security", label: "9. Security" },
    ],
  },
  {
    group: "REFERENCE",
    items: [
      { id: "appendix-a", label: "Appendix A · USDC types" },
      { id: "appendix-b", label: "Appendix B · References" },
    ],
  },
];

export function SpecContent() {
  return (
    <div className="su-doc">
      <aside className="su-doc-toc">
        {TOC.map((g) => (
          <div key={g.group}>
            <div className="group">{g.group}</div>
            <ul>
              {g.items.map((it) => (
                <li key={it.id}>
                  <a href={`#${it.id}`}>{it.label}</a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </aside>

      <article className="su-prose">
        <div className="mb-4 flex items-center gap-2.5">
          <span className="su-tag">
            <span className="dot" />
            v0.1 · draft
          </span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "var(--fg-subtle)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            // SPECIFICATION
          </span>
        </div>

        <h1>Machine Payments Protocol — Sui</h1>
        <p style={{ marginTop: 8, color: "var(--fg-muted)", fontSize: 17, lineHeight: 1.55 }}>
          The MPP standard, bound to <a href="https://sui.io">Sui</a>. <strong>USDC</strong> as the settlement currency.
        </p>

        <H2 id="preamble">Preamble</H2>
        <p>
          The Machine Payments Protocol (MPP) is an open standard, originally specified by{" "}
          <a href="https://stripe.com">Stripe</a> and{" "}
          <a href="https://tempo.io">Tempo Labs</a>, for autonomous agent-to-service payments over HTTP. This document defines the <strong>Sui binding</strong> of MPP — the rules a server and client follow when settling MPP challenges on the Sui chain using USDC.
        </p>
        <p>
          This document, version <code>0.1</code>, is a draft. Implementers should expect breaking changes between draft revisions. The reference implementation is{" "}
          <a href="https://www.npmjs.com/package/@suimpp/mpp">@suimpp/mpp</a> at version <code>0.7</code> or later, layered over{" "}
          <a href="https://www.npmjs.com/package/mppx">mppx</a>. The normative behavior is described in sections 1 through 9. Appendices are informative.
        </p>

        <H2 id="terminology">Terminology</H2>
        <p>
          The key words <strong>MUST</strong>, <strong>SHOULD</strong>, and <strong>MAY</strong> in this document are to be interpreted as described in{" "}
          <a href="https://www.rfc-editor.org/rfc/rfc2119">RFC 2119</a>.
        </p>
        <table>
          <thead>
            <tr><th>Term</th><th>Definition</th></tr>
          </thead>
          <tbody>
            <tr><td>Agent</td><td>The HTTP client initiating paid requests on behalf of a human or another program.</td></tr>
            <tr><td>Server</td><td>The HTTP server advertising paid endpoints and verifying payments.</td></tr>
            <tr><td>Gateway</td><td>An application layer that wraps one or more upstream APIs in MPP semantics.</td></tr>
            <tr><td>Challenge</td><td>The structured 402 response naming the endpoint's price, recipient, and currency.</td></tr>
            <tr><td>Credential</td><td>The signed payload an agent attaches to a retry to satisfy a challenge.</td></tr>
            <tr><td>Digest</td><td>A Sui transaction digest — the canonical reference to a settled payment.</td></tr>
            <tr><td>Coin type</td><td>A Move type tag identifying the asset being transferred, e.g. <code>0xdba…::usdc::USDC</code>.</td></tr>
            <tr><td>Sponsored transaction</td><td>A Sui transaction whose gas is paid by a sponsor object, leaving the sender to pay zero SUI.</td></tr>
          </tbody>
        </table>

        <H2 id="scope">Scope</H2>
        <p>This binding defines:</p>
        <ul>
          <li>The shape of the HTTP <code>402 Payment Required</code> challenge a Sui-MPP server returns.</li>
          <li>The shape of the credential a client sends to satisfy that challenge.</li>
          <li>The verification a server <strong>MUST</strong> perform against the Sui chain before responding 200.</li>
          <li>The OpenAPI extension a server <strong>SHOULD</strong> use to advertise its terms.</li>
        </ul>
        <p>
          Out of scope: how the agent acquires USDC, how the server prices its endpoints, how off-chain receipts are stored, or how clients select among multiple offered payment methods.
        </p>

        <H2 id="challenge">1. The 402 challenge</H2>
        <p>
          When a request arrives at a paid endpoint without a valid <code>Authorization</code> header, the server <strong>MUST</strong> respond with HTTP status <code>402 Payment Required</code> and one or more <code>WWW-Authenticate</code> headers using the <code>Payment</code> scheme. Each header carries a single offered payment method:
        </p>
        <pre><code>{`HTTP/1.1 402 Payment Required
WWW-Authenticate: Payment id="a1b2c3...",
  realm="api.example.com",
  method="sui",
  intent="charge",
  request="eyJhbW91bnQiOiIwLjAxMiIsImN1cnJlbmN5IjoiMHhkYmEzNDY3M..."`}</code></pre>
        <p>The parameters carry the following meanings:</p>
        <table>
          <thead>
            <tr><th>Parameter</th><th>Meaning</th></tr>
          </thead>
          <tbody>
            <tr><td>id</td><td>An opaque challenge identifier, unique per 402 response. Used by the client to bind its credential to a specific challenge.</td></tr>
            <tr><td>realm</td><td>An opaque realm string (typically the server's hostname). Clients <strong>SHOULD</strong> echo this back in any UI.</td></tr>
            <tr><td>method</td><td>Always <code>"sui"</code> for this binding. Servers <strong>MAY</strong> emit multiple <code>WWW-Authenticate</code> headers to offer alternative methods.</td></tr>
            <tr><td>intent</td><td>Always <code>"charge"</code> for this binding.</td></tr>
            <tr><td>request</td><td>A base64url-encoded JSON object carrying the price terms. The agent <strong>MUST</strong> decode it to obtain <code>amount</code>, <code>currency</code>, and <code>recipient</code>.</td></tr>
            <tr><td>expires</td><td>Optional. Unix timestamp (seconds) after which the server <strong>MUST</strong> reject any credential bound to this challenge.</td></tr>
          </tbody>
        </table>
        <p>The decoded <code>request</code> object is shaped:</p>
        <pre><code>{`{
  "amount":    "0.012",                  // decimal string, in units of currency
  "currency":  "0xdba…::usdc::USDC",     // full Sui Move type tag
  "recipient": "0xabc…def012"            // Sui address that MUST receive the transfer
}`}</code></pre>
        <p>
          Servers <strong>MUST</strong> reject any retry whose decoded request mismatches the original challenge by amount, currency, or recipient — agents <strong>MUST NOT</strong> tamper with these fields.
        </p>

        <H2 id="credential">2. The Payment credential</H2>
        <p>
          To satisfy a 402 challenge, the client <strong>MUST</strong> retry the original request with an additional <code>Authorization</code> header using the <code>Payment</code> scheme:
        </p>
        <pre><code>{`POST /api/resource HTTP/1.1
Host: api.example.com
Authorization: Payment eyJjaGFsbGVuZ2UiOnsiaWQiOiJhMWIyYzMuLi4iLCJyZWFs...`}</code></pre>
        <p>
          The portion following <code>Payment </code> is a base64url-encoded JSON object containing:
        </p>
        <pre><code>{`{
  "challenge": { … },           // the deserialized challenge, echoed back verbatim
  "payload": {
    "digest":    "Hp4oHHs...",  // the Sui transaction digest
    "signature": "ALxw..."      // grief-protection signature (REQUIRED since 0.7)
  }
}`}</code></pre>
        <p>
          The <code>payload.signature</code> field is a Sui <em>personal-message signature</em> over a deterministic message binding the sender's identity to this exact challenge and digest. Without it, an attacker who observes a digest on-chain or in transit could submit it as their own credential and consume the paid request. The signed message is:
        </p>
        <pre><code>{`{
  "domain":       "suimpp.sui.payment-proof",
  "version":      1,
  "method":       "sui",
  "intent":       "charge",
  "challengeId":  "<challenge.id>",
  "amount":       "<challenge.request.amount>",
  "currency":     "<challenge.request.currency>",
  "recipient":    "<challenge.request.recipient>",
  "digest":       "<payload.digest>"
}`}</code></pre>
        <p>
          The client <strong>MUST</strong> sign this message with the same Sui keypair that signed the on-chain settlement transaction (§3).
        </p>

        <H2 id="settlement">3. Settlement on Sui</H2>
        <p>
          The client builds a Sui programmable transaction block (PTB) that transfers <code>amount</code> of <code>currency</code> to <code>recipient</code>, signs it, and submits it. The transaction <strong>MUST</strong>:
        </p>
        <ul>
          <li>Be executed against the network advertised in the 402 challenge (see Appendix A for canonical coin types per network).</li>
          <li>Reach status <code>success</code> before the credential is sent.</li>
          <li>Transfer at least <code>amount</code> of <code>currency</code> to <code>recipient</code>, net of any coin splits. Overpayment is permitted but not refunded.</li>
          <li>Be signed by a keypair whose address equals the on-chain sender. Multi-sig and sponsored signing schemes are permitted as long as the eventual on-chain sender matches.</li>
        </ul>
        <p>
          Sui's <strong>sponsored transaction</strong> capability is supported. When the canonical USDC coin type is used (Appendix A), the reference SDK requests a sponsor object from the Sui Foundation gasless tier and constructs the PTB so the sender pays zero SUI for gas. Servers <strong>MUST NOT</strong> reject a payment for being sponsored.
        </p>

        <H2 id="verification">4. Verification</H2>
        <p>
          On receiving a retry with an <code>Authorization: Payment</code> header, the server <strong>MUST</strong> perform <em>all</em> of the following before responding 200:
        </p>
        <ol>
          <li>Decode the credential and extract <code>challenge</code> and <code>payload</code>.</li>
          <li>If the original challenge carried an <code>expires</code> parameter and it has passed, reject with a fresh 402.</li>
          <li>If <code>payload.digest</code> is already present in the server's digest store, reject with <code>409 Conflict</code> (replay defense — see §9).</li>
          <li>Fetch the transaction from a trusted Sui RPC. The reference implementation uses{" "}
            <code>client.core.getTransaction(&#123;digest, include: &#123;balanceChanges, transaction&#125;&#125;)</code>.</li>
          <li>Verify the transaction status is <code>success</code>.</li>
          <li>Verify the balance changes include an entry where <code>coinType</code> equals <code>request.currency</code>, the recipient address (normalized) equals <code>request.recipient</code>, and the transferred amount (in raw units) is greater than or equal to <code>request.amount</code> converted using the currency's decimals.</li>
          <li>Verify the grief-protection signature: recover the signing public key from <code>payload.signature</code> over the message defined in §2. Reject if the recovered Sui address does not equal the on-chain transaction sender.</li>
          <li>Persist <code>payload.digest</code> in the digest store. The store <strong>MUST</strong> retain the digest for at least the challenge expiry window.</li>
          <li>Handle the original request and respond <code>200 OK</code>. The response <strong>SHOULD</strong> include a <code>Payment-Receipt</code> header carrying the receipt token.</li>
        </ol>
        <p>
          Any failure in steps 2 through 7 <strong>MUST</strong> result in a fresh <code>402 Payment Required</code> response. The server <strong>MUST NOT</strong> consume agent balance or partially fulfill a request that fails verification.
        </p>

        <H2 id="openapi">5. OpenAPI advertisement</H2>
        <p>
          Servers <strong>SHOULD</strong> publish an OpenAPI 3.x document at <code>/openapi.json</code>. This makes the server discoverable by tooling — including the{" "}
          <a href="https://www.npmjs.com/package/@suimpp/discovery">@suimpp/discovery</a> validator — without out-of-band coordination.
        </p>
        <p>
          The document <strong>SHOULD</strong> mark every paid operation with the <code>x-payment-info</code> extension defined in §6, and <strong>SHOULD</strong> declare a <code>"402"</code> response describing the challenge body shape.
        </p>

        <H2 id="extension">6. <code>x-payment-info</code></H2>
        <p>The <code>x-payment-info</code> object is attached to an OpenAPI operation to declare the endpoint's price terms:</p>
        <pre><code>{`paths:
  /v1/chat/completions:
    post:
      x-payment-info:
        method: sui
        amount: "0.005"
        currency: "0xdba…::usdc::USDC"
        recipient: "0xabc…def012"
        network: mainnet
        unit: per_request
      responses:
        "200": { … }
        "402": { … }`}</code></pre>
        <p>
          Allowed values for <code>unit</code> are <code>per_request</code>, <code>per_token</code>, <code>per_second</code>, and <code>tiered</code>. When <code>per_token</code> or <code>tiered</code> is used, the actual challenge amount is computed at request time and is only authoritative in the 402 response.
        </p>

        <H2 id="reporting">7. Payment reporting (informative)</H2>
        <p>
          Gateways <strong>MAY</strong> report settled payments to a directory service for ecosystem visibility. Reporting is opt-in and <strong>MUST NOT</strong> block a 200 response.
        </p>
        <p>
          The library emits on-chain context via an <code>onPayment</code> callback. The host enriches it with HTTP context (which service / endpoint was called) and POSTs the joined record to any registry. A single report carries all fields:
        </p>
        <pre><code>{`POST https://<registry>/api/report
Content-Type: application/json

{
  "digest":    "Hp4oHHs...",
  "sender":    "0xagent...",
  "recipient": "0xabc...def012",
  "amount":    "0.012",
  "currency":  "0xdba...::usdc::USDC",
  "network":   "mainnet",
  "serverUrl": "https://api.example.com",
  "service":   "openai",
  "endpoint":  "/v1/chat/completions"
}`}</code></pre>

        <H2 id="errors">8. Errors</H2>
        <p>
          Errors are conveyed via HTTP status codes. Servers <strong>MUST</strong> use the codes below; clients <strong>MUST</strong> treat unrecognized codes per <a href="https://www.rfc-editor.org/rfc/rfc9110">RFC 9110</a>.
        </p>
        <table>
          <thead>
            <tr><th>Status</th><th>Meaning</th></tr>
          </thead>
          <tbody>
            <tr><td>402</td><td>Payment required, or the supplied credential is invalid, expired, or fails verification.</td></tr>
            <tr><td>400</td><td>Malformed <code>Authorization: Payment</code> header or credential JSON.</td></tr>
            <tr><td>404</td><td>Endpoint exists but is not paid (no challenge to issue).</td></tr>
            <tr><td>409</td><td>Digest already redeemed.</td></tr>
            <tr><td>503</td><td>Sui RPC unreachable — server cannot verify. Client <strong>MAY</strong> retry.</td></tr>
          </tbody>
        </table>

        <H2 id="security">9. Security considerations</H2>
        <ul>
          <li><strong>Replay defense.</strong> A digest <strong>MUST</strong> be redeemable exactly once. Servers <strong>MUST</strong> persist consumed digests for at least the challenge expiry window. The reference implementation requires a non-default <code>DigestStore</code> in production; <code>InMemoryDigestStore</code> is for development only.</li>
          <li><strong>Grief protection.</strong> Without the §2 signature, anyone observing a digest in mempool or on-chain could submit it as their own credential and consume the paid request. Servers <strong>MUST</strong> verify the recovered signer equals the on-chain transaction sender.</li>
          <li><strong>Recipient verification.</strong> The recipient address in the decoded request <strong>MUST</strong> exactly match the one found on-chain. Address normalization (case, padding, zero-extension) is the server's responsibility.</li>
          <li><strong>Network confusion.</strong> Servers <strong>MUST</strong> reject digests from networks other than the one they configured — a testnet digest <strong>MUST NOT</strong> satisfy a mainnet challenge.</li>
          <li><strong>Amount precision.</strong> Servers <strong>MUST</strong> compare transferred and requested amounts in raw integer units (BigInt). Floating-point arithmetic introduces rounding errors that can be exploited to underpay.</li>
          <li><strong>RPC trust.</strong> Verification is only as trustworthy as the Sui RPC the server queries. Production servers <strong>SHOULD</strong> consult more than one independent RPC or run a self-hosted full node.</li>
          <li><strong>Privacy.</strong> The sender address is on-chain and public. Servers <strong>SHOULD</strong> avoid logging sender addresses alongside personally identifying request context unless required.</li>
        </ul>

        <H2 id="appendix-a">Appendix A · Canonical USDC types</H2>
        <p>
          The following coin types are recognized as USDC by the reference implementation. Servers <strong>SHOULD</strong> accept any matching their declared network; clients <strong>SHOULD</strong> default to the mainnet type.
        </p>
        <table>
          <thead>
            <tr><th>Network</th><th>Coin type</th></tr>
          </thead>
          <tbody>
            <tr>
              <td>mainnet</td>
              <td><code>0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC</code></td>
            </tr>
            <tr>
              <td>testnet</td>
              <td><code>0xa1ec7fc00a6f40db9693ad1415d0c193ad3906494428cf252621037bd7117e29::usdc::USDC</code></td>
            </tr>
          </tbody>
        </table>
        <p>
          Both have 6 decimals. The constants are exported from <code>@suimpp/mpp</code> as <code>USDC</code> and <code>USDC_TESTNET</code>.
        </p>

        <H2 id="appendix-b">Appendix B · References</H2>
        <ul>
          <li><a href="https://github.com/mission69b/suimpp">github.com/mission69b/suimpp</a> — reference implementation source.</li>
          <li><a href="https://www.npmjs.com/package/@suimpp/mpp">@suimpp/mpp</a> — Sui USDC payment method for MPP.</li>
          <li><a href="https://www.npmjs.com/package/mppx">mppx</a> — framework-agnostic MPP protocol SDK.</li>
          <li><a href="https://docs.sui.io">docs.sui.io</a> — Sui transaction semantics, PTBs, sponsored transactions.</li>
          <li><a href="https://www.rfc-editor.org/rfc/rfc9110">RFC 9110</a> — HTTP semantics.</li>
          <li><a href="https://spec.openapis.org/oas/v3.1.0">OpenAPI 3.1</a> — interface description format.</li>
        </ul>
      </article>
    </div>
  );
}

function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id}>
      {children}
      <a className="su-anchor" href={`#${id}`} aria-label="Link to section">
        #
      </a>
    </h2>
  );
}
