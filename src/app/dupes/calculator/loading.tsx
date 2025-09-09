import React from "react";

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="rounded-lg border border-[#2E3944] bg-[#212A31] p-6">
        <div className="flex items-center justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#5865F2]"></div>
        </div>
      </div>
    </div>
  );
}
