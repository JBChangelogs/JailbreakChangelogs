"use client";

import { motion, useAnimationFrame, useMotionValue } from "framer-motion";
import { useRef, useState } from "react";

interface TestimonialCarouselProps {
  children: React.ReactNode;
}

export default function TestimonialCarousel({
  children,
}: TestimonialCarouselProps) {
  const baseX = useMotionValue(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  useAnimationFrame(() => {
    const container = containerRef.current;
    if (!container) return;

    // Pause animation when hovered
    if (isHovered) return;

    const scrollWidth = container.scrollWidth / 2; // Half because we duplicate

    let newX = baseX.get() - 0.5;

    // Reset when we've scrolled past one full set
    if (newX <= -scrollWidth) {
      newX = 0;
    }

    baseX.set(newX);
  });

  return (
    <div
      className="overflow-x-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div
        ref={containerRef}
        className="flex items-start gap-6"
        style={{ x: baseX }}
      >
        {children}
        {children}
      </motion.div>
    </div>
  );
}
