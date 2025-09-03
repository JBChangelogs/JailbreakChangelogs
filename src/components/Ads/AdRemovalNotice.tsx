"use client";

import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

interface AdRemovalNoticeProps {
  className?: string;
}

const AdRemovalNotice: React.FC<AdRemovalNoticeProps> = ({ className = "" }) => {
  const { user } = useAuth();
  const isSupporter = user?.premiumtype && user.premiumtype > 0;

  // Don't show the notice if user is already a supporter
  if (isSupporter) {
    return null;
  }

  return (
    <div className={`mt-2 text-center ${className}`}>
      <p className="text-xs text-muted">
        <span className="text-blue-300">Become a supporter</span> to remove ads and unlock premium features!{' '}
        <Link
          href="/supporting" 
          className="text-blue-400 hover:text-blue-300 underline transition-colors"
        >
          Learn more
        </Link>
      </p>
    </div>
  );
};

export default AdRemovalNotice;
