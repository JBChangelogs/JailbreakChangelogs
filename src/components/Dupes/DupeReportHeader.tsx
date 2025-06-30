import React from 'react';

const DupeReportHeader: React.FC = () => {
  return (
    <div className="mb-8 rounded-lg border border-[#2E3944] bg-[#212A31] p-6">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold text-muted">
          Roblox Jailbreak Dupe Calculator
        </h1>
      </div>
      <p className="mb-4 text-muted">
        Check if a specific Jailbreak item is duped by entering the duper&apos;s name and the item name.
      </p>
    </div>
  );
};

export default DupeReportHeader; 