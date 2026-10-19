import React, { useState } from "react";
import Image from "next/image";
import { IMAGE_PLACEHOLDER } from "@/utils/ui/imagePlaceholder";
import { Icon } from "@/components/ui/IconWrapper";
import { ImageLightbox } from "@/components/ui/ImageLightbox";
import { parseMarkdown } from "@/utils/changelogs/changelogs";
import UpdateStatisticsCard from "@/components/common/UpdateStatisticsCard";
import { Changelog, CommentData } from "@/utils/api/api";
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
  changelogList: Changelog[];
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

  const currentIndex = changelogList.findIndex((c) => c.id === changelogId);
  const prevChangelog =
    currentIndex < changelogList.length - 1
      ? changelogList[currentIndex + 1]
      : null;
  const nextChangelog =
    currentIndex > 0 ? changelogList[currentIndex - 1] : null;

  const parsedSections = parseMarkdown(sections);

  const handleImageLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const img = event.currentTarget;
    const aspectRatio = img.naturalWidth / img.naturalHeight;

    if (Math.abs(aspectRatio - 1) < 0.1) {
      setImageAspectRatio("aspect-square");
    } else {
      setImageAspectRatio("aspect-video");
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
        {/* Content Section - 8/12 columns on desktop, full width on tablet and mobile */}
        <div className="sm:col-span-12 xl:col-span-8">
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
                      className={`flex items-start gap-2 ${item.isNested ? "ml-8" : ""} ${item.type === "text" && item.isLabel ? "mt-3 first:mt-0" : ""}`}
                    >
                      {item.type === "media" ? (
                        <ChangelogMediaEmbed
                          type={item.mediaType}
                          url={item.url}
                        />
                      ) : item.isLabel ? (
                        <span dangerouslySetInnerHTML={{ __html: item.text }} />
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
            <ImageLightbox
              src={`https://assets.jailbreakchangelogs.com${imageUrl}`}
              alt={title}
              showUrl
              className={`w-full ${imageAspectRatio}`}
            >
              <Image
                placeholder={IMAGE_PLACEHOLDER}
                src={`https://assets.jailbreakchangelogs.com${imageUrl}`}
                alt={title}
                fill
                className="object-contain"
                onLoad={handleImageLoad}
              />
            </ImageLightbox>
          )}

          <UpdateStatisticsCard changelogs={changelogList} />

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
