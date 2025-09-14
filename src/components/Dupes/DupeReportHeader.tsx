import React from "react";
import Link from "next/link";

const DupeReportHeader: React.FC = () => {
  return (
    <div className="mb-8 rounded-lg border border-[#2E3944] bg-[#212A31] p-6">
      <div className="mb-4">
        <h1 className="text-muted text-2xl font-semibold">
          Roblox Jailbreak Dupe Calculator
        </h1>
      </div>
      <div className="mb-6 rounded-lg border-2 border-orange-600 bg-[#3a2a00] p-4 text-base font-bold text-orange-200 shadow-lg">
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
          <span className="font-bold">Important Notice:</span>
        </div>
        <div className="mt-2 space-y-2 font-bold">
          <p>
            This dupe calculator is{" "}
            <span className="text-orange-100">
              deprecated and no longer maintained
            </span>
            . It may contain outdated or inaccurate information.
          </p>
          <p>
            For the most accurate and up-to-date dupe detection, please use our
            new{" "}
            <Link
              href="/dupes"
              className="font-extrabold text-orange-100 underline hover:text-orange-50"
            >
              Dupe Finder
            </Link>{" "}
          </p>
        </div>
      </div>
    </div>
  );
};

export default DupeReportHeader;
