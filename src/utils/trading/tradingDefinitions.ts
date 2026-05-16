export const trendDescriptions: Record<string, string> = {
  Dropping:
    "Items which are currently experiencing a sustained decrease in value due to a demand deficit and/or a supply surplus.",
  Unstable:
    "Items which inconsistently yet occasionally get a varying overpay/underpay from base.",
  Hoarded:
    "Items that have a significant amount of circulation in the hands of a conglomerate or an individual.",
  Manipulated: "Items that only receive its value due to manipulation.",
  Stable:
    "Items which get a consistent amount of value. (Consistent underpay/base/overpay)",
  Recovering:
    "Items which have recently dropped significantly in value which are beginning to gradually increase in demand.",
  Rising:
    "Items which are currently experiencing a sustained increase in value due to a surplus in demand.",
  Hyped:
    "Items which are experiencing a significant, but temporary, spike in demand which is driven by the community",
};

export const demandDescriptions: Record<string, string> = {
  "Close to none":
    "Nearly no interest from traders; typically very hard to trade.",
  "Very Low": "Minimal interest; trades usually require significant overpay.",
  Low: "Limited interest; often needs added value to move.",
  Medium: "Average interest; trades can be inconsistent.",
  Decent: "Good interest; generally trades without heavy overpay.",
  High: "Strong interest; usually trades quickly at solid value.",
  "Very High": "Very strong interest; often commands overpay due to demand.",
  "Extremely High":
    "Top-tier interest; highly sought after and typically overpays.",
};
