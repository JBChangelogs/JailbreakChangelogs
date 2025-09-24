"use client";

import { Typography } from "@mui/material";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import { ShieldCheckIcon } from "@heroicons/react/24/outline";

export default function PrivacyPage() {
  return (
    <div className="text-primary-text relative min-h-screen p-8">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40"
        style={{
          backgroundImage:
            "url('https://assets.jailbreakchangelogs.xyz/assets/backgrounds/background8.webp')",
        }}
      />
      <div className="absolute inset-0 opacity-60" />
      <div className="relative mx-auto max-w-4xl">
        <Breadcrumb />
        <div className="mb-2 flex items-center gap-2">
          <ShieldCheckIcon className="text-secondary-text h-6 w-6" />
          <h1 className="text-primary-text text-2xl font-bold">
            Privacy Policy
          </h1>
        </div>
        <p className="text-primary-text mb-6 text-sm">
          Last updated: May 07th, 2025
        </p>

        <div className="border-stroke bg-secondary-bg hover:border-button-info rounded-lg border p-6 transition-colors">
          <Typography className="text-primary-text">
            This Privacy Policy outlines our commitment to protecting your
            privacy. We prioritize transparency and do not collect any personal
            information from users of our website.
          </Typography>

          <div className="mt-6 space-y-6">
            <div>
              <h2 className="text-primary-text mb-4 text-xl font-semibold">
                Discord Data (Only When Authenticating)
              </h2>
              <Typography className="text-secondary-text mb-4">
                If you choose to authenticate with Discord, we collect the
                following publicly available information:
              </Typography>
              <ul className="text-secondary-text list-inside list-disc space-y-1">
                <li>Discord User ID</li>
                <li>Discord Avatar</li>
                <li>Discord Username and Global Name</li>
                <li>Discord Banner</li>
              </ul>
            </div>

            <div>
              <h2 className="text-primary-text mb-4 text-xl font-semibold">
                Roblox Data (Only When Authenticating)
              </h2>
              <Typography className="text-secondary-text mb-4">
                If you choose to authenticate with Roblox, we collect the
                following publicly available information:
              </Typography>
              <ul className="text-secondary-text list-inside list-disc space-y-1">
                <li>Roblox Username</li>
                <li>Roblox Player ID</li>
                <li>Roblox Display Name</li>
                <li>Roblox Avatar</li>
                <li>Roblox Join Date</li>
              </ul>
            </div>

            <div>
              <h2 className="text-primary-text mb-4 text-xl font-semibold">
                Cookies
              </h2>
              <Typography className="text-secondary-text">
                Our website may use cookies to enhance user experience. However,
                we do not track or collect any information through cookies.
              </Typography>
            </div>

            <div>
              <h2 className="text-primary-text mb-4 text-xl font-semibold">
                Microsoft Clarity and Advertising
              </h2>
              <Typography className="text-secondary-text mb-4">
                We partner with Microsoft Clarity and Microsoft Advertising to
                capture how you use and interact with our website through
                behavioral metrics, heatmaps, and session replay to improve and
                market our products/services. Website usage data is captured
                using first and third-party cookies and other tracking
                technologies to determine the popularity of products/services
                and online activity. Additionally, we use this information for
                site optimization, fraud/security purposes, and advertising.
              </Typography>
              <Typography className="text-secondary-text">
                For more information about how Microsoft collects and uses your
                data, visit the{" "}
                <a
                  href="https://www.microsoft.com/en-us/privacy/privacystatement"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-link hover:text-link-hover hover:underline"
                >
                  Microsoft Privacy Statement
                </a>
                .
              </Typography>
            </div>

            <div>
              <h2 className="text-primary-text mb-4 text-xl font-semibold">
                Third-Party Links
              </h2>
              <Typography className="text-secondary-text">
                Our website may contain links to third-party websites. We are
                not responsible for the privacy practices of these websites.
              </Typography>
            </div>

            <div>
              <h2 className="text-primary-text mb-4 text-xl font-semibold">
                Changes to This Privacy Policy
              </h2>
              <Typography className="text-secondary-text">
                We may update this Privacy Policy from time to time. Any changes
                will be posted on this page.
              </Typography>
            </div>

            <div>
              <h2 className="text-primary-text mb-4 text-xl font-semibold">
                Contact Us
              </h2>
              <Typography className="text-secondary-text">
                If you have any questions or concerns about our Privacy Policy,
                please don&apos;t hesitate to contact us:
              </Typography>
              <Typography className="text-secondary-text mt-2">
                Email:{" "}
                <a
                  href="mailto:support@jailbreakchangelogs.xyz"
                  className="text-link hover:text-link-hover hover:underline"
                >
                  support@jailbreakchangelogs.xyz
                </a>
              </Typography>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
