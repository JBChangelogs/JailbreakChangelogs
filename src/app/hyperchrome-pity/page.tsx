import Breadcrumb from "@/components/Layout/Breadcrumb";
import HyperchromeCalculator from "@/components/Hyperchrome/HyperchromeCalculatorSheet";

export default function HyperchromeCalculatorPage() {
  return (
    <div className="container mx-auto px-4 pb-8">
      <Breadcrumb />

      <div className="mb-8">
        <h1 className="page-heading mb-2">Hyperchrome Pity Calculator</h1>
        <p className="text-secondary-text text-lg">
          Estimate robberies needed for your next Hyperchrome level and compare
          pity progression between big and small servers.
        </p>
      </div>

      <HyperchromeCalculator asPage />
    </div>
  );
}
