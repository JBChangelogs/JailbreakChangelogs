"use client";

import React from "react";
import Link from "next/link";
import { useAuthContext } from "@/contexts/AuthContext";

const OGFinderDescription: React.FC = () => {
  const { user, isAuthenticated } = useAuthContext();

  return (
    <div className="border-border-primary bg-secondary-bg mb-8 rounded-lg border p-6">
      <div className="mb-4">
        <div className="mb-4 flex items-center gap-3">
          <h2 className="text-primary-text text-2xl font-semibold">
            Jailbreak Changelogs OG Finder - Track Your Original Items
          </h2>
        </div>
      </div>
      <p className="text-secondary-text mb-4">
        Find items you originally owned in Roblox Jailbreak but have since
        traded away. Enter your Roblox ID or username to see who currently has
        your old items and track their journey through the trading community.
      </p>

      {/* View My OGs Button for authenticated users */}
      {isAuthenticated && user?.roblox_id && (
        <div className="mt-4 flex gap-2">
          <Link
            href={`/inventories/${user.roblox_id}`}
            prefetch={false}
            className="bg-button-info text-form-button-text hover:bg-button-info-hover inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
          >
            Check Inventory
          </Link>
          <Link
            href={`/og/${user.roblox_id}`}
            className="bg-button-info text-form-button-text hover:bg-button-info-hover inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
          >
            View My OG items
          </Link>
        </div>
      )}
    </div>
  );
};

export default OGFinderDescription;
