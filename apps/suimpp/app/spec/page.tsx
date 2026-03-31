import { Nav } from '../components/Nav';
import { Footer } from '../components/Footer';
import { SpecContent } from './SpecContent';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sui Charge Method Spec — suimpp',
  description:
    'The Sui charge method specification for Machine Payments Protocol (MPP). On-chain USDC micropayments for API access.',
};

export default function SpecPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Nav />

      <main className="flex-1 px-6 py-12">
        <div className="max-w-3xl mx-auto">
          <SpecContent />
        </div>
      </main>

      <Footer />
    </div>
  );
}
