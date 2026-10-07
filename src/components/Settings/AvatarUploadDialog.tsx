import { useCallback, useEffect, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import Cropper, { type Area, type Point } from "react-easy-crop";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
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
  uploadCustomBackground,
  uploadCustomBanner,
} from "@/services/settingsService";
import type { UserSettingsV2 } from "@/types/auth";
import { trackEvent } from "@/utils/analytics/rybbit";
import {
  cropAvatarImage,
  cropBackgroundImage,
  cropBannerImage,
} from "@/utils/images/cropImage";
import { validateFile } from "@/utils/storage/fileValidation";
import SupporterModal from "../Modals/SupporterModal";

const log = createLogger("UI");
type UploadPhase = "processing" | "uploading" | null;
const ALLOWED_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
];

export const IMAGE_UPLOAD_FORMATS = "PNG, JPG, WebP, or animated GIF";
export const IMAGE_UPLOAD_MAX_SIZE_MB = {
  avatar: 8,
  banner: 10,
  background: 10,
} as const;

type ImageType = keyof typeof IMAGE_UPLOAD_MAX_SIZE_MB;

const IMAGE_TYPE_CONFIG = {
  avatar: {
    title: "Avatar",
    aspect: 1,
    crop: cropAvatarImage,
    upload: uploadCustomAvatar,
    setting: "custom_avatar",
  },
  banner: {
    title: "Banner",
    aspect: 3,
    crop: cropBannerImage,
    upload: uploadCustomBanner,
    setting: "custom_banner",
  },
  background: {
    title: "Background",
    aspect: 16 / 9,
    crop: cropBackgroundImage,
    upload: uploadCustomBackground,
    setting: "custom_background",
  },
} as const;

export const getImageUploadRequirements = (imageType: ImageType) =>
  `${IMAGE_UPLOAD_FORMATS} up to ${IMAGE_UPLOAD_MAX_SIZE_MB[imageType]} MB.`;

interface ImageUploadDialogProps {
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
  imageType: ImageType;
}

