import { expect, test } from "bun:test";
import ChangelogEntryPage from "./page";

test("old release links redirect to the matching timeline anchor", async () => {
  for (const slug of ["0.53.0", "v0.53.0"]) {
    await expect(
      ChangelogEntryPage({ params: Promise.resolve({ slug: [slug] }) }),
    ).rejects.toMatchObject({
      digest: "NEXT_REDIRECT;replace;/dev/changelogs#release-0.53.0;308;",
    });
  }
});
