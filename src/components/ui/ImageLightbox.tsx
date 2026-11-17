"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { IMAGE_PLACEHOLDER } from "@/utils/ui/imagePlaceholder";
import { Slot } from "radix-ui";
import { toast } from "sonner";

import { Icon } from "@/components/ui/IconWrapper";
import { cn } from "@/lib/utils";

const ACTION_CLASS =
  "text-secondary-text hover:bg-tertiary-bg hover:text-primary-text focus-visible:outline-border-focus flex size-10 cursor-pointer items-center justify-center rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-wait disabled:opacity-50";

interface LightboxImage {
  src: string;
  alt: string;
}

interface ImageLightboxProps {
  src?: string;
  alt?: string;
  images?: LightboxImage[];
  initialIndex?: number;
  children: ReactNode;
  className?: string;
  previewRadius?: string;
  compact?: boolean;
  showUrl?: boolean;
  triggerAsChild?: boolean;
  stopPropagation?: boolean;
  noReferrer?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const ImageLightbox = ({
  src,
  alt,
  images,
  initialIndex = 0,
  children,
  className,
  previewRadius = "rounded-lg",
  compact = false,
  showUrl = false,
  triggerAsChild = false,
  stopPropagation = false,
  noReferrer = false,
  onOpenChange,
}: ImageLightboxProps) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const lightboxImages = images?.length
    ? images
    : src
      ? [{ src, alt: alt ?? "Image preview" }]
      : [];
  const activeImage =
    activeIndex === null ? undefined : lightboxImages[activeIndex];

  const showPrevious = useCallback(() => {
    setActiveIndex((index) =>
      index === null
        ? index
        : (index - 1 + lightboxImages.length) % lightboxImages.length,
    );
  }, [lightboxImages.length]);

  const showNext = useCallback(() => {
    setActiveIndex((index) =>
      index === null ? index : (index + 1) % lightboxImages.length,
    );
  }, [lightboxImages.length]);

  useEffect(() => setMounted(true), []);

  const isOpen = activeIndex !== null;
  useEffect(() => {
    onOpenChange?.(isOpen);
  }, [isOpen, onOpenChange]);

