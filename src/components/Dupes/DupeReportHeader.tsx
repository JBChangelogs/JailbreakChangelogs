import React from "react";

const DupeReportHeader: React.FC = () => {
  return (
    <div className="mb-8 rounded-lg border border-[#2E3944] bg-[#212A31] p-6">
      <div className="mb-4">
        <h1 className="text-muted text-2xl font-semibold">
          Roblox Jailbreak Dupe Calculator
        </h1>
      </div>
      <p className="text-muted mb-4">
        Check if a specific Jailbreak item is duped by entering the duper&apos;s
        name and the item name.
      </p>
      <div className="mb-6 rounded-lg border-2 border-yellow-600 bg-[#3a3200] p-4 text-base font-bold text-yellow-200 shadow-lg">
        <div className="mb-2 flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="font-bold">Disclaimer:</span>
        </div>
        <ul className="mt-2 list-disc space-y-1 pl-8 font-bold">
          <li>
            Our calculator may not have every duper name. Do not fully rely on
            it.
          </li>
          <li>
            For the most accurate results, please use all available dupe
            calculators to fully confirm before making any decisions.
          </li>
          <li>
            We advise you to check other dupe calculators, such as{" "}
            <a
              href="https://www.jailbreaktradingnetwork.com/dupe-calculator"
              target="_blank"
              rel="noopener noreferrer"
              className="font-extrabold text-yellow-200 underline hover:text-yellow-100"
            >
              this one
            </a>
            .
          </li>
        </ul>
      </div>
    </div>
  );
};

export default DupeReportHeader;
