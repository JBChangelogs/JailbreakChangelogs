import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { UserAvatar } from "./avatar";

test("avatars use the API URL verbatim, including animated and default images", () => {
  for (const avatarUrl of [
    "https://cdn.discordapp.com/avatars/123/a_animated.gif",
    "https://cdn.discordapp.com/embed/avatars/0.png",
    "https://uploads.jailbreakchangelogs.com/custom.webp",
  ]) {
    const html = renderToStaticMarkup(
      <UserAvatar userId="123" username="Test" avatarUrl={avatarUrl} />,
    );
    expect(
      html.includes(avatarUrl) || html.includes(encodeURIComponent(avatarUrl)),
    ).toBe(true);
  }
});

test("explicit Roblox avatars keep their override", () => {
  const html = renderToStaticMarkup(
    <UserAvatar
      userId="123"
      username="Test"
      avatarUrl="https://cdn.discordapp.com/embed/avatars/0.png"
      forceAvatarUrl="https://tr.rbxcdn.com/roblox.png"
    />,
  );
  expect(html).toContain(
    encodeURIComponent("https://tr.rbxcdn.com/roblox.png"),
  );
  expect(html).not.toContain("embed/avatars");
});
