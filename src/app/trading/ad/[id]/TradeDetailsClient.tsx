"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { CommentData } from "@/utils/api";
import { UserData } from "@/types/auth";
import { DiscordIcon } from "@/components/Icons/DiscordIcon";
import { Icon } from "@/components/ui/IconWrapper";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import ChangelogComments from "@/components/PageComments/ChangelogComments";
import { deleteTradeAd } from "@/utils/trading";
import { toast } from "sonner";
import TradeItemsImages from "@/components/trading/TradeItemsImages";
import TradeItemsWithValues from "@/components/trading/TradeItemsWithValues";
import { TradeAd } from "@/types/trading";
import TradeUserProfile from "@/components/trading/TradeUserProfile";
import TradeAdMetadata from "@/components/trading/TradeAdMetadata";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useAuthContext } from "@/contexts/AuthContext";
import Image from "next/image";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
// Removed MUI Tabs in favor of calculator-style tabs

const Tooltip = dynamic(() => import("@mui/material/Tooltip"), {
  ssr: false,
});

interface TradeDetailsClientProps {
  trade: TradeAd;
  initialComments?: CommentData[];
  initialUserMap?: Record<string, UserData>;
}

export default function TradeDetailsClient({
  trade,
  initialComments = [],
  initialUserMap = {},
}: TradeDetailsClientProps) {
  const discordChannelId = "1398359394726449352";
  const discordGuildId = "1286064050135896064";
  const router = useRouter();
  const { user } = useAuthContext();
  const currentUserId = user?.id || null;
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showOfferConfirm, setShowOfferConfirm] = useState(false);
  const [offerStatus, setOfferStatus] = useState<{
    loading: boolean;
    error: string | null;
    success: boolean;
  }>({
    loading: false,
    error: null,
    success: false,
  });
  const [activeTab, setActiveTab] = useState<"items" | "comments">("items");

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

  const handleMakeOffer = async () => {
    try {
      setOfferStatus({ loading: true, error: null, success: false });

      if (!currentUserId) {
        toast.error("You must be logged in to make an offer", {
          duration: 3000,
        });
        setOfferStatus({
          loading: false,
          error: "You must be logged in to make an offer",
          success: false,
        });
        return;
      }

      const response = await fetch(`/api/trades/offer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: trade?.id,
        }),
      });

      if (response.status === 409) {
        toast.error("You have already made an offer for this trade", {
          duration: 3000,
        });
        setOfferStatus({
          loading: false,
          error: "You have already made an offer for this trade",
          success: false,
        });
      } else if (response.status === 403) {
        toast.error("The trade owner's settings do not allow direct messages", {
          duration: 3000,
        });
        setOfferStatus({
          loading: false,
          error: "The trade owner's settings do not allow direct messages",
          success: false,
        });
      } else if (!response.ok) {
        throw new Error("Failed to create offer");
      } else {
        toast.success("Offer Sent", {
          description:
            "Your offer has been successfully sent to the trade owner.",
          duration: 3000,
        });
        setOfferStatus({
          loading: false,
          error: null,
          success: true,
        });
      }
    } catch (err) {
      console.error("Error creating offer:", err);
      toast.error("Failed to create offer. Please try again.", {
        duration: 3000,
      });
      setOfferStatus({
        loading: false,
        error: "Failed to create offer. Please try again.",
        success: false,
      });
    }
  };

  const handleDelete = async () => {
    if (!trade) return;

    try {
      setIsDeleting(true);
      await deleteTradeAd(trade.id);
      toast.success("Trade Ad Deleted", {
        description:
          "Your trade ad has been successfully removed from the platform.",
      });
      router.push("/trading");
    } catch (error) {
      console.error("Error deleting trade ad:", error);
      toast.error("Failed to delete trade ad");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Breadcrumb />
      <div className="container mx-auto mb-16">
        {/* Trade Card */}
        <div className="border-border-primary bg-secondary-bg rounded-lg border">
          {/* Header */}
          <div className="p-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex w-full flex-col sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-2">
                        <h1 className="text-primary-text text-2xl font-bold">
                          Trade #{trade.id}
                        </h1>
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
                                  boxShadow:
                                    "0 4px 12px var(--color-card-shadow)",
                                  "& .MuiTooltip-arrow": {
                                    color: "var(--color-secondary-bg)",
                                  },
                                },
                              },
                            }}
                          >
                            <a href="/supporting" className="flex items-center">
                              <Image
                                src={
                                  supporterIcons[
                                    supporterTier as keyof typeof supporterIcons
                                  ]
                                }
                                alt={`Supporter Type ${supporterTier}`}
                                width={24}
                                height={24}
                                className="object-contain transition-opacity hover:opacity-80"
                              />
                            </a>
                          </Tooltip>
                        )}
                      </div>
                      <div className="mt-4 flex flex-col gap-2 sm:mt-0 sm:flex-row">
                        {trade &&
                          trade.status === "Pending" &&
                          trade.author !== currentUserId && (
                            <Button
                              onClick={() => setShowOfferConfirm(true)}
                              disabled={offerStatus.loading}
                              variant={
                                offerStatus.success ? "success" : "default"
                              }
                              size="sm"
                            >
                              <Icon icon="heroicons:chat-bubble-left" />
                              {offerStatus.loading
                                ? "Making Offer..."
                                : offerStatus.success
                                  ? "Offer Sent!"
                                  : "Make Offer"}
                            </Button>
                          )}
                        {trade.author === currentUserId && (
                          <Button
                            onClick={() => setShowDeleteConfirm(true)}
                            disabled={isDeleting}
                            variant="destructive"
                            size="sm"
                          >
                            <Icon icon="heroicons-outline:trash" />
                            {isDeleting ? "Deleting..." : "Delete"}
                          </Button>
                        )}
                        {/* View in Discord Button */}
                        {trade.message_id && (
                          <a
                            href={`https://discord.com/channels/${discordGuildId}/${discordChannelId}/${trade.message_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-button-info text-form-button-text hover:bg-button-info-hover flex items-center gap-1 rounded-lg px-3 py-1 text-sm transition-colors"
                          >
                            <DiscordIcon className="h-4 w-4" />
                            View in Discord
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2">
                    <TradeAdMetadata
                      status={trade.status}
                      created_at={trade.created_at}
                      expires={trade.expires}
                    />
                  </div>
                </div>
              </div>
              {trade.user && <TradeUserProfile user={trade.user} />}
            </div>
          </div>

          {/* Trade Items */}
          <div className="p-6">
            {/* Item Images */}
            <TradeItemsImages
              offering={trade.offering}
              requesting={trade.requesting}
            />

            {/* Tabs - DaisyUI style */}
            <div className="overflow-x-auto">
              <div role="tablist" className="tabs min-w-max">
                <button
                  role="tab"
                  aria-selected={activeTab === "items"}
                  aria-controls="trade-details-tabpanel-items"
                  id="trade-details-tab-items"
                  onClick={() => setActiveTab("items")}
                  className={`tab ${activeTab === "items" ? "tab-active" : ""}`}
                >
                  Items & Values
                </button>
                <button
                  role="tab"
                  aria-selected={activeTab === "comments"}
                  aria-controls="trade-details-tabpanel-comments"
                  id="trade-details-tab-comments"
                  onClick={() => setActiveTab("comments")}
                  className={`tab ${activeTab === "comments" ? "tab-active" : ""}`}
                >
                  Comments
                </button>
              </div>
            </div>
            {/* Tab Content */}
            <div className="mt-6">
              <div
                role="tabpanel"
                hidden={activeTab !== "items"}
                id="trade-details-tabpanel-items"
                aria-labelledby="trade-details-tab-items"
              >
                {activeTab === "items" && (
                  <TradeItemsWithValues
                    offering={trade.offering}
                    requesting={trade.requesting}
                  />
                )}
              </div>

              <div
                role="tabpanel"
                hidden={activeTab !== "comments"}
                id="trade-details-tabpanel-comments"
                aria-labelledby="trade-details-tab-comments"
              >
                {activeTab === "comments" && (
                  <ChangelogComments
                    changelogId={trade.id}
                    changelogTitle={`Trade #${trade.id}`}
                    type="trade"
                    trade={trade}
                    initialComments={initialComments}
                    initialUserMap={initialUserMap}
                  />
                )}
              </div>
            </div>
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
          confirmButtonClass="bg-status-error text-form-button-text hover:bg-status-error-hover"
        />

        {/* Offer Confirmation Dialog */}
        <ConfirmDialog
          isOpen={showOfferConfirm}
          onClose={() => setShowOfferConfirm(false)}
          onConfirm={handleMakeOffer}
          title="Make Trade Offer"
          message={`Are you sure you want to make an offer for Trade #${trade.id}? This will notify ${trade.user?.username || "the trade owner"} about your interest in trading for their ${trade.offering.length} items.`}
          confirmText="Make Offer"
          cancelText="Cancel"
          confirmButtonClass="bg-button-info text-form-button-text hover:bg-button-info-hover"
        />
      </div>
    </>
  );
}
