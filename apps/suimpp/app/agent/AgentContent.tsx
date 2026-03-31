'use client';

import Link from 'next/link';
import { useState } from 'react';
import { CopyBlock } from '../components/CopyBlock';

type PromptTab = 'claude' | 'codex' | 'prompt';

export function AgentContent() {
  const [promptTab, setPromptTab] = useState<PromptTab>('claude');

  const PROMPT_COMMANDS: Record<PromptTab, string> = {
    claude: 'claude -p "Set up t2000.ai/skill.md"',
    codex: 'codex -q "Set up t2000.ai/skill.md"',
    prompt: 'Set up t2000.ai/skill.md',
  };

  return (
    <article className="space-y-12">
      <header className="space-y-3">
        <h1 className="text-2xl font-medium">Use in Your Agent</h1>
        <p className="text-sm text-muted max-w-xl leading-relaxed">
          MPP allows you to access hundreds of APIs with micropayments and no API keys
        </p>
      </header>

      {/* Option 1: t2000 Web App */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-medium">Web App</h2>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-border text-muted">
            Recommended
          </span>
        </div>
        <p className="text-sm text-muted">
          Gasless onboarding with USDC sponsorship — start using APIs immediately.
        </p>
        <a
          href="https://app.t2000.ai"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-sm px-5 py-2.5 rounded-md border border-border text-text hover:border-accent/50 transition-colors"
        >
          Open t2000 Web App
        </a>
      </section>

      <hr className="border-border" />

      {/* Option 2: Terminal Install */}
      <section className="space-y-4">
        <h2 className="text-base font-medium">Terminal Install</h2>
        <p className="text-sm text-muted">
          Use the t2000 CLI to call any MPP-protected API with automatic payment
        </p>
        <CopyBlock title="Terminal" code="npx @t2000/cli init" />
        <div className="flex items-center gap-6 text-xs text-muted">
          <span>Skills</span>
          <span className="text-muted/30">·</span>
          <span>Wallet</span>
          <span className="text-muted/30">·</span>
          <span>Discovery</span>
        </div>
      </section>

      <hr className="border-border" />

      {/* Option 3: Prompt Install */}
      <section className="space-y-4">
        <h2 className="text-base font-medium">Prompt Install</h2>
        <p className="text-sm text-muted">
          One-shot prompt for configuring MPP on your agent through t2000
        </p>
        <div>
          <div className="flex gap-1 mb-0">
            {([
              { id: 'claude' as const, label: 'Claude Code' },
              { id: 'codex' as const, label: 'Codex' },
              { id: 'prompt' as const, label: 'Prompt' },
            ]).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setPromptTab(tab.id)}
                className={`px-3 py-1.5 rounded-t text-xs font-mono transition-colors cursor-pointer ${
                  promptTab === tab.id
                    ? 'bg-surface border border-border border-b-surface text-text'
                    : 'text-muted hover:text-text'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <CopyBlock code={PROMPT_COMMANDS[promptTab]} />
        </div>
      </section>

      {/* Footer Links */}
      <section className="border-t border-border pt-8 space-y-2">
        {[
          { href: '/servers', label: 'Browse MPP servers' },
          { href: '/docs', label: 'Developer guide' },
          { href: 'https://t2000.ai/docs', label: 't2000 documentation' },
          { href: 'https://www.npmjs.com/package/@t2000/cli', label: '@t2000/cli on npm' },
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
