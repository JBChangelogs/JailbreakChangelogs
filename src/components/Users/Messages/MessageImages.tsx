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
        className="border-border-card max-h-48 max-w-full rounded-lg border object-contain"
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
    <div className="mt-1 grid max-w-md grid-cols-2 gap-2">
      {images.map((url, index) => (
        <MessageImage key={url} url={url} index={index} images={gallery} />
      ))}
    </div>
  );
}
