export const TESTIMONIALS_BASE_URL =
  "https://assets.jailbreakchangelogs.xyz/assets/testimonials";

const brandSplitRegex = /(jailbreak\s*changelogs?|changelogs|jbcl)/gi;
const brandCheckRegex = /(jailbreak\s*changelogs?|changelogs|jbcl)/i;

export const highlightBrandName = (text: string) => {
  const parts = text.split(brandSplitRegex);

  return parts.map((part, index) => {
    if (brandCheckRegex.test(part)) {
      return (
        <span key={index} className="text-link font-semibold">
          {part}
        </span>
      );
    }
    return part;
  });
};
