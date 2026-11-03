"use client";

import Image from "next/image";
import { ImageLightbox } from "@/components/ui/ImageLightbox";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/IconWrapper";
import type { ThemePreviewImage } from "@/utils/api/userThemes";

export default function ThemePreviewImages({
  previews,
  label,
  onDelete,
  disabled = false,
}: {
  previews: ThemePreviewImage[];
  label: string;
  onDelete?: (id: string) => void;
  disabled?: boolean;
}) {
  const images = previews.map((preview, index) => ({
    src: preview.url,
    alt: `${label}: ${preview.kind} screenshot ${index + 1}`,
  }));
  return (
    <div className="grid grid-cols-2 items-start gap-3">
      {previews.map((preview, index) => (
        <div
          key={preview.id}
          className={
            preview.kind === "desktop"
              ? "relative col-span-2"
              : "relative mx-auto w-full max-w-40"
          }
        >
          <ImageLightbox
            images={images}
            initialIndex={index}
            alt={images[index].alt}
            className={`border-border-card bg-primary-bg w-full border ${preview.kind === "desktop" ? "aspect-video" : "aspect-[9/19]"}`}
          >
            <Image
              src={preview.url}
              alt={images[index].alt}
              fill
              unoptimized
              sizes={
                preview.kind === "desktop"
                  ? "(max-width: 768px) 100vw, 480px"
                  : "160px"
              }
              className="object-contain"
            />
          </ImageLightbox>
          {onDelete && (
            <Button
              type="button"
              size="icon"
              variant="destructive"
              className="absolute top-2 right-2 size-8!"
              disabled={disabled}
              aria-label={`Delete screenshot ${index + 1}`}
              onClick={() => onDelete(preview.id)}
            >
              <Icon icon="heroicons:trash" aria-hidden="true" />
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}
