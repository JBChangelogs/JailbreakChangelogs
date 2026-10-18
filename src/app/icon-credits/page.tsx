import LegalLayout, { LegalSection } from "@/components/Layout/LegalLayout";
import { credits, lastUpdated } from "@/lib/icon-credits.generated.json";

export default function IconCreditsPage() {
  return (
    <LegalLayout
      title="Icon credits"
      icon="lucide:palette"
      lastUpdated={lastUpdated}
      toc={credits.map((credit) => ({ id: credit.prefix, label: credit.name }))}
      intro={
        <p>
          Credits and license notices for the icon collections used on this
          website. Artwork may be scaled and colored to match the interface.
          These icons remain under their respective licenses.
        </p>
      }
    >
      {credits.map((credit) => (
        <LegalSection
          key={credit.prefix}
          id={credit.prefix}
          title={credit.name}
        >
          <p>
            By{" "}
            <a
              href={credit.author.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${credit.author.name} (opens in a new tab)`}
              className="text-link hover:text-link-hover underline"
            >
              {credit.author.name}
            </a>
            . License:{" "}
            <a
              href={credit.license.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${credit.license.title} (opens in a new tab)`}
              className="text-link hover:text-link-hover underline"
            >
              {credit.license.title}
            </a>
            .
          </p>
          <a
            href={`/licenses/icons/${credit.prefix}.txt`}
            className="text-link hover:text-link-hover underline"
          >
            License and copyright notices
          </a>
        </LegalSection>
      ))}
    </LegalLayout>
  );
}
