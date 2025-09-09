import React from "react";
import { ClockIcon } from "@heroicons/react/24/outline";
import { useRealTimeRelativeDate } from "@/hooks/useRealTimeRelativeDate";

interface TradeAdMetadataProps {
  status: string;
  created_at: number;
  expires?: number;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "Pending":
      return "bg-[#5865F2]/10 text-[#5865F2] border-[#5865F2]/20";
    case "Completed":
      return "bg-[#43B581]/10 text-[#43B581] border-[#43B581]/20";
    case "Expired":
      return "bg-red-500/10 text-red-500 border-red-500/20";
    default:
      return "bg-gray-500/10 text-gray-500 border-gray-500/20";
  }
};

export default function TradeAdMetadata({
  status,
  created_at,
  expires,
}: TradeAdMetadataProps) {
  const createdRelative = useRealTimeRelativeDate(created_at);
  const expiresRelative = useRealTimeRelativeDate(expires);
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <span
        className={`rounded-full border px-3 py-1 text-sm font-medium ${getStatusColor(status)}`}
      >
        {status}
      </span>
      <div className="text-muted flex items-center gap-2 text-sm">
        <ClockIcon className="h-4 w-4 text-[#5865F2]" />
        <span>Created {createdRelative}</span>
        {expires && (
          <>
            <span className="text-[#5865F2]">•</span>
            <span>Expires {expiresRelative}</span>
          </>
        )}
      </div>
    </div>
  );
}
