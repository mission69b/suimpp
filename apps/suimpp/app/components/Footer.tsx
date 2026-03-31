export function Footer() {
  const links = [
    { label: '@suimpp/mpp', href: 'https://www.npmjs.com/package/@suimpp/mpp' },
    { label: 'GitHub', href: 'https://github.com/mission69b/suimpp' },
    { label: 'npm', href: 'https://www.npmjs.com/org/suimpp' },
    { label: 'mpp.dev', href: 'https://mpp.dev' },
    { label: 'mppscan', href: 'https://mppscan.com' },
  ];

  return (
    <footer className="border-t border-border px-6 py-8">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="text-xs text-muted">Built on Sui</span>
        <div className="flex flex-wrap items-center gap-4">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted hover:text-accent transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
