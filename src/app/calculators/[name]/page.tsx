import { notFound } from "next/navigation";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import NitroCalculatorsRailAd from "@/components/Ads/NitroCalculatorsRailAd";
import HyperchromeCalculator from "@/components/Hyperchrome/HyperchromeCalculatorSheet";

type CalculatorName = "hyperchrome-pity";

interface CalculatorPageProps {
  params: Promise<{ name: string }>;
}

const isSupportedCalculator = (name: string): name is CalculatorName => {
  return name === "hyperchrome-pity";
};

export default async function CalculatorPage({ params }: CalculatorPageProps) {
  const { name } = await params;

  if (!isSupportedCalculator(name)) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 pb-8">
      <NitroCalculatorsRailAd />
      <Breadcrumb />

      <div className="mb-8">
        <h1 className="text-primary-text mb-4 text-4xl font-bold">
          Hyperchrome Pity Calculator
        </h1>
        <p className="text-secondary-text text-lg">
          Estimate robberies needed for your next Hyperchrome level and compare
          pity progression between big and small servers.
        </p>
      </div>

      <HyperchromeCalculator asPage />
    </div>
  );
}
