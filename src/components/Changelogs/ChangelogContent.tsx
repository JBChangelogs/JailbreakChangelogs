import React, { useState, useEffect } from 'react';
import Image from "next/image";
import { ArrowRightIcon, ArrowTurnDownRightIcon } from "@heroicons/react/24/outline";
import { Inter } from "next/font/google";
import { parseMarkdown } from '@/utils/changelogs';
import ChangelogMediaEmbed from './ChangelogMediaEmbed';
import ChangelogComments from '../PageComments/ChangelogComments';
import ChangelogQuickNav from './ChangelogQuickNav';
import DisplayAd from '../Ads/DisplayAd';
import { getCurrentUserPremiumType } from '@/hooks/useAuth';

const inter = Inter({ subsets: ["latin"], display: "swap" });

interface ChangelogContentProps {
  title: string;
  sections: string;
  imageUrl: string;
  changelogId: number;
  onChangelogSelect: (id: string) => void;
  changelogList: Array<{ id: number; title: string }>;
}

const ChangelogContent: React.FC<ChangelogContentProps> = ({
  title,
  sections,
  imageUrl,
  changelogId,
  onChangelogSelect,
  changelogList,
}) => {
  const [imageAspectRatio, setImageAspectRatio] = useState<string>('aspect-[4/3]');
  const [currentUserPremiumType, setCurrentUserPremiumType] = useState<number>(0);
  const [premiumStatusLoaded, setPremiumStatusLoaded] = useState(false);
  
  const currentIndex = changelogList.findIndex(c => c.id === changelogId);
  const prevChangelog = currentIndex < changelogList.length - 1 ? changelogList[currentIndex + 1] : null;
  const nextChangelog = currentIndex > 0 ? changelogList[currentIndex - 1] : null;

  useEffect(() => {
    // Get current user's premium type
    setCurrentUserPremiumType(getCurrentUserPremiumType());
    setPremiumStatusLoaded(true);

    // Listen for auth changes
    const handleAuthChange = () => {
      setCurrentUserPremiumType(getCurrentUserPremiumType());
    };

    window.addEventListener('authStateChanged', handleAuthChange);
    return () => {
      window.removeEventListener('authStateChanged', handleAuthChange);
    };
  }, []);

  const handleImageLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const img = event.currentTarget;
    const aspectRatio = img.naturalWidth / img.naturalHeight;
    
    // Determine the appropriate aspect ratio class based on image dimensions
    if (Math.abs(aspectRatio - 1) < 0.1) {
      // Square image (ratio close to 1:1)
      setImageAspectRatio('aspect-square');
    } else {
      // Everything else uses 16:9
      setImageAspectRatio('aspect-video');
    }
  };

  return (
    <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
      {/* Content Section - 8/12 columns on desktop, full width on tablet and mobile */}
      <div className="sm:col-span-12 xl:col-span-8">
        <h1 className={`${inter.className} mb-8 font-bold text-3xl sm:text-5xl text-muted border-b border-[#748D92] pb-4 tracking-tighter`}>
          {title}
        </h1>
        <div className="prose prose-invert max-w-none">
          {parseMarkdown(sections).map((section, sectionIndex) => (
            <div key={sectionIndex} className="mb-8">
              {section.title && (
                <h2 className={`${inter.className} font-bold text-[#748D92] text-2xl sm:text-3xl mb-4 tracking-tighter`}>
                  {section.title}
                </h2>
              )}
              <ul className="space-y-2 text-muted">
                {section.items.map((item, itemIndex) => (
                  <li key={itemIndex} className={`flex items-start gap-2 ${item.isNested ? 'ml-6' : ''}`}>
                    {item.type === 'media' ? (
                      <ChangelogMediaEmbed type={item.mediaType} url={item.url} />
                    ) : (
                      <>
                        {item.isNested ? (
                          <ArrowTurnDownRightIcon className="h-6 w-6 sm:h-5 sm:w-5 text-[#FFFFFF] mt-1 flex-shrink-0" />
                        ) : (
                          <ArrowRightIcon className="h-6 w-6 sm:h-5 sm:w-5 text-[#FFFFFF] mt-1 flex-shrink-0" />
                        )}
                        <span dangerouslySetInnerHTML={{ __html: item.text }} />
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
      <div className="sm:col-span-12 xl:col-span-4 space-y-8">
        {imageUrl && (
          <div>
            <div className={`relative w-full ${imageAspectRatio}`}>
              <Image
                src={`https://assets.jailbreakchangelogs.xyz${imageUrl}`}
                alt={title}
                fill
                className="object-contain rounded-lg"
                unoptimized
                onLoad={handleImageLoad}
              />
            </div>
          </div>
        )}

        {/* Comments Section */}
        <div>
        {premiumStatusLoaded && currentUserPremiumType === 0 && (
            <div className="my-8 flex justify-center">
              <div className="w-full max-w-[700px] bg-[#1a2127] rounded-lg overflow-hidden border border-[#2E3944] shadow transition-all duration-300 relative" style={{ minHeight: '250px' }}>
                <span className="absolute top-2 left-2 text-xs text-muted bg-[#212A31] px-2 py-0.5 rounded z-10">
                  Advertisement
                </span>
                <DisplayAd
                  adSlot="4408799044"
                  adFormat="auto"
                  style={{ display: "block", width: "100%", height: "100%" }}
                />
              </div>
            </div>
          )}
          <ChangelogComments 
            changelogId={changelogId} 
            changelogTitle={title}
            type="changelog"
          />
        </div>
      </div>
    </div>
  );
};

export default ChangelogContent; 