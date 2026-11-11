"use client";

import { createLogger } from "@/services/logger";
import React, { useCallback, useEffect, useMemo, useState } from "react";

const log = createLogger("UI");
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { Icon } from "@/components/ui/IconWrapper";
import { Spinner } from "@/components/ui/Spinner";
import { trackWebEvent } from "@/utils/analytics/web";
import { fetchTradeCatalog } from "@/utils/api/fetchTradeItemsByIds";
import { parseTradeScan, TradeScanError, type ScannedItem } from "./tradeScan";
import type { TradeScreenshotRead } from "./tradeScanOcr";

interface ScanTradeFromImageProps {
  onScanSuccess: (result: {
    offering: ScannedItem[];
    requesting: ScannedItem[];
  }) => void;
}

// One worker per page, kept alive so the OCR models load once. Scans never
// overlap (the dropzone is disabled while scanning), so one handler at a time.
let ocrWorker: Worker | null = null;

function readTradeScreenshotInWorker(file: File): Promise<TradeScreenshotRead> {
  ocrWorker ??= new Worker(
    new URL("./tradeScanOcr.worker.ts", import.meta.url),
    { type: "module" },
  );
  const worker = ocrWorker;
  return new Promise((resolve, reject) => {
    worker.onmessage = (
      event: MessageEvent<{ result?: TradeScreenshotRead; error?: string }>,
    ) => {
      if (event.data.result) resolve(event.data.result);
      else reject(new Error(event.data.error ?? "OCR failed"));
    };
    worker.onerror = () => {
      worker.terminate();
      ocrWorker = null; // start fresh on the next scan
      reject(new Error("The scanner failed to start"));
    };
    worker.postMessage(file);
  });
}

const isSupportedImage = (file: File): boolean => {
  const supportedTypes = new Set(["image/png", "image/jpeg", "image/jpg"]);
  if (supportedTypes.has(file.type)) return true;
  const name = file.name.toLowerCase();
  return (
    name.endsWith(".png") || name.endsWith(".jpg") || name.endsWith(".jpeg")
  );
};

