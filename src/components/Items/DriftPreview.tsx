"use client";

import { useRef } from "react";
import Image from "next/image";
import { IMAGE_PLACEHOLDER } from "@/utils/ui/imagePlaceholder";
import {
  getItemImagePath,
  getDriftVideoPath,
  handleImageError,
} from "@/utils/ui/images";
import { createLogger } from "@/services/logger";

const log = createLogger("UI");

export default function DriftPreview({ name }: { name: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  return (
    <div
      className="group/drift relative h-full w-full"
      onMouseEnter={() => {
        videoRef.current?.play()?.catch((error) => {
          log.error("Error playing drift video:", error);
        });
      }}
      onMouseLeave={() => {
        if (videoRef.current) {
          videoRef.current.pause();
          videoRef.current.currentTime = 0;
        }
      }}
    >
      <Image
        placeholder={IMAGE_PLACEHOLDER}
        src={getItemImagePath("Drift", name, true)}
        alt={name}
        fill
        className="object-contain"
        onError={handleImageError}
      />
      <video
        ref={videoRef}
        src={getDriftVideoPath(name, true)}
        loop
        muted
        playsInline
        preload="none"
        className="absolute inset-0 h-full w-full object-contain opacity-0 transition-opacity duration-300 group-hover/drift:opacity-100"
      />
    </div>
  );
}
