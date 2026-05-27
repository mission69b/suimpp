import type { Metadata } from "next";
import { SuimppNav } from "../components/site/SuimppNav";
import { SuimppFooter } from "../components/site/SuimppFooter";
import { DocsContent } from "./DocsContent";

export const metadata: Metadata = {
  title: "Docs — suimpp",
  description:
    "Quickstart for @suimpp/mpp and @suimpp/discovery. Install, accept payments, make payments, validate, report.",
};

export default function DocsPage() {
  return (
    <>
      <SuimppNav currentPage="docs" />
      <main>
        <DocsContent />
      </main>
      <SuimppFooter />
    </>
  );
}
