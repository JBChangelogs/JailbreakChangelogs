"use client";

import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { Icon } from "@/components/ui/IconWrapper";
import { Spinner } from "@/components/ui/Spinner";
import ThemePreviewImages from "./ThemePreviewImages";
import {
  uploadThemePreview,
  deleteThemePreview,
  ThemeApiError,
  type ThemePreviewImage,
  type UserTheme,
} from "@/utils/api/userThemes";

const previewErrors: Record<string, string> = {
  upload_failed:
    "Couldn't upload the screenshot. Check its image format, file size, and dimensions.",
  image_rejected:
    "This screenshot was rejected by the automatic content review. Please choose another image.",
  preview_limit_reached:
    "You can upload up to 3 screenshots. Remove one before adding another.",
  review_unavailable:
    "Image review is temporarily unavailable. Please try again shortly.",
};

export default function ThemePreviewUploader({
  theme,
  disabled,
  onChange,
  onBusyChange,
}: {
  theme?: UserTheme;
  disabled: boolean;
  onChange: (previews: ThemePreviewImage[]) => void;
  onBusyChange: (busy: boolean) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const previews = theme?.previews ?? [];

  const change = async (operation: () => Promise<ThemePreviewImage[]>) => {
    if (busy || disabled || !theme) return;
    setBusy(true);
    onBusyChange(true);
    setError(null);
    try {
      onChange(await operation());
    } catch (err) {
      setError(
        err instanceof ThemeApiError
          ? err.status === 403
            ? "Managing preview images requires Supporter II."
            : (previewErrors[err.code ?? ""] ?? err.message)
          : err instanceof Error
            ? err.message
            : "Couldn't update the screenshots. Please try again.",
      );
    } finally {
      setBusy(false);
      onBusyChange(false);
    }
  };

  const full = previews.length >= 3;
  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      multiple: false,
      accept: { "image/*": [] },
      disabled: busy || disabled || full || !theme,
      onDrop: ([image]) => {
        if (image && theme)
          void change(() => uploadThemePreview(theme.id, image));
      },
    });

  return (
    <section className="space-y-3" aria-labelledby="theme-screenshots-title">
      <div>
        <h3
          id="theme-screenshots-title"
          className="text-primary-text text-sm font-medium"
        >
          Preview screenshots ({previews.length}/3)
        </h3>
        <p
          id="theme-screenshots-description"
          className="text-secondary-text mt-1 text-xs"
        >
          Upload a 16:9 desktop screenshot or a portrait phone screenshot
          between 9:21 and 9:16. Screenshots are saved immediately.
        </p>
      </div>
      {!theme ? (
        <p className="text-secondary-text text-sm">
          Save your theme before adding screenshots.
        </p>
      ) : (
        <>
          <ThemePreviewImages
            previews={previews}
            label={theme.label}
            disabled={busy || disabled}
            onDelete={(id) =>
              void change(() => deleteThemePreview(theme.id, id))
            }
          />
          <div
            {...getRootProps({
              role: "button",
              "aria-describedby": "theme-screenshots-description",
            })}
            className={[
              "flex items-center gap-3 rounded-lg border-2 border-dashed p-4 text-sm transition-colors",
              isDragActive
                ? isDragReject
                  ? "border-status-error bg-status-error/10"
                  : "border-button-info bg-button-info/10"
                : "border-border-card hover:border-border-focus bg-secondary-bg",
              busy || disabled || full
                ? "cursor-not-allowed opacity-60"
                : "cursor-pointer",
            ].join(" ")}
          >
            <input
              {...getInputProps({ "aria-label": "Choose a theme screenshot" })}
            />
            <Icon
              icon="material-symbols:cloud-upload"
              className="text-secondary-text size-6 shrink-0"
              aria-hidden="true"
            />
            <span className="text-primary-text">
              {full
                ? "Screenshot limit reached"
                : isDragActive
                  ? "Drop to upload"
                  : "Drag a screenshot here or click to choose"}
            </span>
          </div>
        </>
      )}
      {busy && (
        <p
          role="status"
          className="text-secondary-text flex items-center gap-2 text-sm"
        >
          <Spinner className="size-4" />
          Updating screenshots…
        </p>
      )}
      {error && (
        <p role="alert" className="text-status-error text-sm">
          {error}
        </p>
      )}
    </section>
  );
}
