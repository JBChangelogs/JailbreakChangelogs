import { expect, test } from "bun:test";
import { highlightBrandName } from "@/components/Testimonials/testimonialText";

const highlighted = (text: string) =>
  highlightBrandName(text)
    .filter((part) => typeof part !== "string")
    .map((part) => part.props.children);

test("highlights the brand but not the generic word", () => {
  expect(
    highlighted(
      "We even use Jailbreakchangelogs to check our own changelogs. JBCL rocks, jailbreak changelogs too",
    ),
  ).toEqual(["Jailbreakchangelogs", "JBCL", "jailbreak changelogs"]);
  expect(highlighted("Before Changelogs and Changelogs Era")).toEqual([
    "Changelogs",
    "Changelogs",
  ]);
  expect(highlighted("scrolling through all the changelogs")).toEqual([]);
});
