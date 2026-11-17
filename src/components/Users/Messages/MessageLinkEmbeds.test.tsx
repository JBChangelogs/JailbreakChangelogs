import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, transpileModule } from "typescript";
import * as React from "react";
import * as runtime from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import ReactMarkdown from "react-markdown";
import * as siteLinks from "@/utils/messages/siteLinks";
import type { LinkEmbed } from "@/services/messageLinkEmbedsService";
import type { MessageLinkEmbeds } from "./MessageLinkEmbeds";

function render(
  embed: Partial<LinkEmbed> | null,
  text = "https://jailbreakchangelogs.com/values",
) {
  const exports = {} as { MessageLinkEmbeds: typeof MessageLinkEmbeds };
  const queries: unknown[] = [];
  const imports: Record<string, unknown> = {
    react: { ...React, lazy: () => ReactMarkdown },
    "react/jsx-runtime": runtime,
    "@tanstack/react-query": {
      useQuery: (options: unknown) => {
        queries.push(options);
        return { data: embed };
      },
    },
    "@/utils/messages/siteLinks": siteLinks,
    "@/services/messageLinkEmbedsService": {},
    "@/components/ui/ImageLightbox": {
      ImageLightbox: ({ children }: { children: React.ReactNode }) => children,
    },
    "@/components/ui/button": {
      Button: ({
        children,
        disabled,
      }: {
        children: React.ReactNode;
        disabled?: boolean;
      }) => (disabled ? <button disabled>{children}</button> : children),
    },
    "@/components/ui/IconWrapper": { Icon: () => null },
  };
  runInNewContext(
    transpileModule(
      readFileSync(new URL("./MessageLinkEmbeds.tsx", import.meta.url), "utf8"),
      {
        compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX },
      },
    ).outputText,
    { exports, require: (name: string) => imports[name] },
  );
  return {
    html: renderToStaticMarkup(<exports.MessageLinkEmbeds text={text} />),
    queries,
  };
}

test("renders standard previews and omits unsafe links and images", () => {
  const { html } = render({
    url: "javascript:alert(1)",
    title: "Values",
    description: "Current prices",
    site_name: "JBCL",
    image: "data:image/svg+xml,unsafe",
  });
  expect(html).toContain("<article");
  expect(html).toContain("Values");
  expect(html).toContain("Current prices");
  expect(html).not.toContain("href=");
  expect(html).not.toContain("<img");
  const valid = render({
    url: "https://jailbreakchangelogs.com/values",
    title: "Values",
    image: "https://embeds.jailbreakchangelogs.com/og/values.png",
  }).html;
  expect(valid).toContain('href="https://jailbreakchangelogs.com/values"');
  expect(valid).toContain('loading="lazy"');
  expect(valid).toContain('referrerPolicy="no-referrer"');
});

test("renders component galleries and buttons, rejects unsafe actions", () => {
  const { html } = render({
    component: {
      type: 17,
      accent_color: 0x2462cd,
      components: [
        {
          type: 12,
          items: [
            {
              media: {
                url: "https://embeds.jailbreakchangelogs.com/og/values.png",
              },
              description: "Values image",
            },
          ],
        },
        { type: 14 },
        {
          type: 1,
          components: [
            {
              type: 2,
              style: 5,
              label: "Calculator",
              url: "https://jailbreakchangelogs.com/values/calculator",
            },
            { type: 2, style: 5, label: "Unsafe", url: "javascript:alert(1)" },
            {
              type: 2,
              style: 5,
              label: "Disabled",
              url: "https://jailbreakchangelogs.com",
              disabled: true,
            },
          ],
        },
      ],
    },
  });
  expect(html).toContain("#2462cd");
  expect(html).toContain('alt="Values image"');
  expect(html).toContain(
    'href="https://jailbreakchangelogs.com/values/calculator"',
  );
  expect(html).toContain("disabled");
  expect(html).not.toContain("Unsafe");
});

test("missing previews leave messages alone and ordinary messages make no requests", () => {
  expect(render(null).html).not.toContain("<article");
  const { html, queries } = render(null, "hello world");
  expect(html).toBe("");
  expect(queries).toHaveLength(0);
});

test("component text renders markdown without HTML or unsafe links", () => {
  const { html } = render({
    component: {
      type: 17,
      components: [
        {
          type: 10,
          content:
            "## Values\n**Prices** [Calculator](https://jailbreakchangelogs.com/values/calculator) [Unsafe](javascript:alert%281%29)\n\n<script>alert(1)</script>",
        },
      ],
    },
  });
  expect(html).toContain("<h2>Values</h2>");
  expect(html).toContain("<strong>Prices</strong>");
  expect(html).toContain(
    'href="https://jailbreakchangelogs.com/values/calculator"',
  );
  expect(html).not.toContain("javascript:");
  expect(html).not.toContain("<script");
});
