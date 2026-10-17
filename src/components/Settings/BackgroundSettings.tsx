import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { BackgroundUploadDialog } from "@/components/Settings/AvatarUploadDialog";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Icon } from "@/components/ui/IconWrapper";
import {
  fetchCustomBackground,
  removeCustomBackground,
} from "@/services/settingsService";
import type { UserData } from "@/types/auth";

interface BackgroundSettingsProps {
  userData: UserData;
  onUploadStateChange?: (isUploading: boolean) => void;
}

export const BackgroundSettings = ({
  userData,
  onUploadStateChange,
}: BackgroundSettingsProps) => {
  const queryClient = useQueryClient();
  const backgroundKey = ["custom-background", userData.id] as const;
  const backgroundQuery = useQuery({
    queryKey: backgroundKey,
    queryFn: fetchCustomBackground,
    staleTime: 0,
    gcTime: 5 * 60_000,
    retry: false,
  });
  const backgroundUrl = backgroundQuery.data ?? null;
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [removing, setRemoving] = useState(false);

  const handleRemove = async () => {
    setRemoving(true);
    try {
      await removeCustomBackground();
      queryClient.setQueryData(backgroundKey, null);
      toast.success("Custom background removed");
    } catch (error) {
      toast.error("Couldn't remove background", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setRemoving(false);
      setConfirmRemove(false);
    }
  };

  return (
    <div className="mt-3">
      <BackgroundUploadDialog
        userData={userData}
        onUploadStateChange={onUploadStateChange}
        onUploaded={(url) => queryClient.setQueryData(backgroundKey, url)}
      >
        {(openFilePicker, isUploading) => (
          // The background itself shows behind the settings page, so this
          // only needs the actions.
          <div className="space-y-3">
            <div className="grid gap-2 sm:auto-cols-fr sm:grid-flow-col">
              <Button
                variant="secondary"
                size="md"
                onClick={openFilePicker}
                disabled={isUploading || removing || backgroundQuery.isPending}
              >
                <Icon
                  icon={
                    isUploading || backgroundQuery.isPending
                      ? "svg-spinners:ring-resize"
                      : "material-symbols:add-photo-alternate-outline"
                  }
                  aria-hidden="true"
                />
                {isUploading
                  ? "Uploading..."
                  : backgroundUrl
                    ? "Change background"
                    : "Upload background"}
              </Button>
              {backgroundUrl && (
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => setConfirmRemove(true)}
                  disabled={isUploading || removing}
                >
                  <Icon
                    icon="material-symbols:delete-outline"
                    aria-hidden="true"
                  />
                  Remove background
                </Button>
              )}
            </div>
          </div>
        )}
      </BackgroundUploadDialog>

      {backgroundQuery.error && (
        <p className="text-button-danger mt-2 text-xs">
          {backgroundQuery.error.message}
        </p>
      )}

      <ConfirmDialog
        isOpen={confirmRemove}
        onClose={() => setConfirmRemove(false)}
        onConfirm={handleRemove}
        title="Remove background"
        message="Remove your custom background? Your profile will go back to the default look."
        confirmText="Remove"
        cancelText="Cancel"
        confirmVariant="destructive"
      />
    </div>
  );
};
