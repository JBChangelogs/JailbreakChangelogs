import React from 'react';
import { PROD_API_URL } from '@/services/api';
import { ClockIcon, UserIcon, ShieldCheckIcon, PencilIcon, TrashIcon, PlusCircleIcon, ClipboardIcon } from "@heroicons/react/24/outline";
import { formatProfileDate } from '@/utils/timestamp';
import { getToken } from '@/utils/auth';
import toast from 'react-hot-toast';
import Link from 'next/link';
import AddServerModal from './AddServerModal';
import { Skeleton, Tooltip } from '@mui/material';
import { UserDetailsTooltip } from '@/components/Users/UserDetailsTooltip';
import type { UserData } from '@/types/auth';
import { CustomConfirmationModal } from '@/components/Modals/CustomConfirmationModal';

interface Server {
  id: number;
  link: string;
  owner: string;
  rules: string;
  expires: string;
}

const ServerList: React.FC = () => {
  const [servers, setServers] = React.useState<Server[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [loggedInUserId, setLoggedInUserId] = React.useState<string | null>(null);
  const [userData, setUserData] = React.useState<Record<string, UserData>>({});
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [editingServer, setEditingServer] = React.useState<Server | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false);
  const [serverToDelete, setServerToDelete] = React.useState<Server | null>(null);

  React.useEffect(() => {
    const fetchServersAndUser = async () => {
      setLoading(true);
      setError(null);
      const token = getToken();

      let userId: string | null = null;
      if (token) {
        try {
          const userResponse = await fetch(`${PROD_API_URL}/users/get/token?token=${token}&nocache=true`);
          if (userResponse.ok) {
            const userData = await userResponse.json() as UserData;
            userId = userData.id;
            setLoggedInUserId(userId);
          } else {
            console.error('Failed to fetch user data for token validation');
            setLoggedInUserId(null);
          }
        } catch (userErr) {
          console.error('Error fetching user data:', userErr);
          setLoggedInUserId(null);
        }
      }

      try {
        const serversResponse = await fetch(`${PROD_API_URL}/servers/list?nocache=true`);
        if (!serversResponse.ok) {
          throw new Error('Failed to fetch servers');
        }
        const data = await serversResponse.json() as Server[];
        setServers(data);

        // Fetch user data for each server owner
        const uniqueOwnerIds = [...new Set(data.map((server: Server) => server.owner))];
        const userDataPromises = uniqueOwnerIds.map(async (ownerId) => {
          try {
            const response = await fetch(`${PROD_API_URL}/users/get?id=${ownerId}&nocache=true`);
            if (response.ok) {
              const userData = await response.json() as UserData;
              return { id: ownerId, data: userData };
            }
            return null;
          } catch (err) {
            console.error(`Error fetching user data for ID ${ownerId}:`, err);
            return null;
          }
        });

        const userDataResults = await Promise.all(userDataPromises);
        const userDataMap = userDataResults.reduce((acc, result) => {
          if (result) {
            acc[result.id] = result.data;
          }
          return acc;
        }, {} as Record<string, UserData>);

        setUserData(userDataMap);
      } catch (serverErr) {
        setError(serverErr instanceof Error ? serverErr.message : 'An error occurred while fetching servers');
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

    window.addEventListener('authStateChanged', handleAuthChange as EventListener);

    return () => {
      window.removeEventListener('authStateChanged', handleAuthChange as EventListener);
    };
  }, []);

  const handleServerAdded = async () => {
    // Fetch updated server list
    try {
      const serversResponse = await fetch(`${PROD_API_URL}/servers/list?nocache=true`);
      if (!serversResponse.ok) {
        throw new Error('Failed to fetch servers');
      }
      const data = await serversResponse.json() as Server[];
      setServers(data);

      // Only fetch user data for new owner IDs
      const uniqueOwnerIds = [...new Set(data.map((server: Server) => server.owner))];
      const newOwnerIds = uniqueOwnerIds.filter((ownerId) => !(ownerId in userData));
      const userDataPromises = newOwnerIds.map(async (ownerId) => {
        try {
          const response = await fetch(`${PROD_API_URL}/users/get?id=${ownerId}&nocache=true`);
          if (response.ok) {
            const userData = await response.json() as UserData;
            return { id: ownerId, data: userData };
          }
          return null;
        } catch (err) {
          console.error(`Error fetching user data for ID ${ownerId}:`, err);
          return null;
        }
      });

      const userDataResults = await Promise.all(userDataPromises);
      const newUserDataMap = userDataResults.reduce((acc, result) => {
        if (result) {
          acc[result.id] = result.data;
        }
        return acc;
      }, {} as Record<string, UserData>);

      setUserData((prev) => ({ ...prev, ...newUserDataMap }));
    } catch {
      toast.error('Failed to refresh server list');
    }
  };

  const handleDeleteServer = (server: Server) => {
    setServerToDelete(server);
    setDeleteModalOpen(true);
  };

  const confirmDeleteServer = async () => {
    if (!serverToDelete) return;
    const token = getToken();
    if (!token) {
      toast.error('You must be logged in to delete a server.');
      setDeleteModalOpen(false);
      setServerToDelete(null);
      return;
    }
    try {
      const response = await fetch(`${PROD_API_URL}/servers/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          link: serverToDelete.link,
          owner: token,
        }),
      });
      if (response.ok) {
        toast.success('Server deleted successfully!');
        handleServerAdded();
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Failed to delete server' }));
        toast.error(`Error deleting server: ${errorData.message}`);
      }
    } catch {
      toast.error('An error occurred while deleting the server.');
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
      toast.success('Server link copied to clipboard!');
    } catch {
      toast.error('Failed to copy server link');
    }
  };

  if (loading) {
    return (
      <div>
        <div className="mb-4 flex items-center justify-between px-4 lg:px-0">
          <div className="flex items-center space-x-2">
            <ShieldCheckIcon className="h-5 w-5 text-[#5865F2]" />
            <Skeleton variant="text" width={120} height={24} sx={{ bgcolor: '#37424D' }} />
          </div>
          <Skeleton variant="rounded" width={120} height={40} sx={{ bgcolor: '#37424D' }} />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-lg border border-[#2E3944] bg-[#212A31] p-4 sm:p-6">
              <div className="mb-4 flex flex-col gap-3">
                <div className="flex items-center space-x-2">
                  <ShieldCheckIcon className="h-5 w-5 text-[#5865F2]" />
                  <Skeleton variant="text" width={80} height={24} sx={{ bgcolor: '#37424D' }} />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Skeleton variant="rounded" width={32} height={32} sx={{ bgcolor: '#37424D' }} />
                  <Skeleton variant="rounded" width={32} height={32} sx={{ bgcolor: '#37424D' }} />
                  <Skeleton variant="rounded" width={80} height={32} sx={{ bgcolor: '#37424D' }} />
                </div>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center space-x-2">
                  <UserIcon className="h-5 w-5 text-[#FFFFFF]" />
                  <Skeleton variant="text" width={160} height={20} sx={{ bgcolor: '#37424D' }} />
                </div>

                <div className="flex items-center space-x-2">
                  <ClockIcon className="h-5 w-5 text-[#FFFFFF]" />
                  <Skeleton variant="text" width={120} height={20} sx={{ bgcolor: '#37424D' }} />
                </div>

                <div className="rounded-lg border border-[#2E3944] bg-[#37424D] p-3 sm:p-4">
                  <Skeleton variant="text" width={100} height={24} sx={{ bgcolor: '#1E2328' }} />
                  <div className="space-y-2 mt-2">
                    <Skeleton variant="text" width="100%" height={16} sx={{ bgcolor: '#1E2328' }} />
                    <Skeleton variant="text" width="90%" height={16} sx={{ bgcolor: '#1E2328' }} />
                    <Skeleton variant="text" width="80%" height={16} sx={{ bgcolor: '#1E2328' }} />
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
      <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-red-500">
        {error}
      </div>
    );
  }

  if (servers.length === 0) {
    return (
      <div className="rounded-lg border border-[#2E3944] bg-[#212A31] p-8 text-center">
        <ShieldCheckIcon className="h-12 w-12 text-[#5865F2] mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-muted mb-2">No servers available</h3>
        <p className="text-[#FFFFFF]">You can add a server or check back later</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-4 lg:px-0">
        <div className="flex items-center space-x-2">
          <ShieldCheckIcon className="h-5 w-5 text-[#5865F2]" />
          <span className="text-muted">Total Servers: {servers.length}</span>
        </div>
        <button
          onClick={handleAddServer}
          className="inline-flex items-center rounded-lg border border-[#5865F2] bg-[#2B2F4C] px-4 py-2 text-muted hover:bg-[#32365A] transition-colors"
        >
          <PlusCircleIcon className="h-5 w-5 mr-2" />
          Add Server
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {servers.map((server, index) => (
          <div key={server.id} className="rounded-lg border border-[#2E3944] bg-[#212A31] p-4 sm:p-6">
            <div className="mb-4 flex flex-col gap-3">
              <div className="flex items-center space-x-2">
                <ShieldCheckIcon className="h-5 w-5 text-[#5865F2]" />
                <span className="text-muted">Server #{index + 1}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {loggedInUserId && loggedInUserId === server.owner ? (
                  <>
                    <button
                      onClick={() => handleCopyLink(server.link)}
                      className="rounded-lg border border-[#5865F2] bg-[#2B2F4C] px-2 sm:px-3 py-1 text-sm text-muted hover:bg-[#32365A] transition-colors"
                      aria-label="Copy Server Link"
                    >
                      <ClipboardIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleEditServer(server)}
                      className="rounded-lg border border-[#FFD93D] bg-[#3C392B] px-2 sm:px-3 py-1 text-sm text-[#FFD93D] hover:bg-[#4A4530] transition-colors"
                      aria-label="Edit Server"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteServer(server)}
                      className="rounded-lg border border-[#FF6B6B] bg-[#3C2B2B] px-2 sm:px-3 py-1 text-sm text-[#FF6B6B] hover:bg-[#4A3030] transition-colors"
                      aria-label="Delete Server"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                    <a
                      href={server.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg border border-[#5865F2] bg-[#2B2F4C] px-2 sm:px-3 py-1 text-sm text-muted hover:bg-[#32365A] transition-colors"
                    >
                      Join Server
                    </a>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleCopyLink(server.link)}
                      className="rounded-lg border border-[#5865F2] bg-[#2B2F4C] px-2 sm:px-3 py-1 text-sm text-muted hover:bg-[#32365A] transition-colors"
                      aria-label="Copy Server Link"
                    >
                      <ClipboardIcon className="h-4 w-4" />
                    </button>
                    <a
                      href={server.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg border border-[#5865F2] bg-[#2B2F4C] px-2 sm:px-3 py-1 text-sm text-muted hover:bg-[#32365A] transition-colors"
                    >
                      Join Server
                    </a>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center space-x-2">
                <UserIcon className="h-5 w-5 text-[#FFFFFF]" />
                <span className="text-muted text-sm sm:text-base">
                  Owner: {userData[server.owner] ? (
                    <Tooltip
                      title={<UserDetailsTooltip user={userData[server.owner]} />}
                      arrow
                      disableTouchListener
                      slotProps={{
                        tooltip: {
                          sx: {
                            bgcolor: '#1A2228',
                            border: '1px solid #2E3944',
                            maxWidth: '400px',
                            width: 'auto',
                            minWidth: '300px',
                            '& .MuiTooltip-arrow': {
                              color: '#1A2228',
                            },
                          },
                        },
                      }}
                    >
                      <Link 
                        href={`/users/${server.owner}`}
                        className="text-blue-300 hover:text-blue-400 hover:underline"
                      >
                        @{userData[server.owner].username}
                      </Link>
                    </Tooltip>
                  ) : 'Unknown'}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <ClockIcon className="h-5 w-5 text-[#FFFFFF]" />
                <span className="text-muted text-sm sm:text-base">
                  Expires: {server.expires === "Never" ? "Never" : formatProfileDate(server.expires)}
                </span>
              </div>

              <div className="rounded-lg border border-[#2E3944] bg-[#37424D] p-3 sm:p-4">
                <h3 className="mb-2 text-sm font-semibold text-muted">Server Rules</h3>
                <p className="text-xs sm:text-sm text-[#FFFFFF] whitespace-pre-wrap break-words">
                  {server.rules === "N/A" ? "No Rules set by owner" : server.rules}
                </p>
              </div>
            </div>
          </div>
        ))}
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