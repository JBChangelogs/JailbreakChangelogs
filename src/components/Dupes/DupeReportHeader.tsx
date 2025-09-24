import React from "react";
import Link from "next/link";

const DupeReportHeader: React.FC = () => {
  return (
    <div className="border-border-primary bg-secondary-bg mb-8 rounded-lg border p-6">
      <div className="mb-4">
        <h1 className="text-secondary-text text-2xl font-semibold">
          Roblox Jailbreak Dupe Calculator
        </h1>
      </div>
      <div className="border-button-info bg-button-info/10 mb-2 flex items-start gap-4 rounded-lg border p-4 shadow-sm">
        <div className="relative z-10">
          <span className="text-primary-text text-base font-bold">
            Important Notice
          </span>
          <div className="text-secondary-text mt-1">
            This dupe calculator is{" "}
            <span className="text-primary-text font-semibold">
              deprecated and no longer maintained
            </span>
            .
            <br />
            For the most accurate and up-to-date dupe detection, please use our
            new{" "}
            <Link
              href="/dupes"
              className="text-button-info hover:text-button-info-hover font-semibold underline transition-colors"
            >
              Dupe Finder
            </Link>
            .
          </div>
        </div>
      </div>
    </div>
  );
};

export default DupeReportHeader;
