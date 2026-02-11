import Breadcrumb from "@/components/Layout/Breadcrumb";
import CalculatorCard from "@/components/Calculators/CalculatorCard";

const calculators = [
  {
    id: "inventory",
    title: "Inventory Calculator",
    description:
      "Check any player's Jailbreak inventory. View items, calculate net worth, and track inventory changes over time.",
    href: "/inventories",
    icon: "material-symbols:inventory-2",
    category: "Inventory",
    features: [
      "Search by username or Roblox ID",
      "View complete inventory details",
      "Calculate total net worth",
      "Track your money trends over time",
    ],
    color: "bg-orange-500",
  },
  {
    id: "values",
    title: "Values Calculator",
    description:
      "Calculate item values and trading worth. Compare items, find similar items, and get accurate trade valuations.",
    href: "/values/calculator",
    icon: "material-symbols:calculate",
    category: "Inventory",
    features: [
      "Add items to offering/requesting sides",
      "Compare trade values with breakdown",
      "Find similar items by value range",
      "Switch between cash and duped values",
    ],
    color: "bg-blue-500",
  },
  {
    id: "season-xp",
    title: "Will I Make It?",
    description:
      "Calculate your chances of reaching level 10 in the current season. Plan your XP strategy and optimize your progress.",
    href: "/seasons/will-i-make-it",
    icon: "material-symbols:bar-chart",
    category: "Progression",
    features: [
      "Enter current level and XP progress",
      "Check if you'll reach level 10",
      "See daily XP requirements",
      "Account for season pass bonuses",
    ],
    color: "bg-green-500",
  },
  {
    id: "dupe-calculator",
    title: "Dupe Calculator",
    description:
      "Search for duplicated items in our database. Check if items have been reported as dupes and verify item authenticity.",
    href: "/dupes",
    icon: "material-symbols:warning",
    category: "Inventory",
    features: [
      "Search by owner name",
      "Filter by specific items",
      "View total dupe reports count",
      "Check if items are duped",
    ],
    color: "bg-red-500",
  },
  {
    id: "hyperchrome-pity",
    title: "Hyperchrome Pity Calculator",
    description:
      "Calculate robberies needed to reach the next Hyperchrome level. Track your pity progress and plan your grinding strategy.",
    href: "/values#hyper-pity-calc",
    icon: "material-symbols:auto-awesome",
    category: "Progression",
    features: [
      "Select current Hyperchrome level",
      "Enter current pity percentage",
      "Calculate robberies needed",
      "See pity for all levels",
    ],
    color: "bg-purple-500",
  },
];

import NitroCalculatorsRailAd from "@/components/Ads/NitroCalculatorsRailAd";

export default function CalculatorsPage() {
  return (
    <div className="container mx-auto px-4 pb-8">
      <NitroCalculatorsRailAd />
      <Breadcrumb />

      <div className="mb-8">
        <h1 className="text-primary-text mb-4 text-4xl font-bold">
          Jailbreak Changelogs Calculators
        </h1>
        <p className="text-secondary-text text-lg">
          Access our calculators in one place. From trading values to season
          progression, find the tools you need.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-2">
        {calculators.map((calculator) => (
          <CalculatorCard key={calculator.id} calculator={calculator} />
        ))}
      </div>
    </div>
  );
}
