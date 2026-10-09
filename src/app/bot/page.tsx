import { Icon } from "../../components/ui/IconWrapper";
import { getRandomBackgroundImage } from "@/utils/helpers/fisherYatesShuffle";
import HeroBackgroundCarousel from "@/components/Home/HeroBackgroundCarousel";
import { Button } from "@/components/ui/button";
import { DiscordIcon } from "@/components/Icons/DiscordIcon";

const features = [
  {
    title: "Inventory Lookups",
    icon: "mdi:console",
    commands: ["/inventory"],
    description:
      "Browse your inventory or look up another player’s items without leaving Discord.",
  },
  {
    title: "Item Values & Demand",
    icon: "mdi:chart-line",
    commands: ["/item", "/items"],
    description:
      "Check cash and duped values, demand, and item details before your next trade.",
  },
  {
    title: "Dupe Checks",
    icon: "mdi:swap-horizontal",
    commands: ["/dupecheck", "/dupes"],
    description:
      "Check an item from a specific original owner or browse a player’s recorded dupes.",
  },
  {
    title: "Original Items",
    icon: "material-symbols:fingerprint-rounded",
    commands: ["/ogs"],
    description:
      "Find the original items logged for you or another player in the inventory database.",
  },
  {
    title: "Networth History",
    icon: "mdi:cash-multiple",
    commands: ["/networth"],
    description:
      "View recorded networth and explore its history with graphs and past snapshots.",
  },
  {
    title: "Seasons & Rewards",
    icon: "mdi:calendar",
    commands: ["/season", "/rewards"],
    description:
      "Look up a Jailbreak season and browse its rewards right in your server.",
  },
  {
    title: "Changelog History",
    icon: "mdi:file-document",
    commands: ["/changelog", "/changelogs"],
    description:
      "Browse recorded Jailbreak updates or pull up the patch notes for a specific release.",
  },
  {
    title: "Personal Reminders",
    icon: "mdi:clock-outline",
    commands: ["/reminder"],
    description:
      "Set a timed reminder and receive a Discord DM when it’s due. Requires a website account.",
  },
  {
    title: "Your Notifications",
    icon: "mdi:bell-outline",
    commands: ["/notifications", "/notificationhistory"],
    description:
      "Read your website notifications and their history privately in Discord. Requires a website account.",
  },
];

export default function BotPage() {
  const initialImage = getRandomBackgroundImage();

  return (
    <main className="bg-primary-bg min-h-screen">
      <section className="relative overflow-hidden pt-16 pb-12 md:py-20">
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
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-12">
            <div>
              <h1 className="mb-5 max-w-3xl text-3xl font-bold text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.65)] md:text-5xl lg:text-6xl">
                Jailbreak Changelogs Discord Bot
              </h1>
              <p className="mb-6 max-w-2xl text-base text-white/95 drop-shadow-[0_1px_8px_rgba(0,0,0,0.55)] md:text-lg">
                Look up inventories, check item values, review dupes, and catch
                up on updates without leaving your server.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg">
                  <a
                    href="https://discord.com/discovery/applications/1281308669299920907"
                    target="_blank"
                    rel="noopener noreferrer"
                    data-rybbit-event="Bot Invite Click"
                  >
                    <DiscordIcon className="h-5 w-5" />
                    Invite to Your Server
                  </a>
                </Button>
                <Button asChild size="lg" variant="heroOutline">
                  <a href="#bot-features">Explore Features</a>
                </Button>
              </div>
              <p className="mt-5 flex items-center gap-2 text-sm text-white/80">
                <Icon icon="mdi:account-group" className="h-4 w-4" />
                Trusted by Jailbreak communities
              </p>
            </div>

            <div className="border-border-card bg-secondary-bg rounded-2xl border p-5 shadow-xl md:p-6">
              <div className="border-border-card mb-5 flex items-center gap-3 border-b pb-5">
                <div className="bg-button-info/15 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl">
                  <DiscordIcon className="text-link h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-primary-text text-lg font-bold">
                    Example Commands
                  </h2>
                  <p className="text-secondary-text text-sm">
                    Look up inventories, item values, and dupes.
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  {
                    command: "/inventory",
                    description: "Look up a player’s inventory",
                    icon: "mdi:console",
                  },
                  {
                    command: "/item",
                    description: "Check an item’s value and demand",
                    icon: "mdi:chart-line",
                  },
                  {
                    command: "/dupecheck",
                    description: "Check for duplicated items",
                    icon: "mdi:swap-horizontal",
                  },
                ].map(({ command, description, icon }) => (
                  <div
                    key={command}
                    className="border-border-card bg-tertiary-bg flex items-center gap-3 rounded-xl border p-4"
                  >
                    <Icon icon={icon} className="text-link h-5 w-5 shrink-0" />
                    <div>
                      <code className="text-primary-text text-sm font-semibold">
                        {command}
                      </code>
                      <p className="text-secondary-text mt-1 text-sm">
                        {description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-secondary-text mt-5 text-xs">
                Plus networth history, seasons, and personal reminders.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="bot-features" className="scroll-mt-20 pt-6 pb-12 md:pb-16">
        <div className="container mx-auto px-4">
          <div className="mb-6">
            <h2 className="text-primary-text text-3xl font-bold md:text-4xl">
              Bot Features
            </h2>
            <p className="text-secondary-text mt-3 max-w-2xl">
              Check inventories, item values, seasons, and more with Discord
              commands.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {features.map(({ title, icon, commands, description }) => (
              <div
                key={title}
                className="border-border-card bg-secondary-bg flex flex-col rounded-2xl border p-5 md:p-6"
              >
                <div className="mb-4 flex items-center gap-3">
                  <div className="bg-button-info/15 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg">
                    <Icon
                      icon={icon}
                      className="text-link h-6 w-6"
                      inline={true}
                    />
                  </div>
                  <h3 className="text-primary-text text-lg font-semibold">
                    {title}
                  </h3>
                </div>
                <p className="text-secondary-text mb-5 text-sm leading-relaxed">
                  {description}
                </p>
                <div className="mt-auto flex flex-wrap gap-2">
                  {commands.map((command) => (
                    <code
                      key={command}
                      className="bg-tertiary-bg text-link rounded-md px-2 py-1 text-xs"
                    >
                      {command}
                    </code>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
