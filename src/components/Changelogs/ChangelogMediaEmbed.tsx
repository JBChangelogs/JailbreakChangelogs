"use client";

import Image from "next/image";
import React from "react";
import { ImageLightbox } from "@/components/ui/ImageLightbox";

interface ChangelogMediaEmbedProps {
  type: "image" | "video" | "audio";
  url: string;
  showUrl?: boolean;
  wrapperClassName?: string;
}

const ChangelogMediaEmbed: React.FC<ChangelogMediaEmbedProps> = ({
  type,
  url,
  showUrl = true,
  wrapperClassName,
}) => {
  switch (type) {
    case "image":
      return (
        <ImageLightbox
          src={url}
          alt="Embedded image"
          showUrl={showUrl}
          className={wrapperClassName ?? "my-4 w-full max-w-2xl"}
        >
          <Image
            src={url}
            alt="Embedded image"
            width={800}
            height={600}
            className="w-full object-contain"
          />
        </ImageLightbox>
      );
    case "video":
      return (
        <div className="my-4 w-full max-w-2xl">
          <video src={url} controls className="w-full">
            <track
              kind="captions"
              src="/captions/empty.vtt"
              srcLang="en"
              label="English"
              default
            />
          </video>
        </div>
      );
    case "audio":
      return (
        <div className="my-4 w-full max-w-2xl">
          <audio src={url} controls className="w-full">
            <track
              kind="captions"
              src="/captions/empty.vtt"
              srcLang="en"
              label="English"
              default
            />
          </audio>
        </div>
      );
    default:
      return null;
  }
};

export default ChangelogMediaEmbed;
