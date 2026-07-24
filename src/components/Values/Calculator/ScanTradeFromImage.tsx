"use client";

import { createLogger } from "@/services/logger";
import React, { useCallback, useEffect, useMemo, useState } from "react";

const log = createLogger("UI");
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { Icon } from "@/components/ui/IconWrapper";
import { Spinner } from "@/components/ui/Spinner";
import { buildApiFetchRequest } from "@/utils/api/apiDevToken";

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

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

const isSupportedImage = (file: File): boolean => {
  const supportedTypes = new Set(["image/png", "image/jpeg", "image/jpg"]);
  if (supportedTypes.has(file.type)) return true;
  const name = file.name.toLowerCase();
  return (
    name.endsWith(".png") || name.endsWith(".jpg") || name.endsWith(".jpeg")
  );
};

const getScanErrorMessage = (payload: unknown): string | null => {
  const withExtras = (
    message: string,
    obj: Record<string, unknown>,
  ): string => {
    const pieces: string[] = [];
    const width = typeof obj.width === "number" ? obj.width : null;
    const height = typeof obj.height === "number" ? obj.height : null;
    if (width && height) pieces.push(`${width}×${height}`);

    const maxSize = typeof obj.max_size === "string" ? obj.max_size : null;
    if (maxSize && !message.toLowerCase().includes(maxSize.toLowerCase())) {
      pieces.push(`max ${maxSize}`);
    }

    return pieces.length ? `${message} (${pieces.join(", ")})` : message;
  };

  // Some deployments return `[errorObj, statusCode]` with HTTP 200.
  if (Array.isArray(payload)) {
    const first = payload[0];
    if (isRecord(first)) {
      const message =
        (typeof first.message === "string" ? first.message : null) ??
        (typeof first.detail === "string" ? first.detail : null);
      return message ? withExtras(message, first) : null;
    }
    return null;
  }

  if (!isRecord(payload)) return null;

  const message =
    (typeof payload.message === "string" ? payload.message : null) ??
    (typeof payload.detail === "string" ? payload.detail : null);
  return message ? withExtras(message, payload) : null;
};

const getEmbeddedStatus = (payload: unknown): number | null => {
  if (!Array.isArray(payload)) return null;
  const maybeStatus = payload[1];
  return typeof maybeStatus === "number" ? maybeStatus : null;
};

