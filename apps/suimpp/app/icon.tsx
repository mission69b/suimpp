import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

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

export default async function Icon() {
  const sansData = await loadGoogleFont('Geist', 600, 's');

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0A0A0A',
          color: '#EDEDED',
          fontSize: 24,
          fontWeight: 600,
          fontFamily: 'Geist',
          letterSpacing: '-0.04em',
        }}
      >
        s
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: 'Geist',
          data: sansData,
          weight: 600,
          style: 'normal',
        },
      ],
    },
  );
}
