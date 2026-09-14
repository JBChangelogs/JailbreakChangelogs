import { useCallback, useEffect, useRef, useState } from "react";
import Cropper, { type Area, type Point } from "react-easy-crop";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Icon } from "@/components/ui/IconWrapper";
import { Slider } from "@/components/ui/slider";
import { useSupporterModal } from "@/hooks/useSupporterModal";
import { createLogger } from "@/services/logger";
import {
  updateUserSettings,
  uploadCustomAvatar,
} from "@/services/settingsService";
import type { UserSettingsV2 } from "@/types/auth";
import { trackEvent } from "@/utils/analytics/rybbit";
import { cropAvatarToPng } from "@/utils/images/cropImage";
import { validateFile } from "@/utils/storage/fileValidation";
import SupporterModal from "../Modals/SupporterModal";

const log = createLogger("UI");
const MAX_AVATAR_FILE_SIZE = 8 * 1024 * 1024;
const ALLOWED_AVATAR_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
const ALLOWED_AVATAR_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
];

interface AvatarUploadDialogProps {
  userData: {
    premiumtype?: number;
    settings_v2?: UserSettingsV2;
  };
  activateAfterUpload?: boolean;
  onUploaded: (url: string, displayEnabled: boolean) => void;
  onUploadStateChange?: (isUploading: boolean) => void;
  children: (
    openFilePicker: () => void,
    isUploading: boolean,
  ) => React.ReactNode;
}

export const AvatarUploadDialog = ({
  userData,
  activateAfterUpload = false,
  onUploaded,
  onUploadStateChange,
  children,
}: AvatarUploadDialogProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedSourceRef = useRef<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const { modalState, closeModal, checkAvatarAccess } = useSupporterModal();
  const usesSquareAvatar = userData.premiumtype === 3;
  const hasCropEdits =
    crop.x !== 0 || crop.y !== 0 || zoom !== 1 || rotation !== 0;

  useEffect(() => {
    onUploadStateChange?.(isUploading);
  }, [isUploading, onUploadStateChange]);

  useEffect(
    () => () => {
      if (selectedSourceRef.current) {
        URL.revokeObjectURL(selectedSourceRef.current);
      }
    },
    [],
  );

  const clearSelectedSource = useCallback(() => {
    if (selectedSourceRef.current) {
      URL.revokeObjectURL(selectedSourceRef.current);
      selectedSourceRef.current = null;
    }
    setSelectedSource(null);
    setIsCropOpen(false);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setCroppedAreaPixels(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const openFilePicker = useCallback(() => {
    if (!checkAvatarAccess(userData.premiumtype ?? 0)) return;
    fileInputRef.current?.click();
  }, [checkAvatarAccess, userData.premiumtype]);

  const handleFileSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validation = validateFile(
      file,
      ALLOWED_AVATAR_EXTENSIONS,
      ALLOWED_AVATAR_TYPES,
      MAX_AVATAR_FILE_SIZE,
      8,
    );
    if (!validation.isValid) {
      toast.error("Invalid avatar", { description: validation.error });
      event.target.value = "";
      return;
    }

    const source = URL.createObjectURL(file);
    selectedSourceRef.current = source;
    setSelectedSource(source);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setIsCropOpen(true);
  };

  const handleCropComplete = useCallback((_area: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const resetCrop = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
  };

  const handleUpload = async () => {
    if (!selectedSource || !croppedAreaPixels || isUploading) return;
    setIsUploading(true);

    try {
      const croppedFile = await cropAvatarToPng(
        selectedSource,
        croppedAreaPixels,
        rotation,
      );
      const newAvatarUrl = await uploadCustomAvatar(croppedFile);
      let displayEnabled = userData.settings_v2?.custom_avatar === true;

      if (activateAfterUpload && !displayEnabled) {
        await updateUserSettings("custom_avatar", true);
        displayEnabled = true;
      }

      onUploaded(newAvatarUrl, displayEnabled);
      clearSelectedSource();
      toast.success("Custom avatar uploaded", {
        description: displayEnabled
          ? "Your new avatar is now visible."
          : "Turn on Custom Avatar when you are ready to display it.",
      });
      trackEvent("Custom Avatar Uploaded", { url: newAvatarUrl });
    } catch (error) {
      log.error("Avatar upload error:", error);
      toast.error("Avatar upload failed", {
        description:
          error instanceof Error ? error.message : "Failed to upload avatar",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_AVATAR_TYPES.join(",")}
        onChange={handleFileSelection}
        className="hidden"
        disabled={isUploading}
      />
      {children(openFilePicker, isUploading)}

      <Dialog
        open={isCropOpen}
        onOpenChange={(open) => {
          if (!open && !isUploading) clearSelectedSource();
        }}
      >
        <DialogContent className="max-w-lg" showClose={!isUploading}>
          <DialogHeader>
            <DialogTitle>Crop your avatar</DialogTitle>
            <DialogDescription>
              Drag to reposition the image and use the slider to zoom.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-primary-bg relative mt-4 h-[min(52vh,420px)] w-full overflow-hidden rounded-xl">
            {selectedSource && (
              <Cropper
                image={selectedSource}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={1}
                cropShape={usesSquareAvatar ? "rect" : "round"}
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onRotationChange={setRotation}
                onCropComplete={handleCropComplete}
              />
            )}
          </div>

          <div className="my-5 flex items-center gap-3">
            <Icon
              icon="heroicons:magnifying-glass-minus"
              className="text-secondary-text size-5"
            />
            <Slider
              aria-label="Avatar zoom"
              min={1}
              max={3}
              step={0.01}
              value={[zoom]}
              onValueChange={([value]) => setZoom(value)}
              disabled={isUploading}
            />
            <Icon
              icon="heroicons:magnifying-glass-plus"
              className="text-secondary-text size-5"
            />
          </div>

          <div className="mb-5 flex items-center gap-3">
            <Icon
              icon="material-symbols:rotate-left"
              className="text-secondary-text size-5"
            />
            <Slider
              aria-label="Avatar rotation"
              min={-180}
              max={180}
              step={1}
              value={[rotation]}
              onValueChange={([value]) => setRotation(value)}
              disabled={isUploading}
            />
            <span className="text-secondary-text w-11 text-right text-xs tabular-nums">
              {Math.round(rotation)}°
            </span>
          </div>

          <div className="mb-4 flex justify-end">
            <Button
              variant="secondary"
              size="sm"
              onClick={resetCrop}
              disabled={isUploading || !hasCropEdits}
            >
              <Icon icon="material-symbols:restart-alt" />
              Reset
            </Button>
          </div>

          <DialogFooter className="gap-2 sm:space-x-0">
            <Button
              variant="secondary"
              onClick={clearSelectedSource}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              onClick={() => void handleUpload()}
              disabled={!croppedAreaPixels || isUploading}
            >
              <Icon
                icon={
                  isUploading
                    ? "svg-spinners:ring-resize"
                    : "material-symbols:cloud-upload"
                }
              />
              {isUploading ? "Uploading..." : "Upload Avatar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SupporterModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        feature={modalState.feature}
        currentTier={modalState.currentTier}
        requiredTier={modalState.requiredTier}
        currentLimit={modalState.currentLimit}
        requiredLimit={modalState.requiredLimit}
      />
    </>
  );
};
