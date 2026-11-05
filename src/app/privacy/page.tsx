"use client";

import LegalLayout, {
  LegalSection,
  LegalList,
  LegalCallout,
} from "@/components/Layout/LegalLayout";
import CCPAHandler from "@/components/Home/CCPAHandler";

const TOC = [
  { id: "discord", label: "1. Discord Data" },
  { id: "roblox", label: "2. Roblox Data" },
  { id: "messaging", label: "3. Messaging & Reports" },
  { id: "analytics", label: "4. Analytics & Security" },
  { id: "third-party", label: "5. Third-Party Services & Links" },
  { id: "deletion", label: "6. Data Deletion Requests" },
  { id: "ccpa", label: "7. CCPA Privacy Rights" },
  { id: "gdpr", label: "8. GDPR Data Protection" },
  { id: "changes", label: "9. Changes To This Policy" },
  { id: "contact", label: "10. Contact Us" },
];

export default function PrivacyPage() {
  return (
    <LegalLayout
      title="Privacy Policy"
      icon="heroicons-outline:shield-check"
      lastUpdated="November 5th, 2026"
      toc={TOC}
      intro={
        <p>
          This Privacy Policy outlines our commitment to protecting your
          privacy. We prioritize transparency and collect only the minimum
          personal information needed for optional account features.
        </p>
      }
    >
      <LegalCallout>
        <p className="mb-2 font-semibold">Summary of key points</p>
        <p className="text-secondary-text">
          We collect account information when you authenticate, content you
          submit through features such as messaging, and usage and security data
          described below. We do not sell your personal data. Messages are
          shared with their recipients, and report alerts are delivered to our
          staff in our private Discord server. You can request deletion of your
          data through our{" "}
          <a
            href="https://discord.gg/jailbreakchangelogs"
            target="_blank"
            rel="noopener noreferrer"
            className="text-link hover:text-link-hover hover:underline"
          >
            Discord server
          </a>{" "}
          or by emailing{" "}
          <a
            href="mailto:support@jailbreakchangelogs.com"
            className="text-link hover:text-link-hover hover:underline"
          >
            support@jailbreakchangelogs.com
          </a>
          . Full details are in the sections below.
        </p>
      </LegalCallout>

      <LegalSection
        id="discord"
        title="1. Discord Data (Only When Authenticating)"
      >
        <p>
          If you choose to authenticate with Discord, we collect the following
          publicly available information:
        </p>
        <LegalList
          items={[
            "Discord User ID",
            "Discord Avatar",
            "Discord Username and Global Name",
            "Discord Banner",
          ]}
        />
        <p>
          If you link an email to receive notifications, we request your Discord
          email address using the Discord OAuth <strong>email</strong> scope.
          Your email is used only for sending email notifications and managing
          your email notification link/unlink status. Email addresses are never
          returned in user data responses, never displayed in the UI, and are
          not accessible to other users. We never share email addresses or user
          data with third-party companies or advertisers for targeting, and we
          will never do so.
        </p>
      </LegalSection>

      <LegalSection
        id="roblox"
        title="2. Roblox Data (Only When Authenticating)"
      >
        <p>
          If you choose to authenticate with Roblox, we collect the following
          publicly available information:
        </p>
        <LegalList
          items={[
            "Roblox Username",
            "Roblox Player ID",
            "Roblox Display Name",
            "Roblox Avatar",
            "Roblox Join Date",
          ]}
        />
      </LegalSection>

      <LegalSection id="messaging" title="3. Messaging & Reports">
        <p>
          When you use direct messages or group chats on our website or app, we
          store message content, sender and recipient or group identifiers,
          timestamps, replies, reactions, and metadata for content you share. We
          also store group names, membership, invitations, conversation
          preferences, and read status to provide messaging and unread counts.
        </p>
        <p>
          Direct messages are available to the participants. Group messages are
          available to current group members, including members who join after a
          message was sent. Messages are processed and stored by our servers and
          are not end-to-end encrypted. Depending on your settings, we share
          read receipts and live typing indicators with conversation
          participants. Message notifications may show the sender and message
          content on a recipient&apos;s device.
        </p>
        <p>
          When a direct or group message is reported, we save a separate copy of
          the reported message, relevant account or group identifiers, the
          report reason, and up to five messages before and five messages after
          it from the same conversation. Authorized staff can review this
          information in our moderation dashboard to investigate abuse and
          enforce our terms. Report details, including the reported message and
          relevant identifiers, are delivered through a webhook to our staff in
          our private Discord server so we can see new reports and respond
          quickly. The webhook alerts our team and does not submit reports to
          Discord staff. The surrounding conversation context is available in
          our dashboard.
        </p>
        <p>
          We retain messages to provide conversation history and keep report
          records separately for moderation and handling disputes. Hiding a
          conversation or leaving a group does not delete its messages. Deleting
          a message does not automatically remove copies already saved in
          reports, sent to Discord, or retained by recipients. Deleting your
          account does not automatically erase all message or report records. To
          request deletion of these records, use the contact methods in the Data
          Deletion Requests section below.
        </p>
      </LegalSection>

      <LegalSection id="analytics" title="4. Internal Analytics & Security">
        <p>
          We use a self-hosted instance of{" "}
          <a
            href="https://rybbit.io"
            target="_blank"
            rel="noopener noreferrer"
            className="text-link hover:text-link-hover hover:underline"
          >
            Rybbit Analytics
          </a>{" "}
          as an internal tool to analyze site usage and maintain platform
          security. Because this system is entirely first-party (hosted on our
          own infrastructure), uses no persistent cookies, and never shares data
          with third parties, it is active for all visitors.
        </p>
        <p>
          This data is essential for us to identify site improvements and detect
          bad actors or fraudulent activity. For guest visitors, data is
          collected anonymously. For authenticated users, we link specific site
          interactions to your account to better understand how our registered
          members use the platform.
        </p>
        <p className="text-primary-text font-medium">What we track:</p>
        <LegalList
          items={[
            "Page views, referrers, and session duration",
            "Technical data (Browser, OS, Device type, Country)",
            "Interaction events (e.g., favoriting items, requesting inventory scans)",
          ]}
        />
        <p className="text-primary-text font-medium">
          Identity and Personalization:
        </p>
        <p>
          When you are authenticated via Discord or Roblox, we may link your
          internal Discord/Roblox User IDs and Usernames with your Rybbit
          session. This allows us to understand how our registered members
          interact with specific features. This data is stored securely on our
          private servers and is never sold or shared.
        </p>
        <p>
          To detect accounts operated by the same person, we collect device and
          browser characteristics (such as hardware and configuration details)
          and a device identifier stored in a cookie, from logged-in users. This
          data is used only for that purpose, is reviewed by staff rather than
          used for automated decisions, and is kept for as long as your account
          exists.
        </p>
        <p>
          Separately from Rybbit, we collect messaging metrics to understand
          message volume, website versus app usage, and how long messages take
          to be read. These analytics records contain timestamps, the app or
          website indicator, or read durations, without message content, user
          identifiers, or message identifiers. Our internal dashboard displays
          aggregate counts and read timing statistics.
        </p>
      </LegalSection>

      <LegalSection id="third-party" title="5. Third-Party Services & Links">
        <p>
          We use a Discord webhook to notify our staff of new reports in our
          private Discord server as described above. Discord provides the
          platform that processes these alerts under{" "}
          <a
            href="https://discord.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-link hover:text-link-hover hover:underline"
          >
            Discord&apos;s Privacy Policy
          </a>
          .
        </p>
        <p>
          Our website may contain links to third-party websites. We are not
          responsible for the privacy practices of these websites.
        </p>
      </LegalSection>

      <LegalSection id="deletion" title="6. Data Deletion Requests">
        <p>
          You have the right to request deletion of your data at any time. If
          you would like to request deletion of your inventory data or any other
          information we have collected, you can contact us through the
          following methods:
        </p>
        <LegalList
          items={[
            <>
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
            </>,
            <>
              Email us at{" "}
              <a
                href="mailto:support@jailbreakchangelogs.com"
                className="text-link hover:text-link-hover hover:underline"
              >
                support@jailbreakchangelogs.com
              </a>
            </>,
          ]}
        />
        <p>
          We will review your deletion request and explain what has been deleted
          and whether any information must be retained under applicable law. If
          your request concerns messages or reports, please identify the
          relevant account and conversation or report so we can review those
          records, including copies sent through our moderation workflow.
        </p>
      </LegalSection>

      <LegalSection
        id="ccpa"
        title="7. CCPA Privacy Rights (Do Not Sell My Personal Information)"
      >
        <p>
          Under the CCPA, among other rights, California consumers have the
          right to:
        </p>
        <LegalList
          items={[
            "Request that a business that collects a consumer's personal data disclose the categories and specific pieces of personal data that a business has collected about consumers.",
            "Request that a business delete any personal data about the consumer that a business has collected.",
            "Request that a business that sells a consumer's personal data, not sell the consumer's personal data.",
          ]}
        />
        <p>
          If you make a request, we have one month to respond to you. If you
          would like to exercise any of these rights, please contact us through
          the methods listed in the &quot;Data Deletion Requests&quot; section
          above.
        </p>
        <p>
          <CCPAHandler />
          <span data-ccpa-link="1"></span>
        </p>
      </LegalSection>

      <LegalSection id="gdpr" title="8. GDPR Data Protection Rights">
        <p>
          We would like to make sure you are fully aware of all of your data
          protection rights. Every user is entitled to the following:
        </p>
        <LegalList
          items={[
            <>
              <strong>The right to access</strong> – You have the right to
              request copies of your personal data. We may charge you a small
              fee for this service.
            </>,
            <>
              <strong>The right to rectification</strong> – You have the right
              to request that we correct any information you believe is
              inaccurate. You also have the right to request that we complete
              the information you believe is incomplete.
            </>,
            <>
              <strong>The right to erasure</strong> – You have the right to
              request that we erase your personal data, under certain
              conditions.
            </>,
            <>
              <strong>The right to restrict processing</strong> – You have the
              right to request that we restrict the processing of your personal
              data, under certain conditions.
            </>,
            <>
              <strong>The right to object to processing</strong> – You have the
              right to object to our processing of your personal data, under
              certain conditions.
            </>,
            <>
              <strong>The right to data portability</strong> – You have the
              right to request that we transfer the data that we have collected
              to another organization, or directly to you, under certain
              conditions.
            </>,
          ]}
        />
        <p>
          If you make a request, we have one month to respond to you. If you
          would like to exercise any of these rights, please contact us through
          the methods listed in the &quot;Data Deletion Requests&quot; section
          above.
        </p>
      </LegalSection>

      <LegalSection id="changes" title="9. Changes To This Privacy Policy">
        <p>
          We may update this Privacy Policy from time to time. Any changes will
          be posted on this page.
        </p>
      </LegalSection>

      <LegalSection id="contact" title="10. Contact Us">
        <p>
          If you have any questions or concerns about our Privacy Policy, please
          don&apos;t hesitate to contact us:
        </p>
        <p>
          Email:{" "}
          <a
            href="mailto:support@jailbreakchangelogs.com"
            className="text-link hover:text-link-hover hover:underline"
          >
            support@jailbreakchangelogs.com
          </a>
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
