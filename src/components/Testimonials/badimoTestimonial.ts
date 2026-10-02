import { TESTIMONIALS_BASE_URL } from "@/components/Testimonials/testimonialText";

export const badimoTestimonial = {
  id: "badimo",
  name: "Badimo",
  role: "Jailbreak Developers",
  quote:
    "We've been watching this place grow and we think it's absolutely wonderful. We even use Jailbreakchangelogs to check our own changelogs. Your search and filter settings make it so easy. Thank you for this incredible resource!",
  url: "https://www.roblox.com/communities/3059674/Badimo",
  avatarUrl: `${TESTIMONIALS_BASE_URL}/Badimo.webp`,
} as const;

export type BadimoTestimonial = typeof badimoTestimonial;