export function ScanTradeFromImage({ onScanSuccess }: ScanTradeFromImageProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [lastFileName, setLastFileName] = useState<string | null>(null);
  const [lastErrorMessage, setLastErrorMessage] = useState<string | null>(null);

  const helpText = useMemo(
    () =>
      "Upload a Jailbreak trading UI screenshot. We'll detect Offering/Requesting items and prefill the calculator.",
    [],
  );
  const acceptedTypesText = useMemo(
    () => "Accepted formats: PNG, JPG/JPEG.",
    [],
  );

  const scanFile = useCallback(
    async (file: File, source: "drag" | "paste" | "picker") => {
      if (!file.type.startsWith("image/")) {
        trackWebEvent("trade_scan_failed", {
          mode: "upload",
          code: "not_image",
        });
        const message = "Please upload an image file.";
        setLastErrorMessage(message);
        toast.error(message);
        return;
      }

      if (!isSupportedImage(file)) {
        trackWebEvent("trade_scan_failed", {
          mode: "upload",
          code: "unsupported_type",
        });
        const message = "Unsupported image type. Please upload a PNG or JPG.";
        setLastErrorMessage(message);
        toast.error(message);
        return;
      }

      setIsScanning(true);
      setLastFileName(file.name);
      setLastErrorMessage(null);

      const toastId = toast.loading("Scanning trade screenshot...");
      let failureCode = "ocr_failed";
      try {
        const catalogRequest = fetchTradeCatalog();
        // Keep a catalog failure from surfacing as an unhandled rejection while OCR runs.
        catalogRequest.catch(() => {});
        const { detections, height, timings } =
          await readTradeScreenshotInWorker(file);
        failureCode = "catalog_failed";
        const catalog = await catalogRequest;

        failureCode = "parse_failed";
        const parseStartedAt = performance.now();
        const { offering, requesting } = parseTradeScan(detections, height, [
          ...catalog.values(),
        ]);

        trackWebEvent("trade_scan", {
          mode: "upload",
          scope: "area",
          offering: offering.length,
          requesting: requesting.length,
          detections: detections.length,
          parse_ms: Math.round(performance.now() - parseStartedAt),
          ...timings,
        });

        if (offering.length === 0 && requesting.length === 0) {
          const message = "No trade items were found in that image.";
          setLastErrorMessage(message);
          toast.error(message, { id: toastId });
          return;
        }

        failureCode = "apply_failed";
        onScanSuccess({ offering, requesting });
        setLastErrorMessage(null);
        toast.success("Trade screenshot scanned.", { id: toastId });
        try {
          window.rybbit?.event("Trade Image Scanned", {
            fileType: file.type.replace("image/", "") || "unknown",
            source,
          });
        } catch {}
      } catch (error) {
        trackWebEvent("trade_scan_failed", {
          mode: "upload",
          code: error instanceof TradeScanError ? error.code : failureCode,
        });
        log.error("Scan trade image failed", error);
        const message =
          error instanceof TradeScanError
            ? "Too much text in that image. Crop it to the trade window and try again."
            : "Failed to scan image. Please try again.";
        setLastErrorMessage(message);
        toast.error(message, { id: toastId });
      } finally {
        setIsScanning(false);
      }
    },
    [onScanSuccess],
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
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
      onDrop: (acceptedFiles, rejected, event) => {
        if (rejected.length > 0) {
          trackWebEvent("trade_scan_failed", {
            mode: "upload",
            code: rejected[0].errors[0]?.code ?? "file_rejected",
          });
        }
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
          "flex items-center gap-4 rounded-lg border-2 border-dashed p-5 text-left transition-all duration-150",
          isDragActive
            ? isDragReject
              ? "border-status-error bg-status-error/10 ring-2 ring-status-error/25"
              : "border-button-info bg-button-info/10 ring-2 ring-button-info/25"
            : "border-border-card hover:border-border-focus bg-secondary-bg",
          isScanning ? "cursor-progress opacity-80" : "cursor-pointer",
        ].join(" ")}
        {...getRootProps({ role: "button", tabIndex: 0 })}
      >
        <input {...getInputProps()} />
        {isScanning ? (
          <Spinner className="text-secondary-text h-7 w-7 shrink-0" />
        ) : (
          <Icon
            icon="material-symbols:cloud-upload"
            className={`h-7 w-7 shrink-0 transition-transform duration-150 ${
              isDragActive
                ? isDragReject
                  ? "text-status-error scale-125"
                  : "text-button-info scale-125"
                : "text-secondary-text"
            }`}
          />
        )}
        <div className="min-w-0" aria-live="polite">
          {isScanning ? (
            <p className="text-primary-text text-base font-semibold">
              <span>{`Scanning${lastFileName ? ` ${lastFileName}` : ""}...`}</span>
              <span className="text-secondary-text ml-2 text-sm font-normal">
                This can take a few seconds
              </span>
            </p>
          ) : isDragActive ? (
            <p className="text-primary-text text-base font-semibold">
              {isDragReject
                ? "Only PNG and JPG screenshots are supported"
                : "Drop screenshot to scan"}
            </p>
          ) : (
            <p className="text-primary-text text-base font-semibold">
              <span>Scan a trade screenshot</span>
              <span className="text-secondary-text ml-2 text-sm font-normal">
                — {helpText}
              </span>
            </p>
          )}
          <p className="text-secondary-text mt-1 text-sm">
            {isDragActive ? (
              isDragReject ? (
                <span>Choose a PNG or JPG/JPEG image.</span>
              ) : (
                <span>Release to upload your trade screenshot.</span>
              )
            ) : (
              <>
                <span className="[@media(min-width:768px)_and_(hover:hover)_and_(pointer:fine)]:hidden">
                  Tap to choose a screenshot
                </span>
                <span className="hidden [@media(min-width:768px)_and_(hover:hover)_and_(pointer:fine)]:inline">
                  Click, drop, or paste (Ctrl+V / ⌘V)
                </span>
                <span>{` · ${acceptedTypesText}`}</span>
              </>
            )}
          </p>

          {lastErrorMessage && (
            <p className="mt-1 text-sm font-medium text-red-400">
              {lastErrorMessage}
            </p>
          )}

          {lastFileName && !isScanning && (
            <p className="text-secondary-text mt-1 text-sm">
              Last uploaded file: {lastFileName}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
