"use client";

import Image from "next/image";
import { useEffect, useState, useCallback, useMemo } from "react";
import { generateShuffledBackgroundImages } from "@/utils/fisherYatesShuffle";

export default function HeroBackgroundCarousel({
  initialImage,
}: {
  initialImage: string;
}) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const backgroundImages = useMemo(() => {
    const allImages = generateShuffledBackgroundImages();
    const remainingImages = allImages.filter((img) => img !== initialImage);
    return [initialImage, ...remainingImages];
  }, [initialImage]);

  // Function to cycle to the next image
  const nextImage = useCallback(() => {
    setCurrentImageIndex((prevIndex) =>
      prevIndex + 1 >= backgroundImages.length ? 0 : prevIndex + 1,
    );
  }, [backgroundImages.length]);

  // Auto-cycle through images every 10 seconds
  useEffect(() => {
    if (backgroundImages.length <= 1) return;

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
      priority={currentImageIndex === 0}
      className="object-cover transition-opacity duration-1000"
      style={{ objectPosition: "center 70%" }}
    />
  );
}
