"use client";

import React from "react";
import { Icon } from "@/components/ui/IconWrapper";
import { formatProfileDate } from "@/utils/timestamp";
import { useAuthContext } from "@/contexts/AuthContext";
import { Dialog, DialogPanel } from "@headlessui/react";
import { toast } from "sonner";
import AddServerModal from "./AddServerModal";
import { Skeleton } from "@mui/material";
import Image from "next/image";
import Link from "next/link";
import { Pagination } from "@/components/ui/Pagination";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { UserAvatar } from "@/utils/avatar";
import DOMPurify from "dompurify";
import type { UserData } from "@/types/auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const BADGE_BASE_URL =
  "https://assets.jailbreakchangelogs.xyz/assets/website_icons";
const supporterIcons = {
  1: `${BADGE_BASE_URL}/jbcl_supporter_1.svg`,
  2: `${BADGE_BASE_URL}/jbcl_supporter_2.svg`,
  3: `${BADGE_BASE_URL}/jbcl_supporter_3.svg`,
};

interface Server {
  id: number;
  link: string;
  owner: string;
  rules: string;
  expires: string;
  created_at: string;
}

type SortOption =
  | "date_added_asc"
  | "date_added_desc"
  | "date_expires_asc"
  | "date_expires_desc";

const processMentions = (text: string): string => {
  return text.replace(/@(\w+)/g, (_, username) => {
    return `<span>@${username}</span>`;
  });
};

const sanitizeHTML = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["span", "br"],
    ALLOWED_ATTR: [],
  });
};

