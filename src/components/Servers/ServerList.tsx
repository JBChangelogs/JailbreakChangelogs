import React from "react";
import { PUBLIC_API_URL } from "@/utils/api";
import { Icon } from "@iconify/react";
import { formatProfileDate } from "@/utils/timestamp";
import { useAuthContext } from "@/contexts/AuthContext";
import toast from "react-hot-toast";
import Link from "next/link";
import AddServerModal from "./AddServerModal";
import { Skeleton } from "@mui/material";
import dynamic from "next/dynamic";
import { useVirtualizer } from "@tanstack/react-virtual";

const Tooltip = dynamic(() => import("@mui/material/Tooltip"), { ssr: false });
const Select = dynamic(() => import("react-select"), { ssr: false });
import { UserDetailsTooltip } from "@/components/Users/UserDetailsTooltip";
import type { UserData } from "@/types/auth";
import { CustomConfirmationModal } from "@/components/Modals/CustomConfirmationModal";
import { UserAvatar } from "@/utils/avatar";

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
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [editingServer, setEditingServer] = React.useState<Server | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false);
  const [serverToDelete, setServerToDelete] = React.useState<Server | null>(
    null,
  );
  const parentRef = React.useRef<HTMLDivElement>(null);
  const sortOptions = [
    { value: "date_added_desc", label: "Date Added (Newest First)" },
    { value: "date_added_asc", label: "Date Added (Oldest First)" },
    { value: "date_expires_desc", label: "Date Expires (Latest First)" },
    { value: "date_expires_asc", label: "Date Expires (Earliest First)" },
  ];
  const sortedServers = React.useMemo(() => {
    const sorted = [...servers];
    const normalizeTimestamp = (timestamp: string): number => {
      const num = parseInt(timestamp);
      return num < 10000000000 ? num * 1000 : num;
    };

    switch (sortOption) {
      case "date_added_asc":
        return sorted.sort((a, b) => {
          const aTime = normalizeTimestamp(a.created_at);
          const bTime = normalizeTimestamp(b.created_at);
          return aTime - bTime;
        });
      case "date_added_desc":
        return sorted.sort((a, b) => {
          const aTime = normalizeTimestamp(a.created_at);
          const bTime = normalizeTimestamp(b.created_at);
          return bTime - aTime;
        });
      case "date_expires_asc":
        return sorted.sort((a, b) => {
          // Handle "Never" expiration dates
          if (a.expires === "Never" && b.expires === "Never") return 0;
          if (a.expires === "Never") return 1; // Never expires goes to end
          if (b.expires === "Never") return -1;
          const aTime = normalizeTimestamp(a.expires);
          const bTime = normalizeTimestamp(b.expires);
          return aTime - bTime;
        });
      case "date_expires_desc":
        return sorted.sort((a, b) => {
          // Handle "Never" expiration dates
          if (a.expires === "Never" && b.expires === "Never") return 0;
          if (a.expires === "Never") return -1; // Never expires goes to beginning
          if (b.expires === "Never") return 1;
          const aTime = normalizeTimestamp(a.expires);
          const bTime = normalizeTimestamp(b.expires);
          return bTime - aTime;
        });
      default:
        return sorted;
    }
  }, [servers, sortOption]);

  // Organize servers into rows for grid virtualization
  // Each row contains multiple servers based on screen size
  const getServersPerRow = () => {
    if (typeof window === "undefined") return 3; // Default for SSR
    const width = window.innerWidth;
    if (width < 768) return 1; // md
    if (width < 1280) return 2; // xl
    return 3; // 2xl
  };

  const serversPerRow = getServersPerRow();
  const rows: Server[][] = [];
  for (let i = 0; i < sortedServers.length; i += serversPerRow) {
    rows.push(sortedServers.slice(i, i + serversPerRow));
  }

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 400, // Simple estimate - let TanStack measure actual content
    overscan: 2,
  });

  React.useEffect(() => {
    const fetchServersAndUser = async () => {
      setLoading(true);
      setError(null);

      const userId = user?.id || null;
      setLoggedInUserId(userId);

      try {
        const serversResponse = await fetch(
          `${PUBLIC_API_URL}/servers/list?nocache=true`,
          {
            headers: {
              "User-Agent": "JailbreakChangelogs-Servers/1.0",
            },
          },
        );
        if (!serversResponse.ok) {
          throw new Error("Failed to fetch servers");
        }
        const data = (await serversResponse.json()) as Server[];
        setServers(data);

        // Fetch user data for each server owner
        const uniqueOwnerIds = [
          ...new Set(data.map((server: Server) => server.owner)),
        ];

        // Use batch endpoint to fetch all user data at once
        if (uniqueOwnerIds.length > 0) {
          try {
            const userResponse = await fetch(
              `${PUBLIC_API_URL}/users/get/batch?ids=${uniqueOwnerIds.join(",")}&nocache=true`,
              {
                headers: {
                  "User-Agent": "JailbreakChangelogs-Servers/1.0",
                },
              },
            );
            if (userResponse.ok) {
              const userDataArray = (await userResponse.json()) as UserData[];
              const userDataMap = userDataArray.reduce(
                (acc, userData) => {
                  acc[userData.id] = userData;
                  return acc;
                },
                {} as Record<string, UserData>,
              );
              setUserData(userDataMap);
            }
          } catch (err) {
            console.error("Error fetching user data:", err);
          }
        }
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

    fetchServersAndUser();

    // Event listener for auth state changes
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
  }, [user]);

  const handleServerAdded = async () => {
    // Fetch updated server list
    try {
      const serversResponse = await fetch(
        `${PUBLIC_API_URL}/servers/list?nocache=true`,
        {
          headers: {
            "User-Agent": "JailbreakChangelogs-Servers/1.0",
          },
        },
      );
      if (!serversResponse.ok) {
        throw new Error("Failed to fetch servers");
      }
      const data = (await serversResponse.json()) as Server[];
      setServers(data);

      // Only fetch user data for new owner IDs
      const uniqueOwnerIds = [
        ...new Set(data.map((server: Server) => server.owner)),
      ];
      const newOwnerIds = uniqueOwnerIds.filter(
        (ownerId) => !(ownerId in userData),
      );

      if (newOwnerIds.length > 0) {
        try {
          const userResponse = await fetch(
            `${PUBLIC_API_URL}/users/get/batch?ids=${newOwnerIds.join(",")}&nocache=true`,
            {
              headers: {
                "User-Agent": "JailbreakChangelogs-Servers/1.0",
              },
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
          console.error("Error fetching new user data:", err);
        }
      }
    } catch {
      toast.error("Failed to refresh server list");
    }
  };

  const handleDeleteServer = (server: Server) => {
    setServerToDelete(server);
    setDeleteModalOpen(true);
  };

  const confirmDeleteServer = async () => {
    if (!serverToDelete) return;
    if (!isAuthenticated) {
      toast.error("You must be logged in to delete a server.");
      setDeleteModalOpen(false);
      setServerToDelete(null);
      return;
    }
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
        toast.success("Server deleted successfully!");
        handleServerAdded();
      } else {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Failed to delete server" }));
        toast.error(`Error deleting server: ${errorData.message}`);
      }
    } catch {
      toast.error("An error occurred while deleting the server.");
    } finally {
      setDeleteModalOpen(false);
      setServerToDelete(null);
    }
  };

  const handleEditServer = async (server: Server) => {
    setEditingServer(server);
    setIsAddModalOpen(true);
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
          <div className="flex items-center space-x-2">
            <Icon
              icon="heroicons-outline:shield-check"
              className="text-button-info h-5 w-5"
            />
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
              className="border-border-primary hover:border-border-focus bg-secondary-bg rounded-lg border p-4 sm:p-6"
            >
              <div className="mb-4 flex flex-col gap-3">
                <div className="flex items-center space-x-2">
                  <Icon
                    icon="heroicons-outline:shield-check"
                    className="text-button-info h-5 w-5"
                  />
                  <Skeleton
                    variant="text"
                    width={80}
                    height={24}
                    sx={{ bgcolor: "var(--color-secondary-bg)" }}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Skeleton
                    variant="rounded"
                    width={32}
                    height={32}
                    sx={{ bgcolor: "var(--color-secondary-bg)" }}
                  />
                  <Skeleton
                    variant="rounded"
                    width={32}
                    height={32}
                    sx={{ bgcolor: "var(--color-secondary-bg)" }}
                  />
                  <Skeleton
                    variant="rounded"
                    width={80}
                    height={32}
                    sx={{ bgcolor: "var(--color-secondary-bg)" }}
                  />
                </div>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center space-x-2">
                  <Icon
                    icon="heroicons:user-solid"
                    className="text-secondary-text h-5 w-5"
                  />
                  <Skeleton
                    variant="text"
                    width={160}
                    height={20}
                    sx={{ bgcolor: "var(--color-secondary-bg)" }}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Icon
                    icon="heroicons:clock"
                    className="text-secondary-text h-5 w-5"
                  />
                  <Skeleton
                    variant="text"
                    width={120}
                    height={20}
                    sx={{ bgcolor: "var(--color-secondary-bg)" }}
                  />
                </div>

                <div className="border-border-primary hover:border-border-focus bg-primary-bg rounded-lg border p-3 sm:p-4">
                  <Skeleton
                    variant="text"
                    width={100}
                    height={24}
                    sx={{ bgcolor: "var(--color-primary-bg)" }}
                  />
                  <div className="mt-2 space-y-2">
                    <Skeleton
                      variant="text"
                      width="100%"
                      height={16}
                      sx={{ bgcolor: "var(--color-primary-bg)" }}
                    />
                    <Skeleton
                      variant="text"
                      width="90%"
                      height={16}
                      sx={{ bgcolor: "var(--color-primary-bg)" }}
                    />
                    <Skeleton
                      variant="text"
                      width="80%"
                      height={16}
                      sx={{ bgcolor: "var(--color-primary-bg)" }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border-button-danger bg-button-danger/10 text-button-danger rounded-lg border p-4">
        {error}
      </div>
    );
  }

  if (sortedServers.length === 0) {
    return (
      <div className="border-border-primary hover:border-border-focus bg-secondary-bg rounded-lg border p-8 text-center">
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
      <div className="mb-4 flex flex-col gap-4 px-4 lg:px-0">
        <div className="flex items-center space-x-2">
          <Icon
            icon="heroicons-outline:shield-check"
            className="text-button-info h-5 w-5"
          />
          <span className="text-secondary-text">
            {sortedServers.length > 0
              ? `${sortedServers.length} servers`
              : "No servers available"}
          </span>
        </div>
        <div className="flex flex-row items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-64 sm:w-80">
              <Select
                value={sortOptions.find(
                  (option) => option.value === sortOption,
                )}
                onChange={(selectedOption) => {
                  if (
                    selectedOption &&
                    typeof selectedOption === "object" &&
                    "value" in selectedOption &&
                    onSortChange
                  ) {
                    onSortChange(selectedOption.value as SortOption);
                  }
                }}
                options={sortOptions}
                unstyled
                classNames={{
                  control: () =>
                    "text-secondary-text flex items-center justify-between rounded-lg border border-border-primary hover:border-border-focus bg-secondary-bg p-3 min-h-[40px] hover:cursor-pointer focus-within:border-button-info",
                  singleValue: () => "text-secondary-text",
                  placeholder: () => "text-secondary-text",
                  menu: () =>
                    "absolute z-[3000] mt-1 w-full rounded-lg border border-border-primary hover:border-border-focus bg-secondary-bg shadow-lg",
                  option: ({ isSelected, isFocused }) =>
                    `px-4 py-3 cursor-pointer ${
                      isSelected
                        ? "bg-button-info text-form-button-text"
                        : isFocused
                          ? "bg-quaternary-bg text-primary-text"
                          : "bg-primary-bg text-secondary-text"
                    }`,
                  clearIndicator: () =>
                    "text-secondary-text hover:text-primary-text cursor-pointer",
                  dropdownIndicator: () =>
                    "text-secondary-text hover:text-primary-text cursor-pointer",
                }}
                isSearchable={false}
              />
            </div>
          </div>
          <button
            onClick={handleAddServer}
            className="text-form-button-text border-button-info bg-button-info hover:bg-button-info-hover inline-flex cursor-pointer items-center rounded-lg border px-3 py-2 whitespace-nowrap transition-colors"
          >
            <Icon
              icon="heroicons:plus-circle"
              className="mr-1 h-4 w-4 sm:mr-2 sm:h-5 sm:w-5"
            />
            <span className="hidden sm:inline">Add Server</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      <div
        ref={parentRef}
        className="h-[800px] overflow-auto"
        style={{
          contain: "strict",
        }}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const row = rows[virtualRow.index];
            return (
              <div
                key={virtualRow.key}
                data-index={virtualRow.index}
                ref={virtualizer.measureElement}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <div className="grid grid-cols-1 gap-4 gap-y-6 pb-4 md:grid-cols-2 xl:grid-cols-3">
                  {row.map((server, index) => (
                    <div
                      key={server.id}
                      className="border-border-primary hover:border-border-focus bg-secondary-bg rounded-lg border p-4 sm:p-6"
                    >
                      <div className="mb-4 flex flex-col gap-3">
                        <div className="flex items-center space-x-2">
                          <Icon
                            icon="heroicons-outline:shield-check"
                            className="text-button-info h-5 w-5"
                          />
                          <span className="text-secondary-text">
                            Server #
                            {virtualRow.index * serversPerRow + index + 1}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {loggedInUserId && loggedInUserId === server.owner ? (
                            <>
                              <button
                                onClick={() => handleCopyLink(server.link)}
                                className="text-form-button-text border-button-info bg-button-info hover:bg-button-info-hover cursor-pointer rounded-lg border px-2 py-1 text-sm transition-colors sm:px-3"
                                aria-label="Copy Server Link"
                              >
                                <Icon
                                  icon="heroicons:clipboard-solid"
                                  className="h-4 w-4"
                                />
                              </button>
                              <button
                                onClick={() => handleEditServer(server)}
                                className="border-button-warning bg-button-warning text-form-button-text hover:bg-button-warning-hover rounded-lg border px-2 py-1 text-sm transition-colors sm:px-3"
                                aria-label="Edit Server"
                              >
                                <Icon
                                  icon="heroicons:pencil"
                                  className="h-4 w-4"
                                />
                              </button>
                              <button
                                onClick={() => handleDeleteServer(server)}
                                className="border-button-danger bg-button-danger text-form-button-text hover:bg-button-danger-hover rounded-lg border px-2 py-1 text-sm transition-colors sm:px-3"
                                aria-label="Delete Server"
                              >
                                <Icon
                                  icon="heroicons:trash-solid"
                                  className="h-4 w-4"
                                />
                              </button>
                              <a
                                href={server.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-form-button-text border-button-info bg-button-info hover:bg-button-info-hover cursor-pointer rounded-lg border px-2 py-1 text-sm transition-colors sm:px-3"
                              >
                                Join Server
                              </a>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleCopyLink(server.link)}
                                className="text-form-button-text border-button-info bg-button-info hover:bg-button-info-hover cursor-pointer rounded-lg border px-2 py-1 text-sm transition-colors sm:px-3"
                                aria-label="Copy Server Link"
                              >
                                <Icon
                                  icon="heroicons:clipboard"
                                  className="h-4 w-4"
                                />
                              </button>
                              <a
                                href={server.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-form-button-text border-button-info bg-button-info hover:bg-button-info-hover cursor-pointer rounded-lg border px-2 py-1 text-sm transition-colors sm:px-3"
                              >
                                Join Server
                              </a>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="space-y-3 sm:space-y-4">
                        <div className="flex items-center space-x-2">
                          <Icon
                            icon="heroicons:user-solid"
                            className="text-secondary-text h-5 w-5 flex-shrink-0"
                          />
                          <span className="text-secondary-text flex items-center gap-1 text-sm sm:text-base">
                            Owner:{" "}
                            {userData[server.owner] ? (
                              <>
                                {userData[server.owner] && (
                                  <UserAvatar
                                    userId={userData[server.owner].id}
                                    avatarHash={userData[server.owner].avatar}
                                    username={userData[server.owner].username}
                                    size={8}
                                    custom_avatar={
                                      userData[server.owner].custom_avatar
                                    }
                                    showBadge={false}
                                    settings={userData[server.owner].settings}
                                    premiumType={
                                      userData[server.owner].premiumtype
                                    }
                                  />
                                )}
                                <Tooltip
                                  title={
                                    <UserDetailsTooltip
                                      user={userData[server.owner]}
                                    />
                                  }
                                  arrow
                                  disableTouchListener
                                  slotProps={{
                                    tooltip: {
                                      sx: {
                                        bgcolor: "var(--color-secondary-bg)",
                                        maxWidth: "400px",
                                        width: "auto",
                                        minWidth: "300px",
                                        "& .MuiTooltip-arrow": {
                                          color: "var(--color-secondary-bg)",
                                        },
                                      },
                                    },
                                  }}
                                >
                                  <Link
                                    href={`/users/${server.owner}`}
                                    prefetch={false}
                                    className="text-link hover:text-link-hover hover:underline"
                                  >
                                    @{userData[server.owner].username}
                                  </Link>
                                </Tooltip>
                              </>
                            ) : (
                              "Unknown"
                            )}
                          </span>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Icon
                              icon="heroicons:clock"
                              className="text-secondary-text h-5 w-5"
                            />
                            <span className="text-secondary-text text-sm sm:text-base">
                              Created: {formatProfileDate(server.created_at)}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Icon
                              icon="heroicons:clock"
                              className="text-secondary-text h-5 w-5"
                            />
                            <span className="text-secondary-text text-sm sm:text-base">
                              Expires:{" "}
                              {server.expires === "Never"
                                ? "Never"
                                : formatProfileDate(server.expires)}
                            </span>
                          </div>
                        </div>

                        <div className="border-border-primary hover:border-border-focus bg-primary-bg rounded-lg border p-3 sm:p-4">
                          <h3 className="text-primary-text mb-2 text-sm font-semibold">
                            Server Rules
                          </h3>
                          <p className="text-secondary-text text-xs break-words whitespace-pre-wrap sm:text-sm">
                            {server.rules === "N/A"
                              ? "No Rules set by owner"
                              : server.rules}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <AddServerModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingServer(null);
        }}
        onServerAdded={handleServerAdded}
        editingServer={editingServer}
      />
      <CustomConfirmationModal
        open={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setServerToDelete(null);
        }}
        title="Delete Server"
        message="Are you sure you want to delete this server? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDeleteServer}
        onCancel={() => {
          setDeleteModalOpen(false);
          setServerToDelete(null);
        }}
      />
    </div>
  );
};

export default ServerList;
