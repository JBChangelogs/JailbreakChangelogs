import Link from "next/link";

import { Icon } from "../components/ui/IconWrapper";
import HeroBackgroundCarousel from "@/components/Home/HeroBackgroundCarousel";

export default function Home() {
  return (
    <main className="bg-primary-bg min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <HeroBackgroundCarousel />
          <div
            className="absolute inset-0 z-10"
            style={{ backgroundColor: "var(--color-hero-overlay)" }}
          ></div>
        </div>

        <div className="relative z-10 container mx-auto px-4">
          <div className="text-center">
            <h1
              className="mb-6 text-3xl font-bold md:text-5xl"
              style={{ color: "var(--color-form-button-text)" }}
            >
              Roblox Jailbreak Changelogs & Values Hub
            </h1>
            <p
              className="mx-auto mb-8 max-w-2xl text-base md:text-lg"
              style={{ color: "var(--color-form-button-text)" }}
            >
              Your comprehensive platform for Roblox Jailbreak item values,
              trade listings, update tracking, and community features. Get
              accurate trading data, post trade ads, track seasonal changes, and
              connect with other players!
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <a
                href="roblox://experiences/start?placeId=606849621"
                target="_blank"
                rel="noopener noreferrer"
                className="text-form-button-text bg-button-info hover:bg-button-info-hover active:bg-button-info-active focus:ring-border-focus rounded-lg px-8 py-3 text-lg font-semibold transition-colors duration-200 focus:ring-2 focus:outline-none"
              >
                Play Jailbreak Now
              </a>
              <Link
                href="/testimonials"
                prefetch={false}
                className="text-form-button-text border-form-button-text hover:bg-button-info-hover rounded-lg border-2 px-8 py-3 text-lg font-semibold transition-colors duration-200"
              >
                Read Testimonials
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Pages CTA Section */}
      <section className="bg-secondary-bg/50 py-16">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="text-primary-text mb-4 text-3xl font-bold">
              Getting Started
            </h2>
            <p className="text-secondary-text mx-auto max-w-2xl">
              Jump right into the most popular features
            </p>
          </div>
          <div className="mx-auto grid max-w-4xl gap-4 md:grid-cols-2">
            <Link
              href="/values"
              prefetch={false}
              className="bg-secondary-bg border-border-primary hover:border-border-focus group flex items-center gap-4 rounded-xl border p-6 transition-all duration-200 hover:shadow-lg"
            >
              <div className="bg-button-info/10 flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-lg">
                <Icon
                  icon="mdi:chart-line"
                  className="text-link h-7 w-7"
                  inline={true}
                />
              </div>
              <div className="flex-1">
                <h3 className="text-card-headline mb-1 text-lg font-bold">
                  Item Values
                </h3>
                <p className="text-card-paragraph text-sm">
                  Check current trading values
                </p>
              </div>
              <Icon
                icon="mdi:arrow-right"
                className="text-tertiary-text group-hover:text-link h-5 w-5 transition-colors"
                inline={true}
              />
            </Link>

            <Link
              href="/trading"
              prefetch={false}
              className="bg-secondary-bg border-border-primary hover:border-border-focus group flex items-center gap-4 rounded-xl border p-6 transition-all duration-200 hover:shadow-lg"
            >
              <div className="bg-button-info/10 flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-lg">
                <Icon
                  icon="mdi:swap-horizontal"
                  className="text-link h-7 w-7"
                  inline={true}
                />
              </div>
              <div className="flex-1">
                <h3 className="text-card-headline mb-1 text-lg font-bold">
                  Trade Ads
                </h3>
                <p className="text-card-paragraph text-sm">
                  Post and browse trade offers
                </p>
              </div>
              <Icon
                icon="mdi:arrow-right"
                className="text-tertiary-text group-hover:text-link h-5 w-5 transition-colors"
                inline={true}
              />
            </Link>

            <Link
              href="/calculators"
              prefetch={false}
              className="bg-secondary-bg border-border-primary hover:border-border-focus group flex items-center gap-4 rounded-xl border p-6 transition-all duration-200 hover:shadow-lg"
            >
              <div className="bg-button-info/10 flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-lg">
                <Icon
                  icon="mdi:calculator"
                  className="text-link h-7 w-7"
                  inline={true}
                />
              </div>
              <div className="flex-1">
                <h3 className="text-card-headline mb-1 text-lg font-bold">
                  Calculators
                </h3>
                <p className="text-card-paragraph text-sm">
                  XP, value, and trading tools
                </p>
              </div>
              <Icon
                icon="mdi:arrow-right"
                className="text-tertiary-text group-hover:text-link h-5 w-5 transition-colors"
                inline={true}
              />
            </Link>

            <Link
              href="/dupes"
              prefetch={false}
              className="bg-secondary-bg border-border-primary hover:border-border-focus group flex items-center gap-4 rounded-xl border p-6 transition-all duration-200 hover:shadow-lg"
            >
              <div className="bg-button-info/10 flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-lg">
                <Icon
                  icon="mdi:shield-alert"
                  className="text-link h-7 w-7"
                  inline={true}
                />
              </div>
              <div className="flex-1">
                <h3 className="text-card-headline mb-1 text-lg font-bold">
                  Dupe Finder
                </h3>
                <p className="text-card-paragraph text-sm">
                  Check for duplicated items
                </p>
              </div>
              <Icon
                icon="mdi:arrow-right"
                className="text-tertiary-text group-hover:text-link h-5 w-5 transition-colors"
                inline={true}
              />
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="mb-16 text-center">
            <h2 className="text-primary-text mb-4 text-4xl font-bold">
              Everything You Need....And More
            </h2>
            <p className="text-secondary-text mx-auto max-w-2xl text-lg">
              Powerful tools and features designed for the Roblox Jailbreak
              community
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 - Changelogs */}
            <Link
              href="/changelogs"
              prefetch={false}
              className="group bg-secondary-bg border-border-primary hover:border-border-focus hover:shadow-card-shadow relative block overflow-hidden rounded-xl border p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-button-info/10">
                  <Icon
                    icon="mdi:book-open-page-variant"
                    className="text-link h-6 w-6"
                    inline={true}
                  />
                </div>
                <h3 className="text-card-headline text-xl font-bold">
                  Changelogs
                </h3>
              </div>
              <p className="text-card-paragraph mb-4 leading-relaxed">
                Access the complete history of Jailbreak updates since 2017.
                Track every change, update, and addition to the game.
              </p>
              <div className="text-link group-hover:text-link-hover flex items-center gap-1 text-sm font-semibold">
                Explore{" "}
                <Icon
                  icon="mdi:arrow-right"
                  className="h-4 w-4"
                  inline={true}
                />
              </div>
            </Link>

            {/* Feature 2 - Seasons & Rewards */}
            <Link
              href="/seasons"
              prefetch={false}
              className="group bg-secondary-bg border-border-primary hover:border-border-focus hover:shadow-card-shadow relative block overflow-hidden rounded-xl border p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-button-info/10">
                  <Icon
                    icon="mdi:trophy"
                    className="text-link h-6 w-6"
                    inline={true}
                  />
                </div>
                <h3 className="text-card-headline text-xl font-bold">
                  Seasons & Rewards
                </h3>
              </div>
              <p className="text-card-paragraph mb-4 leading-relaxed">
                Browse seasonal rewards, contracts, and use XP calculators to
                track your progress and plan your season journey.
              </p>
              <div className="text-link group-hover:text-link-hover flex items-center gap-1 text-sm font-semibold">
                Explore{" "}
                <Icon
                  icon="mdi:arrow-right"
                  className="h-4 w-4"
                  inline={true}
                />
              </div>
            </Link>

            {/* Feature 3 - Item Values */}
            <Link
              href="/values"
              prefetch={false}
              className="group bg-secondary-bg border-border-primary hover:border-border-focus hover:shadow-card-shadow relative block overflow-hidden rounded-xl border p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-button-info/10">
                  <Icon
                    icon="mdi:chart-line"
                    className="text-link h-6 w-6"
                    inline={true}
                  />
                </div>
                <h3 className="text-card-headline text-xl font-bold">
                  Item Values
                </h3>
              </div>
              <p className="text-card-paragraph mb-4 leading-relaxed">
                View accurate item values and trading statistics. Stay updated
                with value changelogs and market trends.
              </p>
              <div className="text-link group-hover:text-link-hover flex items-center gap-1 text-sm font-semibold">
                Explore{" "}
                <Icon
                  icon="mdi:arrow-right"
                  className="h-4 w-4"
                  inline={true}
                />
              </div>
            </Link>

            {/* Feature 4 - Trade Ads */}
            <Link
              href="/trading"
              prefetch={false}
              className="group bg-secondary-bg border-border-primary hover:border-border-focus hover:shadow-card-shadow relative block overflow-hidden rounded-xl border p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-button-info/10">
                  <Icon
                    icon="mdi:swap-horizontal"
                    className="text-link h-6 w-6"
                    inline={true}
                  />
                </div>
                <h3 className="text-card-headline text-xl font-bold">
                  Trade Ads
                </h3>
              </div>
              <p className="text-card-paragraph mb-4 leading-relaxed">
                Create and browse trade ads. Find the perfect trading partner
                and negotiate deals with the community.
              </p>
              <div className="text-link group-hover:text-link-hover flex items-center gap-1 text-sm font-semibold">
                Explore{" "}
                <Icon
                  icon="mdi:arrow-right"
                  className="h-4 w-4"
                  inline={true}
                />
              </div>
            </Link>

            {/* Feature 5 - Inventory Checker */}
            <Link
              href="/inventories"
              prefetch={false}
              className="group bg-secondary-bg border-border-primary hover:border-border-focus hover:shadow-card-shadow relative block overflow-hidden rounded-xl border p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-button-info/10">
                  <Icon
                    icon="mdi:package-variant"
                    className="text-link h-6 w-6"
                    inline={true}
                  />
                </div>
                <h3 className="text-card-headline text-xl font-bold">
                  Inventory Checker
                </h3>
              </div>
              <p className="text-card-paragraph mb-4 leading-relaxed">
                Check player inventories and calculate total networth. Track
                item ownership and collection progress.
              </p>
              <div className="text-link group-hover:text-link-hover flex items-center gap-1 text-sm font-semibold">
                Explore{" "}
                <Icon
                  icon="mdi:arrow-right"
                  className="h-4 w-4"
                  inline={true}
                />
              </div>
            </Link>

            {/* Feature 6 - Dupe Detection */}
            <Link
              href="/dupes"
              prefetch={false}
              className="group bg-secondary-bg border-border-primary hover:border-border-focus hover:shadow-card-shadow relative block overflow-hidden rounded-xl border p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-button-info/10">
                  <Icon
                    icon="mdi:shield-alert"
                    className="text-link h-6 w-6"
                    inline={true}
                  />
                </div>
                <h3 className="text-card-headline text-xl font-bold">
                  Dupe Detection
                </h3>
              </div>
              <p className="text-card-paragraph mb-4 leading-relaxed">
                Find duped items and check item authenticity. Protect yourself
                from trading for duplicated items.
              </p>
              <div className="text-link group-hover:text-link-hover flex items-center gap-1 text-sm font-semibold">
                Explore{" "}
                <Icon
                  icon="mdi:arrow-right"
                  className="h-4 w-4"
                  inline={true}
                />
              </div>
            </Link>

            {/* Feature 7 - OG Finder */}
            <Link
              href="/og"
              prefetch={false}
              className="group bg-secondary-bg border-border-primary hover:border-border-focus hover:shadow-card-shadow relative block overflow-hidden rounded-xl border p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-button-info/10">
                  <Icon
                    icon="mdi:crown"
                    className="text-link h-6 w-6"
                    inline={true}
                  />
                </div>
                <h3 className="text-card-headline text-xl font-bold">
                  OG Finder
                </h3>
              </div>
              <p className="text-card-paragraph mb-4 leading-relaxed">
                Discover original owners of limited items. Track item history
                and verify ownership authenticity.
              </p>
              <div className="text-link group-hover:text-link-hover flex items-center gap-1 text-sm font-semibold">
                Explore{" "}
                <Icon
                  icon="mdi:arrow-right"
                  className="h-4 w-4"
                  inline={true}
                />
              </div>
            </Link>

            {/* Feature 8 - Leaderboards */}
            <Link
              href="/leaderboard/money"
              prefetch={false}
              className="group bg-secondary-bg border-border-primary hover:border-border-focus hover:shadow-card-shadow relative block overflow-hidden rounded-xl border p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-button-info/10">
                  <Icon
                    icon="mdi:podium"
                    className="text-link h-6 w-6"
                    inline={true}
                  />
                </div>
                <h3 className="text-card-headline text-xl font-bold">
                  Leaderboards
                </h3>
              </div>
              <p className="text-card-paragraph mb-4 leading-relaxed">
                View money and networth leaderboards. See top players and
                compare your progress with the community.
              </p>
              <div className="text-link group-hover:text-link-hover flex items-center gap-1 text-sm font-semibold">
                Explore{" "}
                <Icon
                  icon="mdi:arrow-right"
                  className="h-4 w-4"
                  inline={true}
                />
              </div>
            </Link>

            {/* Feature 9 - Calculators */}
            <Link
              href="/calculators"
              prefetch={false}
              className="group bg-secondary-bg border-border-primary hover:border-border-focus hover:shadow-card-shadow relative block overflow-hidden rounded-xl border p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-button-info/10">
                  <Icon
                    icon="mdi:calculator"
                    className="text-link h-6 w-6"
                    inline={true}
                  />
                </div>
                <h3 className="text-card-headline text-xl font-bold">
                  Calculators
                </h3>
              </div>
              <p className="text-card-paragraph mb-4 leading-relaxed">
                Access XP calculators, value calculators, and trading worth
                tools. Plan your progression efficiently.
              </p>
              <div className="text-link group-hover:text-link-hover flex items-center gap-1 text-sm font-semibold">
                Explore{" "}
                <Icon
                  icon="mdi:arrow-right"
                  className="h-4 w-4"
                  inline={true}
                />
              </div>
            </Link>

            {/* Feature 10 - Private Servers */}
            <Link
              href="/servers"
              prefetch={false}
              className="group bg-secondary-bg border-border-primary hover:border-border-focus hover:shadow-card-shadow relative block overflow-hidden rounded-xl border p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-button-info/10">
                  <Icon
                    icon="mdi:server-network"
                    className="text-link h-6 w-6"
                    inline={true}
                  />
                </div>
                <h3 className="text-card-headline text-xl font-bold">
                  Private Servers
                </h3>
              </div>
              <p className="text-card-paragraph mb-4 leading-relaxed">
                Browse and submit private servers for grinding, trading, and
                hanging out. Connect with fellow players.
              </p>
              <div className="text-link group-hover:text-link-hover flex items-center gap-1 text-sm font-semibold">
                Explore{" "}
                <Icon
                  icon="mdi:arrow-right"
                  className="h-4 w-4"
                  inline={true}
                />
              </div>
            </Link>

            {/* Feature 11 - User Profiles */}
            <Link
              href="/users"
              prefetch={false}
              className="group bg-secondary-bg border-border-primary hover:border-border-focus hover:shadow-card-shadow relative block overflow-hidden rounded-xl border p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-button-info/10">
                  <Icon
                    icon="mdi:account-group"
                    className="text-link h-6 w-6"
                    inline={true}
                  />
                </div>
                <h3 className="text-card-headline text-xl font-bold">
                  User Profiles
                </h3>
              </div>
              <p className="text-card-paragraph mb-4 leading-relaxed">
                Search users, create profiles, and engage with the community.
                Connect your Roblox account securely.
              </p>
              <div className="text-link group-hover:text-link-hover flex items-center gap-1 text-sm font-semibold">
                Explore{" "}
                <Icon
                  icon="mdi:arrow-right"
                  className="h-4 w-4"
                  inline={true}
                />
              </div>
            </Link>

            {/* Feature 12 - Discord Bot */}
            <Link
              href="/bot"
              prefetch={false}
              className="group bg-secondary-bg border-border-primary hover:border-border-focus hover:shadow-card-shadow relative block overflow-hidden rounded-xl border p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-button-info/10">
                  <Icon
                    icon="mdi:robot"
                    className="text-link h-6 w-6"
                    inline={true}
                  />
                </div>
                <h3 className="text-card-headline text-xl font-bold">
                  Discord Bot
                </h3>
              </div>
              <p className="text-card-paragraph mb-4 leading-relaxed">
                Add our Discord bot to your server. Get changelogs, values, and
                updates directly in Discord.
              </p>
              <div className="text-link group-hover:text-link-hover flex items-center gap-1 text-sm font-semibold">
                Explore{" "}
                <Icon
                  icon="mdi:arrow-right"
                  className="h-4 w-4"
                  inline={true}
                />
              </div>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
