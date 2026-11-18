"use client";

import NitroInlineVideoPlayer from "@/components/Ads/NitroInlineVideoPlayer";
import RelatedInventoryPages from "@/components/Inventory/RelatedInventoryPages";

const OGFinderDescription = ({ videoSlotId }: { videoSlotId?: string }) => {
  return (
    <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center">
      <div className="flex-1">
        <div className="mb-2">
          <div className="flex items-center gap-3">
            <h2 className="page-heading">OG Finder</h2>
          </div>
        </div>
        <p className="text-secondary-text mb-3">
          Enter a username or Roblox ID to find their original Jailbreak items
          and see who owns them now.
        </p>

        <RelatedInventoryPages current="og" />
      </div>

      {videoSlotId && (
        <NitroInlineVideoPlayer
          slotId={videoSlotId}
          className="w-full self-center lg:w-96 lg:shrink-0"
        />
      )}
    </div>
  );
};

export default OGFinderDescription;
