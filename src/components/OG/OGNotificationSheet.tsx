"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import Image from "next/image";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Icon } from "@/components/ui/IconWrapper";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { getCategoryColor, getCategoryIcon } from "@/utils/categoryIcons";
import SupporterModal from "@/components/Modals/SupporterModal";
import { useSupporterModal } from "@/hooks/useSupporterModal";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMediaQuery } from "@mui/material";

/**
 * Item type for partial items list
 */
interface PartialItem {
  id: number;
  name: string;
  type: string;
}

/**
 * Props for the OGNotificationSheet component
 */
interface OGNotificationSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * OGNotificationSheet Component
 *
 * Allows users to select which OG items they want to be notified about.
 */
export default function OGNotificationSheet({
  isOpen,
  onClose,
}: OGNotificationSheetProps) {
  const { user, setLoginModal } = useAuthContext();
  const isMobile = useMediaQuery("(max-width:1024px)");

  // State management
  const [items, setItems] = useState<PartialItem[]>([]);
  const [notifiedItemIds, setNotifiedItemIds] = useState<string[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [processingItemId, setProcessingItemId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [avatarError, setAvatarError] = useState(false);

  const { modalState, openModal, closeModal } = useSupporterModal();
  const sheetContentRef = useRef<HTMLDivElement | null>(null);

  const setMobileSheetOpen = (open: boolean) => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return;
    }
    const w = window as Window & { __jbMobileSheetOpenCount?: number };
    const current = w.__jbMobileSheetOpenCount ?? 0;
    const next = Math.max(0, current + (open ? 1 : -1));
    w.__jbMobileSheetOpenCount = next;
    if (next > 0) {
      document.body.dataset.mobileSheetOpen = "true";
    } else {
      delete document.body.dataset.mobileSheetOpen;
    }
    window.dispatchEvent(new Event("jb-sheet-toggle"));
  };

  /**
   * Fetches the partial items list from the API
   */
  const fetchItems = useCallback(async () => {
    setIsLoadingItems(true);
    try {
      const response = await fetch("/api/items/list/partial", {
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch items");
      }
      const data = await response.json();
      setItems(data);
    } catch (error) {
      console.error("Error fetching items:", error);
      toast.error("Failed to load items", {
        description: "Please check your connection and try again.",
      });
    } finally {
      setIsLoadingItems(false);
    }
  }, []);

  /**
   * Fetches the user's current notification preferences
   */
  const fetchNotifications = useCallback(async () => {
    if (!user?.roblox_id) return;

    setIsLoadingNotifications(true);
    try {
      // Add a timestamp to bust any browser cache
      const response = await fetch(`/api/og/notify?user_id=${user.roblox_id}`, {
        cache: "no-store",
      });
      if (!response.ok) {
        if (response.status === 429) {
          console.log("OG Notify limit reached (GET)");
        }
        throw new Error("Failed to fetch notifications");
      }
      const data = await response.json();
      // Ensure we have an array of strings
      const ids = Array.isArray(data) ? data.map((id) => String(id)) : [];
      setNotifiedItemIds(ids);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setIsLoadingNotifications(false);
    }
  }, [user?.roblox_id]);

  useEffect(() => {
    if (!isMobile) return;
    if (isOpen) {
      setMobileSheetOpen(true);
      return () => {
        setMobileSheetOpen(false);
      };
    }
    return undefined;
  }, [isMobile, isOpen]);

  // Fetch items when sheet opens
  useEffect(() => {
    if (isOpen && user?.roblox_id) {
      // Clear previous states to avoid flashes of old data
      setAvatarError(false);
      fetchItems();
      fetchNotifications();
    }
  }, [isOpen, user?.roblox_id, fetchItems, fetchNotifications]);

  /**
   * Toggles notification for a specific item
   */
  const toggleNotification = async (item: PartialItem) => {
    if (!user?.roblox_id) {
      toast.error("Authentication required", {
        description: "You must be logged in and have Roblox linked.",
      });
      return;
    }

    if (processingItemId !== null) return;

    const itemIdStr = String(item.id);
    const isCurrentlyNotified = notifiedItemIds.includes(itemIdStr);

    setProcessingItemId(item.id);

    const toastId = toast.loading(
      isCurrentlyNotified
        ? "Removing notification..."
        : "Adding notification...",
      {
        description: `Updating preference for ${item.name} (${item.type})`,
      },
    );

    try {
      const method = isCurrentlyNotified ? "DELETE" : "POST";
      const response = await fetch(
        `/api/og/notify?user_id=${user.roblox_id}&item_id=${item.id}`,
        { method },
      );

      if (response.status === 429) {
        interface OGNotifyError {
          error?: string;
          message?: string;
          premium_type?: number;
          max_notifications?: number;
        }
        let errorData: OGNotifyError = {};
        try {
          errorData = await response.json();
          console.log("OG Notification 429 Error Data:", errorData);
        } catch (e) {
          console.error("Failed to parse 429 response", e);
        }

        toast.dismiss(toastId);

        // Check for specific error code OR presence of limit-related fields (premium_type can be 0)
        const hasLimitInfo =
          typeof errorData.premium_type === "number" &&
          typeof errorData.max_notifications === "number";
        if (
          errorData.error === "og_notification_limit_reached" ||
          hasLimitInfo
        ) {
          const currentTier = errorData.premium_type ?? 0;
          const currentLimit = errorData.max_notifications ?? 0;
          const nextTier = currentTier + 1;

          if (nextTier <= 3) {
            const limitMap: Record<number, number> = {
              0: 3,
              1: 5,
              2: 10,
              3: 15,
            };
            const nextLimit = limitMap[nextTier] || 15;

            onClose(); // Close the sheet first to avoid focus/interaction conflicts
            openModal({
              feature: "og_notification",
              currentTier: currentTier,
              requiredTier: nextTier,
              currentLimit: currentLimit,
              requiredLimit: nextLimit,
            });
          } else {
            toast.error("Limit Reached", {
              description:
                errorData.message ||
                "You have reached the maximum number of notifications.",
            });
          }
        } else {
          toast.error("Limit Reached", {
            description: errorData.message || "You have reached the limit.",
          });
        }
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to update notification");
      }

      await response.json();

      // Update local state
      if (isCurrentlyNotified) {
        setNotifiedItemIds((prev) => prev.filter((id) => id !== itemIdStr));
        toast.success("Notification Removed", {
          id: toastId,
          description: `You will no longer be notified when your ${item.name} (${item.type}) is found.`,
        });

        // Track analytics
        if (typeof window !== "undefined" && window.umami) {
          window.umami.track("Remove OG Notification", {
            itemName: item.name,
            itemType: item.type,
          });
        }
      } else {
        setNotifiedItemIds((prev) => [...prev, itemIdStr]);
        toast.success("Notification Added", {
          id: toastId,
          description: `You will now be notified when your ${item.name} (${item.type}) is found!`,
        });

        // Track analytics
        if (typeof window !== "undefined" && window.umami) {
          window.umami.track("Add OG Notification", {
            itemName: item.name,
            itemType: item.type,
          });
        }
      }
    } catch (error) {
      console.error("Error toggling notification:", error);
      toast.error("Update Failed", {
        id: toastId,
        description: "Failed to update notification. Please try again.",
      });
    } finally {
      setProcessingItemId(null);
    }
  };

  // Filter and prioritize items
  const sortedAndFilteredItems = useMemo(() => {
    // 1. Filter based on search and type
    const filtered = items.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.type.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = selectedType === "all" || item.type === selectedType;
      return matchesSearch && matchesType;
    });

    // 2. Sort: Watchlisted items first, then alphabetically
    return [...filtered].sort((a, b) => {
      const aIsWatched = notifiedItemIds.includes(String(a.id));
      const bIsWatched = notifiedItemIds.includes(String(b.id));

      if (aIsWatched && !bIsWatched) return -1;
      if (!aIsWatched && bIsWatched) return 1;

      // Secondary sort by name
      return a.name.localeCompare(b.name);
    });
  }, [items, searchQuery, selectedType, notifiedItemIds]);

  // Get unique item types for filter
  const itemTypes = Array.from(new Set(items.map((item) => item.type))).sort();
  const currentTypeLabel =
    selectedType === "all" ? "All Item Categories" : selectedType;

  // Check authentication states
  const isAuthenticated = !!user;
  const hasRobloxLinked = !!user?.roblox_id;
  const canUseFeature = hasRobloxLinked;

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent
          ref={sheetContentRef}
          className="bg-secondary-bg flex h-full w-full flex-col sm:max-w-md"
        >
          <SheetHeader className="shrink-0">
            <SheetTitle className="text-2xl font-bold">
              OG Notifications
            </SheetTitle>
            <SheetDescription className="text-secondary-text">
              Stay informed! Select the items you want to track, and we&apos;ll
              notify you when they appear on scanned users.
            </SheetDescription>
          </SheetHeader>

          {/* User Info - Show Roblox data if available */}
          {user?.roblox_id && (
            <div className="border-border-card bg-tertiary-bg mt-6 flex shrink-0 items-center gap-3 rounded-xl border p-3">
              <div className="bg-tertiary-bg border-border-card relative h-12 w-12 shrink-0 overflow-hidden rounded-full border-2">
                {!avatarError ? (
                  <Image
                    src={`${process.env.NEXT_PUBLIC_INVENTORY_API_URL}/proxy/users/${user.roblox_id}/avatar-headshot`}
                    alt="Your Avatar"
                    fill
                    className="rounded-full object-cover"
                    onError={() => setAvatarError(true)}
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Icon
                      icon="heroicons:user"
                      className="text-tertiary-text h-6 w-6"
                    />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-primary-text truncate text-sm font-semibold">
                  {user.roblox_display_name || user.roblox_username || "User"}
                </p>
                <p className="text-secondary-text truncate text-xs">
                  @{user.roblox_username || user.roblox_id}
                </p>
              </div>
            </div>
          )}

          <div className="mt-6 flex min-h-0 flex-1 flex-col gap-6">
            {/* Authentication check */}
            {!canUseFeature && (
              <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
                <div className="mb-6 rounded-full border border-yellow-500/20 bg-yellow-500/10 p-6">
                  <Icon
                    icon={
                      isAuthenticated
                        ? "material-symbols:link-off"
                        : "material-symbols:lock-outline"
                    }
                    className="h-12 w-12 text-yellow-500"
                    inline={true}
                  />
                </div>

                <h3 className="text-primary-text mb-2 text-xl font-bold">
                  {isAuthenticated ? "Link Roblox Account" : "Login Required"}
                </h3>

                <p className="text-secondary-text mb-8 max-w-[300px] text-sm leading-relaxed">
                  {isAuthenticated
                    ? "You're almost there! Connect your Roblox account to start tracking OG items and receive instant notifications."
                    : "You need to log in with Discord first, then you'll be able to link your Roblox account and manage notifications."}
                </p>

                <Button
                  onClick={() => {
                    onClose();
                    setLoginModal({
                      open: true,
                      tab: isAuthenticated ? "roblox" : "discord",
                    });
                  }}
                  className="shadow-button-info/20 h-[56px] w-full text-base font-bold shadow-lg"
                >
                  {isAuthenticated
                    ? "Link Roblox Account"
                    : "Login with Discord"}
                </Button>
              </div>
            )}

            {canUseFeature && (
              <>
                {/* Search and filter controls - Unified spacing with list */}
                <div className="flex min-h-0 flex-1 flex-col gap-4">
                  <div className="shrink-0 space-y-4">
                    {/* Search input - Values page style refined */}
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search items..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="border-border-card bg-primary-bg text-primary-text placeholder:text-secondary-text focus:border-button-info focus:ring-button-info/50 hover:border-border-focus w-full rounded-xl border py-4 pr-11 pl-11 text-sm transition-all duration-300 focus:ring-1 focus:outline-none"
                      />
                      <Icon
                        icon="heroicons:magnifying-glass"
                        className="text-secondary-text absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2"
                        inline={true}
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery("")}
                          className="text-secondary-text hover:text-primary-text absolute top-1/2 right-4 h-5 w-5 -translate-y-1/2 cursor-pointer transition-colors"
                        >
                          <Icon icon="heroicons:x-mark" inline={true} />
                        </button>
                      )}
                    </div>

                    {/* Type filter */}
                    <DropdownMenu modal={false}>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="border-border-card bg-primary-bg text-primary-text focus:border-button-info focus:ring-button-info/50 hover:border-border-focus flex h-[56px] w-full items-center justify-between rounded-xl border px-4 py-2 text-sm transition-all duration-300 focus:ring-1 focus:outline-none"
                          aria-label="Select item category"
                        >
                          <span className="truncate">{currentTypeLabel}</span>
                          <Icon
                            icon="heroicons:chevron-down"
                            className="text-secondary-text h-5 w-5"
                            inline={true}
                          />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="start"
                        container={sheetContentRef.current}
                        className="border-border-card bg-primary-bg text-primary-text scrollbar-thin max-h-[280px] w-[var(--radix-popper-anchor-width)] min-w-[var(--radix-popper-anchor-width)] overflow-x-hidden overflow-y-auto rounded-xl border p-1 shadow-lg"
                      >
                        <DropdownMenuCheckboxItem
                          checked={selectedType === "all"}
                          onCheckedChange={(checked) => {
                            if (checked) setSelectedType("all");
                          }}
                          className="focus:bg-quaternary-bg focus:text-primary-text cursor-pointer rounded-lg px-3 py-2 text-sm"
                        >
                          All Item Categories
                        </DropdownMenuCheckboxItem>
                        {itemTypes.map((type) => (
                          <DropdownMenuCheckboxItem
                            key={type}
                            checked={selectedType === type}
                            onCheckedChange={(checked) => {
                              if (checked) setSelectedType(type);
                              else if (selectedType === type)
                                setSelectedType("all");
                            }}
                            className="focus:bg-quaternary-bg focus:text-primary-text cursor-pointer rounded-lg px-3 py-2 text-sm"
                          >
                            {type}
                          </DropdownMenuCheckboxItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Items list */}
                  <div className="-mr-1 flex-1 overflow-y-auto pr-1">
                    {isLoadingItems || isLoadingNotifications ? (
                      <div className="flex flex-col items-center justify-center gap-4 py-20">
                        <div className="border-button-info shadow-button-info/20 h-10 w-10 animate-spin rounded-full border-4 border-t-transparent shadow-lg" />
                        <p className="text-secondary-text text-sm font-medium">
                          Loading catalog...
                        </p>
                      </div>
                    ) : sortedAndFilteredItems.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="bg-tertiary-bg/50 mb-6 rounded-full p-6">
                          <Icon
                            icon="heroicons:magnifying-glass"
                            className="text-secondary-text/40 h-12 w-12"
                            inline={true}
                          />
                        </div>
                        <h3 className="text-primary-text mb-2 text-lg font-semibold">
                          No items found
                        </h3>
                        <p className="text-secondary-text mx-auto max-w-[240px] text-sm">
                          We couldn&apos;t find any items matching your current
                          filters.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-8 pb-8">
                        {/* Watching Section */}
                        {sortedAndFilteredItems.some((item) =>
                          notifiedItemIds.includes(String(item.id)),
                        ) && (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between px-1">
                              <div className="flex items-center gap-2">
                                <h3 className="text-secondary-text text-[11px] font-black tracking-widest uppercase">
                                  Watching (
                                  {
                                    sortedAndFilteredItems.filter((i) =>
                                      notifiedItemIds.includes(String(i.id)),
                                    ).length
                                  }
                                  )
                                </h3>
                              </div>
                              <div className="bg-border-primary/50 ml-4 h-px flex-1" />
                            </div>
                            <div className="grid gap-3">
                              {sortedAndFilteredItems
                                .filter((item) =>
                                  notifiedItemIds.includes(String(item.id)),
                                )
                                .map((item) => renderItemCard(item))}
                            </div>
                          </div>
                        )}

                        {/* Discovery Section (formerly Available) */}
                        {sortedAndFilteredItems.some(
                          (item) => !notifiedItemIds.includes(String(item.id)),
                        ) && (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between px-1">
                              <h3 className="text-secondary-text text-[11px] font-black tracking-widest uppercase">
                                Available for Notifications
                              </h3>
                              <div className="bg-border-primary/50 ml-4 h-px flex-1" />
                            </div>
                            <div className="grid gap-3">
                              {sortedAndFilteredItems
                                .filter(
                                  (item) =>
                                    !notifiedItemIds.includes(String(item.id)),
                                )
                                .map((item) => renderItemCard(item))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
      <SupporterModal onClose={closeModal} {...modalState} />
    </>
  );

  // Define renderItemCard helper inside the same component scope
  function renderItemCard(item: PartialItem) {
    const isNotified = notifiedItemIds.includes(String(item.id));
    const isProcessing = processingItemId === item.id;
    const itemUrl = `/item/${item.type.toLowerCase()}/${item.name}`;
    const categoryIcon = getCategoryIcon(item.type);

    return (
      <div
        key={item.id}
        className={cn(
          "border-border-card bg-tertiary-bg group flex w-full items-center justify-between rounded-xl border p-4 text-left transition-all duration-300",
          processingItemId !== null && "opacity-50",
        )}
      >
        <div
          className="min-w-0 flex-1 cursor-pointer pr-4"
          onClick={() => toggleNotification(item)}
        >
          <p className="truncate text-sm font-bold">
            <Link
              href={itemUrl}
              target="_blank"
              rel="noopener noreferrer"
              prefetch={false}
              onClick={(e) => e.stopPropagation()}
              className={cn(
                "transition-colors",
                isNotified
                  ? "text-link hover:text-link-hover"
                  : "text-primary-text hover:text-link-hover",
              )}
            >
              {item.name}
            </Link>
          </p>
          <div className="mt-1 flex flex-wrap gap-2">
            <span
              className="text-primary-text bg-tertiary-bg/40 inline-flex h-6 items-center gap-1.5 rounded-lg border px-2.5 text-xs leading-none font-medium shadow-2xl backdrop-blur-xl"
              style={{
                borderColor: getCategoryColor(item.type),
              }}
            >
              {categoryIcon && (
                <categoryIcon.Icon
                  className="h-3 w-3"
                  style={{ color: getCategoryColor(item.type) }}
                />
              )}
              {item.type}
            </span>
          </div>
        </div>

        <div
          className="relative flex shrink-0 cursor-pointer items-center"
          onClick={() => toggleNotification(item)}
        >
          {isProcessing ? (
            <div className="border-button-info h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
          ) : (
            <input
              type="checkbox"
              checked={isNotified}
              readOnly
              disabled={processingItemId !== null}
              className="text-button-info focus:ring-button-info bg-primary-bg border-border-card h-4 w-4 cursor-pointer rounded disabled:cursor-not-allowed"
            />
          )}
        </div>
      </div>
    );
  }
}
