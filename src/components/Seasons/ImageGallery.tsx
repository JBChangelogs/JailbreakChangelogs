"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";

interface Reward {
  id: number;
  season_number: number;
  item: string;
  requirement: string;
  link: string;
  exclusive: string;
  bonus: string;
}

interface ImageGalleryProps {
  rewards: Reward[];
}

export default function ImageGallery({ rewards }: ImageGalleryProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const filteredRewards = rewards.filter((reward) => {
    // Include rewards with valid images
    if (reward.link === "N/A") return false;

    // Include all non-bonus rewards
    if (reward.bonus !== "True") return true;

    // Include bonus rewards that are top percentage rewards
    if (
      reward.requirement.toLowerCase().includes("top") &&
      reward.requirement.includes("%")
    ) {
      return true;
    }

    // Exclude other bonus rewards
    return false;
  });

  const handlePreviousImage = useCallback(() => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? filteredRewards.length - 1 : prev - 1,
    );
  }, [filteredRewards.length]);

  const handleNextImage = useCallback(() => {
    setCurrentImageIndex((prev) =>
      prev === filteredRewards.length - 1 ? 0 : prev + 1,
    );
  }, [filteredRewards.length]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        handlePreviousImage();
      } else if (e.key === "ArrowRight") {
        handleNextImage();
      }
    },
    [handlePreviousImage, handleNextImage],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      handleNextImage();
    }, 7000);

    return () => clearInterval(interval);
  }, [isPaused, handleNextImage]);

  if (filteredRewards.length === 0) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-lg bg-[#212A31]">
        <p className="text-muted">No images available</p>
      </div>
    );
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="relative aspect-video overflow-hidden rounded-lg bg-[#212A31]">
        <Image
          src={`https://assets.jailbreakchangelogs.xyz${filteredRewards[currentImageIndex].link}`}
          alt={filteredRewards[currentImageIndex].item}
          fill
          className="object-contain"
          priority
        />

        {/* Navigation Buttons */}
        <button
          onClick={() => {
            setIsPaused(true);
            handlePreviousImage();
          }}
          className="absolute top-1/2 left-2 z-20 -translate-y-1/2 rounded-full bg-black/50 p-1 text-white transition-colors hover:bg-black/70 sm:p-2"
          aria-label="Previous image"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 sm:h-6 sm:w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <button
          onClick={() => {
            setIsPaused(true);
            handleNextImage();
          }}
          className="absolute top-1/2 right-2 z-20 -translate-y-1/2 rounded-full bg-black/50 p-1 text-white transition-colors hover:bg-black/70 sm:p-2"
          aria-label="Next image"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 sm:h-6 sm:w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
