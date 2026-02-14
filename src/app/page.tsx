import Link from "next/link";
import type { Metadata } from "next";
import { getRandomBackgroundImage } from "@/utils/fisherYatesShuffle";
import { fetchHomepageImpactStats, fetchHomepageStats } from "@/utils/api";
import { Icon } from "../components/ui/IconWrapper";
import { DiscordIcon } from "@/components/Icons/DiscordIcon";
import HeroBackgroundCarousel from "@/components/Home/HeroBackgroundCarousel";
import NitroHomepageAd from "@/components/Ads/NitroHomepageAd";
import CountUpNumber from "@/components/Home/CountUpNumber";
import { Button } from "@/components/ui/button";

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
        href: "/leaderboard/money",
        icon: "mdi:podium",
        title: "Leaderboards",
        description: "Compare your progress with top players.",
      },
      {
        href: "/calculators",
        icon: "mdi:calculator",
        title: "Calculators",
        description: "Use XP and progression calculators to plan ahead.",
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
        icon: "mdi:crown",
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

const heroQuickCardClass =
  "group relative block overflow-hidden rounded-2xl border border-white/20 bg-white/10 p-4 text-left backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-white/35 hover:bg-white/15";

const platformGroupClass =
  "rounded-2xl border border-border-card bg-secondary-bg/80 p-5 backdrop-blur-sm";

const platformRowClass =
  "group -mx-2 flex items-start gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-tertiary-bg";

const heroStatCardClass =
  "group rounded-2xl border border-white/20 bg-white/10 p-4 text-left backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:border-white/35 hover:bg-white/15";

type HeroStatCard = {
  label: string;
  icon: string;
  value: number;
  prefix?: string;
  suffix?: string;
};

export default async function Home() {
  const initialImage = getRandomBackgroundImage();
  const [impactStats, homepageStats] = await Promise.all([
    fetchHomepageImpactStats(),
    fetchHomepageStats(),
  ]);

  const legacyStats: HeroStatCard[] = [
    {
      label: "Users",
      icon: "mdi:account-group",
      value: homepageStats?.total_users ?? 0,
    },
    {
      label: "Trades Posted",
      icon: "mdi:swap-horizontal",
      value: homepageStats?.total_trades ?? 0,
    },
    {
      label: "Updates Recorded",
      icon: "mdi:book-open-page-variant",
      value: homepageStats?.total_changelogs ?? 0,
    },
    {
      label: "Comments Posted",
      icon: "mdi:comment-text",
      value: homepageStats?.total_comments ?? 0,
    },
    {
      label: "Value List Items",
      icon: "mdi:archive",
      value: homepageStats?.total_items ?? 0,
    },
  ];

  const impactStatsCards: HeroStatCard[] = [
    {
      label: "Items Tracked",
      icon: "mdi:shape",
      value: impactStats?.items_tracked ?? 0,
      suffix: " and counting",
    },
    {
      label: "Inventories Scanned",
      icon: "mdi:account-search",
      value: impactStats?.users_scanned ?? 0,
      suffix: " and counting",
    },
    {
      label: "Item Duplicates",
      icon: "mdi:content-copy",
      value: impactStats?.total_duplicates ?? 0,
      suffix: " and counting",
    },
  ];

  return (
    <main className="bg-primary-bg min-h-screen">
      <section className="relative overflow-hidden py-16 md:py-20">
        <div className="absolute inset-0 z-0">
          <HeroBackgroundCarousel initialImage={initialImage} />
          <div className="absolute inset-0 z-10 bg-gradient-to-br from-slate-950/75 via-slate-900/60 to-black/80" />
          <div className="absolute inset-0 z-10 bg-[radial-gradient(circle_at_15%_20%,rgba(37,99,235,0.22),transparent_40%),radial-gradient(circle_at_85%_35%,rgba(14,165,233,0.18),transparent_35%)]" />
          <div className="absolute inset-y-0 left-0 z-10 w-full bg-gradient-to-r from-black/70 via-black/35 to-transparent md:w-2/3" />
        </div>

        <div className="relative z-10 container mx-auto px-4">
          <div className="grid items-stretch gap-6 md:grid-cols-2 lg:gap-8">
            <div className="md:pt-2">
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
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="border-white/55 bg-black/50 text-white shadow-[0_2px_12px_rgba(0,0,0,0.4)] hover:bg-black/60 hover:text-white"
                >
                  <a
                    href="https://discord.jailbreakchangelogs.xyz"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2"
                  >
                    <DiscordIcon className="h-5 w-5" />
                    Join the Discord
                  </a>
                </Button>
              </div>
            </div>

            <div>
              <div className="mb-4 grid gap-3 sm:grid-cols-2">
                {quickLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    prefetch={false}
                    className={heroQuickCardClass}
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

            <div className="pt-6 md:col-span-2">
              <div className="mb-4">
                <div>
                  <p className="text-link text-xs font-semibold tracking-[0.2em] uppercase">
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
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {legacyStats.map((stat) => (
                  <div key={stat.label} className={heroStatCardClass}>
                    <div className="mb-2 flex items-center gap-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
                        <Icon
                          icon={stat.icon}
                          className="h-5 w-5 text-white"
                          inline={true}
                        />
                      </div>
                      <span className="text-xs font-medium text-white/85 uppercase">
                        {stat.label}
                      </span>
                    </div>
                    <p className="text-3xl leading-none font-bold text-white">
                      {stat.prefix ?? ""}
                      <CountUpNumber value={stat.value} />
                      {stat.suffix ? (
                        <span className="text-sm font-medium text-white/85">
                          {stat.suffix}
                        </span>
                      ) : null}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                {impactStatsCards.map((stat) => (
                  <div key={stat.label} className={heroStatCardClass}>
                    <div className="mb-2 flex items-center gap-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
                        <Icon
                          icon={stat.icon}
                          className="h-5 w-5 text-white"
                          inline={true}
                        />
                      </div>
                      <span className="text-xs font-medium text-white/85 uppercase">
                        {stat.label}
                      </span>
                    </div>
                    <p className="text-3xl leading-none font-bold text-white">
                      {stat.prefix ?? ""}
                      <CountUpNumber value={stat.value} />
                      {stat.suffix ? (
                        <span className="text-sm font-medium text-white/85">
                          {stat.suffix}
                        </span>
                      ) : null}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-4">
        <div className="p-4 pb-8">
          <NitroHomepageAd />
        </div>
        <div className="container mx-auto px-4">
          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-link mb-2 text-xs font-semibold tracking-[0.2em] uppercase">
                Explore Our Platform
              </p>
              <h2 className="text-primary-text text-3xl font-bold md:text-4xl">
                Something for Every Jailbreak Player
              </h2>
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
                  into improving our services. We accept Ko-fi donations, crypto
                  donations, and Robux donations.
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
