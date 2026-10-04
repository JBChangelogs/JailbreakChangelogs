import { expect, mock, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import RobberyGrid from "./RobberyGrid";

const getKey = (id: number) => String(id);

test("a 500-card grid creates JSX only for rows near the viewport", () => {
  const items = Array.from({ length: 500 }, (_, index) => index);
  const renderItem = mock((id: number) => (
    <button data-card={id}>Join server {id}</button>
  ));
  const markup = renderToStaticMarkup(
    <RobberyGrid
      items={items}
      getKey={getKey}
      renderItem={renderItem}
      isUpdating={false}
    />,
  );
  const mountedCount = (markup.match(/data-card=/g) ?? []).length;
  expect(mountedCount).toBeGreaterThan(0);
  expect(mountedCount).toBeLessThan(20);
  expect(renderItem).toHaveBeenCalledTimes(mountedCount);
  expect(renderItem.mock.calls.some(([id]) => id === 499)).toBe(false);
  expect(markup).toContain('data-card="0"');
  expect(markup).not.toContain('data-card="499"');
  expect(markup).toContain('aria-busy="false"');
});

test("short grids retain every card and expose pending updates", () => {
  const markup = renderToStaticMarkup(
    <RobberyGrid
      items={[0]}
      getKey={getKey}
      renderItem={() => <button>Join first server</button>}
      isUpdating
    />,
  );
  expect(markup).toContain("Join first server");
  expect(markup).toContain('aria-busy="true"');
});
