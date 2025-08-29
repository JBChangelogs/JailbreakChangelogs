"use client";

import { useState, useEffect, useRef } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpIcon } from "@heroicons/react/24/outline";
import toast from 'react-hot-toast';
import { Changelog } from "@/utils/api";
import Image from 'next/image';

interface ChangelogsClientProps {
  changelogListPromise: Promise<Changelog[]>;
}

export default function ChangelogsClient({ changelogListPromise }: ChangelogsClientProps) {
  const router = useRouter();
  
  // Use the use hook to resolve promises
  const changelogList = use(changelogListPromise);
  
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [sortedChangelogs, setSortedChangelogs] = useState<Changelog[]>([]);
  const backToTopRef = useRef<HTMLDivElement>(null);

  // Sort changelogs by newest first
  useEffect(() => {
    const sorted = [...changelogList].sort((a, b) => b.id - a.id);
    setSortedChangelogs(sorted);
  }, [changelogList]);

  // Handle scroll to show/hide back to top button
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLatestChangelog = () => {
    // Find the latest changelog from the already fetched data
    if (sortedChangelogs.length > 0) {
      const latestChangelog = sortedChangelogs[0]; // Already sorted by newest first
      router.push(`/changelogs/${latestChangelog.id}`);
    } else {
      toast.error('No changelogs available');
    }
  };

  const formatDate = (title: string) => {
    // Extract date from title (assuming format like "Changelog - January 1, 2024")
    const dateMatch = title.match(/(\w+ \d{1,2}, \d{4})/);
    if (dateMatch) {
      return dateMatch[1];
    }
    return title;
  };

  return (
    <div className="py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-4">Changelogs</h1>
        <p className="text-gray-300 mb-6">
          Stay updated with the latest changes and improvements to Jailbreak Changelogs.
        </p>
        
        <button
          onClick={handleLatestChangelog}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
        >
          View Latest Changelog
        </button>
      </div>

      <div className="grid gap-6">
        {sortedChangelogs.map((changelog) => (
          <div
            key={changelog.id}
            onClick={() => router.push(`/changelogs/${changelog.id}`)}
            className="bg-[#212A31] rounded-lg p-6 cursor-pointer hover:bg-[#2A343C] transition-colors duration-200 border border-[#37424D]"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-white mb-2">
                  {changelog.title}
                </h2>
                <p className="text-gray-400 text-sm mb-3">
                  {formatDate(changelog.title)}
                </p>
                <div className="text-gray-300 line-clamp-3">
                  {changelog.sections.length > 200 
                    ? `${changelog.sections.substring(0, 200)}...` 
                    : changelog.sections
                  }
                </div>
              </div>
              {changelog.image_url && (
                <div className="ml-4 flex-shrink-0">
                  <Image
                    src={`https://assets.jailbreakchangelogs.xyz${changelog.image_url}`}
                    alt="Changelog"
                    width={64}
                    height={64}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Back to top button */}
      {showBackToTop && (
        <div ref={backToTopRef} className="fixed bottom-8 right-8 z-50">
          <button
            onClick={scrollToTop}
            className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
            aria-label="Back to top"
          >
            <ArrowUpIcon className="w-6 h-6" />
          </button>
        </div>
      )}
    </div>
  );
}
