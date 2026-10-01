import ExplorePageLinks from "@/components/Layout/ExplorePageLinks";

const CalculatorDescription = () => {
  return (
    <div className="border-border-card bg-secondary-bg mb-8 rounded-lg border p-6">
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
  );
};

export default CalculatorDescription;
