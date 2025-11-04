import Image from "next/image";
import TestimonialCarousel from "./TestimonialCarousel";

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
  {
    name: "ItsSpecter",
    role: "Jailbreak YouTuber",
    quote:
      "JBCL is THE only site I use when checking values or any update changes in the game. It has active people updating the values so you know you're getting the right trades. It also has an inventory value checker, leaderboards, and so much more for the community to interact with than just a list of values. I easily recommend using JBCL over any other site because of how clean and accurate it is.",
    url: "https://www.youtube.com/@ItsSpecter",
  },
];

export default function TestimonialsSection() {
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

        {/* Mobile: Scrollable Container */}
        <div className="relative lg:hidden">
          {/* Gradient overlays for mobile */}
          <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-8 bg-gradient-to-r from-primary-bg to-transparent"></div>
          <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-8 bg-gradient-to-l from-primary-bg to-transparent"></div>

          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
            {testimonials.map((testimonial, index) => (
              <a
                key={index}
                href={testimonial.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-secondary-bg border-border-primary hover:border-border-focus hover:shadow-card-shadow flex-shrink-0 rounded-xl border p-6 shadow-md transition-all duration-200 snap-center"
                style={{ width: "85vw", maxWidth: "400px" }}
              >
                <div className="mb-4 flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <Image
                      src={`${TESTIMONIALS_BASE_URL}/${testimonial.name}.webp`}
                      alt={testimonial.name}
                      width={56}
                      height={56}
                      className="h-14 w-14 object-contain"
                      loading="lazy"
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

        {/* Desktop: Scrolling Carousel */}
        <div className="relative hidden lg:block">
          {/* Gradient overlays */}
          <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-20 bg-gradient-to-r from-primary-bg to-transparent"></div>
          <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-20 bg-gradient-to-l from-primary-bg to-transparent"></div>

          {/* Scrolling container */}
          <TestimonialCarousel>
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
                      loading="lazy"
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
          </TestimonialCarousel>
        </div>
      </div>
    </section>
  );
}
