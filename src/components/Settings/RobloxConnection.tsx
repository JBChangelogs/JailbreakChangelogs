import { createLogger } from "@/services/logger";
import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

const log = createLogger("UI");
import { Icon } from "@/components/ui/IconWrapper";
import { toast } from "sonner";

import { safeGetJSON, safeSetJSON } from "@/utils/storage/safeStorage";
import { UserData } from "@/types/auth";
import { useAuthContext } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { PUBLIC_API_URL } from "@/utils/api/api";
import { buildApiFetchRequest } from "@/utils/api/apiDevToken";
import Image from "next/image";
import { IMAGE_PLACEHOLDER } from "@/utils/ui/imagePlaceholder";
import { SettingRow } from "./SettingRow";

interface RobloxConnectionProps {
  userData: {
    roblox_id?: string;
    roblox_username?: string;
    roblox_display_name?: string;
    roblox_avatar?: string;
    premiumtype?: number;
  };
}

export const RobloxConnection = ({ userData }: RobloxConnectionProps) => {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const { setLoginModal } = useAuthContext();

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    if (isDisconnecting) return;
    setOpen(false);
    setError(null);
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    const loadingToast = toast.loading("Disconnecting Roblox account...");
    try {
      if (!PUBLIC_API_URL) {
        throw new Error("Missing public API URL configuration");
      }

      const { url, headers } = buildApiFetchRequest(
        PUBLIC_API_URL!,
        "/oauth/roblox/disconnect",
      );
      const response = await fetch(url, {
        method: "DELETE",
        credentials: "include",
        headers: { ...headers, "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        log.error("disconnect Roblox account failed", {
          status: response.status,
          body: errorData,
        });
        throw new Error(
          (errorData as { message?: string; error?: string; detail?: string })
            .message ??
            (errorData as { message?: string; error?: string; detail?: string })
              .error ??
            (errorData as { message?: string; error?: string; detail?: string })
              .detail ??
            "Failed to disconnect Roblox account",
        );
      }

      const storedUser = safeGetJSON<UserData>("user", null);
      if (storedUser) {
        const {
          roblox_id: _id,
          roblox_username: _username,
          roblox_display_name: _displayName,
          roblox_avatar: _avatar,
          ...updatedUser
        } = storedUser;
        safeSetJSON("user", updatedUser as UserData);

        window.dispatchEvent(
          new CustomEvent("authStateChanged", { detail: updatedUser }),
        );
      }

      toast.dismiss(loadingToast);
      toast.success(
        "Roblox account disconnected. Changes will be applied shortly.",
      );

      handleClose();
    } catch (error) {
      toast.dismiss(loadingToast);
      log.error("Error disconnecting Roblox account", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to disconnect Roblox account",
      );
    } finally {
      setIsDisconnecting(false);
    }
  };

  return (
    <div>
      <SettingRow
        title="Roblox"
        description={
          userData.roblox_username
            ? "Your Roblox account, for inventories and trading."
            : "Connect your Roblox account for inventories and trading."
        }
        action={
          userData.roblox_username ? (
            <Button
              variant="destructive"
              onClick={handleOpen}
              size="md"
              disabled={isDisconnecting}
            >
              Disconnect Roblox
            </Button>
          ) : (
            <Button
              onClick={() => setLoginModal({ open: true, tab: "roblox" })}
              size="md"
            >
              <Icon icon="heroicons:link" aria-hidden="true" />
              Connect Roblox
            </Button>
          )
        }
      >
        {userData.roblox_username && (
          <a
            href={
              userData.roblox_id
                ? `https://www.roblox.com/users/${userData.roblox_id}/profile`
                : undefined
            }
            target="_blank"
            rel="noopener noreferrer"
            className="border-border-card bg-tertiary-bg hover:border-border-focus mt-3 flex items-center gap-3 rounded-lg border p-3 transition-colors"
          >
            {userData.roblox_avatar && (
              <Image
                placeholder={IMAGE_PLACEHOLDER}
                src={userData.roblox_avatar}
                alt={userData.roblox_username}
                width={48}
                height={48}
                className={`bg-quaternary-bg ${userData.premiumtype === 3 ? "rounded-[25%]" : "rounded-full"}`}
              />
            )}
            <div className="min-w-0 flex-1">
              {userData.roblox_display_name && (
                <p className="text-primary-text truncate font-semibold">
                  {userData.roblox_display_name}
                </p>
              )}
              <p className="text-secondary-text truncate text-sm">
                @{userData.roblox_username}
              </p>
            </div>
            {userData.roblox_id && (
              <Icon
                icon="akar-icons:link-out"
                className="text-link h-4 w-4 shrink-0"
              />
            )}
          </a>
        )}
      </SettingRow>

      <ConfirmDialog
        isOpen={open}
        onClose={handleClose}
        onConfirm={handleDisconnect}
        title="Disconnect Roblox Account"
        confirmText={isDisconnecting ? "Disconnecting..." : "Disconnect"}
        confirmVariant="destructive"
        confirmDisabled={isDisconnecting}
        closeOnConfirm={false}
      >
        <>
          <p className="text-primary-text">
            Are you sure you want to disconnect your Roblox account?
          </p>

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
