import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { Icon } from "@/components/ui/IconWrapper";
import {
  parseMarkdown,
  extractContentInfo,
  getBadgeColor,
} from "@/utils/changelogs/changelogs";
import { CommentData } from "@/utils/api/api";
import { UserData } from "@/types/auth";
import dynamic from "next/dynamic";
import ChangelogSummary from "./ChangelogSummary";
import { isFeatureEnabled } from "@/utils/api/featureFlags";

// Dynamic imports for heavy components
const ChangelogMediaEmbed = dynamic(() => import("./ChangelogMediaEmbed"), {
  loading: () => <div className="bg-secondary-bg h-32 animate-pulse rounded" />,
  ssr: true,
});

const ChangelogComments = dynamic(
  () => import("../PageComments/ChangelogComments"),
  {
    loading: () => (
      <div className="bg-secondary-bg h-64 animate-pulse rounded" />
    ),
    ssr: true,
  },
);

const ChangelogQuickNav = dynamic(() => import("./ChangelogQuickNav"), {
  loading: () => <div className="bg-secondary-bg h-16 animate-pulse rounded" />,
  ssr: true,
});

interface ChangelogContentProps {
  title: string;
  sections: string;
  imageUrl: string;
  changelogId: number;
  onChangelogSelect: (id: string) => void;
  changelogList: Array<{ id: number; title: string }>;
  initialComments?: CommentData[];
  initialUserMap?: Record<string, UserData>;
}

