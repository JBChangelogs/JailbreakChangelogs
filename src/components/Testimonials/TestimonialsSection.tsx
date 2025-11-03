"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";

interface Testimonial {
  name: string;
  role: string;
  quote: string;
  url: string;
}

const TESTIMONIALS_BASE_URL =
  "https://assets.jailbreakchangelogs.xyz/assets/testimonials";

const highlightBrandName = (text: string) => {
  const regex = /(jailbreak\s*changelogs?|changelogs|JBCL)/gi;
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (regex.test(part)) {
      return (
        <span key={index} className="text-link font-semibold">
          {part}
        </span>
      );
    }
    return part;
  });
};

const testimonials: Testimonial[] = [
  {
    name: "Badimo",
    role: "Jailbreak Developers",
    quote:
      "We've been watching this place grow and we think it's absolutely wonderful. We even use Jailbreakchangelogs to check our own changelogs. Your search and filter settings make it so easy. Thank you for this incredible resource!",
    url: "https://www.roblox.com/communities/3059674/Badimo",
  },
  {
    name: "bobthelog",
    role: "Jailbreak YouTuber",
    quote:
      "In my own experience jailbreak changelogs is the most reliable and accurate site to use for both trading and general jailbreak queries. 10/10 I recommend 👍",
    url: "https://www.youtube.com/@bobdelog",
  },
  {
    name: "Felicityy",
    role: "Jailbreak YouTuber",
    quote:
      "Whenever I need a clear list of every change in an update, i look to changelogs. Whenever I need to see detailed graphs of the current trading market, I look at changelogs. Whenever I want to see if anyone has my long lost OG items, I use changelogs. There is no other website that can do what changelogs does. Use  jailbreakchangelogss!!!",
    url: "https://www.youtube.com/@Felicityy-",
  },
  {
    name: "mrflyingpies",
    role: "Jailbreak YouTuber",
    quote:
      "JBCL is the only site I trust to keep me ahead in Jailbreak. It's clean, accurate, and packed with everything I need, from update news to value lists. This is a must have for anyone.",
    url: "https://www.youtube.com/@mrflyingpies",
  },
  {
    name: "C3T1C",
    role: "Jailbreak YouTuber",
    quote:
      "JBCL is the website we were asking for. There are so many features that are not present on other jailbreak websites such as an OG finder and an inventory logger! The community aswell are very kind and welcoming, and I highly, HIGHLY reccomend joining their discord server for a positive experience!",
    url: "https://www.youtube.com/@C3T1C",
  },
];

export default function TestimonialsSection() {
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

  const duplicatedTestimonials = [...testimonials, ...testimonials];

  return (
    <section className="py-8">
      <div className="container mx-auto px-6">
        <h2 className="text-primary-text mb-3 text-center text-3xl font-bold lg:text-4xl">
          What Our Community Says
        </h2>
        <p className="text-secondary-text mx-auto mb-8 max-w-2xl text-center">
          Trusted by thousands of Jailbreak players and even the developers
          themselves
        </p>

        {/* Mobile: Static Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:hidden">
          {testimonials.map((testimonial, index) => (
            <a
              key={index}
              href={testimonial.url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-secondary-bg border-border-primary hover:border-border-focus hover:shadow-card-shadow rounded-xl border p-6 shadow-md transition-all duration-200"
            >
              <div className="mb-4 flex items-start gap-4">
                <div className="flex-shrink-0">
                  <Image
                    src={`${TESTIMONIALS_BASE_URL}/${testimonial.name}.webp`}
                    alt={testimonial.name}
                    width={56}
                    height={56}
                    className="h-14 w-14 object-contain"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-card-headline mb-1 font-bold hover:text-link transition-colors">
                    {testimonial.name}
                  </h3>
                  <p className="text-primary-text text-sm">
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

        {/* Desktop: Scrolling Carousel */}
        <div className="relative hidden lg:block">
          {/* Gradient overlays */}
          <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-20 bg-gradient-to-r from-primary-bg to-transparent"></div>
          <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-20 bg-gradient-to-l from-primary-bg to-transparent"></div>

          {/* Scrolling container */}
          <div
            ref={scrollRef}
            className="flex gap-6 overflow-x-hidden"
            style={{ scrollBehavior: "auto" }}
          >
            {duplicatedTestimonials.map((testimonial, index) => (
              <a
                key={index}
                href={testimonial.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-secondary-bg border-border-primary hover:border-border-focus hover:shadow-card-shadow flex-shrink-0 rounded-xl border p-6 shadow-md transition-all duration-200"
                style={{ width: "400px" }}
              >
                <div className="mb-2 flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <Image
                      src={`${TESTIMONIALS_BASE_URL}/${testimonial.name}.webp`}
                      alt={testimonial.name}
                      width={56}
                      height={56}
                      className="h-14 w-14 object-contain"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-card-headline mb-1 font-bold hover:text-link transition-colors">
                      {testimonial.name}
                    </h3>
                    <p className="text-primary-text text-sm">
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
      </div>
    </section>
  );
}
