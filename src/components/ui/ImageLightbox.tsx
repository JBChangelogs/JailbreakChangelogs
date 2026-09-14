"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";

import { Icon } from "@/components/ui/IconWrapper";
import { cn } from "@/lib/utils";

interface ImageLightboxProps {
  src: string;
  alt: string;
  children: ReactNode;
  className?: string;
  previewRadius?: string;
  compact?: boolean;
}

export const ImageLightbox = ({
  src,
  alt,
  children,
  className,
  previewRadius = "rounded-lg",
  compact = false,
}: ImageLightboxProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        aria-label={`Preview ${alt}`}
        onClick={() => setIsOpen(true)}
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

      {mounted &&
        isOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/90 p-4"
            onClick={() => setIsOpen(false)}
          >
            <button
              type="button"
              aria-label="Close image preview"
              onClick={(event) => {
                event.stopPropagation();
                setIsOpen(false);
              }}
              className="absolute top-4 right-4 cursor-pointer rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
            >
              <Icon icon="mdi:close" className="size-5" />
            </button>
            <Image
              src={src}
              alt={alt}
              width={0}
              height={0}
              sizes="100vw"
              unoptimized
              onClick={(event) => event.stopPropagation()}
              className={cn(
                "max-h-[80vh] object-contain",
                compact
                  ? "size-[min(80vh,80vw)]"
                  : "h-auto w-[min(95vw,1400px)]",
                previewRadius,
              )}
            />
          </div>,
          document.body,
        )}
    </>
  );
};
