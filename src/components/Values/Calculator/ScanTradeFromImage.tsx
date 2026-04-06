"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { Icon } from "@/components/ui/IconWrapper";

export interface ScannedTradeItem {
  name: string;
  type: string;
  id: number;
  score?: number;
}

export interface ScanTradeResponse {
  offering: ScannedTradeItem[];
  requesting: ScannedTradeItem[];
}

interface ScanTradeFromImageProps {
  onScanSuccess: (result: ScanTradeResponse) => void;
}

export function ScanTradeFromImage({ onScanSuccess }: ScanTradeFromImageProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [lastFileName, setLastFileName] = useState<string | null>(null);

  const helpText = useMemo(
    () =>
      "Drop a Jailbreak trading UI screenshot here. We'll detect Offering/Requesting items and prefill the calculator.",
    [],
  );

  const scanFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file.");
        return;
      }

      const baseUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!baseUrl) {
        toast.error("API is not configured (NEXT_PUBLIC_API_URL missing).");
        return;
      }

      setIsScanning(true);
      setLastFileName(file.name);

      const toastId = toast.loading("Scanning trade screenshot...");
      try {
        const formData = new FormData();
        formData.set("image", file);

        const response = await fetch(`${baseUrl}/scan/trade`, {
          method: "POST",
          body: formData,
          credentials: "include",
          cache: "no-store",
        });

        const data = (await response.json()) as unknown;
        if (!response.ok) {
          if (response.status === 429) {
            toast.error(
              "Too many scans — please wait a moment and try again.",
              {
                id: toastId,
              },
            );
            return;
          }

          const detail =
            data && typeof data === "object"
              ? (data as Record<string, unknown>).detail
              : null;
          const message = typeof detail === "string" ? detail : "Scan failed";
          throw new Error(message);
        }

        if (!data || typeof data !== "object") {
          throw new Error("Unexpected scan response");
        }

        const offering = Array.isArray((data as ScanTradeResponse).offering)
          ? (data as ScanTradeResponse).offering
          : [];
        const requesting = Array.isArray((data as ScanTradeResponse).requesting)
          ? (data as ScanTradeResponse).requesting
          : [];

        if (offering.length === 0 && requesting.length === 0) {
          toast.error("No trade items were found in that image.", {
            id: toastId,
          });
          return;
        }

        onScanSuccess({ offering, requesting });
        toast.success("Trade screenshot scanned.", { id: toastId });
      } catch (error) {
        console.error("Scan trade image failed:", error);
        toast.error(
          error instanceof Error ? error.message : "Failed to scan image",
          { id: toastId },
        );
      } finally {
        setIsScanning(false);
      }
    },
    [onScanSuccess],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    multiple: false,
    maxFiles: 1,
    noClick: false,
    noKeyboard: true,
    disabled: isScanning,
    accept: { "image/*": [] },
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (file) void scanFile(file);
    },
  });

  useEffect(() => {
    const isEditableTarget = (target: EventTarget | null): boolean => {
      const el = target instanceof Element ? target : null;
      if (!el) return false;
      const tagName = el.tagName.toLowerCase();
      if (tagName === "input" || tagName === "textarea") return true;
      return (el as HTMLElement).isContentEditable;
    };

    const onPaste = (event: ClipboardEvent) => {
      if (isScanning) return;
      if (isEditableTarget(event.target)) return;
      const items = event.clipboardData?.items;
      if (!items || items.length === 0) return;

      for (const item of items) {
        if (!item.type.startsWith("image/")) continue;
        const file = item.getAsFile();
        if (!file) continue;
        event.preventDefault();
        void scanFile(file);
        return;
      }
    };

    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [isScanning, scanFile]);

  return (
    <div data-component="scan-trade-from-image">
      <div
        className={[
          "border-border-card bg-secondary-bg rounded-lg border p-6 text-center transition-colors",
          isDragActive ? "border-border-focus bg-tertiary-bg" : "",
          isScanning ? "cursor-progress opacity-80" : "cursor-pointer",
        ].join(" ")}
        {...getRootProps({ role: "button", tabIndex: 0 })}
      >
        <input {...getInputProps()} />
        <div className="mb-3 flex justify-center">
          <Icon
            icon="material-symbols:cloud-upload"
            className="text-secondary-text h-8 w-8"
          />
        </div>
        <h3 className="text-primary-text mb-2 text-lg font-semibold">
          Scan a trade screenshot
        </h3>
        <p className="text-secondary-text mx-auto mb-4 max-w-[560px] text-sm">
          {helpText}
        </p>
        <p className="text-secondary-text mx-auto mb-4 max-w-[560px] text-xs">
          Tip: Click to upload, or paste an image (Ctrl+V / ⌘V).
        </p>

        {lastFileName && (
          <p className="text-secondary-text/70 mt-4 text-xs">
            Last uploaded file: {lastFileName}
          </p>
        )}
      </div>
    </div>
  );
}
