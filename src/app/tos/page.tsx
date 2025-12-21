"use client";

import { Typography } from "@mui/material";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import { Icon } from "@/components/ui/IconWrapper";
import Link from "next/link";

export default function TermsOfServicePage() {
  return (
    <div className="text-primary-text relative min-h-screen p-8">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40"
        style={{
          backgroundImage:
            "url('https://assets.jailbreakchangelogs.xyz/assets/backgrounds/background6.webp')",
        }}
      />
      <div className="absolute inset-0 opacity-60" />
      <div className="relative mx-auto max-w-4xl">
        <Breadcrumb />
        <div className="mb-2 flex items-center gap-2">
          <Icon
            icon="heroicons-outline:document-text"
            className="text-secondary-text h-6 w-6"
          />
          <h1 className="text-primary-text text-2xl font-bold">
            Terms of Service
          </h1>
        </div>
        <p className="text-primary-text mb-6 text-sm">
          Last updated: September 12th, 2025
        </p>

        <div className="border-border-primary bg-secondary-bg hover:border-border-focus rounded-lg border p-6 transition-colors">
          <Typography className="text-primary-text">
            Please read these Terms of Service carefully before using Jailbreak
            Changelogs.
          </Typography>

          <div className="mt-6 space-y-6">
            <div>
              <h2 className="text-primary-text mb-4 text-xl font-semibold">
                1. Acceptance of Terms
              </h2>
              <Typography className="text-secondary-text">
                By accessing and using Jailbreak Changelogs, you accept and
                agree to be bound by the terms and provisions of this agreement.
                You confirm that you&apos;re at least 13 years old and meet the
                minimum age required by the laws in your country. If you are old
                enough to access our services in your country, but not old
                enough to have authority to consent to our terms, your parent or
                legal guardian must agree to our terms on your behalf. Please
                ask your parent or legal guardian to read these terms with you.
                If you&apos;re a parent or legal guardian and you allow your
                child (who must meet the minimum age for your country) to use
                the services, then these terms also apply to you and you&apos;re
                responsible for your child&apos;s activity on the services,
                including purchases made by them.
              </Typography>
            </div>

            <div>
              <h2 className="text-primary-text mb-4 text-xl font-semibold">
                2. Use License
              </h2>
              <Typography className="text-secondary-text mb-4">
                Permission is granted to temporarily access and use our
                materials for personal, non-commercial viewing only.
              </Typography>
              <ul className="text-secondary-text mb-4 list-inside list-disc space-y-1">
                <li>You must not modify or copy these materials</li>
                <li>
                  You must not use these materials for commercial purposes
                </li>
                <li>
                  You must not attempt to decompile or reverse engineer any
                  software
                </li>
              </ul>
              <div className="mt-2 ml-4">
                <h3 className="text-primary-text mb-2 text-lg font-semibold">
                  API Terms of Service
                </h3>
                <Typography className="text-secondary-text mb-2">
                  By accessing our API, you accept that we reserve the right to
                  restrict or revoke your access and block IP address(es) at our
                  sole discretion.
                </Typography>
                <Typography className="text-secondary-text mb-2">
                  Violations include, but are not limited to:
                </Typography>
                <ul className="text-secondary-text list-inside list-disc space-y-1">
                  <li>Sending excessive or spammy requests</li>
                  <li>Engaging in abusive behavior towards the API</li>
                  <li>Scraping or harvesting data from the API</li>
                  <li>
                    Sharing private endpoints with third parties without
                    authorization
                  </li>
                  <li>
                    Distributing malware, viruses, or harmful content via the
                    API
                  </li>
                  <li>Harassing others through API usage</li>
                </ul>
              </div>
            </div>

            <div>
              <h2 className="text-primary-text mb-4 text-xl font-semibold">
                3. Disclaimer
              </h2>
              <Typography className="text-secondary-text">
                The materials on our website are provided on an &apos;as
                is&apos; basis. We make no warranties, expressed or implied, and
                hereby disclaim and negate all other warranties including,
                without limitation, implied warranties or conditions of
                merchantability, fitness for a particular purpose, or
                non-infringement of intellectual property or other violation of
                rights.
              </Typography>
            </div>

            <div>
              <h2 className="text-primary-text mb-4 text-xl font-semibold">
                4. Limitations
              </h2>
              <Typography className="text-secondary-text">
                In no event shall Jailbreak Changelogs LLC or its suppliers be
                liable for any damages (including, without limitation, damages
                for loss of data or profit, or due to business interruption)
                arising out of the use or inability to use the materials on our
                website.
              </Typography>
            </div>

            <div>
              <h2 className="text-primary-text mb-4 text-xl font-semibold">
                5. Revisions and Errata
              </h2>
              <Typography className="text-secondary-text">
                We reserve the right to make changes to our Terms of Service at
                any time without notice. By using this website, you are agreeing
                to be bound by the current version of these Terms of Service.
              </Typography>
            </div>

            <div>
              <h2 className="text-primary-text mb-4 text-xl font-semibold">
                6. Refund Policy
              </h2>
              <Typography className="text-secondary-text">
                All supporter purchases are one-time only and non-refundable. By
                making a supporter purchase, you acknowledge and agree that you
                will not be entitled to a refund for any reason. For more
                information about supporter purchases and their benefits, please
                visit our{" "}
                <Link
                  href="/supporting"
                  className="text-link hover:text-link-hover hover:underline"
                >
                  Supporter page
                </Link>
                .
              </Typography>
            </div>

            <div>
              <h2 className="text-primary-text mb-4 text-xl font-semibold">
                7. Contact Information
              </h2>
              <Typography className="text-secondary-text">
                If you have any questions about these Terms of Service, please
                contact us:
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
