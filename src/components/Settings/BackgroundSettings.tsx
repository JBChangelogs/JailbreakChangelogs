import { useId, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { toast } from "sonner";

import {
  BackgroundUploadDialog,
  getImageUploadRequirements,
} from "@/components/Settings/AvatarUploadDialog";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Icon } from "@/components/ui/IconWrapper";
import { cn } from "@/lib/utils";
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
  const [expanded, setExpanded] = useState(false);
  const panelId = useId();

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
          <div className="border-border-card overflow-hidden rounded-xl border">
            <button
              type="button"
              onClick={() => setExpanded((open) => !open)}
              aria-expanded={expanded}
              aria-controls={panelId}
              className="bg-secondary-bg hover:bg-tertiary-bg flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3 text-left transition-colors"
            >
              <span className="flex items-center gap-2">
                <span className="text-primary-text text-sm font-semibold">
                  Your background
                </span>
                <span className="text-secondary-text text-xs">
                  {isUploading
                    ? "Uploading..."
                    : backgroundQuery.isPending
                      ? "Loading..."
                      : backgroundUrl
                        ? "Uploaded"
                        : "None yet"}
                </span>
              </span>
              <Icon
                icon="heroicons-outline:chevron-down"
                className={`text-secondary-text h-4 w-4 shrink-0 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
              />
            </button>

            {/* Animated open/close, same as the FAQ page. */}
            <div
              id={panelId}
              className={`grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none ${expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
            >
              <div className="overflow-hidden" inert={!expanded}>
                <div className="bg-tertiary-bg border-border-card border-t p-3">
                  {backgroundUrl ? (
                    <>
                      {/* Click to change, like the banner and avatar. */}
                      <button
                        type="button"
                        onClick={openFilePicker}
                        disabled={isUploading || removing}
                        aria-label={
                          isUploading
                            ? "Uploading background"
                            : "Change background"
                        }
                        className="group/background focus-visible:ring-border-focus relative block aspect-video w-full cursor-pointer overflow-hidden rounded-lg focus-visible:ring-2 focus-visible:outline-none disabled:cursor-wait"
                      >
                        <Image
                          src={backgroundUrl}
                          alt=""
                          fill
                          sizes="(min-width: 1024px) 720px, 100vw"
                          unoptimized
                          className="object-cover"
                        />
                        <span className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover/background:bg-black/40 group-focus-visible/background:bg-black/40">
                          <span
                            className={cn(
                              "flex items-center gap-2 rounded-full bg-black/60 px-4 py-2 text-sm font-medium text-white opacity-0 transition-opacity group-hover/background:opacity-100 group-focus-visible/background:opacity-100",
                              isUploading && "opacity-100",
                            )}
                          >
                            <Icon
                              icon={
                                isUploading
                                  ? "svg-spinners:ring-resize"
                                  : "material-symbols:photo-camera"
                              }
                              className="size-4"
                            />
                            {isUploading ? "Uploading..." : "Change background"}
                          </span>
                        </span>
                        {/* Always visible so touch users can tell it's editable. */}
                        <span className="absolute top-3 right-3 rounded-full bg-black/50 p-2 text-white">
                          <Icon
                            icon="material-symbols:photo-camera"
                            className="size-4"
                          />
                        </span>
                      </button>
                      <div className="mt-3 flex justify-end">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setConfirmRemove(true)}
                          disabled={isUploading || removing}
                        >
                          <Icon icon="material-symbols:delete-outline" />
                          Remove background
                        </Button>
                      </div>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={openFilePicker}
                      disabled={isUploading || backgroundQuery.isPending}
                      className="border-border-card hover:border-link focus-visible:ring-border-focus flex aspect-video w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:cursor-wait"
                    >
                      <Icon
                        icon={
                          isUploading || backgroundQuery.isPending
                            ? "svg-spinners:ring-resize"
                            : "material-symbols:add-photo-alternate-outline"
                        }
                        className="text-secondary-text size-8"
                      />
                      <span className="text-primary-text text-sm font-medium">
                        {isUploading ? "Uploading..." : "Upload a background"}
                      </span>
                      <span className="text-secondary-text text-xs">
                        Shown behind your profile, cropped to 16:9.{" "}
                        {getImageUploadRequirements("background")}
                      </span>
                    </button>
                  )}
                </div>
              </div>
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
