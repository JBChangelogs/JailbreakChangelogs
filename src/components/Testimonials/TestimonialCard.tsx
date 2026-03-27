"use client";

import Image from "next/image";
import {
  TESTIMONIALS_BASE_URL,
  highlightBrandName,
} from "@/components/Testimonials/testimonialText";
import type { Testimonial } from "@/components/Testimonials/testimonialsData";

const BADIMO_TESTIMONIAL_NAME = "Badimo";

export default function TestimonialCard({
  testimonial,
  idx,
}: {
  testimonial: Testimonial;
  idx: number;
}) {
  const isBadimo = testimonial.name === BADIMO_TESTIMONIAL_NAME;

  return (
    <blockquote
      className="flex w-[300px] shrink-0 flex-col self-stretch rounded-2xl border border-white/20 bg-white/10 p-4 text-left backdrop-blur-md md:w-[350px]"
      style={
        {
          viewTransitionName: `jbcl-home-testimonial-${idx}`,
        } as React.CSSProperties
      }
    >
      <p className="text-sm leading-relaxed text-white/90">
        &ldquo;{highlightBrandName(testimonial.quote)}&rdquo;
      </p>
      <footer className="mt-auto flex items-center gap-3 pt-4">
        <div className="relative h-10 w-10 shrink-0">
          <Image
            src={`${TESTIMONIALS_BASE_URL}/${testimonial.name}.webp`}
            alt={testimonial.name}
            fill
            className={`object-contain ${!isBadimo ? "rounded-full" : ""}`}
            loading={isBadimo ? "eager" : "lazy"}
            priority={isBadimo}
            sizes="40px"
          />
        </div>
        <div>
          <p className="text-sm font-bold text-white">{testimonial.name}</p>
          <p className="text-xs text-white/80">{testimonial.role}</p>
        </div>
      </footer>
    </blockquote>
  );
}
