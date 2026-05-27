import type { Metadata, Viewport } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#000000',
};

export const metadata: Metadata = {
  title: 'suimpp — Machine Payments Protocol on Sui',
  description:
    'An open standard for agent-to-service payments. 402 Payment Required, settled in USDC on Sui. The protocol, the reference packages, the live implementations.',
  metadataBase: new URL('https://suimpp.dev'),
  openGraph: {
    title: 'suimpp — Machine Payments Protocol on Sui',
    description:
      'An open standard for agent-to-service payments. Settled in USDC on Sui. No keys, no accounts, no subscriptions.',
    url: 'https://suimpp.dev',
    siteName: 'suimpp',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@t2000ai',
    title: 'suimpp — Machine Payments Protocol on Sui',
    description:
      'An open standard for agent-to-service payments. Settled in USDC on Sui.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
