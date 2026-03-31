'use client';

import { useEffect, useState } from 'react';

const LINES = [
  { text: '$ curl -X POST mpp.t2000.ai/openai/v1/chat/completions \\', type: 'cmd' as const },
  { text: '  -d \'{"model":"gpt-4o","messages":[{"role":"user","content":"Hello"}]}\'', type: 'cmd' as const },
  { text: '', type: 'blank' as const },
  { text: 'HTTP/1.1 402 Payment Required', type: 'error' as const },
  { text: 'WWW-Authenticate: MPP realm="mpp.t2000.ai" method="sui"', type: 'header' as const },
  { text: '  amount="0.01" currency="...usdc::USDC" recipient="0x3bb5..."', type: 'header' as const },
  { text: '', type: 'blank' as const },
  { text: '── agent pays 0.01 USDC on Sui ──', type: 'divider' as const },
  { text: '', type: 'blank' as const },
  { text: '✓ TX verified on Sui · 380ms', type: 'success' as const },
  { text: 'HTTP/1.1 200 OK', type: 'success' as const },
  { text: 'Payment-Receipt: sui:eyJ...', type: 'header' as const },
  { text: '{"choices":[{"message":{"content":"Hello! How can I help?"}}]}', type: 'json' as const },
];

const LINE_COLORS: Record<string, string> = {
  cmd: 'text-text',
  blank: '',
  error: 'text-error',
  header: 'text-muted',
  divider: 'text-muted/60',
  success: 'text-success',
  json: 'text-muted/80',
};

export function Terminal() {
  const [visibleLines, setVisibleLines] = useState(0);

  useEffect(() => {
    if (visibleLines >= LINES.length) return;

    const delay = LINES[visibleLines]?.type === 'cmd' ? 400 : 200;
    const timer = setTimeout(() => setVisibleLines((v) => v + 1), delay);
    return () => clearTimeout(timer);
  }, [visibleLines]);

  return (
    <div className="rounded-lg border border-border bg-surface overflow-hidden">
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border">
        <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
        <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
        <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
        <span className="ml-2 text-[10px] text-muted font-mono">terminal</span>
      </div>
      <div className="p-4 font-mono text-xs leading-relaxed min-h-[280px]">
        {LINES.slice(0, visibleLines).map((line, i) => (
          <div key={i} className={LINE_COLORS[line.type]}>
            {line.text || '\u00A0'}
          </div>
        ))}
        {visibleLines < LINES.length && (
          <span className="inline-block w-2 h-3.5 bg-accent animate-pulse" />
        )}
      </div>
    </div>
  );
}