const ChangelogContent: React.FC<ChangelogContentProps> = ({
  title,
  sections,
  imageUrl,
  changelogId,
  onChangelogSelect,
  changelogList,
  initialComments = [],
  initialUserMap = {},
}) => {
  const [imageAspectRatio, setImageAspectRatio] =
    useState<string>("aspect-[4/3]");
  const [thumbnailLightbox, setThumbnailLightbox] = useState(false);

  useEffect(() => {
    if (!thumbnailLightbox) return;
    const onKey = (e: KeyboardEvent) =>
      e.key === "Escape" && setThumbnailLightbox(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [thumbnailLightbox]);

  const currentIndex = changelogList.findIndex((c) => c.id === changelogId);
  const prevChangelog =
    currentIndex < changelogList.length - 1
      ? changelogList[currentIndex + 1]
      : null;
  const nextChangelog =
    currentIndex > 0 ? changelogList[currentIndex - 1] : null;

  // Parse markdown sections
  const parsedSections = parseMarkdown(sections);

  // Extract content info for badges
  const contentInfo = extractContentInfo(sections);

  const handleImageLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const img = event.currentTarget;
    const aspectRatio = img.naturalWidth / img.naturalHeight;

    // Determine the appropriate aspect ratio class based on image dimensions
    if (Math.abs(aspectRatio - 1) < 0.1) {
      // Square image (ratio close to 1:1)
      setImageAspectRatio("aspect-square");
    } else {
      // Everything else uses 16:9
      setImageAspectRatio("aspect-video");
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
        {/* Content Section - 8/12 columns on desktop, full width on tablet and mobile */}
        <div className="sm:col-span-12 xl:col-span-8">
          <div className="border-secondary-text mb-8 border-b pb-4">
            <h1 className="text-primary-text mb-3 text-3xl font-bold tracking-tight sm:text-5xl">
              {title}
            </h1>
            {(contentInfo.mediaTypes.length > 0 ||
              contentInfo.mentions.length > 0) && (
              <div className="flex flex-wrap gap-2">
                {contentInfo.mediaTypeCounts.video > 0 && (
                  <span
                    className={`inline-flex h-6 items-center rounded-lg px-2.5 text-xs leading-none font-medium backdrop-blur-xl ${getBadgeColor("video")} text-white`}
                  >
                    {contentInfo.mediaTypeCounts.video}{" "}
                    {contentInfo.mediaTypeCounts.video === 1
                      ? "Video"
                      : "Videos"}
                  </span>
                )}
                {contentInfo.mediaTypeCounts.audio > 0 && (
                  <span
                    className={`inline-flex h-6 items-center rounded-lg px-2.5 text-xs leading-none font-medium backdrop-blur-xl ${getBadgeColor("audio")} text-white`}
                  >
                    {contentInfo.mediaTypeCounts.audio}{" "}
                    {contentInfo.mediaTypeCounts.audio === 1
                      ? "Audio"
                      : "Audios"}
                  </span>
                )}
                {contentInfo.mediaTypeCounts.image > 0 && (
                  <span
                    className={`inline-flex h-6 items-center rounded-lg px-2.5 text-xs leading-none font-medium backdrop-blur-xl ${getBadgeColor("image")} text-white`}
                  >
                    {contentInfo.mediaTypeCounts.image}{" "}
                    {contentInfo.mediaTypeCounts.image === 1
                      ? "Image"
                      : "Images"}
                  </span>
                )}
                {contentInfo.mentionCount > 0 && (
                  <span
                    className={`inline-flex h-6 items-center rounded-lg px-2.5 text-xs leading-none font-medium backdrop-blur-xl ${getBadgeColor("mentions")} text-white`}
                  >
                    {contentInfo.mentionCount}{" "}
                    {contentInfo.mentionCount === 1 ? "Mention" : "Mentions"}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* AI Summary */}
          {isFeatureEnabled("AI_SUMMARY") && (
            <ChangelogSummary changelogId={changelogId} content={sections} />
          )}

          <div className="prose prose-invert max-w-none">
            {parsedSections.map((section, sectionIndex) => (
              <div key={sectionIndex} className="mb-8">
                {section.title && (
                  <h2 className="text-primary-text mb-4 text-2xl font-bold tracking-tight sm:text-3xl">
                    {section.title}
                  </h2>
                )}
                <ul className="text-secondary-text space-y-2">
                  {section.items.map((item, itemIndex) => (
                    <li
                      key={itemIndex}
                      className={`flex items-start gap-2 ${item.isNested ? "ml-8" : ""}`}
                    >
                      {item.type === "media" ? (
                        <ChangelogMediaEmbed
                          type={item.mediaType}
                          url={item.url}
                        />
                      ) : (
                        <>
                          {item.isNested ? (
                            <Icon
                              icon="heroicons:arrow-turn-down-right"
                              className="text-secondary-text mt-1 h-6 w-6 shrink-0 sm:h-5 sm:w-5"
                            />
                          ) : (
                            <Icon
                              icon="heroicons-outline:arrow-right"
                              className="text-secondary-text mt-1 h-6 w-6 shrink-0 sm:h-5 sm:w-5"
                            />
                          )}
                          <span
                            dangerouslySetInnerHTML={{ __html: item.text }}
                          />
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Navigation Buttons */}
          <ChangelogQuickNav
            prevChangelog={prevChangelog}
            nextChangelog={nextChangelog}
            onChangelogSelect={onChangelogSelect}
          />
        </div>

        {/* Image Section - 4/12 columns on desktop, full width on tablet and mobile */}
        <div className="space-y-8 sm:col-span-12 xl:col-span-4">
          {imageUrl && (
            <>
              <div>
                <div
                  className={`group relative w-full cursor-zoom-in ${imageAspectRatio}`}
                  onClick={() => setThumbnailLightbox(true)}
                >
                  <Image
                    src={`https://assets.jailbreakchangelogs.com${imageUrl}`}
                    alt={title}
                    fill
                    className="rounded-lg object-contain"
                    onLoad={handleImageLoad}
                  />
                  <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/0 opacity-0 transition-all group-hover:bg-black/20 group-hover:opacity-100">
                    <Icon
                      icon="mdi:magnify-plus-outline"
                      className="h-8 w-8 text-white drop-shadow"
                    />
                  </div>
                </div>
              </div>

              {thumbnailLightbox &&
                createPortal(
                  <div
                    className="fixed inset-0 z-[10000] flex cursor-default flex-col items-center justify-center gap-3 bg-black/90 p-4"
                    onClick={() => setThumbnailLightbox(false)}
                  >
                    <button
                      className="absolute top-4 right-4 cursor-pointer rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
                      onClick={(e) => {
                        e.stopPropagation();
                        setThumbnailLightbox(false);
                      }}
                    >
                      <Icon icon="mdi:close" className="h-5 w-5" />
                    </button>
                    <Image
                      src={`https://assets.jailbreakchangelogs.com${imageUrl}`}
                      alt={title}
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
                    />
                    <a
                      href={`https://assets.jailbreakchangelogs.com${imageUrl}`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full px-6 text-center font-mono text-xs break-all text-white/50 hover:text-white/80 hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {`https://assets.jailbreakchangelogs.com${imageUrl}`}
                    </a>
                  </div>,
                  document.body,
                )}
            </>
          )}

          {/* Comments Section */}
          <div>
            <ChangelogComments
              changelogId={changelogId}
              changelogTitle={title}
              type="changelog"
              initialComments={initialComments}
              initialUserMap={initialUserMap}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default ChangelogContent;
