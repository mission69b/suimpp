'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface ValidationIssue {
  code: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  path?: string;
  method?: string;
}

interface DiscoveredEndpoint {
  path: string;
  method: string;
  paymentInfo: { price?: string; amount?: string; pricingMode?: string };
}

interface CheckResult {
  ok: boolean;
  origin: string;
  discovery: {
    ok: boolean;
    title: string;
    version: string;
    guidance?: string;
    endpoints: DiscoveredEndpoint[];
    totalEndpoints: number;
    paidEndpoints: number;
    issues: ValidationIssue[];
  };
  probe?: {
    ok: boolean;
    url: string;
    statusCode: number;
    hasSuiPayment: boolean;
    recipient?: string;
    currency?: string;
    amount?: string;
    issues: ValidationIssue[];
  };
  summary: {
    totalIssues: number;
    errors: number;
    warnings: number;
  };
}

type Stage = 'input' | 'validating' | 'results' | 'registering' | 'done';

export function RegisterForm() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [stage, setStage] = useState<Stage>('input');
  const [result, setResult] = useState<CheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [slug, setSlug] = useState<string | null>(null);

  const handleValidate = useCallback(async () => {
    if (!url.trim()) return;
    setStage('validating');
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/validate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok && !data.discovery) {
        setError(data.error || 'Validation failed');
        setStage('input');
        return;
      }
      setResult(data);
      setStage('results');
    } catch {
      setError('Network error — could not reach validation service');
      setStage('input');
    }
  }, [url]);

  const handleRegister = useCallback(async () => {
    if (!result?.ok) return;
    setStage('registering');
    setError(null);

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.slug) {
          setSlug(data.slug);
          setStage('done');
          return;
        }
        setError(data.error || 'Registration failed');
        setStage('results');
        return;
      }
      setSlug(data.slug);
      setStage('done');
    } catch {
      setError('Network error');
      setStage('results');
    }
  }, [result, url]);

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-medium">Add your Server</h1>
        <p className="text-sm text-muted leading-relaxed max-w-lg">
          Register your MPP-compatible server to be discoverable by the suimpp
          explorer and API. Once registered, we&apos;ll begin tracking transactions
          and activity.
        </p>
      </header>

      {/* Discovery Spec Banner */}
      <a
        href="/discovery"
        className="flex items-center gap-4 rounded-lg border border-border bg-surface p-4 hover:border-accent/30 transition-colors group"
      >
        <span className="shrink-0 w-10 h-10 rounded-lg bg-border flex items-center justify-center text-text text-lg">
          &#x1D4D3;
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-text group-hover:text-accent transition-colors">
            Read the Discovery Spec
          </div>
          <div className="text-xs text-muted mt-0.5">
            Learn how MPP-compatible servers expose their endpoints for discovery.
          </div>
        </div>
        <span className="text-muted group-hover:text-accent transition-colors shrink-0">→</span>
      </a>

      {/* URL Input */}
      <div className="space-y-3">
        <label className="text-xs text-muted" htmlFor="server-url">
          Server Base URL
        </label>
        <div className="flex gap-2">
          <input
            id="server-url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleValidate()}
            placeholder="https://mpp.example.com"
            disabled={stage === 'validating' || stage === 'registering'}
            className="flex-1 bg-surface border border-border rounded-lg px-4 py-2.5 text-sm text-text placeholder:text-muted/40 focus:outline-none focus:border-accent/50 disabled:opacity-50"
          />
          <button
            onClick={handleValidate}
            disabled={!url.trim() || stage === 'validating' || stage === 'registering'}
            className="px-5 py-2.5 rounded-lg bg-accent text-bg text-sm font-medium hover:bg-accent-hover disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer shrink-0"
          >
            {stage === 'validating' ? 'Validating...' : 'Validate →'}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-error/30 bg-error/5 px-4 py-3 text-xs text-error">
          {error}
        </div>
      )}

      {/* Validation Checks */}
      {result && (
        <div className="space-y-6">
          <div className="rounded-lg border border-border bg-surface p-5 space-y-3">
            <h3 className="text-sm font-medium">Validation Checks</h3>
            <div className="space-y-2">
              <Check
                pass={result.discovery.ok || result.discovery.paidEndpoints > 0}
                label={`OpenAPI document found at /openapi.json`}
              />
              <Check
                pass={result.discovery.paidEndpoints > 0}
                label={`${result.discovery.paidEndpoints} payable endpoint${result.discovery.paidEndpoints !== 1 ? 's' : ''} detected`}
              />
              {result.probe && (
                <>
                  <Check
                    pass={result.probe.statusCode === 402}
                    label="402 challenge response verified"
                  />
                  <Check
                    pass={result.probe.hasSuiPayment}
                    label="Sui USDC payment method detected"
                  />
                  {result.probe.recipient && (
                    <Check
                      pass={!!result.probe.recipient}
                      label={`Recipient: ${truncate(result.probe.recipient)}`}
                    />
                  )}
                </>
              )}
              {result.discovery.issues.map((issue, i) => (
                <Check
                  key={`d-${i}`}
                  pass={issue.severity !== 'error'}
                  warn={issue.severity === 'warning'}
                  label={issue.message}
                />
              ))}
              {result.probe?.issues.map((issue, i) => (
                <Check
                  key={`p-${i}`}
                  pass={issue.severity !== 'error'}
                  warn={issue.severity === 'warning'}
                  label={issue.message}
                />
              ))}
            </div>

            <div className="pt-2 border-t border-border/50">
              {result.ok ? (
                <span className="text-xs text-success font-medium">
                  All checks passed
                </span>
              ) : (
                <span className="text-xs text-muted">
                  {result.summary.errors} error{result.summary.errors !== 1 ? 's' : ''}
                  {result.summary.warnings > 0 && `, ${result.summary.warnings} warning${result.summary.warnings !== 1 ? 's' : ''}`}
                  {' — '}fix errors to register
                </span>
              )}
            </div>
          </div>

          {/* Endpoint Preview */}
          {result.discovery.paidEndpoints > 0 && (
            <div className="rounded-lg border border-border bg-surface p-5 space-y-3">
              <h3 className="text-sm font-medium">Preview</h3>
              <div className="space-y-1">
                <div className="text-base font-medium">{result.discovery.title}</div>
                <div className="text-xs text-muted">
                  {result.discovery.paidEndpoints} endpoint{result.discovery.paidEndpoints !== 1 ? 's' : ''}
                  {priceRange(result.discovery.endpoints) && ` · ${priceRange(result.discovery.endpoints)}`}
                </div>
                {result.discovery.guidance && (
                  <p className="text-xs text-muted/80 mt-1">{result.discovery.guidance}</p>
                )}
              </div>

              {/* Endpoint list */}
              <div className="max-h-48 overflow-y-auto space-y-1 mt-2">
                {result.discovery.endpoints.slice(0, 20).map((ep, i) => (
                  <div key={i} className="flex items-center justify-between text-xs font-mono py-1">
                    <span className="text-muted truncate">
                      <span className="text-muted/50 mr-2">{ep.method}</span>
                      {ep.path}
                    </span>
                    <span className="text-text shrink-0 ml-3">
                      {ep.paymentInfo.price ?? ep.paymentInfo.amount ?? 'dynamic'}
                    </span>
                  </div>
                ))}
                {result.discovery.endpoints.length > 20 && (
                  <div className="text-[10px] text-muted/50 pt-1">
                    ... and {result.discovery.endpoints.length - 20} more
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Register Button */}
          {result.ok && (
            <button
              onClick={handleRegister}
              disabled={stage === 'registering'}
              className="w-full py-3 rounded-lg bg-accent text-bg font-medium hover:bg-accent-hover disabled:opacity-40 transition-colors cursor-pointer text-sm"
            >
              {stage === 'registering' ? 'Registering...' : 'Register Server'}
            </button>
          )}
        </div>
      )}

      {/* Success */}
      {stage === 'done' && slug && (
        <div className="rounded-lg border border-success/30 bg-success/5 p-6 text-center space-y-3">
          <div className="text-success text-lg font-medium">Server registered</div>
          <p className="text-sm text-muted">
            Your server is now listed on suimpp.dev. Payments will be tracked automatically.
          </p>
          <button
            onClick={() => router.push(`/servers/${slug}`)}
            className="text-sm text-accent hover:underline cursor-pointer"
          >
            View your server →
          </button>
        </div>
      )}

      {/* Help Footer */}
      <div className="border-t border-border pt-6 space-y-2">
        <span className="text-xs text-muted">Need help?</span>
        <div className="flex flex-wrap gap-4">
          {[
            { href: '/discovery', label: 'Discovery Spec' },
            { href: 'https://www.npmjs.com/package/@suimpp/discovery', label: 'Validation CLI' },
            { href: 'https://discord.gg/qE95FPt6Z5', label: 'Discord' },
          ].map((link) => (
            <a
              key={link.href}
              href={link.href}
              target={link.href.startsWith('/') ? undefined : '_blank'}
              rel={link.href.startsWith('/') ? undefined : 'noopener noreferrer'}
              className="text-xs text-accent hover:underline"
            >
              {link.label} →
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

function Check({ pass, warn, label }: { pass: boolean; warn?: boolean; label: string }) {
  const icon = pass
    ? warn
      ? '⚠'
      : '✓'
    : '✗';
  const color = pass
    ? warn
      ? 'text-yellow-400'
      : 'text-success'
    : 'text-error';

  return (
    <div className="flex items-start gap-2 text-xs">
      <span className={`${color} shrink-0 w-4 text-center`}>{icon}</span>
      <span className="text-muted">{label}</span>
    </div>
  );
}

function truncate(s: string) {
  if (s.length <= 16) return s;
  return `${s.slice(0, 8)}...${s.slice(-6)}`;
}

function priceRange(endpoints: DiscoveredEndpoint[]): string | null {
  const prices = endpoints
    .map((ep) => parseFloat(ep.paymentInfo.price ?? ep.paymentInfo.amount ?? ''))
    .filter((n) => !isNaN(n))
    .sort((a, b) => a - b);

  if (prices.length === 0) return null;
  if (prices.length === 1) return `$${prices[0]}`;
  const min = prices[0];
  const max = prices[prices.length - 1];
  if (min === max) return `$${min}`;
  return `$${min}–$${max}`;
}
