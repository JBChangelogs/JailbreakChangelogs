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
  const [isFirstRender, setIsFirstRender] = useState(true);

  const backgroundImages = useMemo(() => {
    const allImages = generateShuffledBackgroundImages();
    const remainingImages = allImages.filter((img) => img !== initialImage);
    return [initialImage, ...remainingImages];
  }, [initialImage]);

  const nextImage = useCallback(() => {
    setCurrentImageIndex((prevIndex) =>
      prevIndex + 1 >= backgroundImages.length ? 0 : prevIndex + 1,
    );
    setIsFirstRender(false);
  }, [backgroundImages.length]);

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
      key={currentBackgroundImage}
      src={currentBackgroundImage}
      alt="Jailbreak Background"
      fill
      priority={isFirstRender}
      fetchPriority={isFirstRender ? "high" : "auto"}
      loading={isFirstRender ? undefined : "lazy"}
      className="object-cover transition-opacity duration-1000"
      style={{ objectPosition: "center 70%" }}
    />
  );
}
