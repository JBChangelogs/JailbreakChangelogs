import React, { useState } from "react";
import { DiscordIcon } from "@/components/Icons/DiscordIcon";
import Link from "next/link";
import { Icon } from "@/components/ui/IconWrapper";
import { TradeAd } from "@/types/trading";
import { ItemGrid } from "./ItemGrid";
import RobloxTradeUser from "./RobloxTradeUser";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useRealTimeRelativeDate } from "@/hooks/useRealTimeRelativeDate";
import dynamic from "next/dynamic";
import { formatCustomDate } from "@/utils/timestamp";
import Image from "next/image";

const Tooltip = dynamic(() => import("@mui/material/Tooltip"), {
  ssr: false,
});

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
    if (!isSupporter) return "border-border-primary";
    switch (supporterTier) {
      case 1:
        return "border-[var(--color-supporter-bronze-border)]";
      case 2:
        return "border-[var(--color-supporter-silver-border)]";
      case 3:
        return "border-[var(--color-supporter-gold-border)]";
      default:
        return "border-border-primary";
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
      className={`${isSupporter ? "" : "bg-secondary-bg"} hover:border-border-focus rounded-lg border p-4 transition-colors ${getBorderClass()} ${isSupporter ? "shadow-lg" : ""}`}
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
            <Tooltip
              title={`Supporter Type ${supporterTier}`}
              placement="top"
              arrow
              slotProps={{
                tooltip: {
                  sx: {
                    backgroundColor: "var(--color-secondary-bg)",
                    color: "var(--color-primary-text)",
                    fontSize: "0.75rem",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    boxShadow: "0 4px 12px var(--color-card-shadow)",
                    "& .MuiTooltip-arrow": {
                      color: "var(--color-secondary-bg)",
                    },
                  },
                },
              }}
            >
              <Link href="/supporting" className="flex items-center">
                <Image
                  src={
                    supporterIcons[supporterTier as keyof typeof supporterIcons]
                  }
                  alt={`Supporter Type ${supporterTier}`}
                  width={20}
                  height={20}
                  className="object-contain transition-opacity hover:opacity-80"
                />
              </Link>
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
              <button
                onClick={() => onMakeOffer(trade.id)}
                disabled={offerStatus?.loading}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 transition-colors ${
                  offerStatus?.loading
                    ? "text-secondary-text cursor-not-allowed"
                    : offerStatus?.success
                      ? "hover:bg-status-success/80 bg-status-success text-form-button-text"
                      : "bg-button-info text-form-button-text hover:bg-button-info-hover"
                }`}
              >
                <Icon icon="heroicons:chat-bubble-left" className="h-5 w-5" />
                {offerStatus?.loading
                  ? "Making Offer..."
                  : offerStatus?.success
                    ? "Offer Sent!"
                    : "Make Offer"}
              </button>
            )}
            <Link
              href={`/trading/ad/${trade.id}`}
              className="bg-button-info text-form-button-text hover:bg-button-info-hover flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
              role="button"
              tabIndex={0}
            >
              <Icon icon="heroicons:magnifying-glass" className="h-5 w-5" />
              View Details
            </Link>
          </div>
          {trade.message_id && (
            <a
              href={`https://discord.com/channels/${discordGuildId}/${discordChannelId}/${trade.message_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-button-info text-form-button-text hover:bg-button-info-hover mt-2 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            >
              <DiscordIcon className="h-5 w-5" />
              View in Discord
            </a>
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
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onEdit?.();
                }}
                className="bg-button-info text-form-button-text hover:bg-button-info-hover flex cursor-pointer items-center gap-1 rounded-lg px-3 py-1 text-sm transition-colors"
              >
                <Icon icon="heroicons-outline:pencil" className="h-4 w-4" />
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
                    ? "bg-status-error/50 text-form-button-text cursor-not-allowed"
                    : "hover:bg-status-error/80 bg-status-error text-form-button-text cursor-pointer"
                }`}
              >
                <Icon icon="heroicons-outline:trash" className="h-4 w-4" />
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

        <div className="text-secondary-text mt-4 text-xs">
          <Tooltip
            title={formatCustomDate(trade.created_at)}
            placement="top"
            arrow
            slotProps={{
              tooltip: {
                sx: {
                  backgroundColor: "var(--color-primary-bg)",
                  color: "var(--color-secondary-text)",
                  fontSize: "0.75rem",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px var(--color-card-shadow)",
                  "& .MuiTooltip-arrow": {
                    color: "var(--color-primary-bg)",
                  },
                },
              },
            }}
          >
            <span className="cursor-help">Created {createdRelative}</span>
          </Tooltip>
          {trade.expires && (
            <>
              <span className="ml-2">•</span>
              <Tooltip
                title={formatCustomDate(trade.expires)}
                placement="top"
                arrow
                slotProps={{
                  tooltip: {
                    sx: {
                      backgroundColor: "var(--color-primary-bg)",
                      color: "var(--color-secondary-text)",
                      fontSize: "0.75rem",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      boxShadow: "0 4px 12px var(--color-card-shadow)",
                      "& .MuiTooltip-arrow": {
                        color: "var(--color-primary-bg)",
                      },
                    },
                  },
                }}
              >
                <span className="ml-2 cursor-help">
                  Expires {expiresRelative}
                </span>
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
        confirmButtonClass="bg-status-error hover:bg-status-error-hover"
      />
    </div>
  );
};
