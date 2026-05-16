"use client";

import React from "react";
import { Icon } from "@/components/ui/IconWrapper";

const faqs = [
  {
    question: "What is the OG Finder?",
    answer:
      "The OG Finder is a tool that helps you locate items you originally owned in Jailbreak but have since traded away. It shows you who currently possesses your former items and tracks their journey through the trading community.",
  },
  {
    question: "How do I use the OG Finder?",
    answer:
      "Enter your Roblox ID or username in the search box above. The system will identify all items you originally owned but traded away, displaying who currently has them in their inventory.",
  },
  {
    question: "Why OG Items May Not Show",
    answer: (
      <>
        Items may not appear in our system if the current owner has not been
        scanned by our bots. Our database only tracks inventories that have been
        logged during active scans, so if an item is sitting with someone who
        rarely plays or has quit, it may never show up.
        <br />
        <br />
        This is especially common with older &quot;OG&quot; items. Once the bots
        join the owner in trade world, their items (including your OG items if
        they have them) will be scanned and added to results.
        <br />
        <br />
        ℹ️ This question is asked often — if your OG item isn&apos;t visible, it
        doesn&apos;t mean it&apos;s gone. It simply means the current owner
        hasn&apos;t been scanned yet. In rare cases, the user may have been
        banned from Jailbreak as well.
      </>
    ),
  },
  {
    question: "How accurate is this information?",
    answer:
      "The data should be highly accurate for the most part. While this is a beta feature, we're confident in the reliability of the information displayed.",
  },
  {
    question: "Can I view detailed trading history?",
    answer:
      "Yes! Click on any item to view its complete trading history, including all previous owners and the dates when trades occurred.",
  },
  {
    question: "Can I manually add or report missing items?",
    answer:
      "No, our system is fully automated to maintain data accuracy and integrity. Items are only added when our bots scan inventories.",
  },
];

const OGFinderFAQ: React.FC = () => {
  return (
    <div className="border-border-card bg-secondary-bg mt-8 rounded-lg border p-6">
      <h3 className="text-primary-text mb-4 text-xl font-semibold">
        Frequently Asked Questions
      </h3>

      <div className="space-y-2">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className="border-border-card overflow-hidden rounded-lg border"
          >
            <details open={index === 0} className="group">
              <summary className="bg-tertiary-bg hover:bg-quaternary-bg flex cursor-pointer list-none items-center justify-between px-4 py-3 transition-colors [&::-webkit-details-marker]:hidden">
                <span className="text-primary-text font-semibold">
                  {faq.question}
                </span>
                <Icon
                  icon="heroicons-outline:chevron-down"
                  className="text-secondary-text h-5 w-5 transition-transform group-open:rotate-180"
                />
              </summary>
              <div className="bg-tertiary-bg px-4 pt-3 pb-4">
                {typeof faq.answer === "string" ? (
                  <p className="text-secondary-text">{faq.answer}</p>
                ) : (
                  <div className="text-secondary-text">{faq.answer}</div>
                )}
              </div>
            </details>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OGFinderFAQ;
