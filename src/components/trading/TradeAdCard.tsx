import React, { useState } from "react";
import SearchIcon from "@mui/icons-material/Search";
import { DiscordIcon } from "@/components/Icons/DiscordIcon";
import Link from "next/link";
import {
  ChatBubbleLeftIcon,
  TrashIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";
import { TradeAd } from "@/types/trading";
import { ItemGrid } from "./ItemGrid";
import RobloxTradeUser from "./RobloxTradeUser";
import { ConfirmDialog } from "@/components/UI/ConfirmDialog";
import { useRealTimeRelativeDate } from "@/hooks/useRealTimeRelativeDate";

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

export const TradeAdCard: React.FC<TradeAdCardProps> = ({
  trade,
  onMakeOffer,
  offerStatus,
  currentUserId,
  onDelete,
  onEdit,
}) => {
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

  const discordChannelId = "1398359394726449352";
  const discordGuildId = "1286064050135896064";
  return (
    <div
      className="rounded-lg border border-[#2E3944] bg-[#212A31] p-4 transition-colors hover:border-[#5865F2]"
      tabIndex={0}
      role="region"
    >
      <div className="block">
        {/* Trade Ad Number */}
        <div className="mb-3 flex items-center gap-2">
          <Link
            href={`/trading/ad/${trade.id}`}
            className="text-muted cursor-pointer text-lg font-semibold underline-offset-2 transition-colors hover:text-blue-300 hover:underline"
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

        {/* Make Offer and View Details*/}
        <div className="mt-4 pt-0">
          <div className="flex flex-row gap-2">
            {trade.status === "Pending" && trade.author !== currentUserId && (
              <button
                onClick={() => onMakeOffer(trade.id)}
                disabled={offerStatus?.loading}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 transition-colors ${
                  offerStatus?.loading
                    ? "text-muted cursor-not-allowed bg-[#2E3944]"
                    : offerStatus?.success
                      ? "bg-[#43B581] text-white hover:bg-[#3CA374]"
                      : "bg-[#5865F2] text-white hover:bg-[#4752C4]"
                }`}
              >
                <ChatBubbleLeftIcon className="h-5 w-5" />
                {offerStatus?.loading
                  ? "Making Offer..."
                  : offerStatus?.success
                    ? "Offer Sent!"
                    : "Make Offer"}
              </button>
            )}
            <Link
              href={`/trading/ad/${trade.id}`}
              className="text-muted flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#2E3944] px-4 py-2 text-sm font-medium transition-colors hover:bg-[#37424D]"
              role="button"
              tabIndex={0}
            >
              <SearchIcon sx={{ fontSize: 20 }} />
              View Details
            </Link>
          </div>
          {trade.message_id && (
            <a
              href={`https://discord.com/channels/${discordGuildId}/${discordChannelId}/${trade.message_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-[#5865F2] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4752C4]"
            >
              <DiscordIcon className="h-5 w-5" />
              View in Discord
            </a>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span
            className={`rounded-full border px-2 py-1 text-xs font-medium ${getStatusColor(trade.status)}`}
          >
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
                className="flex items-center gap-1 rounded-lg bg-[#5865F2] px-3 py-1 text-sm text-white transition-colors hover:bg-[#4752C4]"
              >
                <PencilIcon className="h-4 w-4" />
                Edit
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowDeleteConfirm(true);
                }}
                disabled={isDeleting}
                className={`flex items-center gap-1 rounded-lg px-3 py-1 text-sm transition-colors ${
                  isDeleting
                    ? "cursor-not-allowed bg-red-500/50 text-white"
                    : "bg-red-500 text-white hover:bg-red-600"
                }`}
              >
                <TrashIcon className="h-4 w-4" />
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          )}
        </div>

        {/* Trade Items */}
        <div className="mt-4 space-y-4">
          <ItemGrid items={trade.offering} title="Offering" />
          <ItemGrid items={trade.requesting} title="Requesting" />
        </div>

        <div className="text-muted mt-4 text-xs">
          Created {createdRelative}
          {trade.expires && (
            <span className="ml-2">• Expires {expiresRelative}</span>
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
