import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { Icon } from "./IconWrapper";

// globals.css finds dropdown arrows by this attribute to rotate them.
test("icons name themselves in data-icon", () => {
  const html = renderToStaticMarkup(<Icon icon="lucide:chevron-down" />);
  expect(html).toContain("<svg");
  expect(html).toContain('data-icon="lucide:chevron-down"');
});

test("simple navbar icons do not expose tree-dependent IDs", () => {
  for (const icon of ["mingcute:notification-fill", "ic:baseline-message"]) {
    const before = renderToStaticMarkup([
      <Icon key="icon" icon={icon} />,
      null,
    ]);
    const after = renderToStaticMarkup([null, <Icon key="icon" icon={icon} />]);
    expect(before).not.toMatch(/\sid=/);
    expect(after).toBe(before);
  }
});

test("SVG references keep unique stable IDs and explicit IDs are preserved", () => {
  const icon = {
    body: '<defs><clipPath id="clip"><path d="M0 0h16v16H0z"/></clipPath></defs><path clip-path="url(#clip)" d="M0 0h16v16H0z"/>',
    width: 16,
    height: 16,
  };
  const render = () =>
    renderToStaticMarkup(
      <>
        <Icon icon={icon} />
        <Icon icon={icon} />
      </>,
    );
  const markup = render();
  expect(render()).toBe(markup);
  const ids = Array.from(
    markup.matchAll(/<clipPath id="([^"]+)"/g),
    ([, id]) => id,
  );
  expect(ids).toHaveLength(2);
  expect(new Set(ids).size).toBe(2);
  for (const id of ids) expect(markup).toContain(`clip-path="url(#${id})"`);
  const renderExplicit = () =>
    renderToStaticMarkup(<Icon icon={icon} id="clipped-icon" />);
  const explicitMarkup = renderExplicit();
  expect(renderExplicit()).toBe(explicitMarkup);
  expect(explicitMarkup).toContain('id="clipped-icon"');
  // Iconify derives it from the given id; its separator changed in 6.0.3
  // (clipped-iconID0 → clipped_iconID0), so only the prefix is checked.
  const clipId = explicitMarkup.match(/<clipPath id="([^"]+)"/)?.[1];
  expect(clipId).toMatch(/^clipped[-_]icon/);
  expect(explicitMarkup).toContain(`clip-path="url(#${clipId})"`);
  expect(
    renderToStaticMarkup(
      <Icon icon="ic:baseline-message" id="messages-icon" />,
    ),
  ).toContain('id="messages-icon"');
});
