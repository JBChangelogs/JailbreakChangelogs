"use client";

import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { Suspense } from "react";
import { CheckCircleIcon } from "@heroicons/react/24/outline";
import { Icon } from "../UI/IconWrapper";
import VersionInfo from "@/components/Layout/VersionInfo";
import ReportIssueButton from "@/components/ReportIssue/ReportIssueButton";
const Tooltip = dynamic(() => import("@mui/material/Tooltip"));

interface FooterProps {
  githubUrl: string;
  versionInfo: {
    version: string;
    date: string;
    branch: string;
  };
}

export default function Footer({ githubUrl, versionInfo }: FooterProps) {
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
                  <Icon
                    icon="prime:twitter"
                    className="text-primary-text h-6 w-6"
                    inline={true}
                  />
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
                  <Icon
                    icon="skill-icons:discord"
                    className="h-6 w-6"
                    inline={true}
                  />
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
                  <Icon
                    icon="simple-icons:roblox"
                    className="text-primary-text h-6 w-6"
                    inline={true}
                  />
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
                  <Icon
                    icon="logos:bluesky"
                    className="h-6 w-6"
                    inline={true}
                  />
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
                <Icon
                  icon="logos:reddit-icon"
                  className="h-5 w-5"
                  inline={true}
                />
                r/RobloxJailbreak
              </a>
              <a
                href="https://discord.gg/jailbreak"
                target="_blank"
                rel="noopener noreferrer"
                className="text-link hover:text-link-hover active:text-link-active flex items-center gap-2 transition-colors duration-200"
              >
                <Icon
                  icon="skill-icons:discord"
                  className="h-5 w-5"
                  inline={true}
                />
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
                <Icon icon="carbon:wikis" className="h-5 w-5" inline={true} />
                Jailbreak Wiki
              </a>
              <Link
                href="/faq"
                className="text-link hover:text-link-hover active:text-link-active flex items-center gap-2 transition-colors duration-200"
              >
                <Icon
                  icon="material-symbols:question-mark"
                  className="h-5 w-5"
                  inline={true}
                />
                FAQ
              </Link>
              <Link
                href="/redeem"
                className="text-link hover:text-link-hover active:text-link-active flex items-center gap-2 transition-colors duration-200"
              >
                <Icon
                  icon="material-symbols:redeem-rounded"
                  className="h-5 w-5"
                  inline={true}
                />
                Redeem Code
              </Link>
              <Link
                href="/bot"
                className="text-link hover:text-link-hover active:text-link-active flex items-center gap-2 transition-colors duration-200"
              >
                <Icon icon="bx:bot" className="h-5 w-5" inline={true} />
                Discord Bot
              </Link>
              <a
                href="https://status.jailbreakchangelogs.xyz"
                target="_blank"
                rel="noopener noreferrer"
                className="text-link hover:text-link-hover active:text-link-active flex items-center gap-2 transition-colors duration-200"
              >
                <CheckCircleIcon className="h-5 w-5" />
                Uptime Status
              </a>
              <Suspense
                fallback={
                  <div className="text-link hover:text-link-hover flex w-full cursor-pointer items-center gap-2">
                    <Icon
                      icon="solar:bug-linear"
                      className="h-5 w-5"
                      inline={true}
                    />
                    Report an Issue
                  </div>
                }
              >
                <ReportIssueButton />
              </Suspense>
              <button
                onClick={() => {
                  const event = new CustomEvent("openCookieSettings");
                  window.dispatchEvent(event);
                }}
                className="text-link hover:text-link-hover active:text-link-active flex items-center gap-2 transition-colors duration-200 cursor-pointer bg-none border-none p-0"
              >
                <Icon
                  icon="material-symbols:cookie-outline-rounded"
                  className="h-5 w-5"
                  inline={true}
                />
                Manage Cookies
              </button>
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
              <VersionInfo
                version={versionInfo.version}
                date={versionInfo.date}
                branch={versionInfo.branch}
              />
              <div className="flex flex-col gap-2 pt-4">
                <Link
                  href="/supporting"
                  className="bg-button-info text-form-button-text hover:bg-button-info-hover active:bg-button-info-active focus:ring-border-focus flex items-center justify-center gap-2 rounded-lg px-4 py-2 transition-colors duration-200 focus:ring-2 focus:outline-none"
                >
                  <Image
                    src="https://assets.jailbreakchangelogs.xyz/assets/images/kofi_assets/kofi_symbol.svg"
                    alt="Kofi Symbol"
                    width={24}
                    height={24}
                    style={{ display: "inline-block" }}
                  />
                  <strong>Support Us</strong>
                </Link>
                <a
                  href={githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-form-button-text bg-button-info hover:bg-button-info-hover active:bg-button-info-active focus:ring-border-focus flex items-center justify-center gap-2 rounded-lg border-none px-4 py-2 transition-colors duration-200 focus:ring-2 focus:outline-none"
                >
                  <Icon icon="mdi:github" className="h-5 w-5" inline={true} />
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
                className="text-link hover:text-link-hover active:text-link-active transition-colors duration-200"
              >
                Privacy Policy
              </Link>
              <Link
                href="/tos"
                className="text-link hover:text-link-hover active:text-link-active transition-colors duration-200"
              >
                Terms of Service
              </Link>
              <a
                href="mailto:support@jailbreakchangelogs.xyz"
                className="text-link hover:text-link-hover active:text-link-active transition-colors duration-200"
              >
                Contact Us
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
