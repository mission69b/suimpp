'use client';

import { useState, useCallback } from 'react';
import { highlight } from 'sugar-high';

function CodeBlock({
  title,
  code,
  cta,
  href,
}: {
  title: string;
  code: string;
  cta: string;
  href: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [code]);

  const highlighted = highlight(code);

  return (
    <div className="rounded-lg border border-border bg-surface overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="text-sm font-medium">{title}</span>
        <button
          onClick={handleCopy}
          className="px-2 py-0.5 rounded text-[10px] font-mono text-muted hover:text-accent hover:border-accent/40 border border-transparent transition-all cursor-pointer"
          aria-label="Copy to clipboard"
        >
          {copied ? 'copied' : 'copy'}
        </button>
      </div>
      <pre className="sh p-4 font-mono text-xs leading-relaxed flex-1 overflow-x-auto">
        <code dangerouslySetInnerHTML={{ __html: highlighted }} />
      </pre>
      <div className="px-4 py-3 border-t border-border">
        <a
          href={href}
          className="text-xs text-accent hover:text-accent-hover transition-colors"
        >
          {cta} →
        </a>
      </div>
    </div>
  );
}

const CLIENT_CODE = `import { Mppx } from 'mppx/client';
import { sui } from '@suimpp/mpp/client';
import { SuiGrpcClient } from '@mysten/sui/grpc';

const mpp = Mppx.create({
  methods: [sui({ client, signer })],
});

const res = await mpp.fetch(
  'https://mpp.t2000.ai/openai/v1/chat/completions',
  { method: 'POST', body: JSON.stringify({ ... }) }
);`;

const SERVER_CODE = `import { Mppx } from 'mppx/nextjs';
import { sui } from '@suimpp/mpp/server';

const mpp = Mppx.create({
  realm: 'api.example.com',
  methods: [sui({
    currency: SUI_USDC_TYPE,
    recipient: '0x...',
  })],
});

export const POST = mpp.protect(handler, {
  amount: '0.01',
});`;

export function CodeBlocks() {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <CodeBlock
        title="Use APIs"
        code={CLIENT_CODE}
        cta="Read docs"
        href="/docs"
      />
      <CodeBlock
        title="Accept Payments"
        code={SERVER_CODE}
        cta="Provider guide"
        href="/docs"
      />
    </div>
  );
}
