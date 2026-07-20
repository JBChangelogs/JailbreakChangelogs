"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import { trackEvent } from "@/utils/analytics/rybbit";
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
import { getCategoryColor, getCategoryIcon } from "@/utils/items/categoryIcons";
import { matchesTextSearch } from "@/utils/helpers/itemSearch";
import SupporterModal from "@/components/Modals/SupporterModal";
import { useSupporterModal } from "@/hooks/useSupporterModal";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Spinner } from "@/components/ui/Spinner";
import { createLogger } from "@/services/logger";
import {
  fetchEmailLinkedStatus,
  fetchEmailNotificationStatus,
} from "@/utils/api/api";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pagination } from "@/components/ui/Pagination";

const ITEMS_PER_PAGE = 20;

const log = createLogger("NOTIFY");

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

  // State management
  const [items, setItems] = useState<PartialItem[]>([]);
  const [notifiedItemIds, setNotifiedItemIds] = useState<string[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [processingItemId, setProcessingItemId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [avatarError, setAvatarError] = useState(false);
  const [emailLinked, setEmailLinked] = useState(false);
  const [emailNotifEnabled, setEmailNotifEnabled] = useState(false);
  const [activeTab, setActiveTab] = useState<"watching" | "all">("watching");
  const [page, setPage] = useState(1);
  const limitMap: Record<number, number> = { 0: 3, 1: 5, 2: 10, 3: 15 };
  const maxNotifications = limitMap[user?.premiumtype ?? 0] ?? 3;

  const { modalState, openModal, closeModal } = useSupporterModal();
  const sheetContentRef = useRef<HTMLDivElement | null>(null);

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
        const body = await response.json().catch(() => ({}));
        log.error("fetch items failed", { status: response.status, body });
        throw new Error("Failed to fetch items");
      }
      const data = await response.json();
      setItems(data);
    } catch (error) {
      log.error("Error fetching items:", error);
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
        const body = await response.json().catch(() => ({}));
        if (response.status === 429) {
          log.info("OG Notify limit reached (GET)");
        } else {
          log.error("fetch notifications failed", {
            status: response.status,
            body,
          });
        }
        throw new Error("Failed to fetch notifications");
      }
      const data = await response.json();
      // Ensure we have an array of strings
      const ids = Array.isArray(data) ? data.map((id) => String(id)) : [];
      setNotifiedItemIds(ids);
    } catch (error) {
      log.error("Error fetching notifications:", error);
    } finally {
      setIsLoadingNotifications(false);
    }
  }, [user?.roblox_id]);

  /**
   * Fetches whether the user has an email linked and email notifications enabled
   */
  const fetchEmailStatus = useCallback(async () => {
    try {
      const [linkedData, enabledData] = await Promise.all([
        fetchEmailLinkedStatus(),
        fetchEmailNotificationStatus(),
      ]);
      setEmailLinked(linkedData.linked === true);
      setEmailNotifEnabled(enabledData.enabled === true);
    } catch (error) {
      log.error("Error fetching email status:", error);
    }
  }, []);

  // Fetch items when sheet opens
  useEffect(() => {
    if (isOpen && user?.roblox_id) {
      // Clear previous states to avoid flashes of old data
      setAvatarError(false);
      fetchItems();
      fetchNotifications();
      fetchEmailStatus();
    }
  }, [
    isOpen,
    user?.roblox_id,
    fetchItems,
    fetchNotifications,
    fetchEmailStatus,
  ]);

  /**
   * Toggles notification for a specific item
   */
  const toggleNotification = async (item: PartialItem) => {
    if (!user?.roblox_id) {
      toast.info("Authentication required", {
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
          log.info("OG Notification 429 Error Data:", errorData);
        } catch (e) {
          log.error("Failed to parse 429 response", e);
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
        trackEvent("Remove OG Notification", {
          itemName: item.name,
          itemType: item.type,
        });
      } else {
        setNotifiedItemIds((prev) => [...prev, itemIdStr]);
        toast.success("Notification Added", {
          id: toastId,
          description: `You will now be notified when your ${item.name} (${item.type}) is found!`,
        });

        // Track analytics
        trackEvent("Add OG Notification", {
          itemName: item.name,
          itemType: item.type,
        });
      }
    } catch (error) {
      log.error("Error toggling notification:", error);
      toast.error("Update Failed", {
        id: toastId,
        description: "Failed to update notification. Please try again.",
      });
    } finally {
      setProcessingItemId(null);
    }
  };

  // Filter items by search and type, sorted alphabetically
  const filteredItems = useMemo(() => {
    return items
      .filter((item) => {
        const matchesType =
          selectedType === "all" || item.type === selectedType;
        return (
          matchesType && matchesTextSearch([item.name, item.type], searchQuery)
        );
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [items, searchQuery, selectedType]);

  // Subset of filtered items the user is currently watching
  const watchingItems = useMemo(
    () =>
      filteredItems.filter((item) => notifiedItemIds.includes(String(item.id))),
    [filteredItems, notifiedItemIds],
  );

  // Reset to page 1 whenever the active list changes shape
  useEffect(() => {
    setPage(1);
  }, [searchQuery, selectedType, activeTab]);

  const activeListItems =
    activeTab === "watching" ? watchingItems : filteredItems;
  const totalPages = Math.max(
    1,
    Math.ceil(activeListItems.length / ITEMS_PER_PAGE),
  );
  const displayedItems = activeListItems.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE,
  );

  const handlePageChange = (
    _event: React.ChangeEvent<unknown>,
    value: number,
  ) => {
    setPage(value);
  };

  // Get unique item types for filter
  const itemTypes = Array.from(new Set(items.map((item) => item.type))).sort();

  // Check authentication states
  const isAuthenticated = !!user;
  const hasRobloxLinked = !!user?.roblox_id;
  const canUseFeature = hasRobloxLinked;

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent
          ref={sheetContentRef}
          className="bg-secondary-bg flex h-full w-full flex-col sm:max-w-lg"
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

          {/* Identity + email upsell - compact borderless strip */}
          {user?.roblox_id && (
            <div className="border-border-card mt-4 shrink-0 space-y-2 border-b pb-4">
              <Link
                href={`https://www.roblox.com/users/${user.roblox_id}/profile`}
                target="_blank"
                rel="noopener noreferrer"
                className="group hover:bg-tertiary-bg/50 -mx-1 flex items-center gap-2.5 rounded-lg px-1 py-1 transition-colors"
              >
                <div className="bg-quaternary-bg border-border-card relative h-8 w-8 shrink-0 overflow-hidden rounded-full border">
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
                        className="text-tertiary-text h-4 w-4"
                      />
                    </div>
                  )}
                </div>
                <p className="min-w-0 flex-1 truncate text-sm">
                  <span className="text-primary-text group-hover:text-link font-semibold transition-colors">
                    {user.roblox_display_name || user.roblox_username || "User"}
                  </span>
                  <span className="text-secondary-text">
                    {" "}
                    &middot; @{user.roblox_username || user.roblox_id}
                  </span>
                </p>
                <Icon
                  icon="heroicons:arrow-top-right-on-square"
                  className="text-secondary-text h-3.5 w-3.5 shrink-0"
                />
              </Link>

              {!(emailLinked && emailNotifEnabled) && (
                <div className="flex items-center gap-1.5">
                  <Icon
                    icon="heroicons:envelope"
                    className="text-link h-3.5 w-3.5 shrink-0"
                    inline={true}
                  />
                  <p className="text-secondary-text min-w-0 flex-1 truncate text-xs">
                    Get notified by email too &mdash;{" "}
                    <Link
                      href="/settings?highlight=notifications"
                      onClick={onClose}
                      className="text-link hover:text-link-hover font-semibold"
                    >
                      {emailLinked ? "enable it" : "link your email"}
                    </Link>
                  </p>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Icon
                        icon="heroicons:information-circle"
                        className="text-secondary-text hover:text-primary-text h-3.5 w-3.5 shrink-0 cursor-help transition-colors"
                        inline={true}
                      />
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      className="bg-secondary-bg text-primary-text max-w-60 border-none shadow-(--color-card-shadow)"
                    >
                      <p>
                        We don&apos;t store your email address separately
                        &mdash; it&apos;s obtained from Discord OAuth and used
                        only for sending notifications.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              )}
            </div>
          )}

          <div className="mt-4 flex min-h-0 flex-1 flex-col gap-6">
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

                <p className="text-secondary-text mb-8 max-w-75 text-sm leading-relaxed">
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
                  className="h-14 w-full text-base font-bold"
                >
                  {isAuthenticated
                    ? "Link Roblox Account"
                    : "Login with Discord"}
                </Button>
              </div>
            )}

            {canUseFeature && (
              <div className="flex min-h-0 flex-1 flex-col gap-3">
                {/* Search + category filter - single row */}
                <div className="flex shrink-0 gap-2">
                  <div className="relative min-w-0 flex-1">
                    <input
                      type="text"
                      placeholder="Search items..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="border-border-card bg-tertiary-bg text-primary-text placeholder:text-secondary-text focus:border-button-info focus:ring-button-info/50 hover:border-border-focus w-full rounded-xl border py-2.5 pr-9 pl-9 text-sm transition-all duration-300 focus:ring-1 focus:outline-none"
                    />
                    <Icon
                      icon="heroicons:magnifying-glass"
                      className="text-secondary-text absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
                      inline={true}
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="text-secondary-text hover:text-primary-text absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 cursor-pointer transition-colors"
                      >
                        <Icon icon="heroicons:x-mark" inline={true} />
                      </button>
                    )}
                  </div>

                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className={cn(
                          "border-border-card bg-tertiary-bg text-primary-text focus:border-button-info focus:ring-button-info/50 hover:border-border-focus flex h-auto shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-2.5 text-sm transition-all duration-300 focus:ring-1 focus:outline-none",
                          selectedType !== "all" && "border-link text-link",
                        )}
                        aria-label="Filter by item category"
                      >
                        <Icon
                          icon="heroicons:funnel"
                          className="h-4 w-4 shrink-0"
                          inline={true}
                        />
                        <span className="max-w-20 truncate">
                          {selectedType === "all" ? "Filter" : selectedType}
                        </span>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      container={sheetContentRef.current}
                      className="border-border-card bg-tertiary-bg text-primary-text max-h-70 w-(--radix-popper-anchor-width) min-w-40 scrollbar-thin overflow-x-hidden overflow-y-auto rounded-xl border p-1 shadow-lg"
                    >
                      <DropdownMenuCheckboxItem
                        checked={selectedType === "all"}
                        onCheckedChange={(checked) => {
                          if (checked) setSelectedType("all");
                        }}
                        className="focus:bg-quaternary-bg focus:text-primary-text cursor-pointer rounded-lg py-2 pr-8 pl-3 text-sm"
                      >
                        All
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
                          className="focus:bg-quaternary-bg focus:text-primary-text cursor-pointer rounded-lg py-2 pr-8 pl-3 text-sm"
                        >
                          {type}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Watching / All Items tabs */}
                <Tabs
                  value={activeTab}
                  onValueChange={(value) =>
                    setActiveTab(value as "watching" | "all")
                  }
                  className="flex min-h-0 flex-1 flex-col"
                >
                  <TabsList fullWidth className="shrink-0">
                    <TabsTrigger fullWidth value="watching">
                      Watching ({notifiedItemIds.length}/{maxNotifications})
                    </TabsTrigger>
                    <TabsTrigger fullWidth value="all">
                      All Items
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent
                    value="watching"
                    className="-mr-1 flex min-h-0 flex-1 flex-col overflow-y-auto pr-1"
                  >
                    {isLoadingItems || isLoadingNotifications ? (
                      renderLoadingState()
                    ) : watchingItems.length === 0 ? (
                      renderEmptyState(
                        "heroicons:bell-slash",
                        "Not watching anything yet",
                        'Switch to "All Items" and toggle the ones you want to track.',
                      )
                    ) : (
                      <>
                        <div className="grid gap-3 pb-4">
                          {displayedItems.map((item) => renderItemCard(item))}
                        </div>
                        {totalPages > 1 && (
                          <div className="mt-auto flex justify-center pb-8">
                            <Pagination
                              count={totalPages}
                              page={page}
                              onChange={handlePageChange}
                            />
                          </div>
                        )}
                      </>
                    )}
                  </TabsContent>

                  <TabsContent
                    value="all"
                    className="-mr-1 flex min-h-0 flex-1 flex-col overflow-y-auto pr-1"
                  >
                    {isLoadingItems || isLoadingNotifications ? (
                      renderLoadingState()
                    ) : filteredItems.length === 0 ? (
                      renderEmptyState(
                        "heroicons:magnifying-glass",
                        "No items found",
                        "We couldn't find any items matching your current filters.",
                      )
                    ) : (
                      <>
                        <div className="grid gap-3 pb-4">
                          {displayedItems.map((item) => renderItemCard(item))}
                        </div>
                        {totalPages > 1 && (
                          <div className="mt-auto flex justify-center pb-8">
                            <Pagination
                              count={totalPages}
                              page={page}
                              onChange={handlePageChange}
                            />
                          </div>
                        )}
                      </>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
      <SupporterModal onClose={closeModal} {...modalState} />
    </>
  );

  // Define render helpers inside the same component scope
  function renderLoadingState() {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <Spinner className="shadow-button-info/20 h-10 w-10 drop-shadow-lg" />
        <p className="text-secondary-text text-sm font-medium">
          Loading catalog...
        </p>
      </div>
    );
  }

  function renderEmptyState(icon: string, title: string, description: string) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="bg-tertiary-bg/50 mb-6 rounded-full p-6">
          <Icon
            icon={icon}
            className="text-secondary-text/40 h-12 w-12"
            inline={true}
          />
        </div>
        <h3 className="text-primary-text mb-2 text-lg font-semibold">
          {title}
        </h3>
        <p className="text-secondary-text mx-auto max-w-60 text-sm">
          {description}
        </p>
      </div>
    );
  }

  function renderItemCard(item: PartialItem) {
    const isNotified = notifiedItemIds.includes(String(item.id));
    const isProcessing = processingItemId === item.id;
    const itemUrl = `/item/${encodeURIComponent(item.type)}/${encodeURIComponent(item.name)}`;
    const categoryIcon = getCategoryIcon(item.type);

    return (
      <div
        key={item.id}
        className={cn(
          "border-border-card bg-tertiary-bg group flex w-full items-center justify-between rounded-xl border p-4 text-left transition-all duration-300",
          processingItemId !== null && "opacity-50",
        )}
      >
        <button
          type="button"
          className="min-w-0 flex-1 cursor-pointer pr-4 text-left"
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
              className="text-primary-text bg-tertiary-bg/40 inline-flex h-6 items-center gap-1.5 rounded-lg border px-2.5 text-xs leading-none font-medium backdrop-blur-xl"
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
        </button>

        <div className="relative flex shrink-0 items-center">
          {isProcessing ? (
            <Spinner className="h-4 w-4" />
          ) : (
            <Checkbox
              checked={isNotified}
              onCheckedChange={() => toggleNotification(item)}
              disabled={processingItemId !== null}
              aria-label={`Toggle notification for ${item.name}`}
            />
          )}
        </div>
      </div>
    );
  }
}
