import React, { useState, useEffect } from 'react';
import Image from "next/image";
import { ArrowRightIcon, ArrowTurnDownRightIcon } from "@heroicons/react/24/outline";
import localFont from "next/font/local";
import { parseMarkdown } from '@/utils/changelogs';
import ChangelogMediaEmbed from './ChangelogMediaEmbed';
import ChangelogComments from '../PageComments/ChangelogComments';
import ChangelogQuickNav from './ChangelogQuickNav';
import { fetchChangelogList } from '@/utils/api';

const luckiestGuy = localFont({ 
  src: '../../../public/fonts/LuckiestGuy.ttf',
});

interface ChangelogContentProps {
  title: string;
  sections: string;
  imageUrl: string;
  changelogId: number;
  onChangelogSelect: (id: string) => void;
}

const ChangelogContent: React.FC<ChangelogContentProps> = ({
  title,
  sections,
  imageUrl,
  changelogId,
  onChangelogSelect,
}) => {
  const [changelogList, setChangelogList] = useState<Array<{ id: number; title: string }>>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);

  useEffect(() => {
    const loadChangelogs = async () => {
      try {
        const changelogs = await fetchChangelogList();
        setChangelogList(changelogs);
        const index = changelogs.findIndex(c => c.id === changelogId);
        setCurrentIndex(index);
      } catch (error) {
        console.error('Error loading changelogs:', error);
      }
    };
    loadChangelogs();
  }, [changelogId]);

  const prevChangelog = currentIndex > 0 ? changelogList[currentIndex - 1] : null;
  const nextChangelog = currentIndex < changelogList.length - 1 ? changelogList[currentIndex + 1] : null;

  return (
    <div className="grid grid-cols-1 gap-8 sm:grid-cols-12">
      {/* Content Section - 8/12 columns on desktop, full width on tablet and mobile */}
      <div className="sm:col-span-12 lg:col-span-8">
        <h1 className={`${luckiestGuy.className} mb-8 text-3xl sm:text-5xl text-muted border-b border-[#748D92] pb-4`}>
          {title}
        </h1>
        <div className="prose prose-invert max-w-none">
          {parseMarkdown(sections).map((section, sectionIndex) => (
            <div key={sectionIndex} className="mb-8">
              {section.title && (
                <h2 className={`${luckiestGuy.className} text-[#748D92] text-2xl sm:text-3xl mb-4`}>
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
      <div className="sm:col-span-12 lg:col-span-4 space-y-8">
        {imageUrl && (
          <div>
            <div className="relative w-full aspect-video">
              <Image
                src={`https://assets.jailbreakchangelogs.xyz${imageUrl}`}
                alt={title}
                fill
                className="object-contain rounded-lg"
                unoptimized
              />
            </div>
          </div>
        )}

        {/* Comments Section */}
        <div>
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