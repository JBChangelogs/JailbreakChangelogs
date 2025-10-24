"use client";

import Image from "next/image";
import Link from "next/link";
import localFont from "next/font/local";

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
            priority
            draggable={false}
            className="h-[140px] w-auto drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)] filter"
          />

          <h1
            className={`${bangers.className} mb-4 text-5xl`}
            style={{ color: "var(--color-primary-text)" }}
          >
            {featureName}
          </h1>

          <h2
            className={`${bangers.className} mb-2 text-3xl`}
            style={{ color: "var(--color-primary-text)" }}
          >
            Under Maintenance
          </h2>

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
                  feature! 🚀
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
                className="text-secondary-text hover:text-link-hover hover:bg-quaternary-bg rounded-full p-3 transition-colors duration-200"
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
              <a
                href="https://discord.jailbreakchangelogs.xyz"
                target="_blank"
                rel="noopener noreferrer"
                className="text-secondary-text hover:text-link-hover hover:bg-quaternary-bg rounded-full p-3 transition-colors duration-200"
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
              <a
                href="https://www.roblox.com/communities/35348206/Jailbreak-Changelogs#!/about"
                target="_blank"
                rel="noopener noreferrer"
                className="text-secondary-text hover:text-link-hover hover:bg-quaternary-bg rounded-full p-3 transition-colors duration-200"
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
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
