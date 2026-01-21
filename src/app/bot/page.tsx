import Link from "next/link";
import { Icon } from "../../components/ui/IconWrapper";
import { getRandomBackgroundImage } from "@/utils/fisherYatesShuffle";
import HeroBackgroundCarousel from "@/components/Home/HeroBackgroundCarousel";

export default function BotPage() {
  const initialImage = getRandomBackgroundImage();

  return (
    <main className="bg-primary-bg min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <HeroBackgroundCarousel initialImage={initialImage} />
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
              Welcome to our Discord Bot Page
            </h1>
            <p
              className="mx-auto mb-8 max-w-2xl text-base md:text-lg"
              style={{ color: "var(--color-form-button-text)" }}
            >
              Your go-to resource for information and updates about our Discord
              bot!
            </p>

            {/* Achievement Banner */}
            <div className="mx-auto mb-8 max-w-2xl">
              <div className="from-tertiary via-tertiary to-tertiary relative overflow-hidden rounded-xl bg-linear-to-r p-1">
                <div className="border-border-primary bg-secondary-bg rounded-lg border p-4">
                  <div className="flex flex-col items-center gap-3 text-center md:flex-row md:justify-center">
                    <div className="flex items-center gap-2">
                      <div>
                        <h2 className="text-card-headline flex items-center gap-2 text-lg font-bold md:text-xl">
                          <Icon
                            icon="mdi:trophy"
                            className="text-tertiary h-6 w-6"
                            inline={true}
                          />
                          #1 Roblox Jailbreak Bot
                        </h2>
                        <p className="text-card-paragraph text-xs md:text-sm">
                          The most popular Discord bot for Jailbreak servers
                        </p>
                      </div>
                    </div>
                    <div className="hidden md:block">
                      <span className="text-tertiary-text">|</span>
                    </div>
                    <div className="text-center md:text-left">
                      <p className="text-tertiary text-sm font-semibold md:text-base">
                        Most Servers Added
                      </p>
                      <p className="text-card-paragraph text-xs">
                        Trusted by Jailbreak communities
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <a
              href="https://discord.com/discovery/applications/1281308669299920907"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-button-info text-form-button-text hover:bg-button-info-hover focus:ring-border-focus active:bg-button-info-active inline-block rounded-lg px-8 py-3 text-lg font-semibold transition-colors duration-200 focus:ring-2 focus:outline-none"
            >
              Invite to Your Server
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-primary-text mb-12 text-center text-3xl font-bold">
            Bot Features
          </h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 - Inventory Commands */}
            <div className="border-border-primary bg-secondary-bg hover:border-border-focus hover:shadow-card-shadow rounded-lg border p-6 transition-colors duration-200 hover:shadow-lg">
              <div className="mb-4 flex items-center gap-2">
                <Icon
                  icon="mdi:console"
                  className="text-link h-6 w-6"
                  inline={true}
                />
                <h3 className="text-card-headline text-xl font-semibold">
                  Inventory Commands
                </h3>
              </div>
              <p className="text-card-paragraph">
                Check player inventories directly from Discord with /inventory
                commands. View detailed item listings without leaving your
                server.
              </p>
            </div>

            {/* Feature 2 - OG Finder */}
            <div className="border-border-primary bg-secondary-bg hover:border-border-focus hover:shadow-card-shadow rounded-lg border p-6 transition-colors duration-200 hover:shadow-lg">
              <div className="mb-4 flex items-center gap-2">
                <Icon
                  icon="mdi:lightning-bolt"
                  className="text-link h-6 w-6"
                  inline={true}
                />
                <h3 className="text-card-headline text-xl font-semibold">
                  OG Finder
                </h3>
              </div>
              <p className="text-card-paragraph">
                Find original owners of rare items using /og commands in
                Discord. Track item provenance and authenticity directly through
                the bot.
              </p>
            </div>

            {/* Feature 3 - Dupe Detection */}
            <div className="border-border-primary bg-secondary-bg hover:border-border-focus hover:shadow-card-shadow rounded-lg border p-6 transition-colors duration-200 hover:shadow-lg">
              <div className="mb-4 flex items-center gap-2">
                <Icon
                  icon="mdi:swap-horizontal"
                  className="text-link h-6 w-6"
                  inline={true}
                />
                <h3 className="text-card-headline text-xl font-semibold">
                  Dupe Detection
                </h3>
              </div>
              <p className="text-card-paragraph">
                Check for duplicated items with /dupe commands. Verify item
                authenticity before trading.
              </p>
            </div>

            {/* Feature 4 - Season Tracking */}
            <div className="border-border-primary bg-secondary-bg hover:border-border-focus hover:shadow-card-shadow rounded-lg border p-6 transition-colors duration-200 hover:shadow-lg">
              <div className="mb-4 flex items-center gap-2">
                <Icon
                  icon="mdi:calendar"
                  className="text-link h-6 w-6"
                  inline={true}
                />
                <h3 className="text-card-headline text-xl font-semibold">
                  Season Tracking
                </h3>
              </div>
              <p className="text-card-paragraph">
                View latest season content and rewards without leaving Discord.
                Stay updated on seasonal progress and requirements.
              </p>
            </div>

            {/* Feature 5 - Changelog History */}
            <div className="border-border-primary bg-secondary-bg hover:border-border-focus hover:shadow-card-shadow rounded-lg border p-6 transition-colors duration-200 hover:shadow-lg">
              <div className="mb-4 flex items-center gap-2">
                <Icon
                  icon="mdi:file-document"
                  className="text-link h-6 w-6"
                  inline={true}
                />
                <h3 className="text-card-headline text-xl font-semibold">
                  Changelog History
                </h3>
              </div>
              <p className="text-card-paragraph">
                View previous changelogs and seasons directly from Discord.
                Browse the complete history of Jailbreak updates.
              </p>
            </div>

            {/* Feature 6 - Trade Features */}
            <div className="border-border-primary bg-secondary-bg hover:border-border-focus hover:shadow-card-shadow rounded-lg border p-6 transition-colors duration-200 hover:shadow-lg">
              <div className="mb-4 flex items-center gap-2">
                <Icon
                  icon="mdi:chat"
                  className="text-link h-6 w-6"
                  inline={true}
                />
                <h3 className="text-card-headline text-xl font-semibold">
                  Trade Features
                </h3>
              </div>
              <p className="text-card-paragraph">
                Receive DMs when users want to trade with you and get trade ads
                automatically posted to our Discord server for maximum
                visibility.
              </p>
            </div>
          </div>
          <div className="mt-12 text-center">
            <p className="text-tertiary-text flex items-center justify-center gap-1">
              Bot made with{" "}
              <Icon
                icon="line-md:heart-filled"
                className="inline h-4 w-4 text-blue-500"
                style={{ color: "#1d80e2" }}
              />
              {" by "}
              <Link
                href="/users/659865209741246514"
                prefetch={false}
                className="text-link hover:text-link-hover active:text-link-active transition-colors duration-200 hover:underline"
              >
                Jakobiis
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
