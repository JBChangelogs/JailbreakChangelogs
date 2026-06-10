"use client";

import { useState, useMemo, useEffect } from "react";
import Fuse from "fuse.js";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/IconWrapper";

type FaqCategory =
  | "jailbreak"
  | "website"
  | "trading"
  | "account"
  | "inventory";

const CATEGORIES: Array<{ id: "all" | FaqCategory; label: string }> = [
  { id: "all", label: "All Topics" },
  { id: "jailbreak", label: "Jailbreak" },
  { id: "website", label: "Website" },
  { id: "trading", label: "Trading & Values" },
  { id: "account", label: "Account & Privacy" },
  { id: "inventory", label: "Inventory Scans" },
];

const CATEGORY_STYLES: Record<
  FaqCategory,
  { pill: string; activePill: string }
> = {
  jailbreak: {
    pill: "text-primary-text bg-blue-400/10",
    activePill: "text-primary-text",
  },
  website: {
    pill: "text-primary-text bg-purple-400/10",
    activePill: "text-primary-text",
  },
  trading: {
    pill: "text-primary-text bg-emerald-400/10",
    activePill: "text-primary-text",
  },
  account: {
    pill: "text-primary-text bg-amber-400/10",
    activePill: "text-primary-text",
  },
  inventory: {
    pill: "text-primary-text bg-cyan-400/10",
    activePill: "text-primary-text",
  },
};

interface FAQ {
  question: string;
  answer: string;
  category: FaqCategory;
}

