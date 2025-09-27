"use client";

import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { Suspense } from "react";
import {
  GlobeAltIcon,
  QuestionMarkCircleIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  EnvelopeIcon,
  BugAntIcon,
} from "@heroicons/react/24/outline";
import VersionInfo from "@/components/Layout/VersionInfo";
import ReportIssueButton from "@/components/ReportIssue/ReportIssueButton";
import { useTheme } from "@/contexts/ThemeContext";

const Tooltip = dynamic(() => import("@mui/material/Tooltip"));

export default function Footer() {
  const { resolvedTheme } = useTheme();

  return (
    <footer className="bg-secondary-bg border-border-primary border-t py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {/* Follow Us */}
          <div className="space-y-4">
            <h3 className="text-primary-text mb-4 text-lg font-semibold">
              Follow Us
            </h3>
            <div className="flex gap-4">
              <Tooltip
                title="Follow us on X (Twitter)"
                arrow
                placement="top"
                slotProps={{
                  tooltip: {
                    sx: {
                      backgroundColor: "var(--color-secondary-bg)",
                      color: "var(--color-primary-text)",
                      "& .MuiTooltip-arrow": {
                        color: "var(--color-secondary-bg)",
                      },
                    },
                  },
                }}
              >
                <a
                  href="https://x.com/JBChangelogs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-link hover:text-link-hover hover:bg-quaternary-bg rounded-full p-3 transition-colors duration-200"
                  aria-label="Twitter/X"
                >
                  <svg
                    className="h-6 w-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
              </Tooltip>
              <Tooltip
                title="Join our Discord server"
                arrow
                placement="top"
                slotProps={{
                  tooltip: {
                    sx: {
                      backgroundColor: "var(--color-secondary-bg)",
                      color: "var(--color-primary-text)",
                      "& .MuiTooltip-arrow": {
                        color: "var(--color-secondary-bg)",
                      },
                    },
                  },
                }}
              >
                <a
                  href="https://discord.jailbreakchangelogs.xyz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-link hover:text-link-hover hover:bg-quaternary-bg rounded-full p-3 transition-colors duration-200"
                  aria-label="Discord"
                >
                  <svg
                    className="h-6 w-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
                  </svg>
                </a>
              </Tooltip>
              <Tooltip
                title="Join our Roblox group"
                arrow
                placement="top"
                slotProps={{
                  tooltip: {
                    sx: {
                      backgroundColor: "var(--color-secondary-bg)",
                      color: "var(--color-primary-text)",
                      "& .MuiTooltip-arrow": {
                        color: "var(--color-secondary-bg)",
                      },
                    },
                  },
                }}
              >
                <a
                  href="https://www.roblox.com/communities/35348206/Jailbreak-Changelogs#!/about"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-link hover:text-link-hover hover:bg-quaternary-bg rounded-full p-3 transition-colors duration-200"
                  aria-label="Roblox Group"
                >
                  <svg
                    className="h-6 w-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M18.926 23.998L0 18.892L5.075.002L24 5.108ZM15.348 10.09l-5.282-1.453l-1.414 5.273l5.282 1.453z" />
                  </svg>
                </a>
              </Tooltip>
              <Tooltip
                title="Follow us on Bluesky"
                arrow
                placement="top"
                slotProps={{
                  tooltip: {
                    sx: {
                      backgroundColor: "var(--color-secondary-bg)",
                      color: "var(--color-primary-text)",
                      "& .MuiTooltip-arrow": {
                        color: "var(--color-secondary-bg)",
                      },
                    },
                  },
                }}
              >
                <a
                  href="https://bsky.app/profile/jbchangelogs.bsky.social"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-link hover:text-link-hover hover:bg-quaternary-bg rounded-full p-3 transition-colors duration-200"
                  aria-label="Bluesky"
                >
                  <svg
                    className="h-6 w-6"
                    fill="currentColor"
                    viewBox="0 0 256 226"
                  >
                    <path d="M55.491 15.172c29.35 22.035 60.917 66.712 72.509 90.686c11.592-23.974 43.159-68.651 72.509-90.686C221.686-.727 256-13.028 256 26.116c0 7.818-4.482 65.674-7.111 75.068c-9.138 32.654-42.436 40.983-72.057 35.942c51.775 8.812 64.946 38 36.501 67.187c-54.021 55.433-77.644-13.908-83.696-31.676c-1.11-3.257-1.63-4.78-1.637-3.485c-.008-1.296-.527.228-1.637 3.485c-6.052 17.768-29.675 87.11-83.696 31.676c-28.445-29.187-15.274-58.375 36.5-67.187c-29.62 5.041-62.918-3.288-72.056-35.942C4.482 91.79 0 33.934 0 26.116C0-13.028 34.314-.727 55.491 15.172" />
                  </svg>
                </a>
              </Tooltip>
            </div>
            <div className="pt-4">
              <p className="text-primary-text text-sm">Sub Communities:</p>
              <a
                href="https://www.reddit.com/r/RobloxJailbreak"
                target="_blank"
                rel="noopener noreferrer"
                className="text-link hover:text-link-hover active:text-link-active mt-2 flex items-center gap-2 transition-colors duration-200"
              >
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463 4.275 4.275 0 0 0 3.046 1.27c1.275 0 2.38-.488 3.046-1.27a.324.324 0 0 0 .047-.463.33.33 0 0 0-.464 0 3.795 3.795 0 0 1-2.629 1.27 3.795 3.795 0 0 1-2.63-1.27.33.33 0 0 0-.232-.095z" />
                </svg>
                r/RobloxJailbreak
              </a>
              <a
                href="https://discord.gg/jailbreak"
                target="_blank"
                rel="noopener noreferrer"
                className="text-link hover:text-link-hover active:text-link-active flex items-center gap-2 transition-colors duration-200"
              >
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
                Official Jailbreak Discord
              </a>
            </div>
          </div>

          {/* Resources */}
          <div className="space-y-4">
            <h3 className="text-primary-text mb-4 text-lg font-semibold">
              Resources
            </h3>
            <div className="space-y-2">
              <a
                href="https://jailbreak.fandom.com/wiki/Jailbreak_Wiki:Home"
                target="_blank"
                rel="noopener noreferrer"
                className="text-link hover:text-link-hover active:text-link-active flex items-center gap-2 transition-colors duration-200"
              >
                <GlobeAltIcon className="h-5 w-5" />
                Jailbreak Wiki
              </a>
              <Link
                href="/faq"
                className="text-link hover:text-link-hover active:text-link-active flex items-center gap-2 transition-colors duration-200"
              >
                <QuestionMarkCircleIcon className="h-5 w-5" />
                FAQ
              </Link>
              <Link
                href="/redeem"
                className="text-link hover:text-link-hover active:text-link-active flex items-center gap-2 transition-colors duration-200"
              >
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M20 7h-.7c.229-.467.349-.98.351-1.5a3.5 3.5 0 0 0-3.5-3.5c-1.717 0-3.215 1.2-4.331 2.481C10.4 2.842 8.949 2 7.5 2A3.5 3.5 0 0 0 4 5.5c.003.52.123 1.033.351 1.5H4a2 2 0 0 0-2 2v2a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1V9a2 2 0 0 0-2-2m-9.942 0H7.5a1.5 1.5 0 0 1 0-3c.9 0 2 .754 3.092 2.122c-.219.337-.392.635-.534.878m6.1 0h-3.742c.933-1.368 2.371-3 3.739-3a1.5 1.5 0 0 1 0 3zM13 14h-2v8h2zm-4 0H4v6a2 2 0 0 0 2 2h3zm6 0v8h3a2 2 0 0 0 2-2v-6z" />
                </svg>
                Redeem Code
              </Link>
              <Link
                href="/bot"
                className="text-link hover:text-link-hover active:text-link-active flex items-center gap-2 transition-colors duration-200"
              >
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
                Discord Bot
              </Link>
              <Suspense
                fallback={
                  <div className="text-link hover:text-link-hover flex w-full cursor-pointer items-center gap-2">
                    <BugAntIcon className="h-5 w-5" />
                    Report an Issue
                  </div>
                }
              >
                <ReportIssueButton />
              </Suspense>
              <div className="pt-2">
                <iframe
                  key={resolvedTheme}
                  src={`https://status.jailbreakchangelogs.xyz/badge?theme=${resolvedTheme}`}
                  width="250"
                  height="30"
                  frameBorder="0"
                  scrolling="no"
                  style={{ colorScheme: "normal" }}
                  title="Service Status Badge"
                />
              </div>
            </div>
          </div>

          {/* About */}
          <div className="space-y-4">
            <h3 className="text-primary-text mb-4 text-lg font-semibold">
              About
            </h3>
            <div className="space-y-2">
              <p className="text-secondary-text">
                This project is NOT affiliated with Badimo.
              </p>

              <p className="text-secondary-text">
                Maintained by{" "}
                <a
                  href="https://github.com/Jakobiis"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-link hover:text-link-hover active:text-link-active transition-colors duration-200 hover:underline"
                >
                  Jakobiis
                </a>{" "}
                and{" "}
                <a
                  href="https://github.com/Jalenzzz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-link hover:text-link-hover active:text-link-active transition-colors duration-200 hover:underline"
                >
                  Jalenzz16
                </a>
              </p>
              <VersionInfo />
              <div className="flex flex-col gap-2 pt-4">
                <Link
                  href="/supporting"
                  className="bg-button-info text-form-button-text hover:bg-button-info-hover active:bg-button-info-active focus:ring-border-focus flex items-center justify-center gap-2 rounded-lg px-4 py-2 transition-colors duration-200 focus:ring-2 focus:outline-none"
                >
                  <Image
                    src="/api/assets/images/kofi_assets/kofi_symbol.svg"
                    alt="Kofi Symbol"
                    width={24}
                    height={24}
                    style={{ display: "inline-block" }}
                  />
                  <strong>Support Us</strong>
                </Link>
                <a
                  href="https://github.com/JBChangelogs/JailbreakChangelogs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-form-button-text bg-button-info hover:bg-button-info-hover active:bg-button-info-active focus:ring-border-focus flex items-center justify-center gap-2 rounded-lg border-none px-4 py-2 transition-colors duration-200 focus:ring-2 focus:outline-none"
                >
                  <svg
                    className="h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                  <strong>View on GitHub</strong>
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8">
          <div className="flex flex-col gap-6">
            <p className="text-primary-text text-sm leading-relaxed">
              &copy; {new Date().getFullYear()} Jailbreak Changelogs LLC.
              Jailbreak Changelogs, JBCL, and any associated logos are
              trademarks, service marks, and/or registered trademarks of
              Jailbreak Changelogs LLC.
            </p>
            <div className="flex flex-wrap gap-6">
              <Link
                href="/privacy"
                className="text-link hover:text-link-hover active:text-link-active flex items-center gap-2 transition-colors duration-200"
              >
                <ShieldCheckIcon className="h-5 w-5" />
                Privacy Policy
              </Link>
              <Link
                href="/tos"
                className="text-link hover:text-link-hover active:text-link-active flex items-center gap-2 transition-colors duration-200"
              >
                <DocumentTextIcon className="h-5 w-5" />
                Terms of Service
              </Link>
              <a
                href="mailto:support@jailbreakchangelogs.xyz"
                className="text-link hover:text-link-hover active:text-link-active flex items-center gap-2 transition-colors duration-200"
              >
                <EnvelopeIcon className="h-5 w-5" />
                Contact Us
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
