import React, { useState } from "react";
import { DiscordIcon } from "@/components/Icons/DiscordIcon";
import Link from "next/link";
import { Icon } from "@/components/ui/IconWrapper";
import { TradeAd } from "@/types/trading";
import { ItemGrid } from "./ItemGrid";
import RobloxTradeUser from "./RobloxTradeUser";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useRealTimeRelativeDate } from "@/hooks/useRealTimeRelativeDate";
import { formatCustomDate } from "@/utils/timestamp";
import Image from "next/image";
import { Button } from "../ui/button";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
      return "bg-button-info/10 text-primary-text border-button-info/20";
    case "Completed":
      return "bg-status-success/10 text-primary-text border-status-success/20";
    case "Expired":
      return "bg-status-error/10 text-status-error border-status-error/20";
    default:
      return "bg-secondary-text/10 text-secondary-text border-secondary-text/20";
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
  const createdDisplay = createdRelative || formatCustomDate(trade.created_at);
  const expiresDisplay = trade.expires
    ? expiresRelative || formatCustomDate(trade.expires)
    : "";

  const discordChannelId = "1398359394726449352";
  const discordGuildId = "1286064050135896064";

  // Check if user is a Supporter (premium types 1-3)
  const premiumType = trade.user?.premiumtype ?? 0;
  const isSupporter = premiumType >= 1 && premiumType <= 3;
  const supporterTier = isSupporter ? premiumType : null;

  const BADGE_BASE_URL =
    "https://assets.jailbreakchangelogs.xyz/assets/website_icons";
  const supporterIcons = {
    1: `${BADGE_BASE_URL}/jbcl_supporter_1.svg`,
    2: `${BADGE_BASE_URL}/jbcl_supporter_2.svg`,
    3: `${BADGE_BASE_URL}/jbcl_supporter_3.svg`,
  };

  // Border colors for different supporter tiers
  const getBorderClass = () => {
    if (!isSupporter) return "border-border-card";
    switch (supporterTier) {
      case 1:
        return "border-[var(--color-supporter-bronze-border)]";
      case 2:
        return "border-[var(--color-supporter-silver-border)]";
      case 3:
        return "border-[var(--color-supporter-gold-border)]";
      default:
        return "border-border-card";
    }
  };

  // Background style for different supporter tiers
  const getBackgroundStyle = (): React.CSSProperties => {
    if (!isSupporter) return {};

    switch (supporterTier) {
      case 1:
        return { backgroundColor: "var(--color-supporter-bronze-bg)" };
      case 2:
        return { backgroundColor: "var(--color-supporter-silver-bg)" };
      case 3:
        return { backgroundColor: "var(--color-supporter-gold-bg)" };
      default:
        return {};
    }
  };

  return (
    <div
      className={`${isSupporter ? "" : "bg-secondary-bg"} rounded-lg border p-4 transition-colors ${getBorderClass()} ${isSupporter ? "shadow-lg" : ""}`}
      style={getBackgroundStyle()}
      tabIndex={0}
      role="region"
    >
      <div className="block">
        {/* Trade Ad Number */}
        <div className="mb-3 flex items-center gap-2">
          <Link
            href={`/trading/ad/${trade.id}`}
            className="text-primary-text hover:text-link cursor-pointer text-lg font-semibold underline-offset-2 transition-colors hover:underline"
            role="button"
            tabIndex={0}
          >
            Trade #{trade.id}
          </Link>
          {isSupporter && supporterTier && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/supporting" className="flex items-center">
                  <Image
                    src={
                      supporterIcons[
                        supporterTier as keyof typeof supporterIcons
                      ]
                    }
                    alt={`Supporter Type ${supporterTier}`}
                    width={20}
                    height={20}
                    className="object-contain transition-opacity hover:opacity-80"
                  />
                </Link>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                className="bg-secondary-bg text-primary-text border-none shadow-[var(--color-card-shadow)]"
              >
                <p>Supporter Type {supporterTier}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* User Info */}
        {trade.user && trade.user.roblox_id && trade.user.roblox_username && (
          <RobloxTradeUser user={trade.user} />
        )}

        {/* Make Offer and View Details*/}
        <div className="mt-4 pt-0">
          <div className="flex flex-row gap-2">
            {trade.status === "Pending" && trade.author !== currentUserId && (
              <Button
                onClick={() => onMakeOffer(trade.id)}
                disabled={offerStatus?.loading}
                variant={offerStatus?.success ? "success" : "default"}
                className="flex-1"
              >
                <Icon icon="heroicons:chat-bubble-left" />
                {offerStatus?.loading
                  ? "Making Offer..."
                  : offerStatus?.success
                    ? "Offer Sent!"
                    : "Make Offer"}
              </Button>
            )}
            <Button asChild className="flex-1">
              <Link href={`/trading/ad/${trade.id}`}>
                <Icon icon="heroicons:magnifying-glass" />
                View Details
              </Link>
            </Button>
          </div>
          {trade.message_id && (
            <Button asChild className="mt-2 w-full">
              <a
                href={`https://discord.com/channels/${discordGuildId}/${discordChannelId}/${trade.message_id}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <DiscordIcon />
                View in Discord
              </a>
            </Button>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span
            className={`rounded-full border px-2 py-1 text-xs font-medium ${getStatusColor(trade.status)}`}
            aria-label={`Trade status: ${trade.status}`}
          >
            {trade.status}
          </span>
          {trade.author === currentUserId && (
            <div className="flex items-center gap-2">
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onEdit?.();
                }}
                size="sm"
              >
                <Icon icon="heroicons-outline:pencil" />
                Edit
              </Button>
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowDeleteConfirm(true);
                }}
                disabled={isDeleting}
                variant="destructive"
                size="sm"
              >
                <Icon icon="heroicons-outline:trash" />
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          )}
        </div>

        {/* Trade Items */}
        <div className="mt-4 space-y-4">
          <ItemGrid items={trade.offering} title="Offering" />
          <ItemGrid items={trade.requesting} title="Requesting" />
        </div>

        <div className="text-secondary-text mt-4 text-xs">
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-help">Created {createdDisplay}</span>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="bg-primary-bg text-secondary-text border-none shadow-[var(--color-card-shadow)]"
            >
              <p>{formatCustomDate(trade.created_at)}</p>
            </TooltipContent>
          </Tooltip>
          {trade.expires && (
            <>
              <span className="ml-2">•</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="ml-2 cursor-help">
                    Expires {expiresDisplay}
                  </span>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="bg-primary-bg text-secondary-text border-none shadow-[var(--color-card-shadow)]"
                >
                  <p>{formatCustomDate(trade.expires)}</p>
                </TooltipContent>
              </Tooltip>
            </>
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
        confirmVariant="destructive"
      />
    </div>
  );
};
