"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { PUBLIC_API_URL, CommentData } from "@/utils/api";
import { UserData } from "@/types/auth";
import Link from "next/link";
import { DiscordIcon } from "@/components/Icons/DiscordIcon";
import {
  ArrowLeftIcon,
  ChatBubbleLeftIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import ChangelogComments from "@/components/PageComments/ChangelogComments";
import { getToken } from "@/utils/auth";
import { deleteTradeAd } from "@/utils/trading";
import toast from "react-hot-toast";
import TradeItemsImages from "@/components/trading/TradeItemsImages";
import TradeItemsList from "@/components/trading/TradeItemsList";
import TradeValueComparison from "@/components/trading/TradeValueComparison";
import { TradeAd } from "@/types/trading";
import TradeUserProfile from "@/components/trading/TradeUserProfile";
import TradeAdMetadata from "@/components/trading/TradeAdMetadata";
import { ConfirmDialog } from "@/components/UI/ConfirmDialog";
// Removed MUI Tabs in favor of calculator-style tabs

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
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
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
  const [activeTab, setActiveTab] = useState<"items" | "values" | "comments">(
    "items",
  );

  // Get current user ID on component mount
  React.useEffect(() => {
    const token = getToken();
    if (token) {
      fetch(`${PUBLIC_API_URL}/users/get/token?token=${token}&nocache=true`)
        .then((response) => {
          if (response.ok) {
            return response.json();
          }
          throw new Error("Failed to fetch user data");
        })
        .then((userData) => {
          setCurrentUserId(userData.id);
        })
        .catch((err) => {
          console.error("Error fetching current user data:", err);
        });
    }
  }, []);

  const handleMakeOffer = async () => {
    try {
      setOfferStatus({ loading: true, error: null, success: false });

      const token = getToken();
      if (!token) {
        toast.error("You must be logged in to make an offer", {
          duration: 3000,
          position: "bottom-right",
        });
        setOfferStatus({
          loading: false,
          error: "You must be logged in to make an offer",
          success: false,
        });
        return;
      }

      const response = await fetch(`${PUBLIC_API_URL}/trades/offer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: trade?.id,
          owner: token,
        }),
      });

      if (response.status === 409) {
        toast.error("You have already made an offer for this trade", {
          duration: 3000,
          position: "bottom-right",
        });
        setOfferStatus({
          loading: false,
          error: "You have already made an offer for this trade",
          success: false,
        });
      } else if (response.status === 403) {
        toast.error("The trade owner's settings do not allow direct messages", {
          duration: 3000,
          position: "bottom-right",
        });
        setOfferStatus({
          loading: false,
          error: "The trade owner's settings do not allow direct messages",
          success: false,
        });
      } else if (!response.ok) {
        throw new Error("Failed to create offer");
      } else {
        toast.success("Offer sent successfully!", {
          duration: 3000,
          position: "bottom-right",
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
        position: "bottom-right",
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
      toast.success("Trade ad deleted successfully");
      router.push("/trading");
    } catch (error) {
      console.error("Error deleting trade ad:", error);
      toast.error("Failed to delete trade ad");
    } finally {
      setIsDeleting(false);
    }
  };

  // Using string-based tabs to match calculator-style

  return (
    <>
      <Breadcrumb />
      <div className="container mx-auto mb-16">
        <div className="mb-6 flex items-center justify-between px-4">
          <Link
            href="/trading"
            className="inline-flex items-center gap-2 text-blue-300 transition-colors hover:text-blue-400"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to Trading
          </Link>
        </div>

        {/* Trade Card */}
        <div className="rounded-lg border border-[#2E3944] bg-[#212A31]">
          {/* Header */}
          <div className="border-b border-[#2E3944] p-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex w-full flex-col sm:flex-row sm:items-center sm:justify-between">
                      <h1 className="text-muted text-2xl font-bold">
                        Trade #{trade.id}
                      </h1>
                      <div className="mt-4 flex flex-col gap-2 sm:mt-0 sm:flex-row">
                        {trade &&
                          trade.status === "Pending" &&
                          trade.author !== currentUserId && (
                            <button
                              onClick={() => setShowOfferConfirm(true)}
                              disabled={offerStatus.loading}
                              className={`flex items-center gap-1 rounded-lg px-3 py-1 text-sm transition-colors ${
                                offerStatus.loading
                                  ? "text-muted cursor-not-allowed bg-[#2E3944]"
                                  : offerStatus.success
                                    ? "bg-[#43B581] text-white hover:bg-[#3CA374]"
                                    : "bg-[#5865F2] text-white hover:bg-[#4752C4]"
                              }`}
                            >
                              <ChatBubbleLeftIcon className="h-4 w-4" />
                              {offerStatus.loading
                                ? "Making Offer..."
                                : offerStatus.success
                                  ? "Offer Sent!"
                                  : "Make Offer"}
                            </button>
                          )}
                        {trade.author === currentUserId && (
                          <button
                            onClick={() => setShowDeleteConfirm(true)}
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
                        )}
                        {/* View in Discord Button */}
                        {trade.message_id && (
                          <a
                            href={`https://discord.com/channels/${discordGuildId}/${discordChannelId}/${trade.message_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 rounded-lg bg-[#5865F2] px-3 py-1 text-sm text-white transition-colors hover:bg-[#4752C4]"
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

            {/* Tabs - calculator style */}
            <div className="mb-6 rounded-lg border border-[#2E3944] bg-[#212A31]">
              <nav className="px-6 py-4">
                <div className="flex flex-col space-y-1 rounded-lg bg-[#2E3944] p-1 sm:flex-row sm:space-y-0 sm:space-x-1">
                  <button
                    onClick={() => setActiveTab("items")}
                    className={`${
                      activeTab === "items"
                        ? "bg-[#5865F2] text-white shadow-sm"
                        : "text-muted hover:bg-[#37424D] hover:text-[#FFFFFF]"
                    } flex w-full items-center justify-center gap-2 rounded-md px-4 py-3 text-sm font-medium transition-all duration-200 sm:flex-1`}
                  >
                    Browse Items
                  </button>
                  <button
                    onClick={() => setActiveTab("values")}
                    className={`${
                      activeTab === "values"
                        ? "bg-[#5865F2] text-white shadow-sm"
                        : "text-muted hover:bg-[#37424D] hover:text-[#FFFFFF]"
                    } flex w-full items-center justify-center gap-2 rounded-md px-4 py-3 text-sm font-medium transition-all duration-200 sm:flex-1`}
                  >
                    Value Comparison
                  </button>
                  <button
                    onClick={() => setActiveTab("comments")}
                    className={`${
                      activeTab === "comments"
                        ? "bg-[#5865F2] text-white shadow-sm"
                        : "text-muted hover:bg-[#37424D] hover:text-[#FFFFFF]"
                    } flex w-full items-center justify-center gap-2 rounded-md px-4 py-3 text-sm font-medium transition-all duration-200 sm:flex-1`}
                  >
                    Comments
                  </button>
                </div>
              </nav>
            </div>
            {/* Tab Content */}
            {activeTab === "items" ? (
              <TradeItemsList
                offering={trade.offering}
                requesting={trade.requesting}
              />
            ) : activeTab === "values" ? (
              <TradeValueComparison
                offering={trade.offering}
                requesting={trade.requesting}
              />
            ) : (
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

        {/* Offer Confirmation Dialog */}
        <ConfirmDialog
          isOpen={showOfferConfirm}
          onClose={() => setShowOfferConfirm(false)}
          onConfirm={handleMakeOffer}
          title="Make Trade Offer"
          message={`Are you sure you want to make an offer for Trade #${trade.id}? This will notify ${trade.user?.username || "the trade owner"} about your interest in trading for their ${trade.offering.length} items.`}
          confirmText="Make Offer"
          cancelText="Cancel"
          confirmButtonClass="bg-[#5865F2] hover:bg-[#4752C4]"
        />
      </div>
    </>
  );
}
