"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { IMAGE_PLACEHOLDER } from "@/utils/ui/imagePlaceholder";
import { Slot } from "radix-ui";
import { toast } from "sonner";

import { Icon } from "@/components/ui/IconWrapper";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  header?: ReactNode;
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
  header,
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
            className="pointer-events-auto fixed inset-0 z-[10000] grid grid-rows-[auto_minmax(0,1fr)_auto] gap-3 bg-black/90 p-4"
            onContextMenu={(event) => event.stopPropagation()}
            onClick={(event) => {
              if (stopPropagation) event.stopPropagation();
              setActiveIndex(null);
            }}
          >
            <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
              {header && (
                <div
                  className="max-w-full min-w-0 grow basis-40"
                  onClick={(event) => event.stopPropagation()}
                >
                  {header}
                </div>
              )}
              <div
                data-lightbox-actions
                className="ml-auto flex shrink-0 items-center gap-2"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="border-border-card bg-secondary-bg flex items-center gap-1 rounded-lg border p-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        aria-label="Copy image link"
                        onClick={copyLink}
                        className={ACTION_CLASS}
                      >
                        <Icon icon="lucide:copy" className="size-5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      Copy image link
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        aria-label="Download image"
                        onClick={downloadImage}
                        disabled={downloading}
                        className={ACTION_CLASS}
                      >
                        <Icon icon="lucide:download" className="size-5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      Download image
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <a
                        href={activeImage.src}
                        target="_blank"
                        rel="noreferrer"
                        aria-label="Open image in new tab"
                        className={ACTION_CLASS}
                      >
                        <Icon icon="lucide:external-link" className="size-5" />
                      </a>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      Open image in new tab
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label="Close image preview"
                      onClick={() => setActiveIndex(null)}
                      className={cn(
                        ACTION_CLASS,
                        "border-border-card bg-secondary-bg size-12 rounded-lg border",
                      )}
                    >
                      <Icon icon="mdi:close" className="size-5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    Close image preview
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
            <div
              className={cn(
                "relative flex min-h-0 items-center justify-center",
                lightboxImages.length > 1 && "px-12 sm:px-16",
              )}
            >
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
                  "max-h-full max-w-full object-contain",
                  compact
                    ? "size-[min(80dvh,80vw)]"
                    : "h-auto w-[min(95vw,1400px)]",
                  previewRadius,
                )}
              />
              {lightboxImages.length > 1 && (
                <>
                  <button
                    type="button"
                    aria-label="Previous image"
                    onClick={(event) => {
                      event.stopPropagation();
                      showPrevious();
                    }}
                    className={cn(
                      ACTION_CLASS,
                      "bg-secondary-bg absolute top-1/2 left-0 -translate-y-1/2",
                    )}
                  >
                    <Icon
                      icon="material-symbols:chevron-left-rounded"
                      className="size-5"
                    />
                  </button>
                  <button
                    type="button"
                    aria-label="Next image"
                    onClick={(event) => {
                      event.stopPropagation();
                      showNext();
                    }}
                    className={cn(
                      ACTION_CLASS,
                      "bg-secondary-bg absolute top-1/2 right-0 -translate-y-1/2",
                    )}
                  >
                    <Icon
                      icon="material-symbols:chevron-right-rounded"
                      className="size-5"
                    />
                  </button>
                </>
              )}
            </div>
            <div className="flex min-w-0 flex-col items-center gap-3">
              {lightboxImages.length > 1 && (
                <div
                  aria-label="Image thumbnails"
                  role="group"
                  className="flex max-w-full gap-2 overflow-x-auto p-1"
                  onClick={(event) => event.stopPropagation()}
                >
                  {lightboxImages.map((image, index) => (
                    <button
                      key={`${image.src}-${index}`}
                      type="button"
                      aria-label={`Show image ${index + 1}: ${image.alt}`}
                      aria-pressed={activeIndex === index}
                      onClick={() => setActiveIndex(index)}
                      className={cn(
                        "focus-visible:outline-border-focus size-14 shrink-0 cursor-pointer overflow-hidden rounded-lg border-2 transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2",
                        activeIndex === index
                          ? "border-white"
                          : "border-transparent opacity-50 hover:opacity-100",
                      )}
                    >
                      <Image
                        src={image.src}
                        alt=""
                        width={56}
                        height={56}
                        unoptimized
                        loading="lazy"
                        referrerPolicy={noReferrer ? "no-referrer" : undefined}
                        className="size-full object-cover"
                      />
                    </button>
                  ))}
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
            </div>
          </div>,
          document.body,
        )}
    </>
  );
};
