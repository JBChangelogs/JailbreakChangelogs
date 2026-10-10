"use client";

// Matches the id on the bottom card in app/testimonials/page.tsx
const SHARE_TESTIMONIAL_ID = "share-testimonial";

export default function ShareTestimonialLink() {
  return (
    <a
      href={`#${SHARE_TESTIMONIAL_ID}`}
      onClick={(event) => {
        const target = document.getElementById(SHARE_TESTIMONIAL_ID);
        if (!target) return;
        event.preventDefault();
        const reduceMotion = window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        ).matches;
        target.scrollIntoView({
          behavior: reduceMotion ? "auto" : "smooth",
          block: "start",
        });
      }}
      className="text-link font-medium whitespace-nowrap hover:underline"
    >
      Share yours &darr;
    </a>
  );
}
