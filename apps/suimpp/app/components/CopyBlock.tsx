'use client';

import { useState, useCallback } from 'react';
import { highlight } from 'sugar-high';

interface CopyBlockProps {
  code: string;
  lang?: string;
  title?: string;
}

export function CopyBlock({ code, lang, title }: CopyBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [code]);

  const highlighted = highlight(code);

  return (
    <div className="rounded-lg border border-border bg-surface overflow-hidden group">
      {title && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-border">
          <span className="text-[11px] font-mono text-muted">{title}</span>
        </div>
      )}
      <div className="relative">
        <pre className="sh p-4 font-mono text-xs leading-relaxed overflow-x-auto whitespace-pre">
          <code
            className="!p-0 !border-0 !bg-transparent !rounded-none !text-inherit"
            dangerouslySetInnerHTML={{ __html: highlighted }}
          />
        </pre>
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 px-2 py-1 rounded text-[10px] font-mono text-muted bg-bg/80 border border-border opacity-0 group-hover:opacity-100 hover:text-accent hover:border-accent/40 transition-all cursor-pointer"
          aria-label="Copy to clipboard"
        >
          {copied ? 'copied' : 'copy'}
        </button>
      </div>
      {lang && (
        <div className="px-4 py-1.5 border-t border-border/50">
          <span className="text-[10px] font-mono text-muted/50">{lang}</span>
        </div>
      )}
    </div>
  );
}
