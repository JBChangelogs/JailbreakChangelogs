"use client";

import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
} from "@mui/material";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import { Icon } from "@/components/ui/IconWrapper";

const faqs = [
  {
    question: "What is Jailbreak?",
    answer:
      'Jailbreak is a 12-time award-winning game where you can orchestrate a robbery or catch criminals! Team up with friends for even more fun and plan the ultimate police raid or criminal heist. It can be played <a href="https://www.roblox.com/games/606849621/Jailbreak" target="_blank" rel="noopener noreferrer" class="text-link hover:text-link-hover underline">here</a> and is made by <a href="https://www.roblox.com/communities/3059674/Badimo#!/about" target="_blank" rel="noopener noreferrer" class="text-link hover:text-link-hover underline">Badimo</a>.',
  },
  {
    question: "Who are the creators of Jailbreak?",
    answer:
      'Jailbreak was created by Badimo, a development team consisting primarily of <a href="https://x.com/asimo3089" target="_blank" rel="noopener noreferrer" class="text-link hover:text-link-hover underline">asimo3089</a> and <a href="https://x.com/badccvoid" target="_blank" rel="noopener noreferrer" class="text-link hover:text-link-hover underline">badcc</a>. asimo3089 focuses on game design, while badcc handles the technical aspects of development. Together, they\'ve turned Jailbreak into one of the most popular and enduring games on the Roblox platform, continuously updating and improving it since its release in 2017.',
  },
  {
    question: "What platforms is Jailbreak available on?",
    answer:
      "Jailbreak is available on Roblox, which can be played on PC, mobile devices, and consoles.",
  },
  {
    question: "Are there any in-game purchases?",
    answer:
      "Yes, Jailbreak offers in-game purchases for items and upgrades, but the game can be enjoyed without spending money.",
  },
  {
    question: "How often is Jailbreak updated?",
    answer:
      "Jailbreak's update schedule has changed over time. Previously, the game received monthly updates. However, as of April 2024, Badimo announced that they would be discontinuing the monthly update cycle. The new update schedule is more flexible, allowing for both larger, less frequent updates and smaller, more frequent patches as needed. This change aims to provide higher quality content and address issues more efficiently.",
  },
  {
    question: "What are seasons in Jailbreak?",
    answer:
      "Seasons in Jailbreak are limited-time events that introduce new content, challenges, and rewards. Each season typically has a unique theme and offers items that players can earn by completing contracts or purchasing a season pass to unlock more prizes.",
  },
  {
    question: "Is there a way to report bugs or issues in the game?",
    answer:
      'Players can report bugs through the official Discord server or by using this form: <a href="https://forms.gle/FHSEsGGAknfqeSdB7" target="_blank" rel="noopener noreferrer" class="text-link hover:text-link-hover underline">Report Form</a>.',
  },
  {
    question: "Is there a way to follow Jailbreak news and updates?",
    answer:
      'Players can follow <a href="https://x.com/badimo" target="_blank" rel="noopener noreferrer" class="text-link hover:text-link-hover underline">Badimo</a>, <a href="https://x.com/asimo3089" target="_blank" rel="noopener noreferrer" class="text-link hover:text-link-hover underline">asimo3089</a>, and <a href="https://x.com/badccvoid" target="_blank" rel="noopener noreferrer" class="text-link hover:text-link-hover underline">badcc</a> on X, join the game\'s official Discord at <a href="https://discord.gg/jailbreak" target="_blank" rel="noopener noreferrer" class="text-link hover:text-link-hover underline">discord.gg/jailbreak</a>, or participate in the Reddit community at <a href="https://www.reddit.com/r/robloxjailbreak" target="_blank" rel="noopener noreferrer" class="text-link hover:text-link-hover underline">r/robloxjailbreak</a>.',
  },
  {
    question: "Why was the Jailbreak Changelogs website created?",
    answer:
      "The website was created to provide a central hub for all Jailbreak Changelog updates, reward details, and season information. It's a convenient place to stay informed about the latest changes and explore the evolution of Jailbreak over time.",
  },
  {
    question: "Where are the changelogs sourced from among the other data?",
    answer:
      'Changelogs are sourced from the <a href="https://jailbreak.fandom.com/wiki/Jailbreak_Wiki:Home" target="_blank" rel="noopener noreferrer" class="text-link hover:text-link-hover underline">Jailbreak Wiki</a>, the official Discord changelogs channel, Twitter posts by <a href="https://x.com/badimo" target="_blank" rel="noopener noreferrer" class="text-link hover:text-link-hover underline">Badimo</a>, <a href="https://x.com/asimo3089" target="_blank" rel="noopener noreferrer" class="text-link hover:text-link-hover underline">asimo3089</a>, and <a href="https://x.com/badccvoid" target="_blank" rel="noopener noreferrer" class="text-link hover:text-link-hover underline">badcc</a>, as well as community contributions.',
  },
  {
    question: "What is the Users page for?",
    answer:
      "The Users page is a community feature that allows users to create and customize their profiles on Jailbreak Changelogs. Users can:<br>1. Sign in with Discord to create a profile<br>2. Customize their profile with a bio and banner image<br>3. Follow other users and be followed<br>4. View and manage their comments on changelogs and seasons<br>5. Control privacy settings for their profile<br>This feature helps build a community around Jailbreak and allows players to connect with others who share their interest in the game.",
  },
  {
    question: "How do I report issues with the website?",
    answer:
      "To report website issues:<br>1. Visit the <a href='/?report-issue=true' class=\"text-link hover:text-link-hover underline\">report issue modal</a> or use the Report An Issue button at the bottom of any page<br>2. You must be logged in with Discord to submit issues<br>3. Follow these requirements:<br>&nbsp;&nbsp;• Issue Title must be at least 10 characters<br>&nbsp;&nbsp;• Description must be at least 25 characters<br>4. After submission, your issue will appear in our <a href='https://discord.jailbreakchangelogs.xyz' target='_blank' rel='noopener noreferrer' class=\"text-link hover:text-link-hover underline\">Discord server</a>'s issues channel",
  },
  {
    question: "How can I create trade ads?",
    answer:
      "To create trade ads, follow these steps:<br>1. Log in with Discord by clicking the Login button in the top right (if you see your avatar and username in the top right, you're already logged in)<br>2. Click your avatar and select 'Authenticate with Roblox' from the dropdown<br>3. Once authenticated, you can now create trade ads and make offers<br><br>Note: Roblox authentication is a one-time process. Future trade ads will only require Discord authentication if you've been logged out",
  },
  {
    question: "How can I suggest new values for items on the Values page?",
    answer:
      "Not happy with a value you see? If you think an item's value should be lower or higher, you can:<br>1. Join the Trading Discord at <a href='https://discord.gg/jailbreaktrading' target='_blank' rel='noopener noreferrer' class=\"text-link hover:text-link-hover underline\">discord.gg/jailbreaktrading</a><br>2. Navigate to their #value-suggestions channel<br>3. Submit your suggestion with reasoning<br><br>If approved, the updated value will appear on our website.",
  },
  {
    question: "How can I connect with JBChangelogs?",
    answer:
      'There are several ways to connect with us:<br>1. Join our Discord server at <a href="https://discord.jailbreakchangelogs.xyz" target="_blank" rel="noopener noreferrer" class="text-link hover:text-link-hover underline">discord.jailbreakchangelogs.xyz</a> to trade, hang out, and discuss the website<br>2. Follow us on X (Twitter) at <a href="https://x.com/JBChangelogs" target="_blank" rel="noopener noreferrer" class="text-link hover:text-link-hover underline">@JBChangelogs</a> for website updates and announcements<br>3. Join our Roblox group at <a href="https://www.roblox.com/communities/35348206/Jailbreak-Changelogs#!/about" target="_blank" rel="noopener noreferrer" class="text-link hover:text-link-hover underline">Jailbreak Changelogs Group</a><br>4. Follow us on Bluesky at <a href="https://bsky.app/profile/jbchangelogs.bsky.social" target="_blank" rel="noopener noreferrer" class="text-link hover:text-link-hover underline">@jbchangelogs.bsky.social</a>',
  },
  {
    question: "Who can I contact if I have questions or need assistance?",
    answer:
      'If you need assistance with the website, you can reach out to these Discord users: <a href="https://discord.com/users/659865209741246514" target="_blank" rel="noopener noreferrer" class="text-link hover:text-link-hover underline">@jakobiis</a> or <a href="https://discord.com/users/1019539798383398946" target="_blank" rel="noopener noreferrer" class="text-link hover:text-link-hover underline">@jalenzz</a>. Please note that these are Discord usernames and links to the individual profiles.',
  },
  {
    question: "What data is collected when I log in with Discord or Roblox?",
    answer:
      "We only collect data when you choose to authenticate:<br><br><strong>Discord Authentication:</strong><br>• Discord User ID<br>• Discord Avatar<br>• Discord Username and Global Name<br>• Discord Banner<br><br><strong>Roblox Authentication:</strong><br>• Roblox Username<br>• Roblox Player ID<br>• Roblox Display Name<br>• Roblox Avatar<br>• Roblox Join Date<br><br>Important: We only collect publicly available information, and only when you choose to log in. Users who browse without authentication have no personal data stored.",
  },
  {
    question: "What are on-demand inventory scans?",
    answer:
      "On-demand inventory scans allow you to request instant scans of your Roblox inventory at any time. Instead of waiting for automatic scans, you can trigger a scan manually to get the most up-to-date information about your items, including their current values and whether they are duped.<br><br>This feature is available to users who have logged in with Discord and connected their Roblox account. You can request scans from your own inventory page.",
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
    question: 'What if a scan fails or shows "No bots available"?',
    answer:
      'If you see "No bots available" or the scan fails:<br>• This means all our scanning bots are currently busy or offline<br>• Wait a few minutes and try again<br>• Make sure you\'re in a trading server in Roblox Jailbreak<br><br>If the issue persists, you can report it through our <a href="https://discord.jailbreakchangelogs.xyz" target="_blank" rel="noopener noreferrer" class="text-link hover:text-link-hover underline">Discord server</a>.',
  },
];

