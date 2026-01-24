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
    name: "Not_Josh",
    role: "Jailbreak YouTuber",
    quote:
      "Jailbreak Changelogs is the BEST Jailbreak website, hands down. It offers everything you could possibly need as a Roblox Jailbreak player. For example, it features the most accurate value list / dupe list, robbery / bounty trackers, inventory lookup / OG finder, update changelogs, and so much more. If you're a Jailbreak player, you would be dumb NOT to use this.",
    url: "https://www.youtube.com/@actuallynotjosh/videos",
  },
  {
    name: "Tolokagy",
    role: "Supporter",
    quote:
      "Jailbreak change logs is a amazingly built platform that has everything that you could ever want from inventory scans all the way up to robbery trackers. This website is the home of some of the most accurate values in jailbreak. With a great community as well, it would be almost a crime if you didn't join! In all, if I had start over again, I would choose change logs all the way through.",
    url: "#",
  },
  {
    name: "Avenger",
    role: "Supporter",
    quote:
      "As a Jailbreak Changelogs community moderator, JBCL has been my go-to option for anything Jailbreak related. I recommend using Jailbreak Changelogs for anything related to jailbreak trading, or Changelogs.",
    url: "#",
  },
  {
    name: "od2h",
    role: "Supporter",
    quote:
      "JB Changelogs have been my MAIN source for EVERYTHING Jailbreak related. This ranges from prices, to patch notes, to even the OG Finder or the Dupe Checker. The changelogs are fast, clear, and reliable, and the people behind the scenes genuinely care. It's made keeping track of updates, prices and everything else much more effortless.",
    url: "#",
  },
  {
    name: "Sky",
    role: "Supporter",
    quote:
      "Jailbreak Changelogs is literally the GOAT. this website has LITERALLY changed my LIFE. Jalenzz16 and Jakobiis are ACTUAL HEROES for making this. You've never had such STRAIGHTFORWARD access to a tracker as ASTONISHING as the JAILBREAK CHANGELOGS tracker. You've never had a VIGOROUS trading list and trading info as VIGOROUS as Jailbreak Changelogs.",
    url: "#",
  },
  {
    name: "DD",
    role: "Supporter",
    quote:
      "JBCL is a great community project, values, season information and game changelogs, all in one convenient place. Very useful tool, wouldn't want to live without it!",
    url: "#",
  },
  {
    name: "Banana",
    role: "Supporter",
    quote:
      "Ever since i started using the jbcl value list in june 2025 my invintory value has increased a lot. And as a contributor to the website I can safely say, jbcl has the best tools for any and every jailbreak player.",
    url: "#",
  },
  {
    name: "NotTesla",
    role: "Supporter",
    quote:
      "Jailbreak changelogs is the go to site for trading or checking when you complete the season pass, the team behind the shit is always eager to add new features and always engages the community. I highly recommend using this site as it has all the features would you want.",
    url: "#",
  },
  {
    name: "Sabatonic",
    role: "Supporter",
    quote:
      "Ever since February 2025, JBCL has been my go-to for everything regarding trading, seasonal contracts, and even more recent features like bounty hunting and robbery tracking. And the fact that it's all in one website makes it's use simple and convenient. Highly recommend!",
    url: "#",
  },
  {
    name: "mysterei",
    role: "Supporter",
    quote:
      "Jailbreak Changelogs helped me with finding values, checking for dupes, tracking robberies and bounties with the newly added bounty tracker. I would recommend JBCL for players that like to have a variety of features in one place.",
    url: "#",
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
              className="border-border-primary bg-secondary-bg hover:border-border-focus hover:shadow-card-shadow flex flex-col rounded-xl border p-6 shadow-md transition-all duration-200"
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
