"use client";

import { useState } from "react";
import { ImageLightbox } from "@/components/ui/ImageLightbox";
import { getMessageImages } from "@/utils/messages/images";

function MessageImage({
  url,
  index,
  images,
}: {
  url: string;
  index: number;
  images: { src: string; alt: string }[];
}) {
  const [failed, setFailed] = useState(false);
  if (failed)
    return (
      <div className="border-border-card text-secondary-text flex h-24 w-36 items-center justify-center rounded-lg border text-sm">
        Image expired
      </div>
    );
  return (
    <ImageLightbox
      images={images}
      initialIndex={index}
      alt={`Attachment ${index + 1}`}
      stopPropagation
    >
      {/* oxlint-disable-next-line next/no-img-element */}
      <img
        src={url}
        alt={`Attachment ${index + 1}`}
        loading="lazy"
        onError={() => setFailed(true)}
        className={`border-border-card rounded-lg border ${
          images.length === 1
            ? "max-h-80 max-w-full object-contain"
            : "aspect-square w-full object-cover"
        }`}
      />
    </ImageLightbox>
  );
}

export function MessageImages({
  metadata,
}: {
  metadata: Record<string, unknown> | null | undefined;
}) {
  const images = getMessageImages(metadata);
  if (!images.length) return null;
  const gallery = images.map((src, index) => ({
    src,
    alt: `Attachment ${index + 1}`,
  }));
  return (
    <div
      className={`mt-1 grid max-w-md gap-1 ${
        images.length === 1 ? "grid-cols-1 justify-items-start" : "grid-cols-2"
      }`}
    >
      {images.map((url, index) => (
        <MessageImage key={url} url={url} index={index} images={gallery} />
      ))}
    </div>
  );
}
