"use client";

import Link from "next/link";
import LegalLayout, {
  LegalSection,
  LegalList,
  LegalCallout,
} from "@/components/Layout/LegalLayout";

const TOC = [
  { id: "acceptance", label: "1. Acceptance of Terms" },
  { id: "license", label: "2. Use License" },
  { id: "disclaimer", label: "3. Disclaimer" },
  { id: "limitations", label: "4. Limitations" },
  { id: "revisions", label: "5. Revisions and Errata" },
  { id: "refunds", label: "6. Refund Policy" },
  { id: "suggestions", label: "7. Item Suggestions" },
  { id: "messaging", label: "8. Messaging & Group Chats" },
  { id: "contact", label: "9. Contact Information" },
];

export default function TermsOfServicePage() {
  return (
    <LegalLayout
      title="Terms of Service"
      icon="heroicons-outline:document-text"
      lastUpdated="November 11th, 2026"
      toc={TOC}
      intro={
        <p>
          Please read these Terms of Service carefully before using Jailbreak
          Changelogs.
        </p>
      }
    >
      <LegalSection id="acceptance" title="1. Acceptance of Terms">
        <p>
          By accessing and using Jailbreak Changelogs, you accept and agree to
          be bound by the terms and provisions of this agreement. You confirm
          that you&apos;re at least 13 years old and meet the minimum age
          required by the laws in your country. If you are old enough to access
          our services in your country, but not old enough to have authority to
          consent to our terms, your parent or legal guardian must agree to our
          terms on your behalf. Please ask your parent or legal guardian to read
          these terms with you. If you&apos;re a parent or legal guardian and
          you allow your child (who must meet the minimum age for your country)
          to use the services, then these terms also apply to you and
          you&apos;re responsible for your child&apos;s activity on the
          services, including purchases made by them.
        </p>
      </LegalSection>

      <LegalSection id="license" title="2. Use License">
        <p>
          Permission is granted to access and use our website materials for
          personal, non-commercial viewing only.
        </p>
        <LegalList
          items={[
            "You must not modify or copy these materials",
            "You must not use these materials for commercial purposes",
            "You must not attempt to decompile or reverse engineer any software",
          ]}
        />
        <p>
          Our source code is licensed separately under the PolyForm
          Noncommercial License 1.0.0. If you obtain a copy of the source code,
          your rights to use, modify, and distribute that code are governed by
          that license.
        </p>
        <div className="mt-2">
          <h3 className="text-primary-text mb-2 text-lg font-semibold">
            API Terms of Service
          </h3>
          <p className="mb-2">
            By accessing our API, you accept that we reserve the right to
            restrict or revoke your access and block IP address(es) at our sole
            discretion.
          </p>
          <p className="mb-2">Violations include, but are not limited to:</p>
          <LegalList
            items={[
              "Sending excessive or spammy requests",
              "Engaging in abusive behavior towards the API",
              "Scraping or harvesting data from the API",
              "Sharing private endpoints with third parties without authorization",
              "Distributing malware, viruses, or harmful content via the API",
              "Harassing others through API usage",
            ]}
          />
        </div>
      </LegalSection>

      <LegalSection id="disclaimer" title="3. Disclaimer">
        <p>
          The materials on our website are provided on an &apos;as is&apos;
          basis. We make no warranties, expressed or implied, and hereby
          disclaim and negate all other warranties including, without
          limitation, implied warranties or conditions of merchantability,
          fitness for a particular purpose, or non-infringement of intellectual
          property or other violation of rights.
        </p>
      </LegalSection>

      <LegalSection id="limitations" title="4. Limitations">
        <p>
          In no event shall Jailbreak Changelogs LLC or its suppliers be liable
          for any damages (including, without limitation, damages for loss of
          data or profit, or due to business interruption) arising out of the
          use or inability to use the materials on our website.
        </p>
      </LegalSection>

      <LegalSection id="revisions" title="5. Revisions and Errata">
        <p>
          We reserve the right to make changes to our Terms of Service at any
          time without notice. By using this website, you are agreeing to be
          bound by the current version of these Terms of Service.
        </p>
      </LegalSection>

      <LegalSection id="refunds" title="6. Refund Policy">
        <p>
          All supporter purchases are one-time only and non-refundable. By
          making a supporter purchase, you acknowledge and agree that you will
          not be entitled to a refund for any reason. For more information about
          supporter purchases and their benefits, please visit our{" "}
          <Link
            href="/supporting"
            className="text-link hover:text-link-hover hover:underline"
          >
            Supporter page
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection id="suggestions" title="7. Item Suggestions">
        <p>
          By submitting a item suggestion on the{" "}
          <Link
            href="/items/suggestions"
            className="text-link hover:text-link-hover hover:underline"
          >
            Item Suggestions
          </Link>{" "}
          page, you agree to the following rules. Failure to follow these rules
          may result in your suggestion being ignored or removed, and repeated
          or egregious violations may result in a ban from the item suggestion
          feature at the sole discretion of Value Team managers, website owners,
          or website moderators.
        </p>
        <LegalCallout>
          Do not use any form of AI-generated content to make value suggestions.
          If found using AI, you will receive punishment for your actions.
        </LegalCallout>
        <LegalList
          items={[
            "Do not be biased solely on your own trading experiences, as other players may have different experiences while trading an item.",
            "Provide meaningful reasoning within the character limits shown in the suggestion form. Repeated characters, excessive repetition, placeholder text, and gibberish can cause your submission to be rejected. Meeting the character requirement does not guarantee acceptance by the Value Team.",
            "For cash or duped value changes, provide 2–5 common trades in the Common Trades section. Each trade must include the suggested item exactly once, on either side, and at least one item on each side. Each side can contain up to 8 items, counting quantities.",
            "Cash and duped value changes cannot exceed 10 million above or below an existing value. Hypershift 4 and 5 values are calculated automatically and cannot be suggested directly.",
            "Do not submit duplicate suggestions. If the same change for the same item is already pending in the relevant suggestion category, vote on the existing suggestion instead, even if someone else submitted it.",
            "Do not bot or manipulate reactions with alternate accounts. Any form of vote manipulation is strictly prohibited.",
            "Your Roblox account must be at least 30 days old to submit or vote on item suggestions.",
            "Troll suggestions or bad-faith submissions may result in a permanent ban from value suggesting at the sole discretion of Value Team managers, website owners, or website moderators.",
          ]}
        />
      </LegalSection>

      <LegalSection id="messaging" title="8. Messaging & Group Chats">
        <p>
          You are responsible for the messages and content you share through
          direct messages and group chats on our website and app. You must have
          the right to share that content. You allow us to store, process, and
          deliver it to conversation participants and review reported content
          for moderation as described in our{" "}
          <Link
            href="/privacy#messaging"
            className="text-link hover:text-link-hover hover:underline"
          >
            Privacy Policy
          </Link>
          .
        </p>
        <LegalList
          items={[
            "Do not harass, threaten, bully, or send hateful or unlawful content.",
            "Do not use messaging for scams, phishing, impersonation, spam, malicious links, or malware.",
            "Do not share another person's private or sensitive information without permission.",
            "Respect blocks, messaging preferences, and moderation restrictions. Do not use alternate accounts or group invitations to evade them.",
            "Do not submit false or abusive reports or use group controls to facilitate abuse.",
          ]}
        />
        <p>
          You can block users and report direct or group messages using the
          available controls. Reports include the reported message and nearby
          conversation context for authorized staff to review. Report details
          are also delivered through a webhook to our staff in our private
          Discord server so we can respond quickly. These alerts go to our team,
          not Discord staff. Violations may result in messaging restrictions,
          temporary or permanent communication bans, or account suspension.
        </p>
        <p>
          Group owners can manage invitations and membership, remove members,
          delete messages in their group, and delete the group. Members who join
          a group can see its earlier message history. Leaving a group or hiding
          a conversation does not delete the messages you sent. Deleting a
          message or account does not automatically remove report records or
          copies retained by recipients. Avoid sharing passwords, payment
          details, or other sensitive information through messaging.
        </p>
      </LegalSection>

      <LegalSection id="contact" title="9. Contact Information">
        <p>
          If you have any questions about these Terms of Service, please contact
          us:
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
