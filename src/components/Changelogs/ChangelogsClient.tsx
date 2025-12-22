"use client";

import { useState, useEffect, useRef } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/IconWrapper";
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
  const backToTopRef = useRef<HTMLDivElement>(null);

  // Sort changelogs by newest first
  const sortedChangelogs = [...changelogList].sort((a, b) => b.id - a.id);

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
        <h1 className="text-primary-text mb-4 text-4xl font-bold">
          Changelogs
        </h1>
        <p className="text-secondary-text mb-6">
          Stay updated with the latest changes, fixes and improvements to Roblox
          Jailbreak.
        </p>

        <button
          onClick={handleLatestChangelog}
          className="bg-button-info text-primary-text hover:bg-button-info-hover flex items-center gap-2 rounded-lg px-6 py-3 font-medium transition-colors duration-200"
        >
          View Latest Changelog
        </button>
      </div>

      <div className="grid gap-6">
        {sortedChangelogs.map((changelog) => (
          <div
            key={changelog.id}
            onClick={() => router.push(`/changelogs/${changelog.id}`)}
            className="border-border-primary bg-secondary-bg hover:bg-primary-bg cursor-pointer rounded-lg border p-6 transition-colors duration-200"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-primary-text mb-2 text-xl font-semibold">
                  {changelog.title}
                </h2>
                <p className="text-secondary-text mb-3 text-sm">
                  {formatDate(changelog.title)}
                </p>
                <div className="text-secondary-text line-clamp-3">
                  {changelog.sections.length > 200
                    ? `${changelog.sections.substring(0, 200)}...`
                    : changelog.sections}
                </div>
              </div>
              {changelog.image_url && (
                <div className="ml-4 shrink-0">
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
            className="bg-button-info text-primary-text hover:bg-button-info-hover rounded-full p-3 shadow-lg transition-all duration-200 hover:scale-110"
            aria-label="Back to top"
          >
            <Icon
              icon="heroicons-outline:arrow-up"
              className="h-6 w-6"
              inline={true}
            />
          </button>
        </div>
      )}
    </div>
  );
}
