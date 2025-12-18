import { useState } from "react";
import { Dialog, DialogPanel } from "@headlessui/react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import LoginModalWrapper from "../Auth/LoginModalWrapper";
import { safeGetJSON, safeSetJSON } from "@/utils/safeStorage";
import { UserData } from "@/types/auth";

interface RobloxConnectionProps {
  userData: {
    roblox_id?: string;
    roblox_username?: string;
  };
}

export const RobloxConnection = ({ userData }: RobloxConnectionProps) => {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginModalOpen, setLoginModalOpen] = useState(false);

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
        position: "bottom-right",
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
    <div className="p-6">
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
                  className="text-link hover:text-link-hover inline-flex items-center gap-1 font-bold hover:underline"
                >
                  {userData.roblox_username}
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
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
        <button
          onClick={handleOpen}
          className="bg-button-info text-form-button-text hover:bg-button-info-hover cursor-pointer rounded-md px-4 py-2 font-medium transition-colors"
        >
          Disconnect Roblox
        </button>
      ) : (
        <button
          onClick={() => {
            setLoginModalOpen(true);
            window.dispatchEvent(new CustomEvent("setLoginTab", { detail: 1 }));
          }}
          className="bg-button-info text-form-button-text hover:bg-button-info-hover inline-flex items-center gap-2 rounded-md px-4 py-2 font-medium transition-colors"
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
        </button>
      )}

      <LoginModalWrapper
        open={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
      />

      <Dialog open={open} onClose={handleClose} className="relative z-50">
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm"
          aria-hidden="true"
        />

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="modal-container border-button-info bg-secondary-bg w-full max-w-[500px] min-w-[320px] rounded-lg border shadow-lg">
            <div className="modal-header text-button-danger px-6 py-4 text-xl font-semibold">
              Disconnect Roblox Account
            </div>

            <div className="modal-content p-6">
              <p className="text-primary-text mb-6">
                Are you sure you want to disconnect your Roblox account?
              </p>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <ExclamationTriangleIcon className="text-button-danger mt-0.5 h-5 w-5 flex-shrink-0" />
                  <p className="text-primary-text text-sm">
                    Remove your Roblox profile from your account
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <ExclamationTriangleIcon className="text-button-danger mt-0.5 h-5 w-5 flex-shrink-0" />
                  <p className="text-primary-text text-sm">
                    Disable trading features and delete all existing trade ads
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <ExclamationTriangleIcon className="text-button-danger mt-0.5 h-5 w-5 flex-shrink-0" />
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
            </div>

            <div className="modal-footer border-border-primary flex justify-end gap-2 border-t px-6 py-4">
              <button
                onClick={handleClose}
                className="text-primary-text cursor-pointer rounded-md px-4 py-2 font-medium transition-colors hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                onClick={handleDisconnect}
                className="bg-button-danger hover:bg-button-danger-hover cursor-pointer rounded-md px-4 py-2 font-medium text-white transition-colors"
              >
                Disconnect
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  );
};
