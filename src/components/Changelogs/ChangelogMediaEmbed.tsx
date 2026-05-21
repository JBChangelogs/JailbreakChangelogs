"use client";

import Image from "next/image";
import React, { useState } from "react";
import { Icon } from "@/components/ui/IconWrapper";

interface ChangelogMediaEmbedProps {
  type: "image" | "video" | "audio";
  url: string;
}

const ChangelogMediaEmbed: React.FC<ChangelogMediaEmbedProps> = ({
  type,
  url,
}) => {
  const [lightbox, setLightbox] = useState(false);

  switch (type) {
    case "image":
      return (
        <>
          <div
            className="group relative my-4 w-full max-w-2xl cursor-zoom-in"
            onClick={() => setLightbox(true)}
          >
            <Image
              src={url}
              alt="Embedded image"
              width={800}
              height={600}
              className="w-full rounded-lg object-contain"
            />
            <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/0 opacity-0 transition-all group-hover:bg-black/20 group-hover:opacity-100">
              <Icon
                icon="mdi:magnify-plus-outline"
                className="h-8 w-8 text-white drop-shadow"
              />
            </div>
          </div>

          {lightbox && (
            <div
              className="fixed inset-0 z-[10000] flex cursor-default flex-col items-center justify-center gap-3 bg-black/90 p-4"
              onClick={() => setLightbox(false)}
            >
              <button
                className="absolute top-4 right-4 cursor-pointer rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightbox(false);
                }}
              >
                <Icon icon="mdi:close" className="h-5 w-5" />
              </button>
              <Image
                src={url}
                alt="Embedded image"
                width={0}
                height={0}
                sizes="100vw"
                style={{
                  width: "min(95vw, 1400px)",
                  height: "auto",
                  maxHeight: "80vh",
                  objectFit: "contain",
                }}
                className="rounded-lg"
                unoptimized
                onClick={(e) => e.stopPropagation()}
              />
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="w-full px-6 text-center font-mono text-xs break-all text-white/50 hover:text-white/80 hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {url}
              </a>
            </div>
          )}
        </>
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
