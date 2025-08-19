import Image from "next/image";
import React from "react";

interface ChangelogMediaEmbedProps {
  type: 'image' | 'video' | 'audio';
  url: string;
}

const ChangelogMediaEmbed: React.FC<ChangelogMediaEmbedProps> = ({ type, url }) => {
  switch (type) {
    case 'image':
      return (
        <div className="relative w-full max-w-2xl aspect-video my-4">
          <Image
            src={url}
            alt="Embedded image"
            fill
            className="object-contain rounded-lg"
          />
        </div>
      );
    case 'video':
      return (
        <div className="w-full max-w-2xl my-4">
          <video
            src={url}
            controls
            className="w-full rounded-lg"
          />
        </div>
      );
    case 'audio':
      return (
        <div className="w-full max-w-2xl my-4">
          <audio
            src={url}
            controls
            className="w-full"
          />
        </div>
      );
    default:
      return null;
  }
};

export default ChangelogMediaEmbed; 