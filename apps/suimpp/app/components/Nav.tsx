import Link from 'next/link';

export function Nav() {
  return (
    <nav className="flex items-center justify-between px-6 py-4 border-b border-border">
      <Link href="/" className="font-mono text-sm font-medium text-accent">
        suimpp.dev
      </Link>
      <div className="flex items-center gap-6 text-sm text-muted">
        <Link href="/spec" className="hover:text-text transition-colors">
          Spec
        </Link>
        <Link href="/docs" className="hover:text-text transition-colors">
          Docs
        </Link>
        <Link href="/servers" className="hover:text-text transition-colors">
          Servers
        </Link>
        <Link href="/explorer" className="hover:text-text transition-colors">
          Explorer
        </Link>
        <a
          href="https://github.com/mission69b/suimpp"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-text transition-colors"
        >
          GitHub
        </a>
      </div>
    </nav>
  );
}
