"use client";

import Image from "next/image";
import { Masonry } from "@mui/lab";
import { useMediaQuery } from "@mui/material";

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
    name: "Cokonya",
    role: "Jailbreak YouTuber",
    quote:
      "I cannot recommend this website enough, JBCL is the #1 all information outlet for JB, Featuring OG trackers to find lost items, Inventory trackers to keep up with your net worth and items, As well as Seasonal tracking like contract logging, Timers for when daily/weekly resets and more! They have it all ranging from values, update logs, seasonal progression, inventory tracking, Leaderboards for value, money, AND on top of all that even have a welcoming discord server you should 100% join, Amazing team behind JBCL and I'm happy to be a contributing partner to it all as it grows!",
    url: "https://www.youtube.com/@Cokonya",
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
  {
    name: "Locked3",
    role: "Jailbreak YouTuber",
    quote:
      "This site has definitely, definitely, at most helped jailbreak and keep the game alive for me, it's a great website, and this has changed the way jailbreak will be forever, it has a bunch of features! Including OG item finder, Dupe list, Values list, duped values list, and much more! Thank You so much JBCL for making me an affiliate i couldn't feel happier at the moment, Thank you.",
    url: "https://www.youtube.com/@Unversed-loch3",
  },
];

export default function TestimonialsSection() {
  const isAtLeast1024 = useMediaQuery("(min-width: 1024px)");
  const isAtLeast768 = useMediaQuery("(min-width: 768px)");

  const columns = isAtLeast1024 ? 3 : isAtLeast768 ? 2 : 1;

  return (
    <section className="py-8">
      <div className="container mx-auto px-6">
        {/* Masonry Layout */}
        <Masonry columns={columns} spacing={3} sx={{ width: "100%" }}>
          {testimonials.map((testimonial, index) => (
            <a
              key={index}
              href={testimonial.url}
              target="_blank"
              rel="noopener noreferrer"
              className="border-border-primary bg-secondary-bg hover:border-border-focus hover:shadow-card-shadow flex flex-col rounded-xl border p-6 shadow-md transition-all duration-200"
            >
              <div className="mb-4 flex items-start gap-4">
                <div className="flex-shrink-0">
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
                  <h3 className="text-card-headline hover:text-link mb-1 font-bold transition-colors">
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
        </Masonry>
      </div>
    </section>
  );
}
