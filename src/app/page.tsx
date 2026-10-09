import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { getRandomBackgroundImage } from "@/utils/helpers/fisherYatesShuffle";
import {
  fetchHomepageImpactStats,
  fetchHomepageStats,
  fetchNetworthCap,
} from "@/utils/api/api";
import { Icon } from "../components/ui/IconWrapper";
import { DiscordIcon } from "@/components/Icons/DiscordIcon";
import HeroBackgroundCarousel from "@/components/Home/HeroBackgroundCarousel";
import NitroHomepageAd from "@/components/Ads/NitroHomepageAd";
import CountUpNumber from "@/components/Home/CountUpNumber";
import { Button } from "@/components/ui/button";
import AppHeroButton from "@/app/app/AppHeroButton";
import { getHomepageTestimonials } from "@/components/Testimonials/homepageTestimonials";
import { highlightBrandName } from "@/components/Testimonials/testimonialText";
import { UserAvatar } from "@/utils/ui/avatar";

export const metadata: Metadata = {
  title: {
    absolute: "Home | Jailbreak Changelogs",
  },
};

const quickLinks = [
  {
    href: "/values",
    icon: "mdi:chart-line",
    title: "Item Values",
    description: "Check current trading values",
  },
  {
    href: "/trading",
    icon: "mdi:swap-horizontal",
    title: "Trade Ads",
    description: "Post and browse trade offers",
  },
  {
    href: "/inventories",
    icon: "mdi:package-variant",
    title: "Inventory Checker",
    description: "View networth breakdowns",
  },
  {
    href: "/dupes",
    icon: "mdi:shield-alert",
    title: "Dupe Finder",
    description: "Check for duplicated items",
  },
] as const;

const platformGroups = [
  {
    title: "Trading & Values",
    subtitle: "Everything you need for values and trading",
    items: [
      {
        href: "/values",
        icon: "mdi:chart-line",
        title: "Item Values",
        description: "Check current values, trends, and recent value changes.",
      },
      {
        href: "/trading",
        icon: "mdi:swap-horizontal",
        title: "Trade Ads",
        description: "Post your trades and browse active offers from others.",
      },
      {
        href: "/inventories",
        icon: "mdi:package-variant",
        title: "Inventory Checker",
        description:
          "View player inventories with full net worth totals and inventory breakdowns.",
      },
      {
        href: "/dupes",
        icon: "mdi:shield-alert",
        title: "Dupe Detection",
        description: "Check items for dupes before you trade.",
      },
    ],
  },
  {
    title: "Progression & History",
    subtitle: "Track updates, seasons, and progression",
    items: [
      {
        href: "/changelogs",
        icon: "mdi:book-open-page-variant",
        title: "Changelogs",
        description: "Browse update history and patch notes since 2017.",
      },
      {
        href: "/seasons",
        icon: "mdi:trophy",
        title: "Seasons & Rewards",
        description: "See season rewards, contracts, and your progress tools.",
      },
      {
        href: "/seasons/leaderboard",
        icon: "mdi:podium",
        title: "Season Leaderboard",
        description: "See where you rank on the current season leaderboard.",
      },
      {
        href: "/seasons/will-i-make-it",
        icon: "mdi:calculator",
        title: "Will I Make It?",
        description:
          "Calculate whether you can hit your target season level before the season ends.",
      },
    ],
  },
  {
    title: "Community & Utility",
    subtitle: "Community tools and useful extras",
    items: [
      {
        href: "/servers",
        icon: "mdi:server-network",
        title: "Private Servers",
        description: "Find and share active private server links.",
      },
      {
        href: "/users",
        icon: "mdi:account-group",
        title: "User Profiles",
        description:
          "Look up user profiles and customize how your profile appears on the website.",
      },
      {
        href: "/og",
        icon: "material-symbols:fingerprint-rounded",
        title: "OG Finder",
        description:
          "Track your original items, see where they are now, and get notified when we find them.",
      },
      {
        href: "/bot",
        icon: "mdi:robot",
        title: "Discord Bot",
        description: "Get values and updates directly in Discord.",
      },
    ],
  },
] as const;

const liveTrackers = [
  {
    href: "/robberies",
    icon: "material-symbols:money-bag-rounded",
    title: "Robbery Tracker",
    description:
      "See which robberies and mansions are open across servers right now.",
  },
  {
    href: "/bounties",
    icon: "mdi:currency-usd",
    title: "Bounty Tracker",
    description:
      "Find the highest bounty players across servers and join the server they're in.",
  },
] as const;

