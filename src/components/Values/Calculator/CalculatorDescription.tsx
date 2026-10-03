import ExplorePageLinks from "@/components/Layout/ExplorePageLinks";
import NitroCalculatorAd from "@/components/Ads/NitroCalculatorAd";

const CalculatorDescription = () => {
  return (
    <div className="border-border-card bg-secondary-bg mb-8 flex flex-col gap-6 rounded-lg border p-6 lg:flex-row lg:items-start">
      <div className="min-w-0 flex-1">
        <h2 className="page-heading mb-2">Roblox Jailbreak Value Calculator</h2>
        <p className="text-secondary-text mb-3">
          Calculate the value of your Roblox Jailbreak items and trades. Get
          accurate market values and make informed trading decisions.
        </p>

        <ExplorePageLinks
          links={[
            { href: "/values", title: "Value List" },
            { href: "/trading?create=true", title: "Create a Trade Ad" },
          ]}
        />
      </div>
      <NitroCalculatorAd className="lg:mx-0 lg:shrink-0" />
    </div>
  );
};

export default CalculatorDescription;
