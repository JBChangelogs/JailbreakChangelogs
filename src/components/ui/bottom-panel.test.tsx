import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { BottomPanelHeader } from "./bottom-panel";

test("bottom panel headers can hide the close button while keeping the handle and content", () => {
  const render = (showCloseButton?: boolean) =>
    renderToStaticMarkup(
      <BottomPanelHeader
        handle={<button>Resize panel</button>}
        showCloseButton={showCloseButton}
        closeLabel="Close the editor"
        onClose={() => {}}
      >
        <span>Panel title</span>
      </BottomPanelHeader>,
    );

  expect(render()).toContain('aria-label="Close the editor"');
  const messages = render(false);
  expect(messages).not.toContain('aria-label="Close the editor"');
  expect(messages).toContain("Resize panel");
  expect(messages).toContain("Panel title");
});
