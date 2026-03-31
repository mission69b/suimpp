import { Nav } from '../components/Nav';
import { Footer } from '../components/Footer';
import { AgentContent } from './AgentContent';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Use APIs — suimpp',
  description:
    'Access hundreds of APIs with micropayments and no API keys. Onboard through t2000 or install via CLI.',
};

export default function AgentPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Nav />

      <main className="flex-1 px-6 py-12">
        <div className="max-w-3xl mx-auto">
          <AgentContent />
        </div>
      </main>

      <Footer />
    </div>
  );
}
