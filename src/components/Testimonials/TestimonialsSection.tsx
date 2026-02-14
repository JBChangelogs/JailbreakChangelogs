"use client";

import Image from "next/image";
import { Masonry } from "@mui/lab";
import { useMediaQuery } from "@mui/material";
import { testimonials } from "@/components/Testimonials/testimonialsData";
import {
  TESTIMONIALS_BASE_URL,
  highlightBrandName,
} from "@/components/Testimonials/testimonialText";

export default function TestimonialsSection() {
  const isAtLeast1024 = useMediaQuery("(min-width: 1024px)");
  const isAtLeast768 = useMediaQuery("(min-width: 768px)");

  const columns = isAtLeast1024 ? 3 : isAtLeast768 ? 2 : 1;

  return (
    <section className="py-8">
      <div className="container mx-auto px-6">
        <Masonry
          columns={columns}
          spacing={3}
          sx={{
            width: "100%",
            overflow: "hidden",
            transition: "height 0.2s ease-in-out",
          }}
        >
          {testimonials.map((testimonial, index) => (
            <a
              key={index}
              href={testimonial.url}
              target="_blank"
              rel="noopener noreferrer"
              className="border-border-card bg-secondary-bg hover:bg-quaternary-bg group flex flex-col rounded-xl border p-6 shadow-md transition-all duration-200"
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
                  <p className="text-primary-text bg-tertiary-bg/40 border-border-card inline-flex h-6 w-fit items-center rounded-lg border px-2.5 text-xs leading-none font-medium shadow-2xl backdrop-blur-xl">
                    {testimonial.role}
                  </p>
                </div>
              </div>

              <blockquote className="text-card-paragraph text-sm leading-relaxed">
                &ldquo;{highlightBrandName(testimonial.quote)}&rdquo;
              </blockquote>
            </a>
          ))}
        </Masonry>
      </div>
    </section>
  );
}
