"use client";

import React, { useState } from "react";
import { Icon } from "@/components/ui/IconWrapper";

const faqs = [
  {
    question: "What is the Dupe Finder?",
    answer:
      "The Dupe Finder is a tool that helps you identify potentially duplicated items in Jailbreak. It scans inventories to find items that may have been duplicated through exploits or glitches.",
  },
  {
    question: "How do I use the Dupe Finder?",
    answer:
      "Enter a Roblox ID or username in the search box above. The system will search through our collected data to identify any items associated with that user that appear to be duplicated based on our detection methods.",
  },
  {
    question: "How do we detect dupes?",
    answer: (
      <>
        Items marked as{" "}
        <span className="text-primary-text font-semibold">duped</span> are
        flagged because our system detects multiple active copies of the same
        item across different owners. Other sites rely on manual reports, while
        our list is generated automatically by our bots hopping servers and
        comparing inventories. This means we often identify more dupes than
        other sources. An item may appear{" "}
        <span className="text-primary-text font-semibold">clean</span> at first
        if only one copy is visible. Later, when another copy surfaces in
        trading, our system updates and marks it as{" "}
        <span className="text-primary-text font-semibold">duped</span>.
        That&apos;s why some items can change status over time. If you believe
        your item has been falsely flagged as a dupe, please report it via
        ModMail in our{" "}
        <a
          href="https://discord.com/channels/1286064050135896064/1392693026865811518"
          target="_blank"
          rel="noopener noreferrer"
          className="text-link hover:text-link-hover underline"
        >
          support channel
        </a>
      </>
    ),
  },
  {
    question: "How much data do you have?",
    answer:
      "We've logged over 32 million items and counting! Our comprehensive database continues to grow daily as we scan inventories across the Jailbreak community, providing the most extensive dupe detection available.",
  },
  {
    question: "How accurate is the dupe detection?",
    answer:
      "The data should be highly accurate for the most part. While this is a beta feature, we're confident in the reliability of the information displayed.",
  },
  {
    question: "Can I report incorrect detections or missed dupes?",
    answer: (
      <>
        Yes. While the detection is still fully automated based on our collected
        data, if you believe an item is incorrectly flagged, you should first
        use our{" "}
        <span className="text-primary-text font-semibold">
          Variant Comparison
        </span>{" "}
        tool. This tool, accessible by clicking &quot;Compare&quot; on any item
        card, allows you to view the ownership history of your item side-by-side
        with its original variant to see exactly where they diverge. If you
        still believe it is a false dupe, you can report it via ModMail in our{" "}
        <a
          href="https://discord.com/channels/1286064050135896064/1392693026865811518"
          target="_blank"
          rel="noopener noreferrer"
          className="text-link hover:text-link-hover underline"
        >
          Discord support channel
        </a>
        .
      </>
    ),
  },
  {
    question: "Why can't I find some users or items?",
    answer:
      "Items are constantly being added each day to grow our database bigger. Our system only tracks items that have been scanned by our bots, so if a user hasn't been scanned recently, their items won't appear in results.",
  },
  {
    question: "What happened to the old dupe calculator?",
    answer:
      "The old deprecated dupe calculator will be kept for reference but is no longer maintained. This new dupe finder provides more accurate and comprehensive results.",
  },
];

const DupeFinderFAQ: React.FC = () => {
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

export default DupeFinderFAQ;