const faqs: FAQ[] = [
  {
    category: "jailbreak",
    question: "What is Jailbreak?",
    answer:
      'Jailbreak is a 12-time award-winning game where you can orchestrate a robbery or catch criminals! Team up with friends for even more fun and plan the ultimate police raid or criminal heist. It can be played <a href="https://www.roblox.com/games/606849621/Jailbreak" target="_blank" rel="noopener noreferrer" class="text-link hover:text-link-hover underline">here</a> and is made by <a href="https://www.roblox.com/communities/3059674/Badimo#!/about" target="_blank" rel="noopener noreferrer" class="text-link hover:text-link-hover underline">Badimo</a>.',
  },
  {
    category: "jailbreak",
    question: "Who are the creators of Jailbreak?",
    answer:
      'Jailbreak was created by Badimo, a development team consisting primarily of <a href="https://x.com/asimo3089" target="_blank" rel="noopener noreferrer" class="text-link hover:text-link-hover underline">asimo3089</a>, <a href="https://x.com/badccvoid" target="_blank" rel="noopener noreferrer" class="text-link hover:text-link-hover underline">badcc</a>, and <a href="https://x.com/REAL_EpicTank" target="_blank" rel="noopener noreferrer" class="text-link hover:text-link-hover underline">Epic_Tank</a>. asimo3089 focuses on game design, while badcc and Epic_Tank handles the technical aspects of development. Together, they\'ve turned Jailbreak into one of the most popular and enduring games on the Roblox platform, continuously updating and improving it since its release in 2017.',
  },
  {
    category: "jailbreak",
    question: "What platforms is Jailbreak available on?",
    answer:
      "Jailbreak is available on Roblox, which can be played on PC, mobile devices, and consoles.",
  },
  {
    category: "jailbreak",
    question: "Are there any in-game purchases?",
    answer:
      "Yes, Jailbreak offers in-game purchases for items and upgrades, but the game can be enjoyed without spending money.",
  },
  {
    category: "jailbreak",
    question: "How often is Jailbreak updated?",
    answer:
      "Jailbreak's update schedule has changed over time. Previously, the game received monthly updates. However, as of April 2024, Badimo announced that they would be discontinuing the monthly update cycle. The new update schedule is more flexible, allowing for both larger, less frequent updates and smaller, more frequent patches as needed. This change aims to provide higher quality content and address issues more efficiently. As of The Epic Update, the game has been receiving almost monthly updates because of the arrival of their new developer, Epic Tank.",
  },
  {
    category: "jailbreak",
    question: "What are seasons in Jailbreak?",
    answer:
      "Seasons in Jailbreak are limited-time events that introduce new content, challenges, and rewards. Each season typically has a unique theme and offers items that players can earn by completing contracts or purchasing a season pass to unlock more prizes.",
  },
  {
    category: "jailbreak",
    question: "Is there a way to report bugs or issues in the game?",
    answer:
      'Players can report bugs through the official Discord server inside the <a href="https://discord.com/channels/305880135372898314/1417191387094585375" target="_blank" rel="noopener noreferrer" class="text-link hover:text-link-hover underline">#forms channel</a>.',
  },
  {
    category: "jailbreak",
    question: "Is there a way to follow Jailbreak news and updates?",
    answer:
      'Players can follow <a href="https://x.com/badimo" target="_blank" rel="noopener noreferrer" class="text-link hover:text-link-hover underline">Badimo</a>, <a href="https://x.com/asimo3089" target="_blank" rel="noopener noreferrer" class="text-link hover:text-link-hover underline">asimo3089</a>, <a href="https://x.com/badccvoid" target="_blank" rel="noopener noreferrer" class="text-link hover:text-link-hover underline">badcc</a>, and <a href="https://x.com/REAL_EpicTank" target="_blank" rel="noopener noreferrer" class="text-link hover:text-link-hover underline">Epic_Tank</a> on X, join the game\'s official Discord at <a href="https://discord.gg/jailbreak" target="_blank" rel="noopener noreferrer" class="text-link hover:text-link-hover underline">discord.gg/jailbreak</a>, or participate in the Reddit community at <a href="https://www.reddit.com/r/robloxjailbreak" target="_blank" rel="noopener noreferrer" class="text-link hover:text-link-hover underline">r/robloxjailbreak</a>.',
  },
  {
    category: "website",
    question: "Why was the Jailbreak Changelogs website created?",
    answer:
      "The website was created to provide a central hub for all Jailbreak Changelog updates, reward details, and season information. It's a convenient place to stay informed about the latest changes and explore the evolution of Jailbreak over time.",
  },
  {
    category: "website",
    question: "Where are the changelogs sourced from among the other data?",
    answer:
      'Changelogs are sourced from the <a href="https://jailbreak.fandom.com/wiki/Jailbreak_Wiki:Home" target="_blank" rel="noopener noreferrer" class="text-link hover:text-link-hover underline">Jailbreak Wiki</a>, the official Discord changelogs channel, Twitter posts by <a href="https://x.com/badimo" target="_blank" rel="noopener noreferrer" class="text-link hover:text-link-hover underline">Badimo</a>, <a href="https://x.com/asimo3089" target="_blank" rel="noopener noreferrer" class="text-link hover:text-link-hover underline">asimo3089</a>, <a href="https://x.com/badccvoid" target="_blank" rel="noopener noreferrer" class="text-link hover:text-link-hover underline">badcc</a>, and <a href="https://x.com/REAL_EpicTank" target="_blank" rel="noopener noreferrer" class="text-link hover:text-link-hover underline">Epic_Tank</a>, as well as community contributions.',
  },
  {
    category: "website",
    question: "What is the Users page for?",
    answer:
      "The Users page is a community feature that allows users to create and customize their profiles on Jailbreak Changelogs. Users can:<br>1. Sign in with Discord to create a profile<br>2. Customize their profile with a bio and banner image<br>3. Follow other users and be followed<br>4. View and manage their comments on changelogs and seasons<br>5. Control privacy settings for their profile<br>This feature helps build a community around Jailbreak and allows players to connect with others who share their interest in the game.",
  },
  {
    category: "website",
    question: "How do I report issues with the website?",
    answer:
      "To report website issues:<br>1. Visit the <a href='/?report-issue=true' class=\"text-link hover:text-link-hover underline\">report issue modal</a> or use the Report An Issue button at the bottom of any page<br>2. You must be logged in with Discord to submit issues<br>3. Follow these requirements:<br>&nbsp;&nbsp;• Issue Title must be at least 10 characters<br>&nbsp;&nbsp;• Description must be at least 25 characters<br>4. After submission, your issue will appear in our <a href='https://discord.jailbreakchangelogs.com' target='_blank' rel='noopener noreferrer' class=\"text-link hover:text-link-hover underline\">Discord server</a>'s issues channel",
  },
  {
    category: "website",
    question: "How can I connect with JBChangelogs?",
    answer:
      'There are several ways to connect with us:<br>1. Join our Discord server at <a href="https://discord.jailbreakchangelogs.com" target="_blank" rel="noopener noreferrer" class="text-link hover:text-link-hover underline">discord.jailbreakchangelogs.com</a> to trade, hang out, and discuss the website<br>2. Follow us on X (Twitter) at <a href="https://x.com/JBChangelogs" target="_blank" rel="noopener noreferrer" class="text-link hover:text-link-hover underline">@JBChangelogs</a> for website updates and announcements<br>3. Join our Roblox group at <a href="https://www.roblox.com/communities/35348206/Jailbreak-Changelogs#!/about" target="_blank" rel="noopener noreferrer" class="text-link hover:text-link-hover underline">Jailbreak Changelogs Group</a><br>4. Follow us on Bluesky at <a href="https://bsky.app/profile/jbchangelogs.bsky.social" target="_blank" rel="noopener noreferrer" class="text-link hover:text-link-hover underline">@jbchangelogs.bsky.social</a>',
  },
  {
    category: "website",
    question: "Do you have an API, data export, or partner integration option?",
    answer:
      'We appreciate the interest! Unfortunately, we don\'t offer public API access, CSV/JSON exports, or third-party integrations at this time. Our backend handles a significant volume of data and keeping it stable for the site itself is the current priority. That said, it\'s something we\'re aware of and may explore down the line as the platform matures. If you\'re interested in being notified when public access becomes available, feel free to let us know in our <a href="https://discord.jailbreakchangelogs.com" target="_blank" rel="noopener noreferrer" class="text-link hover:text-link-hover underline">Discord server</a> — we\'ll keep track of those with interest for when the time comes.',
  },
  {
    category: "website",
    question: "How can I support the website?",
    answer:
      'Yes! Visit our <a href="/supporting" class="text-link hover:text-link-hover underline">Supporting</a> page where you can contribute either through real USD donations or via Robux. The page also shows the different supporter tiers and the perks you\'ll receive for each. Full instructions for both payment options are included.',
  },
  {
    category: "website",
    question: "Who can I contact if I have questions or need assistance?",
    answer:
      'If you need assistance with the website, you can reach out to these Discord users: <a href="https://discord.com/users/659865209741246514" target="_blank" rel="noopener noreferrer" class="text-link hover:text-link-hover underline">@jakobiis</a> or <a href="https://discord.com/users/1019539798383398946" target="_blank" rel="noopener noreferrer" class="text-link hover:text-link-hover underline">@jalenzz</a>. Please note that these are Discord usernames and links to the individual profiles.',
  },
  {
    category: "trading",
    question: "How can I create trade ads?",
    answer:
      "To create trade ads, follow these steps:<br>1. Log in with Discord by clicking the Login button in the top right (if you see your avatar and username in the top right, you're already logged in)<br>2. Click your avatar and select 'Authenticate with Roblox' from the dropdown<br>3. Once authenticated, you can now create trade ads and make offers<br><br>Note: Roblox authentication is a one-time process. Future trade ads will only require Discord authentication if you've been logged out",
  },
  {
    category: "trading",
    question: "Why do some items not have a duped value?",
    answer:
      "Not all dupes are considered negative — in cases where no duped value is listed, the clean value takes priority and applies regardless. Additionally, some items simply don't have a duped variant at all, as they were released after duping was patched out of the game.",
  },
  {
    category: "trading",
    question: "How can I suggest new values for items on the Values page?",
    answer:
      "Not happy with a value you see? You can suggest and vote on value changes directly on the website:<br>1. Visit the <a href='/values/suggestions' class=\"text-link hover:text-link-hover underline\">Value Suggestions</a> page<br>2. Submit a suggestion for any item with your proposed value and reasoning<br>3. Vote on existing suggestions from the community<br><br>Approved suggestions will be reflected in the value list. Not all suggestions with a high upvote count will be accepted.",
  },
  {
    category: "account",
    question: "What data is collected when I log in with Discord or Roblox?",
    answer:
      "We only collect data when you choose to authenticate:<br><br><strong>Discord Authentication:</strong><br>• Discord User ID<br>• Discord Avatar<br>• Discord Username and Global Name<br>• Discord Banner<br><br><strong>Roblox Authentication:</strong><br>• Roblox Username<br>• Roblox Player ID<br>• Roblox Display Name<br>• Roblox Avatar<br>• Roblox Join Date<br><br>Important: We only collect publicly available information, and only when you choose to log in. Users who browse without authentication have no personal data stored.",
  },
  {
    category: "inventory",
    question: "What's the gold background around an item?",
    answer:
      "Items with a gold tint indicate that the user you looked up is the original owner of that item. This is in-game data — it's how Jailbreak itself differentiates items that were originally purchased by that player versus items they acquired through trading.",
  },
  {
    category: "inventory",
    question: "What are on-demand inventory scans?",
    answer:
      "On-demand inventory scans allow you to request instant scans of your Roblox inventory at any time. Instead of waiting for automatic scans, you can trigger a scan manually to get the most up-to-date information about your items, including their current values and whether they are duped.<br><br>This feature is available to users who have logged in with Discord and connected their Roblox account, and have Supporter tier 3. You can request scans from your own inventory page.",
  },
  {
    category: "inventory",
    question: "How do I request an on-demand inventory scan?",
    answer:
      'To request an on-demand scan:<br>1. Log in with Discord by clicking the Login button in the top right<br>2. Connect your Roblox account by clicking your avatar and selecting "Connect with Roblox"<br>3. Visit your own inventory page (you can find it by searching your Roblox username or Roblox ID)<br>4. Click the "Scan Inventory" button<br>5. Wait for the scan to complete - you\'ll see progress updates<br><br>Note: There\'s a 30-second cooldown between scans to prevent spam and abuse.',
  },
  {
    category: "inventory",
    question: "Why can't I request a scan on someone else's inventory?",
    answer:
      "On-demand scans are only available for your own inventory to prevent abuse and ensure fair usage of our scanning resources. When viewing someone else's inventory, you'll see an informational notice about the feature, but the scan button will only appear on your own inventory page.",
  },
  {
    category: "inventory",
    question: 'What if a scan fails or shows "No bots available"?',
    answer:
      'If you see "No bots available" or the scan fails:<br>• This means all our scanning bots are currently busy or offline<br>• Wait a few minutes and try again<br>• Make sure you\'re in a trading server in Roblox Jailbreak<br><br>If the issue persists, you can report it through our <a href="https://discord.jailbreakchangelogs.com" target="_blank" rel="noopener noreferrer" class="text-link hover:text-link-hover underline">Discord server</a>.',
  },
];

