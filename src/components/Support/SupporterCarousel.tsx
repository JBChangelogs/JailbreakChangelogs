"use client";

import { motion, useAnimationFrame, useMotionValue } from "framer-motion";
import { useRef } from "react";

interface SupporterCarouselProps {
  children: React.ReactNode;
  speed?: number;
}

export default function SupporterCarousel({
  children,
  speed = 0.5,
}: SupporterCarouselProps) {
  const baseX = useMotionValue(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useAnimationFrame(() => {
    const container = containerRef.current;
    if (!container) return;

    const scrollWidth = container.scrollWidth / 2; // Half because we duplicate

    let newX = baseX.get() - speed;

    // Reset when we've scrolled past one full set
    if (newX <= -scrollWidth) {
      newX = 0;
    }

    baseX.set(newX);
  });

  return (
    <div className="overflow-hidden">
      <motion.div
        ref={containerRef}
        className="flex gap-6"
        style={{ x: baseX }}
      >
        {children}
        {children}
      </motion.div>
    </div>
  );
}