export function ScanTradeFromImage({ onScanSuccess }: ScanTradeFromImageProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [lastFileName, setLastFileName] = useState<string | null>(null);
  const [lastErrorMessage, setLastErrorMessage] = useState<string | null>(null);

  const helpText = useMemo(
    () =>
      "Drop a Jailbreak trading UI screenshot here. We'll detect Offering/Requesting items and prefill the calculator.",
    [],
  );
  const acceptedTypesText = useMemo(
    () => "Accepted formats: PNG, JPG/JPEG.",
    [],
  );

  const scanFile = useCallback(
    async (file: File, source: "drag" | "paste" | "picker") => {
      if (!file.type.startsWith("image/")) {
        const message = "Please upload an image file.";
        setLastErrorMessage(message);
        toast.error(message);
        return;
      }

      if (!isSupportedImage(file)) {
        const message = "Unsupported image type. Please upload a PNG or JPG.";
        setLastErrorMessage(message);
        toast.error(message);
        return;
      }

      const baseUrl = process.env.NEXT_PUBLIC_SCANNING_API_URL;
      if (!baseUrl) {
        const message = "API is not configured (NEXT_PUBLIC_API_URL missing).";
        setLastErrorMessage(message);
        toast.error(message);
        return;
      }

      setIsScanning(true);
      setLastFileName(file.name);
      setLastErrorMessage(null);

      const toastId = toast.loading("Scanning trade screenshot...");
      try {
        const formData = new FormData();
        formData.set("image", file);

        const { url, headers } = buildApiFetchRequest(baseUrl, "/trade");
        const response = await fetch(url, {
          method: "POST",
          body: formData,
          credentials: "include",
          cache: "no-store",
          headers,
        });

        const data = (await response.json()) as unknown;
        const embeddedStatus = getEmbeddedStatus(data);
        const effectiveStatus = embeddedStatus ?? response.status;

        if (
          !response.ok ||
          (embeddedStatus !== null && embeddedStatus >= 400)
        ) {
          if (effectiveStatus === 429) {
            const message =
              "Too many scans — please wait a moment and try again.";
            setLastErrorMessage(message);
            toast.error(message, { id: toastId });
            return;
          }

          const message =
            getScanErrorMessage(data) ??
            `Scan failed${effectiveStatus ? ` (${effectiveStatus})` : ""}`;
          setLastErrorMessage(message);
          throw new Error(message);
        }

        // Defensive: some backends return an error payload with HTTP 200.
        const okButErrorMessage = getScanErrorMessage(data);
        if (okButErrorMessage) {
          setLastErrorMessage(okButErrorMessage);
          throw new Error(okButErrorMessage);
        }

        if (!data || typeof data !== "object" || Array.isArray(data)) {
          setLastErrorMessage("Unexpected scan response");
          throw new Error("Unexpected scan response");
        }

        const offering = Array.isArray((data as ScanTradeResponse).offering)
          ? (data as ScanTradeResponse).offering
          : [];
        const requesting = Array.isArray((data as ScanTradeResponse).requesting)
          ? (data as ScanTradeResponse).requesting
          : [];

        if (offering.length === 0 && requesting.length === 0) {
          const message = "No trade items were found in that image.";
          setLastErrorMessage(message);
          toast.error(message, { id: toastId });
          return;
        }

        onScanSuccess({ offering, requesting });
        setLastErrorMessage(null);
        toast.success("Trade screenshot scanned.", { id: toastId });
        window.rybbit?.event("Trade Image Scanned", {
          fileType: file.type.replace("image/", "") || "unknown",
          source,
        });
      } catch (error) {
        log.error("Scan trade image failed", error);
        const message =
          error instanceof Error ? error.message : "Failed to scan image";
        setLastErrorMessage(message);
        toast.error(message, { id: toastId });
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
    accept: {
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/jpg": [".jpg"],
    },
    onDrop: (acceptedFiles, _rejected, event) => {
      const file = acceptedFiles[0];
      if (file) {
        const source =
          event instanceof Event && event.type === "drop" ? "drag" : "picker";
        void scanFile(file, source);
      }
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
        void scanFile(file, "paste");
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
          "border-border-card hover:border-border-focus bg-secondary-bg flex items-center gap-3 rounded-lg border-2 border-dashed p-4 text-left transition-colors",
          isDragActive ? "border-border-focus bg-tertiary-bg" : "",
          isScanning ? "cursor-progress opacity-80" : "cursor-pointer",
        ].join(" ")}
        {...getRootProps({ role: "button", tabIndex: 0 })}
      >
        <input {...getInputProps()} />
        {isScanning ? (
          <Spinner className="text-secondary-text h-6 w-6 shrink-0" />
        ) : (
          <Icon
            icon="material-symbols:cloud-upload"
            className="text-secondary-text h-6 w-6 shrink-0"
          />
        )}
        <div className="min-w-0">
          {isScanning ? (
            <p className="text-primary-text text-sm font-semibold">
              Scanning{lastFileName ? ` ${lastFileName}` : ""}...
              <span className="text-secondary-text ml-2 font-normal">
                This can take a few seconds
              </span>
            </p>
          ) : (
            <p className="text-primary-text text-sm font-semibold">
              Scan a trade screenshot
              <span className="text-secondary-text ml-2 font-normal">
                — {helpText}
              </span>
            </p>
          )}
          <p className="text-secondary-text mt-0.5 text-xs">
            Click, drop, or paste (Ctrl+V / ⌘V) · {acceptedTypesText}
          </p>

          {lastErrorMessage && (
            <p className="mt-1 text-xs text-red-400">{lastErrorMessage}</p>
          )}

          {lastFileName && !isScanning && (
            <p className="text-secondary-text/70 mt-1 text-xs">
              Last uploaded file: {lastFileName}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
