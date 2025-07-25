import React, { useState } from 'react';
import Link from 'next/link';
import { ChatBubbleLeftIcon, TrashIcon, PencilIcon } from "@heroicons/react/24/outline";
import { TradeAd } from '@/types/trading';
import { ItemGrid } from './ItemGrid';
import RobloxTradeUser from './RobloxTradeUser';
import { ConfirmDialog } from '@/components/UI/ConfirmDialog';
import { useRealTimeRelativeDate } from '@/hooks/useRealTimeRelativeDate';

interface TradeAdCardProps {
  trade: TradeAd;
  onMakeOffer: (tradeId: number) => Promise<void>;
  offerStatus?: {
    loading: boolean;
    error: string | null;
    success: boolean;
  };
  currentUserId: string | null;
  onDelete?: () => void;
  onEdit?: () => void;
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

export const TradeAdCard: React.FC<TradeAdCardProps> = ({ trade, onMakeOffer, offerStatus, currentUserId, onDelete, onEdit }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = async () => {
    if (!onDelete) return;
    
    try {
      setIsDeleting(true);
      await onDelete();
    } finally {
      setIsDeleting(false);
    }
  };

  const createdRelative = useRealTimeRelativeDate(trade.created_at);
  const expiresRelative = useRealTimeRelativeDate(trade.expires);

  return (
    <div
      className="bg-[#212A31] rounded-lg p-4 border border-[#2E3944] hover:border-[#5865F2] transition-colors"
      tabIndex={0}
      role="region"
    >
      <div className="block">
        {/* Trade Ad Number */}
        <div className="flex items-center gap-2 mb-3">
          <Link
            href={`/trading/ad/${trade.id}`}
            className="text-lg font-semibold text-muted hover:text-blue-300 transition-colors underline-offset-2 hover:underline cursor-pointer"
            role="button"
            tabIndex={0}
          >
            Trade #{trade.id}
          </Link>
        </div>

        {/* User Info */}
        {trade.user && trade.user.roblox_id && trade.user.roblox_username && (
          <RobloxTradeUser user={trade.user} />
        )}

        {/* View Details and Make Offer Buttons (moved to top) */}
        <div className="mt-4 pt-0 space-y-2">
          {trade.status === 'Pending' && trade.author !== currentUserId && (
            <>
              <button
                onClick={() => onMakeOffer(trade.id)}
                disabled={offerStatus?.loading}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  offerStatus?.loading
                    ? 'bg-[#2E3944] text-muted cursor-not-allowed'
                    : offerStatus?.success
                    ? 'bg-[#43B581] text-white hover:bg-[#3CA374]'
                    : 'bg-[#5865F2] text-white hover:bg-[#4752C4]'
                }`}
              >
                <ChatBubbleLeftIcon className="w-5 h-5" />
                {offerStatus?.loading
                  ? 'Making Offer...'
                  : offerStatus?.success
                  ? 'Offer Sent!'
                  : 'Make Offer'}
              </button>
            </>
          )}
          <Link
            href={`/trading/ad/${trade.id}`}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#2E3944] hover:bg-[#37424D] text-muted rounded-lg transition-colors text-sm font-medium"
            role="button"
            tabIndex={0}
          >
            View Details
          </Link>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(trade.status)}`}>
            {trade.status}
          </span>
          {trade.author === currentUserId && (
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onEdit?.();
                }}
                className="flex items-center gap-1 px-3 py-1 rounded-lg text-sm transition-colors bg-[#5865F2] text-white hover:bg-[#4752C4]"
              >
                <PencilIcon className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowDeleteConfirm(true);
                }}
                disabled={isDeleting}
                className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm transition-colors ${
                  isDeleting
                    ? 'bg-red-500/50 text-white cursor-not-allowed'
                    : 'bg-red-500 text-white hover:bg-red-600'
                }`}
              >
                <TrashIcon className="w-4 h-4" />
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          )}
        </div>

        {/* Trade Items */}
        <div className="space-y-4 mt-4">
          <ItemGrid items={trade.offering} title="Offering" />
          <ItemGrid items={trade.requesting} title="Requesting" />
        </div>

        <div className="mt-4 text-xs text-muted">
          Created {createdRelative}
          {trade.expires && (
            <span className="ml-2">
              • Expires {expiresRelative}
            </span>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Trade Ad"
        message="Are you sure you want to delete this trade ad? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonClass="bg-red-500 hover:bg-red-600"
      />
    </div>
  );
}; 