import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { ValueRangeFilter } from "./ValueRangeFilter";
import { formatFullValue, formatPrice } from "@/utils/trading/values";

test("value filters and item prices keep comma formatting across browser locales", () => {
  const original = Number.prototype.toLocaleString;
  let defaultLocale = "en-US";
  Number.prototype.toLocaleString = function (locales, options) {
    return original.call(this, locales ?? defaultLocale, options);
  };
  try {
    const render = () =>
      renderToStaticMarkup(
        <ValueRangeFilter
          rangeValue={[1234, 50000000]}
          maxValueRange={50000000}
          onCommit={() => {}}
        />,
      );
    const server = render();
    defaultLocale = "pt-BR";
    expect(render()).toBe(server);
    expect(server).toContain('value="1,234"');
    expect(server).toContain('value="50,000,000"');
    expect(formatFullValue("1.5m")).toBe("1,500,000");
    expect(formatPrice("1.5k - 2m")).toBe("1,500 - 2,000,000");
    expect(formatPrice("100k / 499 Robux")).toBe("100,000 / 499 Robux");
    expect(formatFullValue(null)).toBe("N/A");
  } finally {
    Number.prototype.toLocaleString = original;
  }
});
