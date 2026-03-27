"use client";

import Image from "next/image";
import { useEffect, useState, useCallback, useMemo } from "react";
import {
  BACKGROUNDS_BASE_URL,
  TOTAL_BACKGROUND_IMAGES,
} from "@/utils/fisherYatesShuffle";

export default function HeroBackgroundCarousel({
  initialImage,
}: {
  initialImage: string;
}) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isFirstRender, setIsFirstRender] = useState(true);

  const backgroundImages = useMemo(() => {
    // Keep ordering deterministic to avoid server/client hydration mismatches.
    const allImages = Array.from(
      { length: TOTAL_BACKGROUND_IMAGES },
      (_, i) => `${BACKGROUNDS_BASE_URL}/background${i + 1}.webp`,
    );
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

    let timeoutId: ReturnType<typeof setTimeout>;
    const intervalId = setInterval(() => {
      setIsTransitioning(true);
      timeoutId = setTimeout(() => {
        setIsTransitioning(false);
        nextImage();
      }, 1000);
    }, 10_000);

    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
  }, [backgroundImages.length, nextImage]);

  if (!backgroundImages.length) {
    return null;
  }

  const activeLayer: number = currentImageIndex % 2;
  const numImages = backgroundImages.length;

  const renderLayer = (layerIndex: number) => {
    const isActive = activeLayer === layerIndex;
    const imageIndex = isActive ? currentImageIndex : currentImageIndex + 1;
    const src = backgroundImages[imageIndex % numImages];
    const isFading = isActive && isTransitioning;

    return (
      <Image
        key={`layer-${layerIndex}`}
        src={src}
        alt="Jailbreak Background"
        fill
        sizes="100vw"
        quality={85}
        priority={isFirstRender && isActive}
        fetchPriority={isFirstRender && isActive ? "high" : "auto"}
        loading={isFirstRender && isActive ? "eager" : "lazy"}
        className={`object-cover transition-opacity duration-1000 ${
          isActive ? "z-10" : "z-0"
        } ${isFading ? "opacity-0" : "opacity-100"}`}
        style={{ objectPosition: "center 70%" }}
      />
    );
  };

  return (
    <>
      {renderLayer(0)}
      {renderLayer(1)}
    </>
  );
}
