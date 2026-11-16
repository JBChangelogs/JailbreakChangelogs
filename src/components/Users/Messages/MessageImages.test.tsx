import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, transpileModule } from "typescript";
import { getMessageImages } from "@/utils/messages/images";
import type { MessageImages } from "./MessageImages";

test("message thumbnails share a gallery starting at the clicked image and retain expired placeholders", () => {
  type Node = {
    type: string | ((props: unknown) => Node);
    props: {
      children?: Node | Node[] | string;
      images?: { src: string; alt: string }[];
      initialIndex?: number;
      stopPropagation?: boolean;
      onError?: () => void;
    };
  };
  let failed = false;
  const exports = {} as { MessageImages: typeof MessageImages };
  const jsx = (type: Node["type"], props: Node["props"]) => ({ type, props });
  runInNewContext(
    transpileModule(
      readFileSync(new URL("./MessageImages.tsx", import.meta.url), "utf8"),
      {
        compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX },
      },
    ).outputText,
    {
      exports,
      require: (name: string) =>
        name === "react/jsx-runtime"
          ? { jsx, jsxs: jsx }
          : name === "react"
            ? {
                useState: () => [
                  failed,
                  (value: boolean) => {
                    failed = value;
                  },
                ],
              }
            : name === "@/components/ui/ImageLightbox"
              ? { ImageLightbox: "ImageLightbox" }
              : { getMessageImages },
    },
  );
  const url =
    "https://uploads.jailbreakchangelogs.com/message-images/1/0123456789abcdef.webp";
  const urls = [
    url,
    ...["2", "3", "4"].map((id) => url.replace("/1/", `/${id}/`)),
  ];
  const grid = exports.MessageImages({
    metadata: { type: "images", images: urls },
  }) as unknown as Node;
  const image = (grid.props.children as Node[])[0];
  const render = () => (image.type as (props: unknown) => Node)(image.props);
  const link = render();
  expect(link.type).toBe("ImageLightbox");
  expect(link.props.images).toEqual(
    urls.map((src, index) => ({ src, alt: `Attachment ${index + 1}` })),
  );
  expect(link.props.initialIndex).toBe(0);
  for (const [index, thumbnail] of (grid.props.children as Node[]).entries()) {
    const preview = (thumbnail.type as (props: unknown) => Node)(
      thumbnail.props,
    );
    expect(preview.props.images).toBe(link.props.images);
    expect(preview.props.initialIndex).toBe(index);
  }
  expect(link.props.stopPropagation).toBe(true);
  (link.props.children as Node).props.onError!();
  expect(render().props.children).toBe("Image expired");
  expect(exports.MessageImages({ metadata: null })).toBeNull();
});
