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
          Last updated: October 27th, 2025
        </p>

        <div className="border-border-primary hover:border-border-focus bg-secondary-bg rounded-lg border p-6 transition-colors">
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
                Cookies and Consent Management
              </h2>
              <Typography className="text-secondary-text mb-4">
                We use cookies and similar technologies to enhance your
                experience on our website. This includes cookies from Microsoft
                Clarity for analytics and Google services for advertising and
                analytics purposes.
              </Typography>
              <Typography className="text-secondary-text mb-4">
                <strong>Your Cookie Preferences:</strong> We respect your
                privacy choices. You have full control over which types of
                cookies we use:
              </Typography>

              <div className="bg-tertiary-bg rounded-lg p-4 mb-4 space-y-4">
                <div>
                  <h3 className="text-primary-text font-semibold mb-2">
                    Analytics Storage
                  </h3>
                  <Typography className="text-secondary-text text-sm mb-2">
                    <strong>What it does:</strong> Allows us to analyze website
                    usage and improve your experience
                  </Typography>
                  <Typography className="text-secondary-text text-sm mb-2">
                    <strong>Cookies used:</strong> Google Analytics (_ga, _gid,
                    _gat), Microsoft Clarity (_clid)
                  </Typography>
                  <Typography className="text-secondary-text text-sm">
                    <strong>Purpose:</strong> Tracks page views, user behavior,
                    and session duration to help us understand how you use our
                    site and identify areas for improvement.
                  </Typography>
                </div>

                <div>
                  <h3 className="text-primary-text font-semibold mb-2">
                    Ad Storage
                  </h3>
                  <Typography className="text-secondary-text text-sm mb-2">
                    <strong>What it does:</strong> Stores information for
                    advertising purposes
                  </Typography>
                  <Typography className="text-secondary-text text-sm mb-2">
                    <strong>Cookies used:</strong> Google Ads cookies (NID, IDE,
                    ANID)
                  </Typography>
                  <Typography className="text-secondary-text text-sm">
                    <strong>Purpose:</strong> Allows Google to store and
                    remember your browsing behavior across websites. Without
                    this, Google cannot track you for ad targeting purposes.
                  </Typography>
                </div>

                <div>
                  <h3 className="text-primary-text font-semibold mb-2">
                    Ad User Data
                  </h3>
                  <Typography className="text-secondary-text text-sm mb-2">
                    <strong>What it does:</strong> Allows personalized
                    advertising based on your data
                  </Typography>
                  <Typography className="text-secondary-text text-sm mb-2">
                    <strong>Cookies used:</strong> Google Ads conversion
                    tracking, audience data
                  </Typography>
                  <Typography className="text-secondary-text text-sm">
                    <strong>Purpose:</strong> Sends your interests and browsing
                    history to Google&apos;s ad network. This enables Google to
                    build a profile of your interests (e.g., &quot;gaming
                    enthusiast&quot;, &quot;tech interested&quot;) to show you
                    more relevant ads.
                  </Typography>
                </div>

                <div>
                  <h3 className="text-primary-text font-semibold mb-2">
                    Ad Personalization
                  </h3>
                  <Typography className="text-secondary-text text-sm mb-2">
                    <strong>What it does:</strong> Enables personalized ads
                    based on your interests
                  </Typography>
                  <Typography className="text-secondary-text text-sm mb-2">
                    <strong>Cookies used:</strong> Google Ads personalization
                    signals
                  </Typography>
                  <Typography className="text-secondary-text text-sm">
                    <strong>Purpose:</strong> Uses the data collected above to
                    show you ads tailored to your interests. Without this, you
                    see generic, non-personalized ads. With this enabled, you
                    see ads more relevant to you.
                  </Typography>
                </div>
              </div>

              <Typography className="text-secondary-text mb-4">
                <strong>How they work together:</strong> All four settings must
                be enabled for personalized advertising to work. If any one is
                disabled, ad personalization is limited and you&apos;ll see
                generic ads instead.
              </Typography>

              <Typography className="text-secondary-text mb-4">
                <strong>Your Consent Preferences:</strong> We respect your
                privacy choices. You have full control over which types of
                cookies we use:
              </Typography>
              <ul className="text-secondary-text list-inside list-disc space-y-1 mb-4">
                <li>
                  <strong>
                    In regulated regions (EU, Brazil, Australia, Canada):
                  </strong>{" "}
                  All cookies are disabled by default. You must actively opt-in
                  to enable them.
                </li>
                <li>
                  <strong>In other regions:</strong> All cookies are enabled by
                  default for the best experience, but you can opt-out at any
                  time.
                </li>
              </ul>

              <Typography className="text-secondary-text mb-4">
                You can manage your cookie preferences at any time by clicking
                the <strong>&quot;Manage Cookies&quot;</strong> button in the
                Resources section of our footer. Your preferences are stored
                securely in a cookie named <strong>gcm-consent</strong> and will
                be respected across all your visits to our website.
              </Typography>
              <Typography className="text-secondary-text">
                We use <strong>Google Consent Mode v2</strong> to ensure your
                consent preferences are honored before any tracking cookies are
                loaded. Your consent choices are communicated to Google and
                other third-party services to respect your privacy decisions.
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
              <Typography className="text-secondary-text mb-4">
                <strong>Consent Required:</strong> Microsoft Clarity and
                advertising cookies are only loaded after you grant explicit
                consent through our cookie consent system. We respect your
                privacy choices and will not load these services until you
                opt-in.
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
                Data Deletion Requests
              </h2>
              <Typography className="text-secondary-text mb-4">
                You have the right to request deletion of your data at any time.
                If you would like to request deletion of your inventory data or
                any other information we have collected, you can contact us
                through the following methods:
              </Typography>
              <ul className="text-secondary-text list-inside list-disc space-y-1">
                <li>
                  Join our{" "}
                  <a
                    href="https://discord.gg/jailbreakchangelogs"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-link hover:text-link-hover hover:underline"
                  >
                    Discord server
                  </a>{" "}
                  and submit a deletion request
                </li>
                <li>
                  Email us at{" "}
                  <a
                    href="mailto:support@jailbreakchangelogs.xyz"
                    className="text-link hover:text-link-hover hover:underline"
                  >
                    support@jailbreakchangelogs.xyz
                  </a>
                </li>
              </ul>
              <Typography className="text-secondary-text mt-4">
                We will process your deletion request promptly and confirm once
                your data has been removed from our systems.
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
