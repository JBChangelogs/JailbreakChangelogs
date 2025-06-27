import React from 'react';
import { formatRelativeDate } from '@/utils/timestamp';
import { ClockIcon } from '@heroicons/react/24/outline';

interface TradeAdMetadataProps {
  status: string;
  created_at: number;
  expires?: number;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Pending':
      return 'bg-[#5865F2]/10 text-[#5865F2] border-[#5865F2]/20';
    case 'Completed':
      return 'bg-[#43B581]/10 text-[#43B581] border-[#43B581]/20';
    case 'Expired':
      return 'bg-red-500/10 text-red-500 border-red-500/20';
    default:
      return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
  }
};

export default function TradeAdMetadata({ status, created_at, expires }: TradeAdMetadataProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(status)}`}>
        {status}
      </span>
      <div className="flex items-center gap-2 text-sm text-muted">
        <ClockIcon className="w-4 h-4 text-[#5865F2]" />
        <span>Created {formatRelativeDate(created_at)}</span>
        {expires && (
          <>
            <span className="text-[#5865F2]">•</span>
            <span>Expires {formatRelativeDate(expires)}</span>
          </>
        )}
      </div>
    </div>
  );
} 