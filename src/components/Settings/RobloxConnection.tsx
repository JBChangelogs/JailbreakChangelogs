import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Icon } from "@/components/ui/IconWrapper";
import { toast } from "sonner";
import { safeGetJSON, safeSetJSON } from "@/utils/safeStorage";
import { UserData } from "@/types/auth";
import { useAuthContext } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

interface RobloxConnectionProps {
  userData: {
    roblox_id?: string;
    roblox_username?: string;
  };
}

export const RobloxConnection = ({ userData }: RobloxConnectionProps) => {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setLoginModal } = useAuthContext();

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setError(null);
  };

  const handleDisconnect = async () => {
    try {
      const response = await fetch("/api/oauth/roblox/disconnect", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to disconnect Roblox account",
        );
      }

      // Update local storage
      const user = safeGetJSON<UserData>("user", null);
      if (user) {
        const updatedUser = { ...user };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (updatedUser as any).roblox_id;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (updatedUser as any).roblox_username;
        safeSetJSON("user", updatedUser);

        // Dispatch authStateChanged event to notify other components
        window.dispatchEvent(
          new CustomEvent("authStateChanged", { detail: updatedUser }),
        );
      }

      toast.success("Successfully disconnected Roblox account", {
        duration: 3000,
      });

      handleClose();
    } catch (error) {
      console.error("Error disconnecting Roblox account:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to disconnect Roblox account",
      );
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-primary-text mb-2 text-lg font-bold">
          Roblox Connection
        </h3>
        <p className="text-primary-text">
          {userData.roblox_username ? (
            <>
              Currently linked to{" "}
              {userData.roblox_id ? (
                <a
                  href={`https://www.roblox.com/users/${userData.roblox_id}/profile`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-text inline-flex items-center gap-1 font-semibold underline transition-opacity hover:opacity-80"
                >
                  <Icon icon="akar-icons:link-out" className="h-4 w-4" />
                  {userData.roblox_username}
                </a>
              ) : (
                <span className="font-bold">{userData.roblox_username}</span>
              )}
            </>
          ) : (
            "Not connected"
          )}
        </p>
      </div>

      {userData.roblox_username ? (
        <Button onClick={handleOpen} size="md" className="text-sm uppercase">
          Disconnect Roblox
        </Button>
      ) : (
        <Button
          onClick={() => {
            setLoginModal({ open: true, tab: "roblox" });
          }}
          size="md"
          className="text-sm uppercase"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
            />
          </svg>
          Connect Roblox Account
        </Button>
      )}

      <ConfirmDialog
        isOpen={open}
        onClose={handleClose}
        onConfirm={handleDisconnect}
        title="Disconnect Roblox Account"
        confirmText="Disconnect"
        confirmVariant="destructive"
      >
        <>
          <p className="text-primary-text mb-6">
            Are you sure you want to disconnect your Roblox account?
          </p>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Icon
                icon="heroicons:exclamation-triangle"
                className="text-button-danger mt-0.5 h-5 w-5 shrink-0"
              />
              <p className="text-primary-text text-sm">
                Remove your Roblox profile from your account
              </p>
            </div>
            <div className="flex items-start gap-3">
              <Icon
                icon="heroicons:exclamation-triangle"
                className="text-button-danger mt-0.5 h-5 w-5 shrink-0"
              />
              <p className="text-primary-text text-sm">
                Disable trading features and delete all existing trade ads
              </p>
            </div>
            <div className="flex items-start gap-3">
              <Icon
                icon="heroicons:exclamation-triangle"
                className="text-button-danger mt-0.5 h-5 w-5 shrink-0"
              />
              <p className="text-primary-text text-sm">
                Require re-authentication to use Trading features again
              </p>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-md border border-red-500/20 bg-red-500/10 p-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}
        </>
      </ConfirmDialog>
    </div>
  );
};