// Fuzzy search index over questions and (HTML-stripped) answers. The FAQ list
// is static, so the index can be built once at module load.
const faqSearchIndex = new Fuse(
  faqs.map((faq) => ({
    question: faq.question,
    plainAnswer: faq.answer.replace(/<[^>]+>/g, ""),
  })),
  {
    keys: [
      { name: "question", weight: 2 },
      { name: "plainAnswer", weight: 1 },
    ],
    useTokenSearch: true,
    ignoreLocation: true,
    threshold: 0.3,
    minMatchCharLength: 2,
  },
);

export default function FAQPage() {
  const [activeCategory, setActiveCategory] = useState<"all" | FaqCategory>(
    "all",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [openQuestion, setOpenQuestion] = useState<string | null>(
    faqs[0].question,
  );

  const categoryCounts = useMemo(() => {
    const counts: Partial<Record<FaqCategory, number>> = {};
    for (const faq of faqs) {
      counts[faq.category] = (counts[faq.category] ?? 0) + 1;
    }
    return counts;
  }, []);

  const filteredFaqs = useMemo(() => {
    const trimmedQuery = searchQuery.trim();
    const matchingQuestions = trimmedQuery
      ? new Set(
          faqSearchIndex.search(trimmedQuery).map(({ item }) => item.question),
        )
      : null;

    return faqs.filter((faq) => {
      if (activeCategory !== "all" && faq.category !== activeCategory)
        return false;
      if (matchingQuestions && !matchingQuestions.has(faq.question))
        return false;
      return true;
    });
  }, [activeCategory, searchQuery]);

  useEffect(() => {
    setOpenQuestion(filteredFaqs[0]?.question ?? null);
  }, [filteredFaqs]);

  return (
    <div className="text-primary-text min-h-screen">
      <div className="mx-auto max-w-4xl px-4 pb-8">
        <Breadcrumb />

        {/* Header */}
        <div className="mb-8">
          <div className="mb-2">
            <h1 className="text-primary-text text-2xl font-bold">
              Frequently Asked Questions
            </h1>
          </div>
          <p className="text-secondary-text mt-1 text-xs">
            Last updated: May 23rd, 2026
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Icon
              icon="heroicons:magnifying-glass"
              className="text-secondary-text h-4 w-4"
            />
          </div>
          <input
            type="text"
            placeholder="Search questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-border-card bg-secondary-bg text-primary-text placeholder:text-secondary-text hover:border-border-focus focus:border-button-info h-11 w-full rounded-lg border px-4 py-2 pl-9 text-sm transition-colors focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-secondary-text hover:text-primary-text absolute top-1/2 right-3 -translate-y-1/2 transition-colors"
              aria-label="Clear search"
            >
              <Icon icon="heroicons:x-mark" className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Category filters */}
        <div className="mb-6 flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => {
            const count =
              cat.id === "all"
                ? faqs.length
                : (categoryCounts[cat.id as FaqCategory] ?? 0);
            const isActive = activeCategory === cat.id;
            return (
              <Button
                key={cat.id}
                onClick={() =>
                  setActiveCategory(
                    isActive && cat.id !== "all"
                      ? "all"
                      : (cat.id as typeof activeCategory),
                  )
                }
                variant={isActive ? "default" : "secondary"}
                size="sm"
              >
                {isActive && (
                  <Icon icon="heroicons:check" className="h-4 w-4" />
                )}
                {cat.label} ({count})
              </Button>
            );
          })}
        </div>

        {/* Results summary */}
        {(searchQuery || activeCategory !== "all") && (
          <p className="text-secondary-text mb-4 text-sm">
            {filteredFaqs.length === 0 ? (
              "No results found"
            ) : (
              <>
                Showing {filteredFaqs.length} of {faqs.length} questions
                {searchQuery && (
                  <span>
                    {" "}
                    matching &ldquo;
                    <span className="text-primary-text font-medium">
                      {searchQuery}
                    </span>
                    &rdquo;
                  </span>
                )}
              </>
            )}
          </p>
        )}

        {/* FAQ accordion */}
        {filteredFaqs.length > 0 ? (
          <div className="space-y-2">
            {filteredFaqs.map((faq) => {
              const isOpen = openQuestion === faq.question;
              const style = CATEGORY_STYLES[faq.category];
              const catLabel =
                CATEGORIES.find((c) => c.id === faq.category)?.label ?? "";

              return (
                <div
                  key={faq.question}
                  className={`border-border-card overflow-hidden rounded-xl border transition-shadow ${
                    isOpen ? "shadow-sm" : ""
                  }`}
                >
                  <button
                    onClick={() =>
                      setOpenQuestion(isOpen ? null : faq.question)
                    }
                    className="bg-secondary-bg hover:bg-tertiary-bg flex w-full cursor-pointer items-center justify-between gap-3 px-5 py-4 text-left transition-colors"
                    aria-expanded={isOpen}
                  >
                    <div className="flex min-w-0 flex-1 flex-col gap-1.5 sm:flex-row sm:items-center">
                      <span
                        className={`inline-flex shrink-0 items-center self-start rounded-lg px-2 py-0.5 text-[10px] font-medium sm:self-auto ${style.pill}`}
                      >
                        {catLabel}
                      </span>
                      <span className="text-primary-text text-sm leading-snug font-semibold">
                        {faq.question}
                      </span>
                    </div>
                    <Icon
                      icon="heroicons-outline:chevron-down"
                      className={`text-secondary-text h-4 w-4 shrink-0 transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Animated content via CSS grid trick */}
                  <div
                    className={`grid transition-[grid-template-rows] duration-200 ease-out ${
                      isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div
                        className="bg-tertiary-bg text-secondary-text border-border-card border-t px-5 py-4 text-sm leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: faq.answer }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="bg-tertiary-bg mb-4 flex h-14 w-14 items-center justify-center rounded-full">
              <Icon
                icon="heroicons-outline:magnifying-glass"
                className="text-secondary-text h-7 w-7"
              />
            </div>
            <h3 className="text-primary-text mb-1 text-base font-semibold">
              No questions found
            </h3>
            <p className="text-secondary-text text-sm">
              {searchQuery
                ? `No results for "${searchQuery}". Try different keywords.`
                : "No questions in this category."}
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setActiveCategory("all");
              }}
              className="text-button-info mt-4 cursor-pointer text-sm hover:underline"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
