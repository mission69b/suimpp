'use client';

interface VolumeChartProps {
  data: { date: string; volume: number }[];
}

export function VolumeChart({ data }: VolumeChartProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface p-6">
        <h3 className="text-sm font-medium mb-4">Volume Over Time</h3>
        <div className="h-48 flex items-center justify-center text-xs text-muted">
          No payment data yet
        </div>
      </div>
    );
  }

  const maxVolume = Math.max(...data.map((d) => d.volume), 0.01);

  return (
    <div className="rounded-lg border border-border bg-surface p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-medium">Volume Over Time</h3>
        <span className="text-[10px] font-mono text-muted">
          {data.length} {data.length === 1 ? 'day' : 'days'}
        </span>
      </div>

      <div className="h-48 flex items-end gap-[2px]">
        {data.map((d, i) => {
          const height = Math.max((d.volume / maxVolume) * 100, 2);
          return (
            <div
              key={i}
              className="flex-1 group relative flex flex-col items-center justify-end"
            >
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-bg border border-border text-[10px] font-mono text-text whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                ${d.volume.toFixed(2)}
                <div className="text-muted">
                  {new Date(d.date + 'T00:00:00').toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </div>
              </div>
              <div
                className="w-full rounded-t bg-accent/60 hover:bg-accent transition-colors cursor-default"
                style={{ height: `${height}%` }}
              />
            </div>
          );
        })}
      </div>

      {data.length > 1 && (
        <div className="flex justify-between mt-2 text-[10px] font-mono text-muted/50">
          <span>
            {new Date(data[0].date + 'T00:00:00').toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </span>
          <span>
            {new Date(data[data.length - 1].date + 'T00:00:00').toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </div>
      )}
    </div>
  );
}
