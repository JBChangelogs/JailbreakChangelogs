"use client";

import Breadcrumb from "@/components/Layout/Breadcrumb";
import { Icon } from "@/components/ui/IconWrapper";
import Link from "next/link";

export default function TermsOfServicePage() {
  return (
    <div className="text-primary-text relative min-h-screen p-8">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40"
        style={{
          backgroundImage: "url(/backgrounds/v2/background6.webp)",
        }}
      />
      <div className="absolute inset-0 opacity-60" />
      <div className="relative mx-auto max-w-4xl">
        <Breadcrumb containerClassName="px-0 py-0 mb-2" />
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
          Last updated: June 2nd, 2026
        </p>

        <div className="border-border-card bg-secondary-bg rounded-lg border p-6 transition-colors">
          <p className="text-primary-text">
            Please read these Terms of Service carefully before using Jailbreak
            Changelogs.
          </p>

          <div className="mt-6 space-y-6">
            <div>
              <h2 className="text-primary-text mb-4 text-xl font-semibold">
                1. Acceptance of Terms
              </h2>
              <p className="text-secondary-text">
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
              </p>
            </div>

            <div>
              <h2 className="text-primary-text mb-4 text-xl font-semibold">
                2. Use License
              </h2>
              <p className="text-secondary-text mb-4">
                Permission is granted to access and use our website materials
                for personal, non-commercial viewing only.
              </p>
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
              <p className="text-secondary-text mb-4">
                Our source code is licensed separately under the PolyForm
                Noncommercial License 1.0.0. If you obtain a copy of the source
                code, your rights to use, modify, and distribute that code are
                governed by that license.
              </p>
              <div className="mt-2 ml-4">
                <h3 className="text-primary-text mb-2 text-lg font-semibold">
                  API Terms of Service
                </h3>
                <p className="text-secondary-text mb-2">
                  By accessing our API, you accept that we reserve the right to
                  restrict or revoke your access and block IP address(es) at our
                  sole discretion.
                </p>
                <p className="text-secondary-text mb-2">
                  Violations include, but are not limited to:
                </p>
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
              <p className="text-secondary-text">
                The materials on our website are provided on an &apos;as
                is&apos; basis. We make no warranties, expressed or implied, and
                hereby disclaim and negate all other warranties including,
                without limitation, implied warranties or conditions of
                merchantability, fitness for a particular purpose, or
                non-infringement of intellectual property or other violation of
                rights.
              </p>
            </div>

            <div>
              <h2 className="text-primary-text mb-4 text-xl font-semibold">
                4. Limitations
              </h2>
              <p className="text-secondary-text">
                In no event shall Jailbreak Changelogs LLC or its suppliers be
                liable for any damages (including, without limitation, damages
                for loss of data or profit, or due to business interruption)
                arising out of the use or inability to use the materials on our
                website.
              </p>
            </div>

            <div>
              <h2 className="text-primary-text mb-4 text-xl font-semibold">
                5. Revisions and Errata
              </h2>
              <p className="text-secondary-text">
                We reserve the right to make changes to our Terms of Service at
                any time without notice. By using this website, you are agreeing
                to be bound by the current version of these Terms of Service.
              </p>
            </div>

            <div>
              <h2 className="text-primary-text mb-4 text-xl font-semibold">
                6. Refund Policy
              </h2>
              <p className="text-secondary-text">
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
              </p>
            </div>

            <div>
              <h2 className="text-primary-text mb-4 text-xl font-semibold">
                7. Value Suggestions
              </h2>
              <p className="text-secondary-text mb-4">
                By submitting a value suggestion on the{" "}
                <Link
                  href="/items/suggestions"
                  className="text-link hover:text-link-hover hover:underline"
                >
                  Value Suggestions
                </Link>{" "}
                page, you agree to the following rules. Failure to follow these
                rules may result in your suggestion being ignored or removed,
                and repeated or egregious violations may result in a ban from
                the value suggestion feature at the sole discretion of Value
                Team managers, website owners, or website moderators.
              </p>
              <ul className="text-secondary-text list-inside list-disc space-y-2">
                <li>
                  Do not use any form of AI-generated content to make value
                  suggestions. If found using AI, you will receive punishment
                  for your actions.
                </li>
                <li>
                  Do not be biased solely on your own trading experiences, as
                  other players may have different experiences while trading an
                  item.
                </li>
                <li>
                  Provide meaningful, effort-filled reasoning to support your
                  suggestion. Padding with repeated characters, periods, or
                  filler text does not count and will likely result in your
                  suggestion being ignored by the Value Team.
                </li>
                <li>
                  Do not bot or manipulate reactions with alternate accounts.
                  Any form of vote manipulation is strictly prohibited.
                </li>
                <li>
                  Your Roblox account must be at least 30 days old to submit or
                  vote on value suggestions.
                </li>
                <li>
                  Troll suggestions or bad-faith submissions may result in a
                  permanent ban from value suggesting at the sole discretion of
                  Value Team managers, website owners, or website moderators.
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-primary-text mb-4 text-xl font-semibold">
                8. Contact Information
              </h2>
              <p className="text-secondary-text">
                If you have any questions about these Terms of Service, please
                contact us:
              </p>
              <p className="text-secondary-text mt-2">
                Email:{" "}
                <a
                  href="mailto:support@jailbreakchangelogs.com"
                  className="text-link hover:text-link-hover hover:underline"
                >
                  support@jailbreakchangelogs.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
