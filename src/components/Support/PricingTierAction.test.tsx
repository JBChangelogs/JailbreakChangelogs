import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import PricingTierAction from "./PricingTierAction";

function renderAction(
  tierNumber: number,
  supporterLevel = 0,
  isRoblox = false,
  isLoading = false,
) {
  return renderToStaticMarkup(
    <PricingTierAction
      tierNumber={tierNumber}
      supporterLevel={supporterLevel}
      isRoblox={isRoblox}
      isLoading={isLoading}
      onSupport={() => {}}
    />,
  );
}

describe("pricing tier actions", () => {
  test("Free stays included for free users and supporters", () => {
    for (const supporterLevel of [0, 3]) {
      const markup = renderAction(0, supporterLevel);
      expect(markup).toContain("Already included");
      expect(markup).not.toContain("<button");
    }
  });

  test("the current paid tier shows its label instead of a purchase button", () => {
    const markup = renderAction(2, 2);
    expect(markup).toContain("Current tier");
    expect(markup).not.toContain("<button");
  });

  test("lower paid tiers show included labels instead of purchase buttons", () => {
    const markup = renderAction(1, 2);
    expect(markup).toContain("Included in your plan");
    expect(markup).not.toContain("<button");
  });

  test("higher tiers show enabled Discord purchase buttons once prices load", () => {
    const markup = renderAction(3, 2);
    expect(markup).toContain("<button");
    expect(markup).toContain("Support with Discord");
    expect(markup).not.toContain('disabled=""');
  });

  test("Discord upgrades are disabled while prices load", () => {
    const markup = renderAction(3, 2, false, true);
    expect(markup).toMatch(/<button\b[^>]*disabled=""/);
    expect(markup).toContain("Loading...");
    expect(markup).not.toContain("Support with Discord");
  });

  test("a missing Discord purchase URL shows a disabled unavailable button", () => {
    const markup = renderToStaticMarkup(
      <PricingTierAction
        tierNumber={3}
        supporterLevel={2}
        isRoblox={false}
        isLoading={false}
        isUnavailable
        onSupport={() => {}}
      />,
    );
    expect(markup).toContain('disabled=""');
    expect(markup).toContain("Unavailable");
    expect(markup).not.toContain("Support with Discord");
  });

  test("Roblox upgrades remain available while Discord prices load", () => {
    const markup = renderAction(3, 2, true, true);
    expect(markup).toContain("<button");
    expect(markup).toContain("Support with Robux");
    expect(markup).not.toContain('disabled=""');
    expect(markup).not.toContain("Loading...");
  });
});
