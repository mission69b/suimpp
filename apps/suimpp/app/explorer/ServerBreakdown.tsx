'use client';

interface ServerBreakdownProps {
  data: { name: string; count: number; volume: number }[];
}

export function ServerBreakdown({ data }: ServerBreakdownProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface p-6">
        <h3 className="text-sm font-medium mb-4">By Server</h3>
        <div className="h-48 flex items-center justify-center text-xs text-muted">
          No servers yet
        </div>
      </div>
    );
  }

  const totalVolume = data.reduce((sum, s) => sum + s.volume, 0) || 1;

  const COLORS = [
    'bg-accent',
    'bg-accent-hover',
    'bg-success',
    'bg-error',
    'bg-muted',
  ];

  return (
    <div className="rounded-lg border border-border bg-surface p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-medium">By Server</h3>
        <span className="text-[10px] font-mono text-muted">
          {data.length} {data.length === 1 ? 'server' : 'servers'}
        </span>
      </div>

      {/* Bar */}
      <div className="flex h-3 rounded-full overflow-hidden mb-6">
        {data.map((s, i) => (
          <div
            key={s.name}
            className={`${COLORS[i % COLORS.length]} transition-all`}
            style={{ width: `${(s.volume / totalVolume) * 100}%` }}
            title={`${s.name}: $${s.volume.toFixed(2)}`}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="space-y-3">
        {data.map((s, i) => (
          <div key={s.name} className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className={`w-2.5 h-2.5 rounded-full shrink-0 ${COLORS[i % COLORS.length]}`}
              />
              <span className="text-xs text-text truncate">{s.name}</span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-[11px] font-mono text-muted">
                {s.count} txn{s.count !== 1 ? 's' : ''}
              </span>
              <span className="text-xs font-mono text-accent">
                ${s.volume.toFixed(2)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
