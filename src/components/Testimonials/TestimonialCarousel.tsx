"use client";

import { useEffect, useRef } from "react";

interface TestimonialCarouselProps {
  children: React.ReactNode;
}

export default function TestimonialCarousel({
  children,
}: TestimonialCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    // Only enable auto-scroll on desktop
    const isDesktop = window.innerWidth >= 1024;
    if (!isDesktop) return;

    let animationId: number;
    let scrollPosition = 0;

    const scroll = () => {
      scrollPosition += 0.5;

      // Reset scroll position when we've scrolled past the first set
      if (scrollPosition >= scrollContainer.scrollWidth / 2) {
        scrollPosition = 0;
      }

      scrollContainer.scrollLeft = scrollPosition;
      animationId = requestAnimationFrame(scroll);
    };

    animationId = requestAnimationFrame(scroll);

    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <div
      ref={scrollRef}
      className="flex gap-6 overflow-x-hidden"
      style={{ scrollBehavior: "auto" }}
    >
      {children}
    </div>
  );
}
