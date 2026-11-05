"use client";

import { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Icon } from "@/components/ui/IconWrapper";
import { Spinner } from "@/components/ui/Spinner";
import ThemePreviewImages from "./ThemePreviewImages";
import {
  uploadThemePreview,
  deleteThemePreview,
  type ThemePreviewImage,
  type UserTheme,
} from "@/utils/api/userThemes";

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

  const change = useCallback(
    async (operation: () => Promise<ThemePreviewImage[]>) => {
      if (busy || disabled || !theme) return;
      setBusy(true);
      onBusyChange(true);
      setError(null);
      try {
        onChange(await operation());
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Couldn't update the screenshots. Please try again.",
        );
      } finally {
        setBusy(false);
        onBusyChange(false);
      }
    },
    [busy, disabled, theme, onBusyChange, onChange],
  );

  const full = previews.length >= 3;
  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      if (event.defaultPrevented || busy || disabled || full || !theme) return;
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.matches("input, textarea") || target.isContentEditable)
      )
        return;
      for (const item of event.clipboardData?.items ?? []) {
        if (!item.type.startsWith("image/")) continue;
        const image = item.getAsFile();
        if (!image) continue;
        event.preventDefault();
        void change(() => uploadThemePreview(theme.id, image));
        return;
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [busy, disabled, full, theme, change]);

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
          Up to 3 screenshots, 10 MB each. Uploads are saved immediately.
        </p>
      </div>
      {!theme ? (
        <p className="text-secondary-text text-sm">
          Save your theme to enable screenshot uploads here. You can also add
          screenshots later through Edit.
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
                  : "Click, drop, or paste a screenshot (Ctrl+V / ⌘V)"}
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
