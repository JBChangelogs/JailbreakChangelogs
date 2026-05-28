"use client";

import React, { useState } from "react";
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
                  <div className="bg-tertiary-bg text-secondary-text border-border-card border-t px-5 py-4 text-sm leading-relaxed">
                    {typeof faq.answer === "string" ? (
                      <span dangerouslySetInnerHTML={{ __html: faq.answer }} />
                    ) : (
                      faq.answer
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OGFinderFAQ;
