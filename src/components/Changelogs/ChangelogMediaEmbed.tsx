import Image from "next/image";
import React from "react";

interface ChangelogMediaEmbedProps {
  type: "image" | "video" | "audio";
  url: string;
}

const ChangelogMediaEmbed: React.FC<ChangelogMediaEmbedProps> = ({
  type,
  url,
}) => {
  switch (type) {
    case "image":
      return (
        <div className="my-4 w-full max-w-2xl">
          <Image
            src={url}
            alt="Embedded image"
            width={800}
            height={600}
            className="w-full object-contain"
          />
        </div>
      );
    case "video":
      return (
        <div className="my-4 w-full max-w-2xl">
          <video
            src={url}
            controls
            className="w-full"
            onError={(e) => {
              console.log("Video error:", e);
            }}
            onAbort={(e) => {
              console.log("Video aborted by browser power saving:", e);
            }}
            onPause={(e) => {
              console.log("Video paused:", e);
            }}
            onPlay={(e) => {
              console.log("Video play attempted:", e);
            }}
          />
        </div>
      );
    case "audio":
      return (
        <div className="my-4 w-full max-w-2xl">
          <audio src={url} controls className="w-full" />
        </div>
      );
    default:
      return null;
  }
};

export default ChangelogMediaEmbed;
