"use client";

import React, { useState } from "react";
import { Icon } from "@/components/ui/IconWrapper";

const faqs = [
  {
    question: "What are on-demand inventory scans?",
    answer:
      "On-demand inventory scans allow you to request instant scans of your Roblox inventory at any time. Instead of waiting for automatic scans, you can trigger a scan manually to get the most up-to-date information about your items, including their current values and whether they are duped.<br><br>This feature is available to users who have logged in with Discord and connected their Roblox account, and have Supporter tier 3. You can request scans from your own inventory page.",
  },
  {
    question: "How do I request an on-demand inventory scan?",
    answer:
      'To request an on-demand scan:<br>1. Log in with Discord by clicking the Login button in the top right<br>2. Connect your Roblox account by clicking your avatar and selecting "Connect with Roblox"<br>3. Visit your own inventory page (you can find it by searching your Roblox username or Roblox ID)<br>4. Click the "Scan Inventory" button<br>5. Wait for the scan to complete - you\'ll see progress updates<br><br>Note: There\'s a 30-second cooldown between scans to prevent spam and abuse.',
  },
  {
    question: "Why can't I request a scan on someone else's inventory?",
    answer:
      "On-demand scans are only available for your own inventory to prevent abuse and ensure fair usage of our scanning resources. When viewing someone else's inventory, you'll see an informational notice about the feature, but the scan button will only appear on your own inventory page.",
  },
  {
    question: "What's the gold background around an item?",
    answer:
      "Items with a gold tint indicate that the user you looked up is the original owner of that item. This is in-game data — it's how Jailbreak itself differentiates items that were originally purchased by that player versus items they acquired through trading.",
  },
  {
    question: 'What if a scan fails or shows "No bots available"?',
    answer:
      'If you see "No bots available" or the scan fails:<br>• This means all our scanning bots are currently busy or offline<br>• Wait a few minutes and try again<br>• Make sure you\'re in a trading server in Roblox Jailbreak<br><br>If the issue persists, you can report it through our <a href="https://discord.jailbreakchangelogs.com" target="_blank" rel="noopener noreferrer" class="text-link hover:text-link-hover underline">Discord server</a>.',
  },
];

const InventoryFAQ: React.FC = () => {
  const [openQuestion, setOpenQuestion] = useState<string | null>(
    faqs[0].question,
  );

  return (
    <div className="mt-8">
      <h3 className="text-primary-text mb-4 text-xl font-semibold">
        Frequently Asked Questions
      </h3>

      <div className="space-y-2">
        {faqs.map((faq) => {
          const isOpen = openQuestion === faq.question;
          return (
            <div
              key={faq.question}
              className={`border-border-card overflow-hidden rounded-xl border transition-shadow ${
                isOpen ? "shadow-sm" : ""
              }`}
            >
              <button
                onClick={() => setOpenQuestion(isOpen ? null : faq.question)}
                className="bg-secondary-bg hover:bg-tertiary-bg flex w-full cursor-pointer items-center justify-between gap-3 px-5 py-4 text-left transition-colors"
                aria-expanded={isOpen}
              >
                <span className="text-primary-text text-sm leading-snug font-semibold">
                  {faq.question}
                </span>
                <Icon
                  icon="heroicons-outline:chevron-down"
                  className={`text-secondary-text h-4 w-4 shrink-0 transition-transform duration-200 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

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
    </div>
  );
};

export default InventoryFAQ;
