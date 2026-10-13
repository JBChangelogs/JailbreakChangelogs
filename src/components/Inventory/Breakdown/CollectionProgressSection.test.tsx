import { expect, test } from "bun:test";
import { createRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import CollectionProgressSection from "./CollectionProgressSection";

test("both Hyperchrome choices explain completion and appear before the missing-items list", () => {
  const render = (
    countLowerLevels: boolean,
    creditedHyperchromeLevels = countLowerLevels ? 1 : 0,
  ) =>
    renderToStaticMarkup(
      <CollectionProgressSection
        countLowerLevels={countLowerLevels}
        creditedHyperchromeLevels={creditedHyperchromeLevels}
        onCountLowerLevelsChange={() => {}}
        overallProgress={{
          total: 5,
          owned: countLowerLevels ? 4 : 3,
          missingCount: countLowerLevels ? 1 : 2,
          percentage: countLowerLevels ? 80 : 60,
        }}
        typeProgress={[
          {
            type: "HyperChrome",
            total: 5,
            owned: countLowerLevels ? 4 : 3,
            ogOwned: 1,
            missing: [],
            missingCount: countLowerLevels ? 1 : 2,
            percentage: countLowerLevels ? 80 : 60,
          },
        ]}
        unverifiableCount={1}
        missingItemsAll={[
          { id: 547, name: "HyperBlue Level 1", type: "HyperChrome" },
        ]}
        unverifiableItemsAll={[
          { id: 587, name: "HyperShift", type: "HyperChrome" },
        ]}
        collectionChartConfig={{
          value: { label: "Completion", color: "blue" },
        }}
        collectionChartData={[]}
        renderCharts={false}
        unverifiableSectionRef={createRef<HTMLDivElement>()}
        onViewUnverifiable={() => {}}
      />,
    );
  for (const mode of [true, false]) {
    const markup = render(mode);
    expect(markup).toContain("<legend");
    expect(markup).toContain("Hyperchrome collection mode");
    expect(markup).toContain(
      "Completion counts unique items using the Hyperchrome mode selected below.",
    );
    expect(markup).toContain("Inventory scans can’t confirm these items.");
    expect(markup.match(/type="radio"/g)).toHaveLength(2);
    expect(markup).toContain(
      "For each color, your highest level counts its lower levels too. Higher levels remain missing.",
    );
    expect(markup).toContain("Each Hyperchrome level counts separately.");
    expect(markup).toContain(
      "higher level doesn&#x27;t count its lower levels.",
    );
    expect(markup).toContain("OG ownership is unchanged.");
    expect(markup.indexOf("Count lower levels")).toBeLessThan(
      markup.indexOf("Trackable Missing Items"),
    );
    const radios = markup.match(/<input[^>]*type="radio"[^>]*>/g)!;
    expect(radios[0].includes('checked=""')).toBe(mode);
    expect(radios[1].includes('checked=""')).toBe(!mode);
    expect(markup).not.toContain(
      "1 unverifiable items are assumed owned and excluded from this list.",
    );
    expect(markup).toContain("View list");
    expect(markup).toContain(
      mode ? "Lower levels included" : "Owned levels only",
    );
    const disclosure = markup.match(/<details\b[^>]*>[\s\S]*?<\/details>/)![0];
    expect(disclosure).not.toMatch(/<details\b[^>]*\bopen\b/);
    expect(disclosure).toMatch(
      /<summary\b[^>]*>[\s\S]*?Unverifiable Items[\s\S]*?Inventory scans can’t confirm these items\.[\s\S]*?<\/summary>/,
    );
    expect(disclosure).toContain("Show items");
    expect(disclosure).toContain("Hide items");
    expect(markup).toContain('role="status"');
    const text = markup.replace(/<[^>]*>/g, "");
    expect(text).toContain(
      mode
        ? "4/5 collected · 1 missing · 80.00% complete"
        : "3/5 collected · 2 missing · 60.00% complete",
    );
    expect(text).toContain(
      mode
        ? "1 lower Hyperchrome level counted toward completion."
        : "Only Hyperchrome levels currently in your inventory count toward completion.",
    );
  }
  expect(render(true, 0)).toContain(
    "No additional lower Hyperchrome levels to count for this inventory.",
  );
  expect(render(true, 2)).toContain(
    "2 lower Hyperchrome levels counted toward completion.",
  );
});
