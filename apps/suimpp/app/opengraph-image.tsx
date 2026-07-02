import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'suimpp — An open standard for agent-to-service payments. Sui binding.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const WORDMARK = 'suimpp';
const VERSION = 'V0.1';
const EYEBROW = '// MACHINE PAYMENTS PROTOCOL · ON SUI';
const LINE_1 = 'An open standard for';
const LINE_2 = 'agent-to-service payments.';
const ATTRIBUTION = 'An open standard by Stripe and Tempo Labs. Sui binding.';
const BOTTOM = 'suimpp.dev — Implements MPP on Sui.';

async function loadGoogleFont(
  family: string,
  weight: number,
  text: string,
): Promise<ArrayBuffer> {
  const url =
    `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, '+')}` +
    `:wght@${weight}&text=${encodeURIComponent(text)}`;
  const css = await (
    await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 6.1; WOW64; Trident/7.0; AS; rv:11.0) like Gecko',
      },
    })
  ).text();
  const match = css.match(
    /src:\s*url\((.+?)\)\s+format\('(opentype|truetype|woff)'\)/,
  );
  if (!match) {
    throw new Error(`Font ${family}@${weight}: font URL not found in CSS`);
  }
  const font = await fetch(match[1]);
  if (!font.ok) {
    throw new Error(`Font ${family}@${weight}: HTTP ${font.status}`);
  }
  return font.arrayBuffer();
}

export default async function Image() {
  const text = [
    WORDMARK,
    VERSION,
    EYEBROW,
    LINE_1,
    LINE_2,
    ATTRIBUTION,
    BOTTOM,
  ].join(' ');
  const [sansData, monoData] = await Promise.all([
    loadGoogleFont('Geist', 600, text),
    loadGoogleFont('Geist Mono', 400, text),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#151515',
          position: 'relative',
          display: 'flex',
          fontFamily: 'Geist',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 16,
            top: 16,
            right: 16,
            bottom: 16,
            border: '1px solid #262626',
          }}
        />

        <div
          style={{
            position: 'absolute',
            left: 80,
            top: 80,
            display: 'flex',
            alignItems: 'baseline',
            gap: 12,
          }}
        >
          <div
            style={{
              display: 'flex',
              fontFamily: 'Geist',
              fontWeight: 600,
              fontSize: 28,
              color: '#ffffff',
              letterSpacing: '-0.6px',
            }}
          >
            {WORDMARK}
          </div>
          <div
            style={{
              display: 'flex',
              fontFamily: 'Geist Mono',
              fontSize: 10,
              color: '#999999',
              letterSpacing: '1.5px',
              padding: '4px 8px',
              border: '1px solid #333333',
              borderRadius: 3,
            }}
          >
            {VERSION}
          </div>
        </div>

        <div
          style={{
            position: 'absolute',
            left: 80,
            top: 280,
            display: 'flex',
            fontFamily: 'Geist Mono',
            fontSize: 14,
            color: '#999999',
            letterSpacing: '0.10em',
          }}
        >
          {EYEBROW}
        </div>

        <div
          style={{
            position: 'absolute',
            left: 80,
            top: 340,
            display: 'flex',
            flexDirection: 'column',
            fontFamily: 'Geist',
            fontWeight: 600,
            fontSize: 68,
            lineHeight: 1.05,
            letterSpacing: '-2.2px',
          }}
        >
          <div style={{ display: 'flex', color: '#ffffff' }}>{LINE_1}</div>
          <div style={{ display: 'flex', color: '#888888' }}>{LINE_2}</div>
        </div>

        <div
          style={{
            position: 'absolute',
            left: 80,
            top: 510,
            display: 'flex',
            fontFamily: 'Geist',
            fontSize: 18,
            color: '#777777',
            letterSpacing: '-0.011em',
          }}
        >
          {ATTRIBUTION}
        </div>

        <div
          style={{
            position: 'absolute',
            left: 80,
            top: 560,
            display: 'flex',
            fontFamily: 'Geist Mono',
            fontSize: 16,
            color: '#555555',
          }}
        >
          {BOTTOM}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Geist', data: sansData, weight: 600, style: 'normal' },
        { name: 'Geist Mono', data: monoData, weight: 400, style: 'normal' },
      ],
    },
  );
}