export default function FAQPage() {
  return (
    <div className="text-primary-text relative min-h-screen p-8">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40"
        style={{
          backgroundImage: "url(/backgrounds/v2/background5.webp)",
        }}
      />
      <div className="absolute inset-0 opacity-60" />
      <div className="relative mx-auto max-w-4xl">
        <Breadcrumb />
        <div className="mb-2 flex items-center gap-2">
          <Icon
            icon="heroicons-outline:question-mark-circle"
            className="text-secondary-text h-6 w-6"
          />
          <h1 className="text-primary-text text-2xl font-bold">
            Frequently Asked Questions
          </h1>
        </div>
        <p className="text-md text-primary-text mb-2">
          Find answers to common questions about Roblox Jailbreak and our
          Website
        </p>
        <p className="text-primary-text mb-6 text-xs">
          Last updated: September 13th, 2025
        </p>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <Accordion
              key={index}
              defaultExpanded={index === 0}
              sx={{
                color: "var(--color-primary-text)",
                "&:before": {
                  display: "none",
                },

                "& .MuiAccordionSummary-root": {
                  backgroundColor: "var(--color-secondary-bg)",
                  "&:hover": {
                    backgroundColor: "var(--color-quaternary-bg)",
                  },
                },
                "&:hover": {
                  borderColor: "var(--color-button-info)",
                },
                transition: "border-color 0.2s ease-in-out",
              }}
            >
              <AccordionSummary
                expandIcon={
                  <Icon
                    icon="heroicons-outline:chevron-down"
                    className="h-6 w-6"
                    style={{ color: "var(--color-primary-text)" }}
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
                sx={{ backgroundColor: "var(--color-tertiary-bg)" }}
              >
                <Typography
                  className="text-secondary-text"
                  dangerouslySetInnerHTML={{ __html: faq.answer }}
                />
              </AccordionDetails>
            </Accordion>
          ))}
        </div>
      </div>
    </div>
  );
}
