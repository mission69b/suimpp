import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'suimpp — Machine Payments Protocol on Sui';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a0a0a',
          position: 'relative',
        }}
      >
        {/* Subtle grid */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        {/* Eyebrow */}
        <div
          style={{
            fontFamily: 'monospace',
            fontSize: 12,
            color: '#888888',
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <span
            style={{
              padding: '3px 9px',
              border: '1px solid rgba(255,255,255,0.18)',
              borderRadius: 4,
              fontSize: 10.5,
              color: '#888',
            }}
          >
            V0.1 · DRAFT
          </span>
          <span>// MACHINE PAYMENTS PROTOCOL · ON SUI</span>
        </div>

        {/* Brand */}
        <div
          style={{
            fontFamily: 'sans-serif',
            fontSize: 96,
            fontWeight: 600,
            color: '#ededed',
            letterSpacing: '-0.045em',
          }}
        >
          suimpp
        </div>

        {/* Tagline */}
        <div
          style={{
            fontFamily: 'sans-serif',
            fontSize: 26,
            color: '#888888',
            marginTop: 18,
            letterSpacing: '-0.011em',
            textAlign: 'center',
            maxWidth: 720,
            lineHeight: 1.35,
          }}
        >
          An open standard for agent-to-service payments.
        </div>

        {/* Footer URL */}
        <div
          style={{
            position: 'absolute',
            bottom: 36,
            fontFamily: 'monospace',
            fontSize: 13,
            color: '#555555',
            letterSpacing: '0.06em',
          }}
        >
          suimpp.dev
        </div>
      </div>
    ),
    { ...size },
  );
}
