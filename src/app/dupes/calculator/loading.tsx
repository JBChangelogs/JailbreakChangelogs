import React from "react";

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="p-6">
        <div className="flex items-center justify-center py-8">
          <div className="border-button-info h-8 w-8 animate-spin rounded-full border-b-2"></div>
        </div>
      </div>
    </div>
  );
}
