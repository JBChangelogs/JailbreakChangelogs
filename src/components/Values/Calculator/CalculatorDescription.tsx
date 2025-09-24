import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const CalculatorDescription: React.FC = () => {
  return (
    <div className="bg-secondary-bg border-border-primary mb-8 rounded-lg border p-6">
      <h2 className="text-secondary-text mb-4 text-2xl font-semibold">
        Roblox Jailbreak Value Calculator
      </h2>
      <p className="text-secondary-text mb-4">
        Calculate the value of your Roblox Jailbreak items and trades. Get
        accurate market values and make informed trading decisions.
      </p>

      <div className="flex flex-col gap-4 sm:flex-row">
        <Button asChild>
          <Link href="/values">View Item Values</Link>
        </Button>
        <Button asChild>
          <Link href="/trading">Create A Trade Ad</Link>
        </Button>
      </div>
    </div>
  );
};

export default CalculatorDescription;
