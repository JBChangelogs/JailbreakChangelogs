"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { Suspense, useEffect } from "react";
import { Icon } from "../ui/IconWrapper";
import VersionInfo from "@/components/Layout/VersionInfo";
import ReportIssueButton from "@/components/ReportIssue/ReportIssueButton";
const Tooltip = dynamic(() => import("@mui/material/Tooltip"));

// Extend Window interface for CMP API (GDPR)
declare global {
  interface Window {
    __cmp?: (command: string) => void;
    __tcfapi?: unknown;
  }
}

interface FooterProps {
  githubUrl: string;
  versionInfo: {
    version: string;
    date: number;
    branch: string;
    commitUrl: string;
  };
}

export default function Footer({ githubUrl, versionInfo }: FooterProps) {
  useEffect(() => {
    // Show GDPR consent button only for EU users
    const showGDPRButton = () => {
      const consentBox = document.getElementById("gdpr-consent-box");
      if (consentBox && window.__tcfapi) {
        consentBox.style.display = "";
      }
    };

    if (window.nitroAds?.loaded) {
      showGDPRButton();
    } else {
      document.addEventListener("nitroAds.loaded", showGDPRButton);
      return () => {
        document.removeEventListener("nitroAds.loaded", showGDPRButton);
      };
    }
  }, []);

  return (
    <footer className="border-border-primary bg-secondary-bg w-full border-t py-8 pb-0">
      <div className="w-full px-4">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {/* Resources */}
          <div className="space-y-4">
            <h3 className="text-secondary-text text-sm">Resources</h3>
            <div className="space-y-2 text-sm">
              <a
                href="https://jailbreak.fandom.com/wiki/Jailbreak_Wiki:Home"
                target="_blank"
                rel="noopener noreferrer"
                className="text-link hover:text-link-hover active:text-link-active block transition-colors duration-200"
              >
                Jailbreak Wiki
              </a>
              <Link
                href="/faq"
                className="text-link hover:text-link-hover active:text-link-active block transition-colors duration-200"
              >
                FAQ
              </Link>
              <Link
                href="/redeem"
                className="text-link hover:text-link-hover active:text-link-active block transition-colors duration-200"
              >
                Redeem Code
              </Link>
              <Link
                href="/bot"
                className="text-link hover:text-link-hover active:text-link-active block transition-colors duration-200"
              >
                Discord Bot
              </Link>
              <a
                href="https://status.jailbreakchangelogs.xyz"
                target="_blank"
                rel="noopener noreferrer"
                className="text-link hover:text-link-hover active:text-link-active block transition-colors duration-200"
              >
                Uptime Status
              </a>
              <Suspense
                fallback={
                  <div className="text-link hover:text-link-hover cursor-pointer">
                    Report an Issue
                  </div>
                }
              >
                <ReportIssueButton />
              </Suspense>
            </div>
          </div>

          {/* Legal */}
          <div className="space-y-3">
            <h3 className="text-secondary-text text-sm">Legal</h3>
            <div className="space-y-2 text-sm">
              <Link
                href="/privacy"
                className="text-link hover:text-link-hover active:text-link-active block transition-colors duration-200"
              >
                Privacy Policy
              </Link>
              <Link
                href="/tos"
                className="text-link hover:text-link-hover active:text-link-active block transition-colors duration-200"
              >
                Terms of Service
              </Link>
              <button
                onClick={() => {
                  const event = new CustomEvent("openCookieSettings");
                  window.dispatchEvent(event);
                }}
                className="text-link hover:text-link-hover active:text-link-active cursor-pointer border-none bg-none p-0 text-left transition-colors duration-200"
              >
                Cookies
              </button>
              <div id="gdpr-consent-box" style={{ display: "none" }}>
                <button
                  onClick={() => {
                    if (window.__cmp) {
                      window.__cmp("showModal");
                    }
                  }}
                  className="text-link hover:text-link-hover active:text-link-active cursor-pointer border-none bg-none p-0 text-left text-sm transition-colors duration-200"
                >
                  Update consent preferences
                </button>
              </div>
              <a
                href="mailto:support@jailbreakchangelogs.xyz"
                className="text-link hover:text-link-hover active:text-link-active block transition-colors duration-200"
              >
                Contact Us
              </a>
            </div>
          </div>

          {/* About */}
          <div className="space-y-4">
            <h3 className="text-secondary-text text-sm">About</h3>
            <div className="space-y-2">
              <p className="text-secondary-text">
                This project is NOT affiliated with Badimo.
              </p>

              <p className="text-secondary-text flex items-center gap-1">
                Crafted with{" "}
                <Icon
                  icon="line-md:heart-filled"
                  className="inline h-4 w-4"
                  style={{ color: "#1d80e2" }}
                  inline={true}
                />{" "}
                by{" "}
                <Link
                  href="/users/659865209741246514"
                  className="text-link hover:text-link-hover active:text-link-active transition-colors duration-200 hover:underline"
                >
                  Jakobiis
                </Link>{" "}
                &{" "}
                <Link
                  href="/users/1019539798383398946"
                  className="text-link hover:text-link-hover active:text-link-active transition-colors duration-200 hover:underline"
                >
                  Jalenzz16
                </Link>
              </p>
              <VersionInfo
                version={versionInfo.version}
                date={versionInfo.date}
                branch={versionInfo.branch}
                commitUrl={versionInfo.commitUrl}
              />
            </div>
          </div>
        </div>

        <div className="border-border-primary mt-12 flex flex-wrap gap-3 border-t pt-8">
          <Tooltip
            title="Follow us on X (Twitter)"
            arrow
            placement="top"
            slotProps={{
              tooltip: {
                sx: {
                  backgroundColor: "var(--color-secondary-bg)",
                  color: "var(--color-primary-text)",
                  "& .MuiTooltip-arrow": { color: "var(--color-secondary-bg)" },
                },
              },
            }}
          >
            <a
              href="https://x.com/JBChangelogs"
              target="_blank"
              rel="noopener noreferrer"
              className="text-link hover:bg-quaternary-bg hover:text-link-hover rounded-full p-2 transition-colors duration-200"
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
                  "& .MuiTooltip-arrow": { color: "var(--color-secondary-bg)" },
                },
              },
            }}
          >
            <a
              href="https://discord.jailbreakchangelogs.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="text-link hover:bg-quaternary-bg hover:text-link-hover rounded-full p-2 transition-colors duration-200"
              aria-label="Discord"
            >
              <Icon
                icon="ic:baseline-discord"
                className="text-primary-text h-6 w-6"
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
                  "& .MuiTooltip-arrow": { color: "var(--color-secondary-bg)" },
                },
              },
            }}
          >
            <a
              href="https://www.roblox.com/communities/35348206/Jailbreak-Changelogs#!/about"
              target="_blank"
              rel="noopener noreferrer"
              className="text-link hover:bg-quaternary-bg hover:text-link-hover rounded-full p-2 transition-colors duration-200"
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
                  "& .MuiTooltip-arrow": { color: "var(--color-secondary-bg)" },
                },
              },
            }}
          >
            <a
              href="https://bsky.app/profile/jbchangelogs.bsky.social"
              target="_blank"
              rel="noopener noreferrer"
              className="text-link hover:bg-quaternary-bg hover:text-link-hover rounded-full p-2 transition-colors duration-200"
              aria-label="Bluesky"
            >
              <Icon
                icon="ri:bluesky-fill"
                className="text-primary-text h-6 w-6"
                inline={true}
              />
            </a>
          </Tooltip>
          <Tooltip
            title="Support Us"
            arrow
            placement="top"
            slotProps={{
              tooltip: {
                sx: {
                  backgroundColor: "var(--color-secondary-bg)",
                  color: "var(--color-primary-text)",
                  "& .MuiTooltip-arrow": { color: "var(--color-secondary-bg)" },
                },
              },
            }}
          >
            <a
              href="/supporting"
              className="text-link hover:bg-quaternary-bg hover:text-link-hover rounded-full p-2 transition-colors duration-200"
              aria-label="Support Us"
            >
              <Icon
                icon="simple-icons:kofi"
                className="text-primary-text h-6 w-6"
                inline={true}
              />
            </a>
          </Tooltip>
          <Tooltip
            title="View on GitHub"
            arrow
            placement="top"
            slotProps={{
              tooltip: {
                sx: {
                  backgroundColor: "var(--color-secondary-bg)",
                  color: "var(--color-primary-text)",
                  "& .MuiTooltip-arrow": { color: "var(--color-secondary-bg)" },
                },
              },
            }}
          >
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-link hover:bg-quaternary-bg hover:text-link-hover rounded-full p-2 transition-colors duration-200"
              aria-label="View on GitHub"
            >
              <Icon
                icon="mdi:github"
                className="text-primary-text h-6 w-6"
                inline={true}
              />
            </a>
          </Tooltip>
          <Tooltip
            title="Subscribe on YouTube"
            arrow
            placement="top"
            slotProps={{
              tooltip: {
                sx: {
                  backgroundColor: "var(--color-secondary-bg)",
                  color: "var(--color-primary-text)",
                  "& .MuiTooltip-arrow": { color: "var(--color-secondary-bg)" },
                },
              },
            }}
          >
            <a
              href="https://www.youtube.com/@JailbreakChangelogs"
              target="_blank"
              rel="noopener noreferrer"
              className="text-link hover:bg-quaternary-bg hover:text-link-hover rounded-full p-2 transition-colors duration-200"
              aria-label="YouTube"
            >
              <Icon
                icon="mdi:youtube"
                className="text-primary-text h-6 w-6"
                inline={true}
              />
            </a>
          </Tooltip>
        </div>

        <div className="pt-8 pb-8">
          <p className="text-secondary-text text-xs leading-relaxed">
            &copy; 2024 -&nbsp;{new Date().getFullYear()} Jailbreak Changelogs
            LLC. Jailbreak Changelogs, JBCL, and any associated logos are
            trademarks, service marks, and/or registered trademarks of Jailbreak
            Changelogs LLC.
          </p>
        </div>
      </div>
    </footer>
  );
}
