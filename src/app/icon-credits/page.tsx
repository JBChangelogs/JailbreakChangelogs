import LegalLayout, { LegalSection } from "@/components/Layout/LegalLayout";
import credits from "@/lib/icon-credits.generated.json";

export default function IconCreditsPage() {
  return (
    <LegalLayout
      title="Icon credits"
      icon="lucide:palette"
      lastUpdated="October 18th, 2026"
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
              className="text-link hover:text-link-hover underline"
            >
              {credit.author.name}
            </a>
            . License:{" "}
            <a
              href={credit.license.url}
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
