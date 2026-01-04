"use client";

import React from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
} from "@mui/material";
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
        <span className="text-primary-text font-semibold">duped</span>. That’s
        why some items can change status over time. If you believe your item has
        been falsely flagged as a dupe, please report it by opening a support
        ticket{" "}
        <a
          href="https://discord.com/channels/1286064050135896064/1392693026865811518"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary-text font-semibold underline hover:opacity-80"
        >
          here
        </a>
      </>
    ),
  },
  {
    question: "How much data do you have?",
    answer:
      "We've logged over 8 million items and counting! Our comprehensive database continues to grow daily as we scan inventories across the Jailbreak community, providing the most extensive dupe detection available.",
  },
  {
    question: "How does this compare to the dupe calculator (deprecated)?",
    answer:
      "Unlike the old dupe calculator, you can't manually report dupes with this new system, making it way more accurate. It's powered by the comprehensive data we have collected, including unknown dupes that don't show up on competitor websites.",
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
        still believe it is a false dupe, you can report it by opening a support
        ticket in our{" "}
        <a
          href="https://discord.com/channels/1286064050135896064/1392693026865811518"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary-text inline-flex items-center gap-1 font-semibold underline transition-opacity hover:opacity-80"
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
  return (
    <div className="border-border-primary bg-secondary-bg shadow-card-shadow mt-8 rounded-lg border p-6">
      <h3 className="text-primary-text mb-4 text-xl font-semibold">
        Frequently Asked Questions
      </h3>

      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <Accordion
            key={index}
            defaultExpanded={index === 0}
            sx={{
              color: "var(--color-primary-text)",
              backgroundColor: "var(--color-tertiary-bg)",
              border: "1px solid var(--color-border-primary)",
              borderRadius: "8px",
              "&:before": {
                display: "none",
              },
              "& .MuiAccordionSummary-root": {
                backgroundColor: "var(--color-tertiary-bg)",
                "&:hover": {
                  backgroundColor: "var(--color-quaternary-bg)",
                },
              },
            }}
          >
            <AccordionSummary
              expandIcon={
                <Icon
                  icon="heroicons-outline:chevron-down"
                  className="h-6 w-6"
                  style={{ color: "var(--color-secondary-text)" }}
                />
              }
              sx={{
                "& .MuiAccordionSummary-content": {
                  margin: "12px 0",
                },
              }}
            >
              <Typography className="text-primary-text font-semibold">
                {faq.question}
              </Typography>
            </AccordionSummary>
            <AccordionDetails
              sx={{ backgroundColor: "var(--color-primary-bg)" }}
            >
              <Typography className="text-secondary-text">
                {faq.answer}
              </Typography>
            </AccordionDetails>
          </Accordion>
        ))}
      </div>
    </div>
  );
};

export default DupeFinderFAQ;
