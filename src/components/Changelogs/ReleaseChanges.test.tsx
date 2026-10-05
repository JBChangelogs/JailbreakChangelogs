import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import ReleaseChanges, { ReleaseTimelineEntry } from "./ReleaseChanges";

test("previews five changes with full counts, keeps notes and sanitizes release HTML", () => {
  const content = `### Features\n${Array.from({ length: 6 }, (_, i) => `* Change ${i + 1}`).join("\n")}\n\nRead the migration guide.\n\n<script>alert('unsafe')</script>`;
  const html = renderToStaticMarkup(
    <ReleaseChanges content={content} version="1.0.0" />,
  );
  expect(html).toContain("6 new");
  expect(html).toContain("Show all (6)");
  expect(html).toContain('aria-expanded="false"');
  expect(html).toContain("Change 5");
  expect(html).not.toContain("Change 6");
  expect(html).toContain("Read the migration guide.");
  expect(html).not.toContain("unsafe");
});

test("collapsed timeline entries show counts without rendering release bodies", () => {
  const html = renderToStaticMarkup(
    <ReleaseTimelineEntry
      entry={{
        slug: "1.0.0",
        version: "1.0.0",
        date: "2026-10-05",
        content: "### Bug Fixes\n* Fix the picker",
      }}
      latest={false}
      initiallyOpen={false}
    />,
  );
  expect(html).toContain("1 fix");
  expect(html).toContain('id="release-1.0.0"');
  expect(html).not.toContain("Fix the picker");
});
