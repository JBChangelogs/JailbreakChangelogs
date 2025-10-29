import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  ArrowRightIcon,
  ArrowTurnDownRightIcon,
} from "@heroicons/react/24/outline";
import { Inter } from "next/font/google";
import { parseMarkdown } from "@/utils/changelogs";
import { getCurrentUserPremiumType } from "@/contexts/AuthContext";
import { CommentData } from "@/utils/api";
import { UserData } from "@/types/auth";
import AdRemovalNotice from "../Ads/AdRemovalNotice";
import dynamic from "next/dynamic";
import ChangelogSummary from "./ChangelogSummary";
import { isFeatureEnabled } from "@/utils/featureFlags";

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

const DisplayAd = dynamic(() => import("../Ads/DisplayAd"), {
  loading: () => <div className="bg-secondary-bg h-48 animate-pulse rounded" />,
  ssr: false,
});

const inter = Inter({ subsets: ["latin"], display: "swap" });

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
  const [currentUserPremiumType, setCurrentUserPremiumType] = useState<number>(
    () => getCurrentUserPremiumType(),
  );

  const currentIndex = changelogList.findIndex((c) => c.id === changelogId);
  const prevChangelog =
    currentIndex < changelogList.length - 1
      ? changelogList[currentIndex + 1]
      : null;
  const nextChangelog =
    currentIndex > 0 ? changelogList[currentIndex - 1] : null;

  // Parse markdown sections
  const parsedSections = parseMarkdown(sections);

  useEffect(() => {
    // Listen for auth changes
    const handleAuthChange = () => {
      setCurrentUserPremiumType(getCurrentUserPremiumType());
    };

    window.addEventListener("authStateChanged", handleAuthChange);
    return () => {
      window.removeEventListener("authStateChanged", handleAuthChange);
    };
  }, []);

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
      <style jsx>{`
        .sidebar-ad-container-changelog {
          width: 320px;
          height: 100px;
          border-radius: 8px;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        @media (min-width: 500px) {
          .sidebar-ad-container-changelog {
            width: 336px;
            height: 280px;
          }
        }

        @media (min-width: 768px) {
          .sidebar-ad-container-changelog {
            width: 300px;
            height: 250px;
          }
        }

        @media (min-width: 1024px) {
          .sidebar-ad-container-changelog {
            width: 300px;
            height: 600px;
          }
        }
      `}</style>
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
        {/* Content Section - 8/12 columns on desktop, full width on tablet and mobile */}
        <div className="sm:col-span-12 xl:col-span-8">
          <h1
            className={`${inter.className} text-primary-text border-secondary-text mb-8 border-b pb-4 text-3xl font-bold tracking-tighter sm:text-5xl`}
          >
            {title}
          </h1>

          {/* AI Summary */}
          {isFeatureEnabled("AI_SUMMARY") && (
            <ChangelogSummary
              changelogId={changelogId}
              title={title}
              content={sections}
            />
          )}

          <div className="prose prose-invert max-w-none">
            {parsedSections.map((section, sectionIndex) => (
              <div key={sectionIndex} className="mb-8">
                {section.title && (
                  <h2
                    className={`${inter.className} text-primary-text mb-4 text-2xl font-bold tracking-tighter sm:text-3xl`}
                  >
                    {section.title}
                  </h2>
                )}
                <ul className="text-secondary-text space-y-2">
                  {section.items.map((item, itemIndex) => (
                    <li
                      key={itemIndex}
                      className={`flex items-start gap-2 ${item.isNested ? "ml-6" : ""}`}
                    >
                      {item.type === "media" ? (
                        <ChangelogMediaEmbed
                          type={item.mediaType}
                          url={item.url}
                        />
                      ) : (
                        <>
                          {item.isNested ? (
                            <ArrowTurnDownRightIcon className="text-secondary-text mt-1 h-6 w-6 flex-shrink-0 sm:h-5 sm:w-5" />
                          ) : (
                            <ArrowRightIcon className="text-secondary-text mt-1 h-6 w-6 flex-shrink-0 sm:h-5 sm:w-5" />
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
            <div>
              <div className={`relative w-full ${imageAspectRatio}`}>
                <Image
                  src={`https://assets.jailbreakchangelogs.xyz${imageUrl}`}
                  alt={title}
                  fill
                  className="rounded-lg object-contain"
                  onLoad={handleImageLoad}
                />
              </div>
            </div>
          )}

          {/* Comments Section */}
          <div>
            {currentUserPremiumType === 0 && (
              <div className="my-8 flex flex-col items-center">
                <span className="text-secondary-text mb-2 block text-center text-xs">
                  ADVERTISEMENT
                </span>
                <div className="sidebar-ad-container-changelog">
                  <DisplayAd
                    adSlot="4408799044"
                    adFormat="auto"
                    style={{ display: "block", width: "100%", height: "100%" }}
                  />
                </div>
                <AdRemovalNotice className="mt-2" />
              </div>
            )}
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