  useEffect(() => {
    if (activeIndex === null) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveIndex(null);
      if (event.key === "ArrowLeft" && lightboxImages.length > 1) {
        showPrevious();
      }
      if (event.key === "ArrowRight" && lightboxImages.length > 1) {
        showNext();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeIndex, lightboxImages.length, showNext, showPrevious]);

  const openLightbox = (event: React.MouseEvent) => {
    if (stopPropagation) event.stopPropagation();
    if (lightboxImages.length) setActiveIndex(initialIndex);
  };

  const copyLink = async () => {
    if (!activeImage) return;
    try {
      await navigator.clipboard.writeText(
        new URL(activeImage.src, window.location.href).href,
      );
      toast.success("Image link copied");
    } catch {
      toast.error("Couldn't copy the image link. Try opening it in a new tab.");
    }
  };

  const downloadImage = async () => {
    if (!activeImage || downloading) return;
    setDownloading(true);
    try {
      const response = await fetch(activeImage.src, {
        referrerPolicy: noReferrer ? "no-referrer" : undefined,
      });
      if (!response.ok) throw new Error("Image download failed");
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download =
        new URL(activeImage.src, window.location.href).pathname
          .split("/")
          .pop() || "image";
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      toast.error(
        "Couldn't download this image. Open it in a new tab to save it.",
      );
    } finally {
      setDownloading(false);
    }
  };

  const trigger = triggerAsChild ? (
    <Slot.Root onClick={openLightbox}>{children}</Slot.Root>
  ) : (
    <button
      type="button"
      aria-label={`Preview ${alt ?? "image"}`}
      onClick={openLightbox}
      className={cn(
        "group/lightbox relative block cursor-zoom-in overflow-hidden",
        previewRadius,
        className,
      )}
    >
      {children}
      <span
        className={cn(
          "absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover/lightbox:bg-black/25 group-hover/lightbox:opacity-100 group-focus-visible/lightbox:bg-black/25 group-focus-visible/lightbox:opacity-100",
          previewRadius,
        )}
      >
        <Icon
          icon="mdi:magnify-plus-outline"
          className="size-6 text-white drop-shadow"
        />
      </span>
    </button>
  );

  return (
    <>
      {trigger}

      {mounted &&
        activeImage &&
        createPortal(
          <div
            data-image-lightbox
            className="pointer-events-auto fixed inset-0 z-[10000] flex flex-col items-center justify-center gap-3 bg-black/90 p-4"
            onContextMenu={(event) => event.stopPropagation()}
            onClick={(event) => {
              if (stopPropagation) event.stopPropagation();
              setActiveIndex(null);
            }}
          >
            <div
              className="absolute top-4 right-4 flex items-center gap-2"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="border-border-card bg-secondary-bg flex items-center gap-1 rounded-lg border p-1">
                <button
                  type="button"
                  aria-label="Copy image link"
                  title="Copy image link"
                  onClick={copyLink}
                  className={ACTION_CLASS}
                >
                  <Icon icon="lucide:copy" className="size-5" />
                </button>
                <button
                  type="button"
                  aria-label="Download image"
                  title="Download image"
                  onClick={downloadImage}
                  disabled={downloading}
                  className={ACTION_CLASS}
                >
                  <Icon icon="lucide:download" className="size-5" />
                </button>
                <a
                  href={activeImage.src}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Open image in new tab"
                  title="Open image in new tab"
                  className={ACTION_CLASS}
                >
                  <Icon icon="lucide:external-link" className="size-5" />
                </a>
              </div>
              <button
                type="button"
                aria-label="Close image preview"
                title="Close image preview"
                onClick={() => setActiveIndex(null)}
                className={cn(
                  ACTION_CLASS,
                  "border-border-card bg-secondary-bg size-12 rounded-lg border",
                )}
              >
                <Icon icon="mdi:close" className="size-5" />
              </button>
            </div>
            <Image
              placeholder={IMAGE_PLACEHOLDER}
              src={activeImage.src}
              alt={activeImage.alt}
              width={0}
              height={0}
              sizes="100vw"
              unoptimized
              draggable={false}
              referrerPolicy={noReferrer ? "no-referrer" : undefined}
              onClick={(event) => event.stopPropagation()}
              className={cn(
                "max-h-[80vh] object-contain",
                compact
                  ? "size-[min(80vh,80vw)]"
                  : "h-auto w-[min(95vw,1400px)]",
                previewRadius,
              )}
            />

            {lightboxImages.length > 1 && (
              <div
                className="flex items-center gap-4"
                onClick={(event) => event.stopPropagation()}
              >
                <button
                  type="button"
                  aria-label="Previous image"
                  onClick={showPrevious}
                  className="cursor-pointer rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
                >
                  <Icon
                    icon="material-symbols:chevron-left-rounded"
                    className="size-5"
                  />
                </button>
                <span className="text-sm text-white/70">
                  {(activeIndex ?? 0) + 1} / {lightboxImages.length}
                </span>
                <button
                  type="button"
                  aria-label="Next image"
                  onClick={showNext}
                  className="cursor-pointer rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
                >
                  <Icon
                    icon="material-symbols:chevron-right-rounded"
                    className="size-5"
                  />
                </button>
              </div>
            )}

            {showUrl && (
              <a
                href={activeImage.src}
                target="_blank"
                rel="noreferrer"
                onClick={(event) => event.stopPropagation()}
                className="w-full px-6 text-center font-mono text-xs break-all text-white/50 hover:text-white/80 hover:underline"
              >
                {activeImage.src}
              </a>
            )}
          </div>,
          document.body,
        )}
    </>
  );
};
