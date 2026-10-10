export const TESTIMONIALS_BASE_URL =
  "https://assets.jailbreakchangelogs.com/assets/testimonials";

const brandSplitRegex = /(jailbreak\s*changelogs?|changelogs|jbcl)/gi;
const fullBrandRegex = /^(jailbreak\s*changelogs?|jbcl)$/i;

// Lowercase "changelogs" alone is usually the generic word ("our own
// changelogs"); people capitalize it when they mean the site.
const isBrand = (part: string) =>
  fullBrandRegex.test(part) || part === "Changelogs";

export const highlightBrandName = (text: string) => {
  const parts = text.split(brandSplitRegex);

  return parts.map((part, index) => {
    if (isBrand(part)) {
      return (
        <span key={index} className="text-highlight font-semibold">
          {part}
        </span>
      );
    }
    return part;
  });
};
