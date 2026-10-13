import Link from "next/link";
import { Button } from "@/components/ui/button";
import NitroCalculatorAd from "@/components/Ads/NitroCalculatorAd";

const CalculatorDescription = () => {
  return (
    <div className="mb-6 flex flex-col gap-6 lg:flex-row lg:items-start">
      <div className="min-w-0 flex-1">
        <h2 className="page-heading mb-2">Roblox Jailbreak Value Calculator</h2>
        <p className="text-secondary-text mb-3">
          Calculate the value of your Roblox Jailbreak items and trades. Get
          accurate market values and make informed trading decisions.
        </p>

        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/values">View Item Values</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/trading?create=true">Create a Trade Ad</Link>
          </Button>
        </div>
      </div>
      <NitroCalculatorAd className="lg:mx-0 lg:shrink-0" />
    </div>
  );
};

export default CalculatorDescription;
