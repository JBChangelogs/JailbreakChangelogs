"use client";

import { motion, useAnimationFrame, useMotionValue } from "framer-motion";
import { useRef } from "react";

interface TestimonialCarouselProps {
  children: React.ReactNode;
}

export default function TestimonialCarousel({
  children,
}: TestimonialCarouselProps) {
  const baseX = useMotionValue(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useAnimationFrame(() => {
    const container = containerRef.current;
    if (!container) return;

    const scrollWidth = container.scrollWidth / 2; // Half because we duplicate

    let newX = baseX.get() - 0.5;

    // Reset when we've scrolled past one full set
    if (newX <= -scrollWidth) {
      newX = 0;
    }

    baseX.set(newX);
  });

  return (
    <div className="overflow-x-hidden">
      <motion.div
        ref={containerRef}
        className="flex gap-6 items-start"
        style={{ x: baseX }}
      >
        {children}
        {children}
      </motion.div>
    </div>
  );
}
