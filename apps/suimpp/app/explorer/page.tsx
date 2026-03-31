import { Nav } from '../components/Nav';
import { Footer } from '../components/Footer';
import { ExplorerContent } from './ExplorerContent';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Explorer — suimpp',
  description:
    'Explore on-chain MPP payments on Sui. Volume charts, per-server breakdown, and full transaction history.',
};

export default function ExplorerPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Nav />

      <main className="flex-1 px-6 py-12">
        <div className="max-w-6xl mx-auto">
          <ExplorerContent />
        </div>
      </main>

      <Footer />
    </div>
  );
}
