import { SuimppNav } from "./components/site/SuimppNav";
import { SuimppFooter } from "./components/site/SuimppFooter";
import { Hero } from "./components/landing/Hero";
import { Pillars } from "./components/landing/Pillars";
import { HowItWorks } from "./components/landing/HowItWorks";
import { Packages } from "./components/landing/Packages";
import { Implementations } from "./components/landing/Implementations";

export default function HomePage() {
  return (
    <>
      <SuimppNav />
      <main>
        <Hero />
        <Pillars />
        <HowItWorks />
        <Packages />
        <Implementations />
      </main>
      <SuimppFooter />
    </>
  );
}
