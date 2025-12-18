"use client";

import { useEffect, useState, useRef } from "react";
import { ChevronDownIcon } from "@heroicons/react/24/solid";

interface SupportersBannerProps {
  targetId: string;
}

export default function SupportersBanner({ targetId }: SupportersBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const targetElement = document.getElementById(targetId);
    if (!targetElement) return;

    // Create intersection observer to watch when supporters section is in view
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Show banner when section is NOT in view
          setIsVisible(!entry.isIntersecting);
        });
      },
      {
        threshold: 0.1, // Trigger when at least 10% of section is visible
        rootMargin: "0px 0px -100px 0px", // Add some buffer at bottom
      },
    );

    observerRef.current.observe(targetElement);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [targetId]);

  const scrollToSupporters = () => {
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      const elementPosition =
        targetElement.getBoundingClientRect().top + window.scrollY;
      const offsetPosition = elementPosition - 100; // 100px offset from top

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 transform sm:bottom-6">
      <button
        onClick={scrollToSupporters}
        className="bg-button-info text-form-button-text hover:bg-button-info-hover active:bg-button-info-active flex cursor-pointer items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold shadow-lg transition-all duration-200 hover:shadow-xl sm:gap-2 sm:px-6 sm:py-3 sm:text-base"
        aria-label="View our supporters"
      >
        <span>View Our Supporters</span>
        <ChevronDownIcon className="h-4 w-4 animate-bounce sm:h-5 sm:w-5" />
      </button>
    </div>
  );
}
