"use client";

import Image from "next/image";
import Link from "next/link";
import localFont from "next/font/local";
import { Icon } from "@/components/ui/IconWrapper";

const bangers = localFont({
  src: "../../public/fonts/Bangers.ttf",
});

interface FeatureMaintenanceProps {
  featureName?: string;
  customMessage?: string;
}

export default function FeatureMaintenance({
  featureName = "Feature",
  customMessage,
}: FeatureMaintenanceProps = {}) {
  return (
    <div
      className="relative flex min-h-screen items-center justify-center bg-[url('https://assets.jailbreakchangelogs.xyz/assets/backgrounds/background16.webp')] bg-cover bg-center bg-no-repeat"
      style={{ color: "var(--color-secondary-text)" }}
    >
      <div className="absolute inset-0 z-[1] bg-black/70" />

      <div className="relative z-[2] container mx-auto max-w-2xl px-4">
        <div
          className="flex flex-col items-center gap-4 rounded-2xl border px-8 py-8 text-center shadow-[0_8px_32px_0_rgba(0,0,0,0.25)] backdrop-blur-xl"
          style={{
            borderColor: "var(--color-border-primary)",
            backgroundColor: "var(--color-overlay-medium)",
          }}
        >
          <Image
            src="https://assets.jailbreakchangelogs.xyz/assets/logos/JBCL_Short_Transparent.webp"
            alt="Jailbreak Changelogs Logo"
            width={140}
            height={140}
            fetchPriority="high"
            draggable={false}
            className="h-[140px] w-auto drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)] filter"
          />

          <Icon
            icon="line-md:cog-filled-loop"
            className="text-primary-text h-16 w-16"
            inline={true}
          />

          <h1
            className={`${bangers.className} mb-4 text-5xl`}
            style={{ color: "var(--color-primary-text)" }}
          >
            {featureName}
          </h1>

          <div className="space-y-4">
            {customMessage ? (
              <p
                className="text-xl font-medium drop-shadow-[0_2px_8px_rgba(0,0,0,0.25)]"
                style={{ color: "var(--color-primary-text)" }}
              >
                {customMessage}
              </p>
            ) : (
              <>
                <p
                  className="text-xl font-medium drop-shadow-[0_2px_8px_rgba(0,0,0,0.25)]"
                  style={{ color: "var(--color-primary-text)" }}
                >
                  We&apos;re making some improvements to the {featureName}{" "}
                  feature!
                </p>

                <p
                  className="text-lg font-medium drop-shadow-[0_2px_8px_rgba(0,0,0,0.25)]"
                  style={{ color: "var(--color-primary-text)" }}
                >
                  This feature is temporarily unavailable while we perform
                  maintenance.
                </p>

                <p
                  className="text-base drop-shadow-[0_2px_8px_rgba(0,0,0,0.25)]"
                  style={{ color: "var(--color-secondary-text)" }}
                >
                  Other features of the site are still available.
                </p>
              </>
            )}
          </div>

          <div
            className="w-full border-t pt-4"
            style={{ borderColor: "var(--color-border-primary)" }}
          >
            <h3
              className="mb-4 text-xl font-bold"
              style={{ color: "var(--color-primary-text)" }}
            >
              Stay Connected
            </h3>

            <p
              className="mb-6 text-base font-medium drop-shadow-[0_2px_8px_rgba(0,0,0,0.25)]"
              style={{ color: "var(--color-primary-text)" }}
            >
              Follow us for updates and announcements
            </p>

            <div className="mb-6 flex justify-center gap-4">
              <a
                href="https://x.com/JBChangelogs"
                target="_blank"
                rel="noopener noreferrer"
                className="text-secondary-text hover:bg-quaternary-bg hover:text-link-hover rounded-full p-3 transition-colors duration-200"
                aria-label="Twitter/X"
              >
                <Icon
                  icon="prime:twitter"
                  className="text-primary-text h-6 w-6"
                  inline={true}
                />
              </a>
              <a
                href="https://discord.jailbreakchangelogs.xyz"
                target="_blank"
                rel="noopener noreferrer"
                className="text-secondary-text hover:bg-quaternary-bg hover:text-link-hover rounded-full p-3 transition-colors duration-200"
                aria-label="Discord"
              >
                <Icon
                  icon="ic:baseline-discord"
                  className="text-primary-text h-6 w-6"
                  inline={true}
                />
              </a>
              <a
                href="https://www.roblox.com/communities/35348206/Jailbreak-Changelogs#!/about"
                target="_blank"
                rel="noopener noreferrer"
                className="text-secondary-text hover:bg-quaternary-bg hover:text-link-hover rounded-full p-3 transition-colors duration-200"
                aria-label="Roblox Group"
              >
                <Icon
                  icon="simple-icons:roblox"
                  className="text-primary-text h-6 w-6"
                  inline={true}
                />
              </a>
            </div>
          </div>

          <Link
            href="/"
            className="rounded-lg px-6 py-2.5 text-base font-semibold shadow-[0_4px_14px_0_rgba(0,0,0,0.25)] transition-colors duration-200"
            style={{
              backgroundColor: "var(--color-button-info)",
              color: "var(--color-form-button-text)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor =
                "var(--color-button-info-hover)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor =
                "var(--color-button-info)";
            }}
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
