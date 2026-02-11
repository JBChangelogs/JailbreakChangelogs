"use client";

import { Typography } from "@mui/material";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import { Icon } from "@/components/ui/IconWrapper";
import CCPAHandler from "@/components/Home/CCPAHandler";

export default function PrivacyPage() {
  return (
    <div className="text-primary-text relative min-h-screen p-8">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40"
        style={{
          backgroundImage: "url('/backgrounds/v2/background8.webp')",
        }}
      />
      <div className="absolute inset-0 opacity-60" />
      <div className="relative mx-auto max-w-4xl">
        <Breadcrumb />
        <div className="mb-2 flex items-center gap-2">
          <Icon
            icon="heroicons-outline:shield-check"
            className="text-secondary-text h-6 w-6"
          />
          <h1 className="text-primary-text text-2xl font-bold">
            Privacy Policy
          </h1>
        </div>
        <p className="text-primary-text mb-6 text-sm">
          Last updated: February 8th, 2026
        </p>

        <div className="border-border-primary bg-secondary-bg hover:border-border-focus rounded-lg border p-6 transition-colors">
          <Typography className="text-primary-text">
            This Privacy Policy outlines our commitment to protecting your
            privacy. We prioritize transparency and collect only the minimum
            personal information needed for optional account features.
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
              <Typography className="text-secondary-text mt-4">
                If you link an email to receive notifications, we request your
                Discord email address using the Discord OAuth{" "}
                <strong>email</strong> scope. Your email is used only for
                sending email notifications and managing your email notification
                link/unlink status. Email addresses are never returned in user
                data responses, never displayed in the UI, and are not
                accessible to other users. We never share email addresses or
                user data with third-party companies or advertisers for
                targeting, and we will never do so.
              </Typography>
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
                Internal Analytics & Security (Umami)
              </h2>
              <Typography className="text-secondary-text mb-4">
                We use a self-hosted instance of{" "}
                <a
                  href="https://umami.is"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-link hover:text-link-hover hover:underline"
                >
                  Umami Analytics
                </a>{" "}
                as an internal tool to analyze site usage and maintain platform
                security. Because this system is entirely first-party (hosted on
                our own infrastructure), uses no persistent cookies, and never
                shares data with third parties, it is active for all visitors.
              </Typography>
              <Typography className="text-secondary-text mb-4">
                This data is essential for us to identify site improvements and
                detect bad actors or fraudulent activity. For guest visitors,
                data is collected anonymously. For authenticated users, we link
                specific site interactions to your account to better understand
                how our registered members use the platform.
              </Typography>
              <Typography className="text-secondary-text mb-4">
                <strong>What we track:</strong>
              </Typography>
              <ul className="text-secondary-text mb-4 list-inside list-disc space-y-1">
                <li>Page views, referrers, and session duration</li>
                <li>Technical data (Browser, OS, Device type, Country)</li>
                <li>
                  Interaction events (e.g., favoriting items, requesting
                  inventory scans)
                </li>
              </ul>
              <Typography className="text-secondary-text mb-4">
                <strong>Identity and Personalization:</strong>
              </Typography>
              <Typography className="text-secondary-text mb-4">
                When you are authenticated via Discord or Roblox, we may link
                your internal Discord/Roblox User IDs and Usernames with your
                Umami session. This allows us to understand how our registered
                members interact with specific features. This data is stored
                securely on our private servers and is never sold or shared.
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
                CCPA Privacy Rights (Do Not Sell My Personal Information)
              </h2>
              <Typography className="text-secondary-text mb-4">
                Under the CCPA, among other rights, California consumers have
                the right to:
              </Typography>
              <ul className="text-secondary-text mb-4 list-inside list-disc space-y-1">
                <li>
                  Request that a business that collects a consumer&apos;s
                  personal data disclose the categories and specific pieces of
                  personal data that a business has collected about consumers.
                </li>
                <li>
                  Request that a business delete any personal data about the
                  consumer that a business has collected.
                </li>
                <li>
                  Request that a business that sells a consumer&apos;s personal
                  data, not sell the consumer&apos;s personal data.
                </li>
              </ul>
              <Typography className="text-secondary-text mb-4">
                If you make a request, we have one month to respond to you. If
                you would like to exercise any of these rights, please contact
                us through the methods listed in the &quot;Data Deletion
                Requests&quot; section above.
              </Typography>
              <Typography className="text-secondary-text">
                <CCPAHandler />
                <span data-ccpa-link="1"></span>
              </Typography>
            </div>

            <div>
              <h2 className="text-primary-text mb-4 text-xl font-semibold">
                GDPR Data Protection Rights
              </h2>
              <Typography className="text-secondary-text mb-4">
                We would like to make sure you are fully aware of all of your
                data protection rights. Every user is entitled to the following:
              </Typography>
              <ul className="text-secondary-text mb-4 list-inside list-disc space-y-1">
                <li>
                  <strong>The right to access</strong> – You have the right to
                  request copies of your personal data. We may charge you a
                  small fee for this service.
                </li>
                <li>
                  <strong>The right to rectification</strong> – You have the
                  right to request that we correct any information you believe
                  is inaccurate. You also have the right to request that we
                  complete the information you believe is incomplete.
                </li>
                <li>
                  <strong>The right to erasure</strong> – You have the right to
                  request that we erase your personal data, under certain
                  conditions.
                </li>
                <li>
                  <strong>The right to restrict processing</strong> – You have
                  the right to request that we restrict the processing of your
                  personal data, under certain conditions.
                </li>
                <li>
                  <strong>The right to object to processing</strong> – You have
                  the right to object to our processing of your personal data,
                  under certain conditions.
                </li>
                <li>
                  <strong>The right to data portability</strong> – You have the
                  right to request that we transfer the data that we have
                  collected to another organization, or directly to you, under
                  certain conditions.
                </li>
              </ul>
              <Typography className="text-secondary-text">
                If you make a request, we have one month to respond to you. If
                you would like to exercise any of these rights, please contact
                us through the methods listed in the &quot;Data Deletion
                Requests&quot; section above.
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
