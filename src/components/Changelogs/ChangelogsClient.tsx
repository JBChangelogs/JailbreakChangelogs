"use client";

import { useState, useEffect, useRef } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { Changelog } from "@/utils/api";
import Image from "next/image";

interface ChangelogsClientProps {
  changelogListPromise: Promise<Changelog[]>;
}

export default function ChangelogsClient({
  changelogListPromise,
}: ChangelogsClientProps) {
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

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLatestChangelog = () => {
    // Find the latest changelog from the already fetched data
    if (sortedChangelogs.length > 0) {
      const latestChangelog = sortedChangelogs[0]; // Already sorted by newest first
      router.push(`/changelogs/${latestChangelog.id}`);
    } else {
      toast.error("No changelogs available");
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
        <h1 className="mb-4 text-4xl font-bold text-white">Changelogs</h1>
        <p className="mb-6 text-gray-300">
          Stay updated with the latest changes, fixes and improvements to Roblox
          Jailbreak.
        </p>

        <button
          onClick={handleLatestChangelog}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors duration-200 hover:bg-blue-700"
        >
          View Latest Changelog
        </button>
      </div>

      <div className="grid gap-6">
        {sortedChangelogs.map((changelog) => (
          <div
            key={changelog.id}
            onClick={() => router.push(`/changelogs/${changelog.id}`)}
            className="cursor-pointer rounded-lg border border-[#37424D] bg-[#212A31] p-6 transition-colors duration-200 hover:bg-[#2A343C]"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="mb-2 text-xl font-semibold text-white">
                  {changelog.title}
                </h2>
                <p className="mb-3 text-sm text-gray-400">
                  {formatDate(changelog.title)}
                </p>
                <div className="line-clamp-3 text-gray-300">
                  {changelog.sections.length > 200
                    ? `${changelog.sections.substring(0, 200)}...`
                    : changelog.sections}
                </div>
              </div>
              {changelog.image_url && (
                <div className="ml-4 flex-shrink-0">
                  <Image
                    src={`https://assets.jailbreakchangelogs.xyz${changelog.image_url}`}
                    alt="Changelog"
                    width={64}
                    height={64}
                    className="h-16 w-16 rounded-lg object-cover"
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Back to top button */}
      {showBackToTop && (
        <div ref={backToTopRef} className="fixed right-8 bottom-8 z-50">
          <button
            onClick={scrollToTop}
            className="rounded-full bg-blue-600 p-3 text-white shadow-lg transition-all duration-200 hover:scale-110 hover:bg-blue-700"
            aria-label="Back to top"
          >
            <ArrowUpIcon className="h-6 w-6" />
          </button>
        </div>
      )}
    </div>
  );
}
