"use client";

import Image from "next/image";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import type { Testimonial } from "@/components/Testimonials/testimonialsData";
import {
  TESTIMONIALS_BASE_URL,
  highlightBrandName,
} from "@/components/Testimonials/testimonialText";

type TestimonialsSectionProps = {
  testimonials: Testimonial[];
};

export default function TestimonialsSection({
  testimonials,
}: TestimonialsSectionProps) {
  const isAtLeast1024 = useMediaQuery("(min-width: 1024px)");
  const isAtLeast768 = useMediaQuery("(min-width: 768px)");

  const columns = isAtLeast1024 ? 3 : isAtLeast768 ? 2 : 1;

  return (
    <section className="py-8">
      <div className="container mx-auto px-6">
        <div style={{ columns: columns, columnGap: "24px" }}>
          {testimonials.map((testimonial, index) => (
            <a
              key={`${testimonial.name}-${index}`}
              href={testimonial.url}
              target="_blank"
              rel="noopener noreferrer"
              className="border-border-card bg-secondary-bg hover:bg-quaternary-bg group mb-6 block flex break-inside-avoid flex-col rounded-xl border p-6 shadow-md transition-all duration-200"
            >
              <div className="mb-4 flex items-start gap-4">
                <div className="shrink-0">
                  <Image
                    src={`${TESTIMONIALS_BASE_URL}/${testimonial.name}.webp`}
                    alt={testimonial.name}
                    width={56}
                    height={56}
                    className={`h-14 w-14 object-contain ${
                      testimonial.name !== "Badimo" ? "rounded-full" : ""
                    }`}
                    loading="lazy"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-card-headline group-hover:text-link mb-1 font-bold transition-colors">
                    {testimonial.name}
                  </h3>
                  <p className="text-primary-text bg-tertiary-bg/40 border-border-card inline-flex h-6 w-fit items-center rounded-lg border px-2.5 text-xs leading-none font-medium backdrop-blur-xl">
                    {testimonial.role}
                  </p>
                </div>
              </div>

              <blockquote className="text-card-paragraph text-sm leading-relaxed">
                &ldquo;{highlightBrandName(testimonial.quote)}&rdquo;
              </blockquote>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
