"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi,
} from "@/components/ui/carousel";
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
  const [api, setApi] = useState<CarouselApi>();
  const [selected, setSelected] = useState(0);
  useEffect(() => {
    if (!api) return;
    const update = () => setSelected(api.selectedScrollSnap());
    update();
    api.on("select", update);
    api.on("reInit", update);
    return () => {
      api.off("select", update);
      api.off("reInit", update);
    };
  }, [api]);
  const images = previews.map((preview, index) => ({
    src: preview.url,
    alt: `${label}: ${preview.kind} screenshot ${index + 1}`,
  }));
  const slides = previews.map((preview, index) => (
    <div
      key={preview.id}
      className={
        onDelete
          ? preview.kind === "desktop"
            ? "relative w-48 max-w-full"
            : "relative w-16"
          : "relative"
      }
    >
      <ImageLightbox
        images={images}
        initialIndex={index}
        alt={images[index].alt}
        className={`border-border-card bg-primary-bg w-full border ${onDelete ? "h-28" : "aspect-video"}`}
      >
        <Image
          src={preview.url}
          alt={images[index].alt}
          fill
          unoptimized
          sizes={
            onDelete
              ? preview.kind === "desktop"
                ? "192px"
                : "64px"
              : preview.kind === "desktop"
                ? "(max-width: 768px) 100vw, 480px"
                : "160px"
          }
          className={
            onDelete || preview.kind === "mobile"
              ? "object-contain"
              : "object-cover"
          }
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
  ));
  return onDelete ? (
    <div className="flex flex-wrap items-start gap-3">{slides}</div>
  ) : (
    <Carousel
      setApi={setApi}
      opts={{ loop: previews.length > 1 }}
      aria-label={`${label} screenshots`}
      className="min-w-0"
    >
      <CarouselContent className="ml-0">
        {slides.map((slide, index) => (
          <CarouselItem key={previews[index].id} className="pl-0">
            {slide}
          </CarouselItem>
        ))}
      </CarouselContent>
      {previews.length > 1 && (
        <>
          <CarouselPrevious
            className="left-2 size-8!"
            aria-label="Previous screenshot"
          />
          <CarouselNext
            className="right-2 size-8!"
            aria-label="Next screenshot"
          />
          <span
            className="bg-secondary-bg/90 text-primary-text pointer-events-none absolute right-2 bottom-2 rounded-md px-2 py-1 text-xs"
            aria-live="polite"
          >
            {selected + 1} / {previews.length}
          </span>
        </>
      )}
    </Carousel>
  );
}
