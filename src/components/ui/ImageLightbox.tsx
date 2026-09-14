"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { Slot } from "@radix-ui/react-slot";

import { Icon } from "@/components/ui/IconWrapper";
import { cn } from "@/lib/utils";

export interface LightboxImage {
  src: string;
  alt: string;
}

interface ImageLightboxProps {
  src?: string;
  alt?: string;
  images?: LightboxImage[];
  children: ReactNode;
  className?: string;
  previewRadius?: string;
  compact?: boolean;
  showUrl?: boolean;
  triggerAsChild?: boolean;
  stopPropagation?: boolean;
  noReferrer?: boolean;
}

export const ImageLightbox = ({
  src,
  alt,
  images,
  children,
  className,
  previewRadius = "rounded-lg",
  compact = false,
  showUrl = false,
  triggerAsChild = false,
  stopPropagation = false,
  noReferrer = false,
}: ImageLightboxProps) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
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
    if (lightboxImages.length) setActiveIndex(0);
  };

  const trigger = triggerAsChild ? (
    <Slot onClick={openLightbox}>{children}</Slot>
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
            className="fixed inset-0 z-[10000] flex flex-col items-center justify-center gap-3 bg-black/90 p-4"
            onClick={(event) => {
              if (stopPropagation) event.stopPropagation();
              setActiveIndex(null);
            }}
          >
            <button
              type="button"
              aria-label="Close image preview"
              onClick={(event) => {
                event.stopPropagation();
                setActiveIndex(null);
              }}
              className="absolute top-4 right-4 cursor-pointer rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
            >
              <Icon icon="mdi:close" className="size-5" />
            </button>
            <Image
              src={activeImage.src}
              alt={activeImage.alt}
              width={0}
              height={0}
              sizes="100vw"
              unoptimized
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