const ImageUploadDialog = ({
  userData,
  activateAfterUpload = false,
  onUploaded,
  onUploadStateChange,
  children,
  imageType,
}: ImageUploadDialogProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedFileRef = useRef<File | null>(null);
  const selectedSourceRef = useRef<string | null>(null);
  const [uploadPhase, setUploadPhase] = useState<UploadPhase>(null);
  const [isUploadPromptOpen, setIsUploadPromptOpen] = useState(false);
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPercentages, setCroppedAreaPercentages] =
    useState<Area | null>(null);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const {
    modalState,
    closeModal,
    checkAvatarAccess,
    checkBannerAccess,
    checkBackgroundAccess,
  } = useSupporterModal();
  const isAvatar = imageType === "avatar";
  const label = imageType;
  const config = IMAGE_TYPE_CONFIG[imageType];
  const title = config.title;
  const maxFileSizeMb = IMAGE_UPLOAD_MAX_SIZE_MB[imageType];
  const settingName = config.setting;
  const isUploading = uploadPhase !== null;
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
    selectedFileRef.current = null;
    setIsCropOpen(false);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setCroppedAreaPercentages(null);
    setCroppedAreaPixels(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const openFilePicker = useCallback(() => {
    const checkAccess = {
      avatar: checkAvatarAccess,
      banner: checkBannerAccess,
      background: checkBackgroundAccess,
    }[imageType];
    if (!checkAccess(userData.premiumtype ?? 0)) return;

    setIsUploadPromptOpen(true);
  }, [
    checkAvatarAccess,
    checkBannerAccess,
    checkBackgroundAccess,
    imageType,
    userData.premiumtype,
  ]);

  const chooseImage = () => {
    fileInputRef.current?.click();
  };

  const selectImage = (file?: File) => {
    if (!file || isUploading) return;

    const validation = validateFile(
      file,
      ALLOWED_IMAGE_EXTENSIONS,
      ALLOWED_IMAGE_TYPES,
      maxFileSizeMb * 1024 * 1024,
      maxFileSizeMb,
    );
    if (!validation.isValid) {
      toast.error(`Invalid ${label}`, { description: validation.error });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const source = URL.createObjectURL(file);
    if (selectedSourceRef.current) {
      URL.revokeObjectURL(selectedSourceRef.current);
    }
    selectedFileRef.current = file;
    selectedSourceRef.current = source;
    setSelectedSource(source);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setCroppedAreaPercentages(null);
    setIsUploadPromptOpen(false);
    setIsCropOpen(true);
  };

  const { getRootProps, isDragActive } = useDropzone({
    onDrop: (files) => selectImage(files[0]),
    onDropRejected: () => toast.error("Choose one image at a time"),
    multiple: false,
    noClick: true,
    noKeyboard: true,
    disabled: isUploading,
  });

  const handleCropComplete = useCallback((area: Area, pixels: Area) => {
    setCroppedAreaPercentages(area);
    setCroppedAreaPixels(pixels);
  }, []);

  const resetCrop = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
  };

  const handleUpload = async () => {
    const selectedFile = selectedFileRef.current;
    if (!selectedFile || !selectedSource || !croppedAreaPixels || isUploading)
      return;
    const fullImageSelected =
      croppedAreaPercentages !== null &&
      croppedAreaPercentages.x <= 0.01 &&
      croppedAreaPercentages.y <= 0.01 &&
      croppedAreaPercentages.width >= 99.99 &&
      croppedAreaPercentages.height >= 99.99;
    const canUploadGifDirectly =
      selectedFile.type === "image/gif" && !hasCropEdits && fullImageSelected;
    setUploadPhase(canUploadGifDirectly ? "uploading" : "processing");

    let uploadStarted = false;
    try {
      const croppedFile = canUploadGifDirectly
        ? selectedFile
        : await config.crop(
            selectedFile,
            selectedSource,
            croppedAreaPixels,
            rotation,
          );
      if (croppedFile.size > maxFileSizeMb * 1024 * 1024) {
        throw new Error(
          `The cropped ${label} is larger than ${maxFileSizeMb}MB. Try a shorter or smaller GIF.`,
        );
      }
      setUploadPhase("uploading");
      uploadStarted = true;
      const newImageUrl = await config.upload(croppedFile);
      let displayEnabled = userData.settings_v2?.[settingName] === true;

      if (activateAfterUpload && !displayEnabled) {
        await updateUserSettings(settingName, true);
        displayEnabled = true;
      }

      onUploaded(newImageUrl, displayEnabled);
      clearSelectedSource();
      toast.success(`Custom ${label} uploaded`, {
        description: displayEnabled
          ? `Your new ${label} is now visible.`
          : `Turn on Custom ${title} when you are ready to display it.`,
      });
      trackEvent(`Custom ${title} Uploaded`, {
        url: newImageUrl,
      });
    } catch (error) {
      log.error(
        `${title} ${uploadStarted ? "upload" : "processing"} error:`,
        error,
      );
      toast.error(
        `${title} ${uploadStarted ? "upload" : "processing"} failed`,
        {
          description:
            error instanceof Error
              ? error.message
              : `Failed to upload ${label}`,
        },
      );
    } finally {
      setUploadPhase(null);
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_IMAGE_TYPES.join(",")}
        onChange={(event) => {
          selectImage(event.target.files?.[0]);
          event.target.value = "";
        }}
        className="hidden"
        disabled={isUploading}
      />
      {children(openFilePicker, isUploading)}

      <Dialog open={isUploadPromptOpen} onOpenChange={setIsUploadPromptOpen}>
        <DialogContent
          className="flex max-w-[480px] flex-col rounded-lg p-0"
          showClose
        >
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle>Upload a custom {label}</DialogTitle>
            <DialogDescription>
              {getImageUploadRequirements(imageType)}
            </DialogDescription>
          </DialogHeader>
          <button
            {...getRootProps({
              type: "button",
              role: "button",
              onClick: chooseImage,
              "aria-label": `Choose or drop a ${label} image`,
              className: `focus-visible:ring-border-focus mx-6 mt-4 hidden min-h-40 cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-6 text-center transition-colors focus-visible:ring-2 focus-visible:outline-none [@media(min-width:768px)_and_(hover:hover)_and_(pointer:fine)]:flex ${isDragActive ? "border-link bg-button-info/10" : "border-border-card bg-tertiary-bg hover:border-link"}`,
            })}
          >
            <Icon
              icon="material-symbols:cloud-upload"
              className="text-secondary-text size-8"
            />
            <span className="text-primary-text text-sm font-medium">
              {isDragActive
                ? "Drop your image here"
                : "Drag and drop an image here"}
            </span>
            <span className="text-secondary-text text-xs">
              or click to choose a file
            </span>
          </button>
          <DialogFooter className="mt-4 gap-2 px-6 pt-2 pb-6">
            <DialogClose asChild>
              <Button variant="ghost" size="sm">
                Cancel
              </Button>
            </DialogClose>
            <Button onClick={chooseImage} size="sm">
              <Icon icon="material-symbols:photo-library-outline" />
              Choose Image
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isCropOpen}
        onOpenChange={(open) => {
          if (!open && !isUploading) clearSelectedSource();
        }}
      >
        <DialogContent
          className={isAvatar ? "max-w-lg" : "max-w-2xl"}
          showClose={!isUploading}
        >
          <DialogHeader>
            <DialogTitle>Adjust your {label}</DialogTitle>
            <DialogDescription>
              Drag to reposition the image and use the slider to zoom.
            </DialogDescription>
          </DialogHeader>

          <div
            className="bg-primary-bg relative mt-4 h-[min(52vh,420px)] w-full overflow-hidden rounded-xl"
            aria-busy={isUploading}
          >
            {selectedSource && (
              <Cropper
                image={selectedSource}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={config.aspect}
                cropShape={
                  isAvatar && userData.premiumtype !== 3 ? "round" : "rect"
                }
                showGrid={false}
                onCropChange={isUploading ? () => undefined : setCrop}
                onZoomChange={isUploading ? undefined : setZoom}
                onRotationChange={isUploading ? undefined : setRotation}
                onCropComplete={handleCropComplete}
              />
            )}
            {isUploading && (
              <div className="absolute inset-0 z-10 cursor-wait" />
            )}
          </div>

          <div className="my-5 flex items-center gap-3">
            <Icon
              icon="heroicons:magnifying-glass-minus"
              className="text-secondary-text size-5"
            />
            <Slider
              aria-label={`${title} zoom`}
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
              aria-label={`${title} rotation`}
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
              {uploadPhase === "processing"
                ? selectedFileRef.current?.type === "image/gif"
                  ? "Processing GIF..."
                  : "Processing image..."
                : uploadPhase === "uploading"
                  ? "Uploading..."
                  : `Upload ${title}`}
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

type SharedUploadDialogProps = Omit<ImageUploadDialogProps, "imageType">;

export const AvatarUploadDialog = (props: SharedUploadDialogProps) => (
  <ImageUploadDialog {...props} imageType="avatar" />
);

export const BannerUploadDialog = (props: SharedUploadDialogProps) => (
  <ImageUploadDialog {...props} imageType="banner" />
);

export const BackgroundUploadDialog = (props: SharedUploadDialogProps) => (
  <ImageUploadDialog {...props} imageType="background" />
);
