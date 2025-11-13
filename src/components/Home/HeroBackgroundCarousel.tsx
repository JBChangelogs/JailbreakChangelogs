"use client";

import Image from "next/image";
import { useEffect, useState, useCallback } from "react";
import { generateShuffledBackgroundImages } from "@/utils/helpers/fisherYatesShuffle";

export default function HeroBackgroundCarousel() {
  const [backgroundImages, setBackgroundImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    setTimeout(() => {
      setBackgroundImages(generateShuffledBackgroundImages());
    }, 0);
  }, []);

  // Function to cycle to the next image
  const nextImage = useCallback(() => {
    setCurrentImageIndex((prevIndex) =>
      prevIndex + 1 >= backgroundImages.length ? 0 : prevIndex + 1,
    );
  }, [backgroundImages.length]);

  // Auto-cycle through images every 10 seconds
  useEffect(() => {
    if (backgroundImages.length === 0) return;

    const interval = setInterval(nextImage, 10000);
    return () => clearInterval(interval);
  }, [backgroundImages.length, nextImage]);

  const currentBackgroundImage = backgroundImages[currentImageIndex] || "";

  if (!currentBackgroundImage) {
    return null;
  }

  return (
    <Image
      src={currentBackgroundImage}
      alt="Jailbreak Background"
      fill
      className="object-cover transition-opacity duration-1000"
      style={{ objectPosition: "center 70%" }}
      priority
    />
  );
}
