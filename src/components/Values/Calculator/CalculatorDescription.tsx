import React from 'react';
import Link from 'next/link';

const CalculatorDescription: React.FC = () => {
  return (
    <div className="mb-8 rounded-lg border border-[#2E3944] bg-[#212A31] p-6">
      <div className="mb-4">
        <h2 className="text-2xl font-semibold text-muted">
          Roblox Jailbreak Value Calculator
        </h2>
      </div>
      <p className="mb-6 text-muted">
        Calculate the value of your Roblox Jailbreak items and trades.
        Get accurate market values and make informed trading decisions.
      </p>

      <div className="flex flex-wrap gap-3 mt-6">
        <Link 
          href="/values" 
          className="inline-flex items-center rounded-lg border border-[#2E3944] bg-[#37424D] px-4 py-2 text-sm font-medium text-muted transition-colors hover:bg-[#124E66] hover:text-white"
        >
          View Item Values
        </Link>
        <Link 
          href="/trading" 
          className="inline-flex items-center rounded-lg border border-[#2E3944] bg-[#37424D] px-4 py-2 text-sm font-medium text-muted transition-colors hover:bg-[#124E66] hover:text-white"
        >
          Create A Trade Ad
        </Link>
      </div>
    </div>
  );
};

export default CalculatorDescription; 