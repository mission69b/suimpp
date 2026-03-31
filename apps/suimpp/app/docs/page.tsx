import { Nav } from '../components/Nav';
import { Footer } from '../components/Footer';
import { DocsContent } from './DocsContent';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Docs — suimpp',
  description:
    'Developer guide for Sui MPP. Pay for APIs with USDC or accept payments on your server.',
};

export default function DocsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Nav />

      <main className="flex-1 px-6 py-12">
        <div className="max-w-3xl mx-auto">
          <DocsContent />
        </div>
      </main>

      <Footer />
    </div>
  );
}
