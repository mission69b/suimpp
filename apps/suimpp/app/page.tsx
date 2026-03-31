import { Suspense } from 'react';
import Link from 'next/link';
import { Nav } from './components/Nav';
import { Terminal } from './components/Terminal';
import { LiveFeed } from './components/LiveFeed';
import { TopServers } from './components/TopServers';
import { Stats } from './components/Stats';
import { Footer } from './components/Footer';

export const dynamic = 'force-dynamic';
export const revalidate = 15;

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Nav />

      <main className="flex-1">
        {/* Hero */}
        <section className="px-6 py-16 md:py-24">
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h1 className="text-3xl md:text-4xl font-medium leading-tight">
                Machine Payments
                <br />
                on Sui
              </h1>
              <p className="text-muted text-lg max-w-md">
                The open protocol for AI agents to pay for APIs with USDC.
              </p>
              <Suspense
                fallback={
                  <div className="flex gap-6 font-mono text-sm text-muted">
                    <span className="h-4 w-48 bg-border/50 rounded animate-pulse" />
                  </div>
                }
              >
                <Stats />
              </Suspense>
              <div className="flex gap-4 pt-2">
                <Link
                  href="/register"
                  className="text-sm px-4 py-2 rounded-md bg-accent text-bg font-medium hover:bg-accent-hover transition-colors"
                >
                  Register Server
                </Link>
                <Link
                  href="/agent"
                  className="text-sm px-4 py-2 rounded-md border border-border text-muted hover:text-text hover:border-accent/50 transition-colors"
                >
                  Use APIs
                </Link>
              </div>
            </div>
            <Terminal />
          </div>
        </section>

        {/* Live Feed */}
        <section className="px-6 pb-12">
          <div className="max-w-5xl mx-auto">
            <LiveFeed />
          </div>
        </section>

        {/* Top Servers */}
        <section className="px-6 pb-20">
          <div className="max-w-5xl mx-auto">
            <Suspense
              fallback={
                <div className="rounded-lg border border-border bg-surface p-6">
                  <div className="h-32 bg-border/20 rounded animate-pulse" />
                </div>
              }
            >
              <TopServers />
            </Suspense>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
