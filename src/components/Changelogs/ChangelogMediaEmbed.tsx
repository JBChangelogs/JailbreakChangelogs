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
        <div className="relative my-4 aspect-video w-full max-w-2xl">
          <Image
            src={url}
            alt="Embedded image"
            fill
            className="rounded-lg object-contain"
          />
        </div>
      );
    case "video":
      return (
        <div className="my-4 w-full max-w-2xl">
          <video src={url} controls className="w-full rounded-lg" />
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
