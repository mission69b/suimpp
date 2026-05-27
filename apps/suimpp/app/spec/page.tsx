import type { Metadata } from "next";
import { SuimppNav } from "../components/site/SuimppNav";
import { SuimppFooter } from "../components/site/SuimppFooter";
import { SpecContent } from "./SpecContent";

export const metadata: Metadata = {
  title: "Spec — suimpp",
  description:
    "v0.1 draft specification of the Machine Payments Protocol on Sui. Normative behavior in 9 sections + 2 appendices.",
};

export default function SpecPage() {
  return (
    <>
      <SuimppNav currentPage="spec" />
      <main>
        <SpecContent />
      </main>
      <SuimppFooter />
    </>
  );
}
