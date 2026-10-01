import type { PhrasingContent, Root } from "mdast";

function headingText(node: PhrasingContent): string {
  if ("value" in node && typeof node.value === "string") return node.value;
  if ("children" in node) return node.children.map(headingText).join("");
  return "";
}

export function omitRepeatedReleaseHeading(version: string) {
  return (tree: Root) => {
    const first = tree.children[0];
    if (first?.type !== "heading") return;

    const heading = first.children.map(headingText).join("").trim();
    const normalized = heading.startsWith("v") ? heading.slice(1) : heading;
    if (
      normalized === version ||
      (normalized.startsWith(`${version} (`) && normalized.endsWith(")"))
    ) {
      tree.children.shift();
    }
  };
}
