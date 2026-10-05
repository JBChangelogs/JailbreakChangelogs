import { CalculatorClient } from "./CalculatorClient";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import CalculatorDescription from "@/components/Values/Calculator/CalculatorDescription";
import NitroRailAd from "@/components/Ads/NitroRailAd";

export const revalidate = 120; // Revalidate every 2 minutes

export default function CalculatorPage() {
  return (
    <>
      <NitroRailAd
        adIdSmall="np-rail-left-calculator"
        adIdWide="np-rail-left-calculator-wide"
      />
      <NitroRailAd
        adIdSmall="np-rail-right-calculator"
        adIdWide="np-rail-right-calculator-wide"
        side="right"
      />
      <main>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumb />
          <CalculatorDescription />
        </div>
        <div className="mx-auto w-full px-4 min-[1900px]:max-w-[96rem] sm:px-6 lg:px-8">
          <CalculatorClient initialItems={[]} />
        </div>
      </main>
    </>
  );
}