const ServerList: React.FC<{
  sortOption?: SortOption;
  onSortChange?: (sortOption: SortOption) => void;
}> = ({ sortOption = "date_added_desc", onSortChange }) => {
  const { isAuthenticated, user } = useAuthContext();
  const [servers, setServers] = React.useState<Server[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [loggedInUserId, setLoggedInUserId] = React.useState<string | null>(
    null,
  );
  const [userData, setUserData] = React.useState<Record<string, UserData>>({});
  const [loadingUsers, setLoadingUsers] = React.useState<
    Record<string, boolean>
  >({});
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [editingServer, setEditingServer] = React.useState<Server | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false);
  const [serverToDelete, setServerToDelete] = React.useState<Server | null>(
    null,
  );
  const [deletingServer, setDeletingServer] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const itemsPerPage = 15;

  const sortOptions = [
    { value: "date_added_desc", label: "Newest added" },
    { value: "date_added_asc", label: "Oldest added" },
    { value: "date_expires_desc", label: "Latest expiry" },
    { value: "date_expires_asc", label: "Earliest expiry" },
  ];
  const sortLabel =
    sortOptions.find((option) => option.value === sortOption)?.label ??
    "Select sort option";

  const sortedServers = React.useMemo(() => {
    const sorted = [...servers];
    const normalizeTimestamp = (timestamp: string): number => {
      const num = parseInt(timestamp);
      return num < 10000000000 ? num * 1000 : num;
    };

    // Separate user's servers from others
    const userServers = sorted.filter(
      (server) => server.owner === loggedInUserId,
    );
    const otherServers = sorted.filter(
      (server) => server.owner !== loggedInUserId,
    );

    // Sort each group based on the selected option
    const sortGroup = (group: Server[]) => {
      switch (sortOption) {
        case "date_added_asc":
          return group.sort((a, b) => a.id - b.id);
        case "date_added_desc":
          return group.sort((a, b) => b.id - a.id);
        case "date_expires_asc":
          return group.sort((a, b) => {
            if (a.expires === "Never" && b.expires === "Never") return 0;
            if (a.expires === "Never") return 1;
            if (b.expires === "Never") return -1;
            const aTime = normalizeTimestamp(a.expires);
            const bTime = normalizeTimestamp(b.expires);
            return aTime - bTime;
          });
        case "date_expires_desc":
          return group.sort((a, b) => {
            if (a.expires === "Never" && b.expires === "Never") return 0;
            if (a.expires === "Never") return -1;
            if (b.expires === "Never") return 1;
            const aTime = normalizeTimestamp(a.expires);
            const bTime = normalizeTimestamp(b.expires);
            return bTime - aTime;
          });
        default:
          return group;
      }
    };

    // Return user's servers first, then others
    return [...sortGroup(userServers), ...sortGroup(otherServers)];
  }, [servers, sortOption, loggedInUserId]);

  const serverNumberMap = React.useMemo(() => {
    const idToNumber: Record<number, number> = {};
    const sortedByIds = [...servers].sort((a, b) => a.id - b.id);
    sortedByIds.forEach((server, index) => {
      idToNumber[server.id] = index + 1;
    });
    return idToNumber;
  }, [servers]);

  // Pagination calculation
  const totalPages = Math.ceil(sortedServers.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentServers = sortedServers.slice(startIndex, endIndex);

  // Fetch user data for visible servers
  React.useEffect(() => {
    const fetchVisibleUsers = async () => {
      const uniqueOwnerIds = [
        ...new Set(currentServers.map((server) => server.owner)),
      ];

      // Filter out user IDs that we already have data for or are currently loading
      const idsToFetch = uniqueOwnerIds.filter(
        (id) => !userData[id] && !loadingUsers[id],
      );

      if (idsToFetch.length === 0) return;

      // Mark these IDs as loading
      setLoadingUsers((prev) => {
        const next = { ...prev };
        idsToFetch.forEach((id) => (next[id] = true));
        return next;
      });

      try {
        const userResponse = await fetch(
          `/api/users/batch?ids=${encodeURIComponent(idsToFetch.join(","))}`,
          {
            cache: "no-store",
          },
        );

        if (userResponse.ok) {
          const userDataArray = (await userResponse.json()) as UserData[];
          const newUserDataMap = userDataArray.reduce(
            (acc, userData) => {
              acc[userData.id] = userData;
              return acc;
            },
            {} as Record<string, UserData>,
          );

          setUserData((prev) => ({ ...prev, ...newUserDataMap }));
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
      } finally {
        // Mark as no longer loading
        setLoadingUsers((prev) => {
          const next = { ...prev };
          idsToFetch.forEach((id) => (next[id] = false));
          return next;
        });
      }
    };

    fetchVisibleUsers();
  }, [currentServers, userData, loadingUsers]); // Dependencies ensure we fetch when page changes or servers update

  // Handle page change
  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    value: number,
  ) => {
    setPage(value);
  };

  React.useEffect(() => {
    setLoggedInUserId(user?.id || null);
  }, [user?.id]);

  React.useEffect(() => {
    const fetchServers = async () => {
      setLoading(true);
      setError(null);

      try {
        const serversResponse = await fetch("/api/servers/list", {
          cache: "no-store",
        });
        if (!serversResponse.ok) {
          throw new Error("Failed to fetch servers");
        }
        const data = (await serversResponse.json()) as Server[];

        // Filter out expired servers (but keep servers with "Never" expiry)
        const now = Date.now();
        const filteredServers = data.filter((server) => {
          if (server.expires === "Never") return true;
          const expiryTimestamp = parseInt(server.expires);
          const normalizedExpiry =
            expiryTimestamp < 10000000000
              ? expiryTimestamp * 1000
              : expiryTimestamp;
          return normalizedExpiry > now;
        });
        setServers(filteredServers);
        // User data fetching is now handled by the other useEffect dependent on currentServers
      } catch (serverErr) {
        setError(
          serverErr instanceof Error
            ? serverErr.message
            : "An error occurred while fetching servers",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchServers();

    const handleAuthChange = (event: CustomEvent) => {
      const userData = event.detail;
      if (!userData) {
        setLoggedInUserId(null);
      } else {
        setLoggedInUserId(userData.id);
      }
    };

    window.addEventListener(
      "authStateChanged",
      handleAuthChange as EventListener,
    );

    return () => {
      window.removeEventListener(
        "authStateChanged",
        handleAuthChange as EventListener,
      );
    };
  }, []);

  const handleServerAdded = async () => {
    try {
      const serversResponse = await fetch("/api/servers/list", {
        cache: "no-store",
      });
      if (!serversResponse.ok) {
        throw new Error("Failed to fetch servers");
      }
      const data = (await serversResponse.json()) as Server[];

      // Filter out expired servers (but keep servers with "Never" expiry)
      const now = Date.now();
      const filteredServers = data.filter((server) => {
        if (server.expires === "Never") return true;
        const expiryTimestamp = parseInt(server.expires);
        const normalizedExpiry =
          expiryTimestamp < 10000000000
            ? expiryTimestamp * 1000
            : expiryTimestamp;
        return normalizedExpiry > now;
      });
      setServers(filteredServers);
      // User data will update automatically thanks to the effect
    } catch {
      toast.error("Failed to refresh server list");
    }
  };

  const handleDeleteServer = (server: Server) => {
    setServerToDelete(server);
    setDeleteModalOpen(true);
  };

  const handleDeleteServerFromMenu = (server: Server) => {
    // Let Radix close the menu before opening modal to avoid layout/focus race.
    setTimeout(() => {
      handleDeleteServer(server);
    }, 0);
  };

  const confirmDeleteServer = async () => {
    if (!serverToDelete) return;
    if (deletingServer) return;
    if (!isAuthenticated) {
      toast.error("You must be logged in to delete a server.");
      setDeleteModalOpen(false);
      setServerToDelete(null);
      return;
    }
    setDeletingServer(true);
    const deletingToastId = toast.loading("Deleting server...");
    try {
      const response = await fetch(`/api/servers/delete`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          link: serverToDelete.link,
        }),
      });
      if (response.ok) {
        toast.success("Server deleted successfully!", { id: deletingToastId });
        handleServerAdded();
      } else {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Failed to delete server" }));
        toast.error(`Error deleting server: ${errorData.message}`, {
          id: deletingToastId,
        });
      }
    } catch {
      toast.error("An error occurred while deleting the server.", {
        id: deletingToastId,
      });
    } finally {
      setDeletingServer(false);
      setDeleteModalOpen(false);
      setServerToDelete(null);
    }
  };

  const handleEditServer = (server: Server) => {
    setEditingServer(server);
    setIsAddModalOpen(true);
  };

  const handleEditServerFromMenu = (server: Server) => {
    // Let Radix close the menu before opening modal to avoid layout/focus race.
    setTimeout(() => {
      handleEditServer(server);
    }, 0);
  };

  const handleAddServer = () => {
    setEditingServer(null);
    setIsAddModalOpen(true);
  };

  const handleCopyLink = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Server link copied to clipboard!");
    } catch {
      toast.error("Failed to copy server link");
    }
  };

  if (loading) {
    return (
      <div>
        <div className="mb-4 flex items-center justify-between px-4 lg:px-0">
          <div className="flex items-center">
            <Skeleton
              variant="text"
              width={120}
              height={24}
              sx={{ bgcolor: "var(--color-secondary-bg)" }}
            />
          </div>
          <Skeleton
            variant="rounded"
            width={120}
            height={40}
            sx={{ bgcolor: "var(--color-secondary-bg)" }}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="border-border-card bg-secondary-bg rounded-xl border p-4 shadow-sm sm:p-5"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Skeleton
                    variant="text"
                    width={110}
                    height={24}
                    sx={{ bgcolor: "var(--color-tertiary-bg)" }}
                  />
                  <Skeleton
                    variant="text"
                    width={90}
                    height={16}
                    sx={{ bgcolor: "var(--color-tertiary-bg)" }}
                  />
                </div>
                <Skeleton
                  variant="rounded"
                  width={90}
                  height={28}
                  sx={{ bgcolor: "var(--color-tertiary-bg)" }}
                />
              </div>

              <div className="border-border-card bg-tertiary-bg mb-4 rounded-lg border p-3">
                <Skeleton
                  variant="text"
                  width={90}
                  height={16}
                  sx={{ bgcolor: "var(--color-secondary-bg)" }}
                />
                <div className="mt-2 flex items-center gap-2">
                  <Skeleton
                    variant="circular"
                    width={32}
                    height={32}
                    sx={{ bgcolor: "var(--color-secondary-bg)" }}
                  />
                  <Skeleton
                    variant="text"
                    width={130}
                    height={22}
                    sx={{ bgcolor: "var(--color-secondary-bg)" }}
                  />
                </div>
              </div>

              <div className="mb-4 flex flex-wrap gap-2">
                <Skeleton
                  variant="rounded"
                  width={130}
                  height={28}
                  sx={{ bgcolor: "var(--color-tertiary-bg)" }}
                />
                <Skeleton
                  variant="rounded"
                  width={120}
                  height={28}
                  sx={{ bgcolor: "var(--color-tertiary-bg)" }}
                />
              </div>

              <div className="border-border-card bg-tertiary-bg rounded-lg border p-3 sm:p-4">
                <Skeleton
                  variant="text"
                  width={70}
                  height={20}
                  sx={{ bgcolor: "var(--color-secondary-bg)" }}
                />
                <div className="mt-2 space-y-2">
                  <Skeleton
                    variant="text"
                    width="100%"
                    height={16}
                    sx={{ bgcolor: "var(--color-secondary-bg)" }}
                  />
                  <Skeleton
                    variant="text"
                    width="85%"
                    height={16}
                    sx={{ bgcolor: "var(--color-secondary-bg)" }}
                  />
                </div>
              </div>

              <div className="border-border-card mt-4 flex items-center justify-between border-t pt-4">
                <Skeleton
                  variant="rounded"
                  width={90}
                  height={32}
                  sx={{ bgcolor: "var(--color-tertiary-bg)" }}
                />
                <Skeleton
                  variant="rounded"
                  width={100}
                  height={32}
                  sx={{ bgcolor: "var(--color-tertiary-bg)" }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-button-danger/10 border-button-danger text-button-danger rounded-lg border p-4">
        {error}
      </div>
    );
  }

  if (sortedServers.length === 0) {
    return (
      <div className="border-border-card bg-secondary-bg hover:border-border-focus rounded-lg border p-8 text-center">
        <Icon
          icon="heroicons-outline:shield-check"
          className="text-button-info mx-auto mb-4 h-12 w-12"
        />
        <h3 className="text-primary-text mb-2 text-xl font-semibold">
          No servers available
        </h3>
        <p className="text-secondary-text">
          You can add a server or check back later
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 px-4 lg:px-0">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-start">
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <div className="min-w-0 flex-1 sm:min-w-[190px] sm:flex-none md:min-w-[210px]">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="border-border-card bg-secondary-bg text-primary-text focus:border-button-info focus:ring-button-info/50 hover:border-border-focus flex h-[40px] w-full items-center justify-between rounded-lg border px-4 py-2 text-sm transition-all focus:ring-1 focus:outline-none"
                    aria-label="Select sort option"
                  >
                    <span className="truncate">{sortLabel}</span>
                    <Icon
                      icon="heroicons:chevron-down"
                      className="text-secondary-text h-4 w-4"
                    />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="border-border-card bg-secondary-bg text-primary-text scrollbar-thin max-h-[240px] w-[var(--radix-popper-anchor-width)] min-w-[var(--radix-popper-anchor-width)] overflow-x-hidden overflow-y-auto rounded-xl border p-1 shadow-lg"
                >
                  <DropdownMenuRadioGroup
                    value={sortOption}
                    onValueChange={(value) => {
                      if (onSortChange) {
                        onSortChange(value as SortOption);
                      }
                    }}
                  >
                    {sortOptions.map((option) => (
                      <DropdownMenuRadioItem
                        key={option.value}
                        value={option.value}
                        className="focus:bg-quaternary-bg focus:text-primary-text cursor-pointer rounded-lg px-3 py-2 text-sm"
                      >
                        {option.label}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <Button
              onClick={handleAddServer}
              size="sm"
              className="shrink-0 whitespace-nowrap"
            >
              <Icon
                icon="heroicons:plus-circle"
                className="mr-1 h-4 w-4 sm:mr-2 sm:h-5 sm:w-5"
              />
              <span className="hidden sm:inline">Add server</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        </div>
        <p className="text-secondary-text mt-3 text-sm">
          Total Servers: {sortedServers.length}
        </p>
      </div>

      {totalPages > 1 && (
        <div className="mb-6 flex justify-center">
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 gap-y-6 pb-4 md:grid-cols-2 xl:grid-cols-3">
        {currentServers.map((server) => {
          // Check if user is a Supporter (premium types 1-3)
          const premiumType = userData[server.owner]?.premiumtype ?? 0;
          const isSupporter = premiumType >= 1 && premiumType <= 3;
          const supporterTier = isSupporter ? premiumType : null;
          const isServerOwner = loggedInUserId === server.owner;
          const expiresText =
            server.expires === "Never"
              ? "Never"
              : formatProfileDate(server.expires);
          const hasRules = Boolean(server.rules && server.rules !== "N/A");
          const parsedRules = hasRules
            ? sanitizeHTML(processMentions(server.rules))
            : "No rules set by owner";
          const shouldShowRulesExpand = hasRules && server.rules.length > 140;

          // Background style for different supporter tiers
          const getBackgroundStyle = (): React.CSSProperties => {
            if (!isSupporter) return {};

            switch (premiumType) {
              case 1:
                return {
                  backgroundColor: "var(--color-supporter-bronze-bg)",
                };
              case 2:
                return {
                  backgroundColor: "var(--color-supporter-silver-bg)",
                };
              case 3:
                return {
                  backgroundColor: "var(--color-supporter-gold-bg)",
                };
              default:
                return {};
            }
          };

          return (
            <div
              key={server.id}
              className={`border-border-card rounded-xl border p-4 shadow-sm transition-all hover:shadow-md sm:p-5 ${
                isSupporter ? "" : "bg-secondary-bg"
              }`}
              style={getBackgroundStyle()}
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-primary-text block text-base font-semibold">
                    Server #{serverNumberMap[server.id]}
                  </span>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {isServerOwner && (
                    <DropdownMenu modal={false}>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="px-2"
                          aria-label="Server actions"
                        >
                          <Icon icon="heroicons:ellipsis-horizontal" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        onCloseAutoFocus={(event) => event.preventDefault()}
                        className="border-border-card bg-secondary-bg text-primary-text min-w-[180px] rounded-xl border p-0"
                      >
                        <DropdownMenuItem
                          className="w-full cursor-pointer rounded-none px-4 py-2"
                          onSelect={() => handleEditServerFromMenu(server)}
                        >
                          <Icon
                            icon="heroicons:pencil"
                            className="mr-2 h-4 w-4"
                          />
                          Edit server
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="hover:bg-button-danger/10 text-button-danger hover:text-button-danger focus:bg-button-danger/10 focus:text-button-danger w-full cursor-pointer rounded-none px-4 py-2"
                          onSelect={() => handleDeleteServerFromMenu(server)}
                        >
                          <Icon
                            icon="heroicons:trash-solid"
                            className="mr-2 h-4 w-4"
                          />
                          Delete server
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>

              <div className="border-border-card bg-tertiary-bg mb-4 rounded-lg border p-3">
                <p className="text-secondary-text mb-2 text-xs tracking-wide uppercase">
                  Server owner
                </p>
                <div className="flex items-center justify-between gap-3">
                  {userData[server.owner] ? (
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <UserAvatar
                        userId={userData[server.owner].id}
                        avatarHash={userData[server.owner].avatar}
                        username={userData[server.owner].username}
                        size={9}
                        custom_avatar={userData[server.owner].custom_avatar}
                        showBadge={false}
                        settings={userData[server.owner].settings}
                        premiumType={userData[server.owner].premiumtype}
                      />
                      <Link
                        href={`/users/${server.owner}`}
                        prefetch={false}
                        className="text-primary-text hover:text-link active:text-link-active min-w-0 truncate font-medium transition-colors"
                      >
                        {userData[server.owner].username}
                      </Link>
                      {isSupporter && supporterTier && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="flex items-center">
                              <Image
                                src={
                                  supporterIcons[
                                    supporterTier as keyof typeof supporterIcons
                                  ]
                                }
                                alt={`Supporter Type ${supporterTier}`}
                                width={16}
                                height={16}
                                className="object-contain"
                              />
                            </span>
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
                  ) : (
                    <Skeleton
                      variant="text"
                      width={100}
                      sx={{ bgcolor: "var(--color-secondary-bg)" }}
                    />
                  )}
                </div>
              </div>

              <div className="mb-4 flex flex-wrap gap-2">
                <div className="text-primary-text bg-tertiary-bg/40 border-border-card hover:bg-quaternary-bg/60 inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium shadow-sm transition-all">
                  <Icon icon="heroicons:clock" className="h-3.5 w-3.5" />
                  Added {formatProfileDate(server.created_at)}
                </div>
                <div className="text-primary-text bg-tertiary-bg/40 border-border-card hover:bg-quaternary-bg/60 inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium shadow-sm transition-all">
                  <Icon
                    icon="heroicons:calendar-days"
                    className="h-3.5 w-3.5"
                  />
                  Expires {expiresText}
                </div>
              </div>

              <div className="border-border-card bg-tertiary-bg rounded-lg border p-3 sm:p-4">
                <h4 className="text-primary-text mb-2 text-sm font-medium">
                  Server rules
                </h4>
                <p
                  className="text-secondary-text text-sm wrap-break-word"
                  style={{
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                  dangerouslySetInnerHTML={{ __html: parsedRules }}
                />
                {shouldShowRulesExpand && (
                  <details className="mt-2">
                    <summary className="text-link hover:text-link-hover cursor-pointer text-xs">
                      Read full rules
                    </summary>
                    <p
                      className="text-secondary-text mt-2 text-sm wrap-break-word"
                      dangerouslySetInnerHTML={{ __html: parsedRules }}
                    />
                  </details>
                )}
              </div>

              <div className="border-border-card mt-4 flex items-center justify-between border-t pt-4">
                <Button
                  onClick={() => handleCopyLink(server.link)}
                  size="sm"
                  variant="secondary"
                  className="px-3"
                  aria-label="Copy Server Link"
                  data-umami-event="Copy Server Link"
                  data-umami-event-server-id={server.id}
                >
                  <Icon icon="heroicons:clipboard" className="mr-1 h-4 w-4" />
                  Copy link
                </Button>
                <Button
                  asChild
                  size="sm"
                  variant="default"
                  className="px-3"
                  data-umami-event="Join Server"
                  data-umami-event-server-id={server.id}
                >
                  <a
                    href={server.link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Join Server
                  </a>
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="mt-8 mb-8 flex justify-center">
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
          />
        </div>
      )}

      {isAddModalOpen && (
        <AddServerModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onServerAdded={handleServerAdded}
          editingServer={editingServer}
        />
      )}

      {deleteModalOpen && serverToDelete && (
        <Dialog
          open={deleteModalOpen}
          onClose={() => {}}
          className="relative z-[3000]"
        >
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            aria-hidden="true"
          />

          <div className="fixed inset-0 flex items-center justify-center p-4">
            <DialogPanel className="border-border-card bg-secondary-bg hover:border-border-focus relative w-full max-w-md rounded-lg border shadow-xl">
              <div className="border-border-card flex items-center justify-between border-b p-4">
                <h2 className="text-primary-text text-xl font-semibold">
                  Delete Server?
                </h2>
                <button
                  type="button"
                  onClick={() => setDeleteModalOpen(false)}
                  aria-label="Close"
                  className="text-secondary-text hover:text-primary-text hover:bg-quaternary-bg focus-visible:ring-ring inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-md transition-colors focus-visible:ring-1 focus-visible:outline-none"
                >
                  <Icon icon="heroicons:x-mark" className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6">
                <p className="text-secondary-text">
                  Are you sure you want to delete this server? This action
                  cannot be undone.
                </p>
              </div>

              <div className="border-border-card flex justify-end gap-2 border-t p-4">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={deletingServer}
                  onClick={() => setDeleteModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={deletingServer}
                  onClick={confirmDeleteServer}
                >
                  {deletingServer ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </DialogPanel>
          </div>
        </Dialog>
      )}
    </div>
  );
};

export default ServerList;
