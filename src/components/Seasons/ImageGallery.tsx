"use client";

import React from "react";
import Image from "next/image";
import Autoplay from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/UI/carousel";

interface Reward {
  id: number;
  item: string;
  requirement: string;
  link: string;
  bonus: string;
}

interface ImageGalleryProps {
  rewards: Reward[];
}

export default function ImageGallery({ rewards }: ImageGalleryProps) {
  const plugin = Autoplay({
    delay: 4000,
    stopOnInteraction: true,
    stopOnMouseEnter: true,
    stopOnFocusIn: true,
  });

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

  if (filteredRewards.length === 0) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-lg">
        <p className="text-muted">No images available</p>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      <Carousel
        plugins={[plugin]}
        className="w-full"
        opts={{
          loop: true,
        }}
      >
        <CarouselContent>
          {filteredRewards.map((reward, index) => (
            <CarouselItem key={reward.id}>
              <div className="relative aspect-video overflow-hidden rounded-lg">
                <Image
                  src={`https://assets.jailbreakchangelogs.xyz${reward.link}`}
                  alt={reward.item}
                  fill
                  className="object-contain"
                  priority={index === 0}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="cursor-pointer" />
        <CarouselNext className="cursor-pointer" />
      </Carousel>
    </div>
  );
}