const heroQuickCardClass =
  "group relative block overflow-hidden rounded-2xl border border-white/20 bg-black/35 p-4 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-white/35 hover:bg-black/40 [.light_&]:border-white/15 [.light_&]:bg-white/[0.04] [.light_&]:backdrop-blur-sm [.light_&]:hover:border-white/25 [.light_&]:hover:bg-white/[0.08]";

const platformGroupClass =
  "rounded-2xl border border-border-card bg-secondary-bg p-5";

const platformRowClass =
  "group -mx-2 flex items-start gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-tertiary-bg";

type HeroStatCard = {
  label: string;
  icon: string;
  value: number;
  valueStr?: string;
  decimals?: number;
  prefix?: string;
  badge?: string;
};

export default async function Home() {
  const initialImage = getRandomBackgroundImage();
  const [impactStats, homepageStats, networthCap, testimonials] =
    await Promise.all([
      fetchHomepageImpactStats(),
      fetchHomepageStats(),
      fetchNetworthCap(),
      getHomepageTestimonials(),
    ]);

  const heroStats: HeroStatCard[] = [
    {
      label: "Registered Users",
      icon: "mdi:account-group",
      value: homepageStats?.total_users ?? 0,
    },
    {
      label: "Items Tracked",
      icon: "mdi:shape",
      value: impactStats?.items_tracked ?? 0,
      badge: "All time",
    },
    {
      label: "Inventories Scanned",
      icon: "mdi:account-search",
      value: impactStats?.users_scanned ?? 0,
      badge: "All time",
    },
    {
      label: "Total Networth",
      icon: "mdi:cash-multiple",
      value: networthCap?.total_networth ?? 0,
      valueStr: networthCap?.total_networth_str ?? "???",
      badge: "Last 24 hours",
    },
  ];

  return (
    <main className="bg-primary-bg min-h-screen">
      <section className="relative overflow-hidden pt-16 pb-8 md:py-20">
        <div className="absolute inset-0 z-0">
          <HeroBackgroundCarousel initialImage={initialImage} />
          <div className="bg-hero-overlay absolute inset-0 z-10" />
          <div className="absolute inset-0 z-10 bg-[radial-gradient(circle_at_15%_20%,var(--color-highlight),transparent_40%)] opacity-20" />
          <div className="absolute inset-y-0 left-0 z-10 w-full bg-gradient-to-r from-black/70 via-black/35 to-transparent md:w-2/3" />
          <div
            aria-hidden="true"
            className="from-primary-bg via-primary-bg/60 pointer-events-none absolute inset-x-0 bottom-0 z-10 h-24 bg-gradient-to-t to-transparent md:h-32"
          />
        </div>

        <div className="relative z-10 container mx-auto px-4">
          <div className="grid items-stretch gap-6 md:grid-cols-2 lg:gap-8">
            <div className="order-1 md:pt-2">
              <h1 className="mb-5 max-w-3xl text-3xl font-bold text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.65)] md:text-5xl lg:text-6xl">
                Jailbreak Changelogs: The All-in-One Platform
              </h1>
              <p className="mb-6 max-w-2xl text-base text-white/95 drop-shadow-[0_1px_8px_rgba(0,0,0,0.55)] md:text-lg">
                Your all-in-one Roblox Jailbreak platform for changelogs and
                game update tracking, values, trading, inventory lookups, OG
                item tracking, dupe detection, and more.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button asChild size="lg">
                  <a
                    href="roblox://experiences/start?placeId=606849621"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Play Jailbreak Now
                  </a>
                </Button>
                <Button asChild variant="heroOutline" size="lg">
                  <a
                    href="https://discord.jailbreakchangelogs.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2"
                  >
                    <DiscordIcon className="h-5 w-5" />
                    Join the Discord
                  </a>
                </Button>
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
                <AppHeroButton />
                <Link
                  href="/bot"
                  className="group inline-flex h-10 items-center gap-2 text-sm font-semibold text-white drop-shadow-[0_1px_8px_rgba(0,0,0,0.55)]"
                >
                  <Icon icon="mdi:robot" className="h-5 w-5" />
                  <span className="group-hover:underline">
                    Add the Discord Bot
                  </span>
                  <Icon
                    icon="material-symbols:arrow-forward-rounded"
                    className="h-5 w-5 transition-transform group-hover:translate-x-0.5"
                  />
                </Link>
              </div>
            </div>

            <div className="order-3 md:order-2">
              <div className="grid gap-3 sm:grid-cols-2 md:mb-4">
                {quickLinks.map((link, i) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    prefetch={false}
                    className={heroQuickCardClass}
                    style={
                      {
                        viewTransitionName: `hero-card-${i + 1}`,
                      } as React.CSSProperties
                    }
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15 text-white">
                        <Icon
                          icon={link.icon}
                          className="h-5 w-5"
                          inline={true}
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-bold text-white">
                          {link.title}
                        </h3>
                        <p className="mt-1 text-xs text-white/80">
                          {link.description}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="order-2 pt-6 md:order-3 md:col-span-2">
              <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-highlight text-sm font-semibold tracking-[0.2em] uppercase [.catppuccin-latte_&]:text-[#7287fd]">
                    Trusted by Badimo
                  </p>
                  <a
                    href="https://x.com/badimo/status/1983975178733543491"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-white/85 underline decoration-white/40 underline-offset-2 transition-colors hover:text-white"
                  >
                    Source: @badimo on X (formerly Twitter)
                    <Icon
                      icon="mdi:open-in-new"
                      className="h-4 w-4"
                      inline={true}
                    />
                  </a>
                  <h2 className="text-xl font-bold text-white md:text-2xl">
                    And loved by the Jailbreak Community
                  </h2>
                </div>
                <Button
                  asChild
                  variant="heroOutline"
                  className="hidden md:inline-flex"
                >
                  <Link href="/testimonials" prefetch={false}>
                    View All Testimonials
                  </Link>
                </Button>
              </div>
              <div className="mb-4 hidden grid-cols-1 items-stretch gap-3 md:grid md:grid-cols-2 lg:grid-cols-3">
                {testimonials.map((testimonial, i) => (
                  <Link
                    key={testimonial.id}
                    href="/testimonials"
                    prefetch={false}
                    className="hover:bg-tertiary-bg block rounded-2xl transition-colors"
                  >
                    <blockquote
                      className="border-border-card bg-secondary-bg/95 flex h-full flex-col rounded-2xl border p-4 text-left"
                      style={
                        {
                          viewTransitionName: `hero-card-${i + 5}`,
                        } as React.CSSProperties
                      }
                    >
                      <p className="text-secondary-text line-clamp-5 text-sm leading-relaxed">
                        &ldquo;{highlightBrandName(testimonial.quote)}&rdquo;
                      </p>
                      <footer className="mt-auto flex items-center gap-3 pt-4">
                        {testimonial.id === "badimo" ? (
                          <Image
                            src={testimonial.avatarUrl}
                            alt={testimonial.name}
                            width={40}
                            height={40}
                            className="h-10 w-10 object-contain"
                            loading="lazy"
                          />
                        ) : (
                          <UserAvatar
                            userId={testimonial.userId}
                            avatarHash={testimonial.avatarHash}
                            username={testimonial.name}
                            size={10}
                            cdnSize={128}
                            showBadge={false}
                          />
                        )}
                        <div>
                          <p className="text-primary-text text-sm font-bold">
                            {testimonial.name}
                          </p>
                          <p className="text-secondary-text text-xs">
                            {testimonial.role}
                          </p>
                        </div>
                      </footer>
                    </blockquote>
                  </Link>
                ))}
              </div>
              <Button asChild variant="heroOutline" className="mb-4 md:hidden">
                <Link href="/testimonials" prefetch={false}>
                  View Testimonials
                </Link>
              </Button>
              <div className="border-border-card bg-secondary-bg/95 rounded-2xl border p-5 md:p-6">
                <div className="lg:divide-border-card grid grid-cols-2 gap-x-6 gap-y-6 lg:grid-cols-4 lg:gap-x-8 lg:divide-x">
                  {heroStats.map((stat, i) => (
                    <div
                      key={stat.label}
                      className="lg:px-6 lg:first:pl-0"
                      style={
                        {
                          viewTransitionName: `hero-card-${i + 8}`,
                        } as React.CSSProperties
                      }
                    >
                      <div className="mb-2 flex items-center gap-2">
                        <Icon
                          icon={stat.icon}
                          className="text-secondary-text h-4 w-4"
                          inline={true}
                        />
                        <span className="text-secondary-text text-xs font-semibold tracking-wide uppercase">
                          {stat.label}
                        </span>
                      </div>
                      <p className="text-primary-text text-2xl leading-none font-bold md:text-3xl">
                        {stat.prefix ?? ""}
                        {stat.valueStr ?? (
                          <CountUpNumber
                            value={stat.value}
                            decimals={stat.decimals}
                          />
                        )}
                      </p>
                      {stat.badge ? (
                        <p className="text-secondary-text mt-1.5 text-[10px] font-medium tracking-wide uppercase">
                          {stat.badge}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-4">
        <div className="p-4 pb-8 empty:hidden">
          <NitroHomepageAd />
        </div>
        <div className="container mx-auto px-4">
          <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-link mb-2 text-xs font-semibold tracking-[0.2em] uppercase">
                Explore Our Platform
              </p>
              <h2 className="text-primary-text text-3xl font-bold md:text-4xl">
                Something for Every Jailbreak Player
              </h2>
            </div>
          </div>

          <div className={`${platformGroupClass} mb-4`}>
            <div className="mb-4 flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="bg-status-success absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" />
                <span className="bg-status-success relative inline-flex h-2.5 w-2.5 rounded-full" />
              </span>
              <p className="text-link text-xs font-semibold tracking-[0.2em] uppercase">
                Live Trackers
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {liveTrackers.map((tracker) => (
                <Link
                  key={tracker.href}
                  href={tracker.href}
                  prefetch={false}
                  className="group border-border-card bg-tertiary-bg hover:border-border-focus flex items-start gap-4 rounded-xl border p-4 transition-colors"
                >
                  <div className="bg-button-info/15 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg">
                    <Icon
                      icon={tracker.icon}
                      className="text-link h-6 w-6"
                      inline={true}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-card-headline group-hover:text-link font-semibold transition-colors">
                      {tracker.title}
                    </p>
                    <p className="text-card-paragraph mt-1 text-sm leading-relaxed">
                      {tracker.description}
                    </p>
                  </div>
                  <Icon
                    icon="mdi:arrow-right"
                    className="text-tertiary-text group-hover:text-link mt-1 h-5 w-5 shrink-0 transition-colors"
                    inline={true}
                  />
                </Link>
              ))}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {platformGroups.map((group) => (
              <div key={group.title} className={platformGroupClass}>
                <div className="border-border-card mb-4 border-b pb-3">
                  <h3 className="text-card-headline text-lg font-bold">
                    {group.title}
                  </h3>
                  <p className="text-card-paragraph mt-1 text-sm">
                    {group.subtitle}
                  </p>
                </div>
                <div className="space-y-1">
                  {group.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      prefetch={false}
                      className={platformRowClass}
                    >
                      <div className="bg-button-info/15 mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md">
                        <Icon
                          icon={item.icon}
                          className="text-link h-4 w-4"
                          inline={true}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-card-headline group-hover:text-link truncate text-sm font-semibold transition-colors">
                          {item.title}
                        </p>
                        <p className="text-card-paragraph text-xs leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                      <Icon
                        icon="mdi:arrow-right"
                        className="text-tertiary-text group-hover:text-link mt-1 h-4 w-4 shrink-0 transition-colors"
                        inline={true}
                      />
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-12">
        <div className="container mx-auto px-4">
          <div className="border-border-card bg-secondary-bg rounded-2xl border p-6 md:p-8">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="max-w-3xl">
                <p className="text-link mb-2 text-xs font-semibold tracking-[0.2em] uppercase">
                  Support Us
                </p>
                <h3 className="text-card-headline text-2xl font-bold md:text-3xl">
                  Love what we&apos;re doing? Help keep it running.
                </h3>
                <p className="text-card-paragraph mt-2 text-sm md:text-base">
                  Running this platform isn&apos;t free. Your support would mean
                  a lot. Supporters get perks on both the website and our
                  Discord. If you can&apos;t support directly, whitelisting us
                  in your ad blocker also helps, and that ad revenue goes back
                  into improving our services. We accept Discord supporter
                  purchases, crypto donations, and Robux donations.
                </p>
                <p className="text-card-paragraph mt-2 text-sm italic">
                  ~{" "}
                  <Link
                    href="/users/1019539798383398946"
                    prefetch={false}
                    className="text-link hover:text-link-hover active:text-link-active transition-colors duration-200 hover:underline"
                  >
                    Jalenzz16
                  </Link>{" "}
                  &amp;{" "}
                  <Link
                    href="/users/659865209741246514"
                    prefetch={false}
                    className="text-link hover:text-link-hover active:text-link-active transition-colors duration-200 hover:underline"
                  >
                    Jakobiis
                  </Link>
                </p>
              </div>
              <Button asChild size="lg">
                <Link href="/supporting" prefetch={false}>
                  Support the Platform
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
