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

  // Don't show the notice if user is already a supporter
  if (isSupporter) {
    return null;
  }

  return (
    <div className={`mt-2 text-center ${className}`}>
      <p className="text-muted text-xs">
        <span className="text-blue-300">Become a supporter</span> to remove ads
        and unlock premium features!{" "}
        <Link
          href="/supporting"
          className="text-blue-400 underline transition-colors hover:text-blue-300"
        >
          Learn more
        </Link>
      </p>
    </div>
  );
};

export default AdRemovalNotice;
