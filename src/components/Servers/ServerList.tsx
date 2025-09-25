import React from "react";
import { PUBLIC_API_URL } from "@/utils/api";
import {
  ClockIcon,
  UserIcon,
  ShieldCheckIcon,
  PencilIcon,
  TrashIcon,
  PlusCircleIcon,
  ClipboardIcon,
} from "@heroicons/react/24/outline";
import { formatProfileDate } from "@/utils/timestamp";
import { useAuthContext } from "@/contexts/AuthContext";
import toast from "react-hot-toast";
import Link from "next/link";
import AddServerModal from "./AddServerModal";
import { Skeleton, Pagination } from "@mui/material";
import dynamic from "next/dynamic";

const Tooltip = dynamic(() => import("@mui/material/Tooltip"), { ssr: false });
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

const ServerList: React.FC = () => {
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
  const [page, setPage] = React.useState(1);
  const itemsPerPage = 9;

  // Calculate pagination values
  const totalPages = Math.ceil(servers.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentServers = servers.slice(startIndex, endIndex);

  React.useEffect(() => {
    const fetchServersAndUser = async () => {
      setLoading(true);
      setError(null);

      // Use centralized auth state instead of direct API call
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

  const handlePageChange = (
    _event: React.ChangeEvent<unknown>,
    value: number,
  ) => {
    setPage(value);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) {
    return (
      <div>
        <div className="mb-4 flex items-center justify-between px-4 lg:px-0">
          <div className="flex items-center space-x-2">
            <ShieldCheckIcon className="text-button-info h-5 w-5" />
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
                  <ShieldCheckIcon className="text-button-info h-5 w-5" />
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
                  <UserIcon className="text-secondary-text h-5 w-5" />
                  <Skeleton
                    variant="text"
                    width={160}
                    height={20}
                    sx={{ bgcolor: "var(--color-secondary-bg)" }}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <ClockIcon className="text-secondary-text h-5 w-5" />
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

  if (servers.length === 0) {
    return (
      <div className="border-border-primary hover:border-border-focus bg-secondary-bg rounded-lg border p-8 text-center">
        <ShieldCheckIcon className="text-button-info mx-auto mb-4 h-12 w-12" />
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
      <div className="mb-4 flex flex-col gap-2 px-4 sm:flex-row sm:items-center sm:justify-between lg:px-0">
        <div className="flex items-center space-x-2">
          <ShieldCheckIcon className="text-button-info h-5 w-5" />
          <span className="text-secondary-text">
            {servers.length > 0
              ? `Showing ${Math.min(itemsPerPage, servers.length - startIndex)} of ${servers.length} servers`
              : "Total Servers: 0"}
          </span>
        </div>
        <button
          onClick={handleAddServer}
          className="text-form-button-text border-button-info bg-button-info hover:bg-button-info-hover inline-flex cursor-pointer items-center rounded-lg border px-4 py-2 transition-colors"
        >
          <PlusCircleIcon className="mr-2 h-5 w-5" />
          Add Server
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {currentServers.map((server, index) => (
          <div
            key={server.id}
            className="border-border-primary hover:border-border-focus bg-secondary-bg rounded-lg border p-4 sm:p-6"
          >
            <div className="mb-4 flex flex-col gap-3">
              <div className="flex items-center space-x-2">
                <ShieldCheckIcon className="text-button-info h-5 w-5" />
                <span className="text-secondary-text">
                  Server #{startIndex + index + 1}
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
                      <ClipboardIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleEditServer(server)}
                      className="border-button-warning bg-button-warning text-form-button-text hover:bg-button-warning-hover rounded-lg border px-2 py-1 text-sm transition-colors sm:px-3"
                      aria-label="Edit Server"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteServer(server)}
                      className="border-button-danger bg-button-danger text-form-button-text hover:bg-button-danger-hover rounded-lg border px-2 py-1 text-sm transition-colors sm:px-3"
                      aria-label="Delete Server"
                    >
                      <TrashIcon className="h-4 w-4" />
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
                      <ClipboardIcon className="h-4 w-4" />
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
                <UserIcon className="text-secondary-text h-5 w-5 flex-shrink-0" />
                {userData[server.owner] && (
                  <UserAvatar
                    userId={userData[server.owner].id}
                    avatarHash={userData[server.owner].avatar}
                    username={userData[server.owner].username}
                    size={8}
                    custom_avatar={userData[server.owner].custom_avatar}
                    showBadge={false}
                    settings={userData[server.owner].settings}
                    premiumType={userData[server.owner].premiumtype}
                  />
                )}
                <span className="text-secondary-text text-sm sm:text-base">
                  Owner:{" "}
                  {userData[server.owner] ? (
                    <Tooltip
                      title={
                        <UserDetailsTooltip user={userData[server.owner]} />
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
                        className="text-link hover:text-link-hover hover:underline"
                      >
                        @{userData[server.owner].username}
                      </Link>
                    </Tooltip>
                  ) : (
                    "Unknown"
                  )}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <ClockIcon className="text-secondary-text h-5 w-5" />
                <span className="text-secondary-text text-sm sm:text-base">
                  Created: {formatProfileDate(server.created_at)} • Expires:{" "}
                  {server.expires === "Never"
                    ? "Never"
                    : formatProfileDate(server.expires)}
                </span>
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

      {totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            sx={{
              "& .MuiPaginationItem-root": {
                color: "var(--color-primary-text)",
                "&.Mui-selected": {
                  backgroundColor: "var(--color-button-info)",
                  color: "var(--color-form-button-text)",
                  "&:hover": {
                    backgroundColor: "var(--color-button-info-hover)",
                  },
                },
                "&:hover": {
                  backgroundColor: "var(--color-quaternary-bg)",
                },
              },
              "& .MuiPaginationItem-icon": {
                color: "var(--color-primary-text)",
              },
            }}
          />
        </div>
      )}

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
