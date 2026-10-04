export interface NavigationItem {
  href: string;
  icon: string;
  title: string;
  description: string;
  badge?: "coming-soon" | "new" | "live";
  className?: string;
  prefetch?: boolean;
}

export interface NavigationSection {
  id: string;
  title: string;
  icon: string;
  items: NavigationItem[];
}

export const navigationSections: NavigationSection[] = [
  {
    id: "updates",
    title: "Updates",
    icon: "material-symbols:article-rounded",
    items: [
      {
        href: "/changelogs",
        icon: "material-symbols:article-rounded",
        title: "Game Changelogs",
        description: "Latest Jailbreak updates and patch notes",
      },
      {
        href: "/changelogs/timeline",
        icon: "material-symbols:schedule-rounded",
        title: "Timeline",
        description: "A simplified tree view of every update at a glance",
      },
    ],
  },
  {
    id: "seasons",
    title: "Seasons",
    icon: "material-symbols:layers-rounded",
    items: [
      {
        href: "/seasons",
        icon: "material-symbols:layers-rounded",
        title: "Browse Seasons",
        description: "Explore all game seasons and rewards",
      },
      {
        href: "/seasons/leaderboard",
        icon: "material-symbols:leaderboard-rounded",
        title: "Season Leaderboard",
        description: "See top-ranked players this season",
      },
      {
        href: "/seasons/contracts",
        icon: "material-symbols:task-alt-rounded",
        title: "Weekly Contracts",
        description:
          "Check this week's contracts and plan ahead without launching the game",
        className: "col-span-2",
      },
    ],
  },
  {
    id: "trading",
    title: "Trading",
    icon: "material-symbols:price-check-rounded",
    items: [
      {
        href: "/values",
        icon: "material-symbols:price-check-rounded",
        title: "Value List",
        description: "Browse item values and market trends",
      },
      {
        href: "/values/calculator",
        icon: "material-symbols:calculate-rounded",
        title: "Value Calculator",
        description: "Compare item values before you trade",
      },
      {
        href: "/items/suggestions",
        icon: "material-symbols:lightbulb-outline-rounded",
        title: "Item Suggestions",
        description: "Suggest value changes and vote on proposals",
      },
      {
        href: "/items/changelogs",
        icon: "material-symbols:history-rounded",
        title: "Item Changelogs",
        description: "See value changes, community votes, and decisions",
      },
      {
        href: "/trading",
        icon: "material-symbols:swap-horiz-rounded",
        title: "Trade Ads",
        description: "Browse and post player trade listings",
        className: "col-span-2",
      },
    ],
  },
  {
    id: "trackers",
    title: "Tools & Trackers",
    icon: "material-symbols:sensors-rounded",
    items: [
      {
        href: "/robberies",
        icon: "material-symbols:money-bag-rounded",
        title: "Robbery Tracker",
        description: "See which robberies and mansions are open right now",
        badge: "live",
      },
      {
        href: "/bounties",
        icon: "mdi:currency-usd",
        title: "Bounty Tracker",
        description: "Find the highest bounty players and join their server",
        badge: "live",
      },
      {
        href: "/inventories",
        icon: "material-symbols:inventory-2-rounded",
        title: "Inventory Checker",
        description: "View any player's full inventory and net worth",
      },
      {
        href: "/og",
        icon: "material-symbols:fingerprint-rounded",
        title: "OG Finder",
        description: "Discover who holds the rarest original items",
      },
      {
        href: "/dupes",
        icon: "material-symbols:content-copy-rounded",
        title: "Dupe Finder",
        description: "Check if items are duped before you trade",
      },
      {
        href: "/seasons/will-i-make-it",
        icon: "material-symbols:trending-up-rounded",
        title: "Will I Make It",
        description:
          "Enter your level and XP to see if you'll hit level 10 before the season ends",
      },
      {
        href: "/hyperchrome-pity",
        icon: "material-symbols:percent-rounded",
        title: "Hyperchrome Pity",
        description: "Estimate robberies until your next Hyperchrome level",
        className: "col-span-2",
      },
    ],
  },
  {
    id: "community",
    title: "Community",
    icon: "material-symbols:groups-rounded",
    items: [
      {
        href: "/users",
        icon: "material-symbols:person-search-rounded",
        title: "User Search",
        description: "Browse 60k+ Jailbreak Changelogs user profiles",
        prefetch: false,
      },
      {
        href: "/servers",
        icon: "material-symbols:groups-rounded",
        title: "Private Servers",
        description: "Find and join private servers",
      },
      {
        href: "/contributors",
        icon: "material-symbols:groups-rounded",
        title: "Meet the Team",
        description: "The people behind this site",
      },
      {
        href: "/testimonials",
        icon: "material-symbols:rate-review-rounded",
        title: "Testimonials",
        description: "What players say about us",
      },
      {
        href: "/supporting",
        icon: "material-symbols:favorite-rounded",
        title: "Support Us",
        description: "Unlock perks like ad removal, custom avatars, and more",
        className: "col-span-2",
      },
    ],
  },
];
