"use client";

import React from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import Link from "next/link";

interface AdRemovalNoticeProps {
  className?: string;
}

const AdRemovalNotice: React.FC<AdRemovalNoticeProps> = ({
  className = "",
}) => {
  const { user } = useAuthContext();
  const isSupporter = user?.premiumtype && user.premiumtype > 0;

  if (isSupporter) {
    return null;
  }

  return (
    <div className={`mt-2 text-center ${className}`}>
      <p className="text-secondary-text text-xs">
        <Link
          href="/supporting"
          className="text-link hover:text-link-hover underline transition-colors"
        >
          REMOVE ADS
        </Link>
      </p>
    </div>
  );
};

export default AdRemovalNotice;
