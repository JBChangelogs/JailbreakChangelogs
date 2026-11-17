import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, transpileModule } from "typescript";
import * as images from "@/utils/messages/images";
import type { MessageComposer, MessageComposerProps } from "./MessageComposer";

type Handler = (...args: unknown[]) => void;
type Node = {
  type: string;
  props: Record<string, unknown> & {
    onChange?: Handler;
    onPaste?: Handler;
    onDrop?: Handler;
    onClick?: Handler;
    onSubmit?: Handler;
  };
};
function nodes(value: unknown): Node[] {
  if (Array.isArray(value)) return value.flatMap(nodes);
  if (!value || typeof value !== "object" || !("props" in value)) return [];
  const node = value as Node;
  return [
    node,
    ...nodes(node.props.children),
    ...nodes(node.props.rightOverlay),
  ];
}
function harness() {
  const state: unknown[] = [];
  let cursor = 0;
  let effects: (() => (() => void) | undefined)[] = [];
  let cleanups: (() => void)[] = [];
  const windowListeners = new Map<string, (event?: unknown) => void>();
  const requests: { resolve: (url: string) => void; signal: AbortSignal }[] =
    [];
  const sent: unknown[][] = [];
  const frames: (() => void)[] = [];
  const errors: string[] = [];
  const infos: string[] = [];
  const previews: string[] = [];
  const revoked: string[] = [];
  const exports = {} as { MessageComposer: typeof MessageComposer };
  const jsx = (type: string, props: Node["props"]) => ({ type, props });
  const imports: Record<string, unknown> = {
    react: {
      useState: (initial: unknown) => {
        const i = cursor++;
        if (!(i in state)) state[i] = initial;
        return [
          state[i],
          (value: unknown) => {
            state[i] = value;
          },
        ];
      },
      useRef: (initial: unknown) => {
        const i = cursor++;
        return (state[i] ??= { current: initial });
      },
      useMemo: (fn: () => unknown) => fn(),
      useCallback: (fn: unknown) => fn,
      useEffect: (fn: () => (() => void) | undefined) => {
        effects.push(fn);
      },
      useEffectEvent: (fn: unknown) => fn,
    },
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "react-dom": {
      createPortal: (children: unknown, container: unknown) =>
        jsx("portal", { children, container }),
    },
    sonner: {
      toast: {
        error: (message: string) => errors.push(message),
        info: (message: string) => infos.push(message),
      },
    },
    "@/contexts/AuthContext": {
      useAuthContext: () => ({ user: { premiumtype: 0 } }),
    },
    "@/contexts/TwemojiContext": {
      useTwemoji: () => ({ twemojiEnabled: false }),
    },
    "@/hooks/useEmojiStringMap": { useEmojiStringMap: () => ({}) },
    "@/hooks/useFrequentEmojis": { recordEmojiUse: () => {} },
    "@/hooks/useMediaQuery": { useMediaQuery: () => false },
    "@/utils/messages/mentions": { mentionsToIds: (text: string) => text },
    "@/utils/ui/sanitizeText": { sanitizeText: (text: string) => text },
    "@/utils/messages/images": {
      ...images,
      uploadMessageImage: (_file: File, signal: AbortSignal) =>
        new Promise<string>((resolve) => requests.push({ resolve, signal })),
    },
  };
  runInNewContext(
    transpileModule(
      readFileSync(new URL("./MessageComposer.tsx", import.meta.url), "utf8"),
      {
        compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX },
      },
    ).outputText,
    {
      exports,
      crypto,
      AbortController,
      URL: {
        createObjectURL: () => {
          const preview = `blob:preview-${previews.length}`;
          previews.push(preview);
          return preview;
        },
        revokeObjectURL: (preview: string) => revoked.push(preview),
      },
      requestAnimationFrame: (callback: () => void) => {
        frames.push(callback);
        return frames.length;
      },
      document: { body: "document-body" },
      window: {
        addEventListener: (name: string, fn: (event?: unknown) => void) =>
          windowListeners.set(name, fn),
        removeEventListener: (name: string) => windowListeners.delete(name),
      },
      require: (name: string) =>
        imports[name] ?? new Proxy({}, { get: (_, key) => String(key) }),
    },
  );
  const props: MessageComposerProps = {
    conversationId: "dm",
    placeholder: "Message",
    maxChars: 350,
    isSending: false,
    onSend: (...args) => {
      sent.push(args);
    },
  };
  const render = () => {
    cursor = 0;
    effects = [];
    const tree = nodes(exports.MessageComposer(props));
    return tree;
  };
  render();
  cleanups = effects.flatMap((effect) => {
    const cleanup = effect();
    return cleanup ? [cleanup] : [];
  });
  return {
    render,
    flushFrames: () => {
      for (const frame of frames.splice(0)) frame();
    },
    props,
    requests,
    sent,
    errors,
    infos,
    previews,
    revoked,
    drag: (name: string, event?: unknown) => windowListeners.get(name)?.(event),
    windowEvent: (name: string) => windowListeners.get(name)?.(),
    changeConversation: () => {
      cleanups.forEach((cleanup) => cleanup());
      render();
      cleanups = effects.flatMap((effect) => {
        const cleanup = effect();
        return cleanup ? [cleanup] : [];
      });
    },
  };
}
const file = () => new File(["png"], "test.png", { type: "image/png" });
const url =
  "https://uploads.jailbreakchangelogs.com/message-images/1/0123456789abcdef.webp";
const flush = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

test.each(["picker", "paste", "drop"])(
  "%s uploads immediately and enables an image-only send after completion",
  async (source) => {
    const h = harness();
    const tree = h.render();
    let prevented = false;
    if (source === "picker")
      tree.find((n) => n.type === "input")!.props.onChange!({
        target: { files: [file()], value: "" },
      });
    if (source === "paste")
      tree.find((n) => n.type === "ChatToolbarTextarea")!.props.onPaste!({
        clipboardData: { files: [file()] },
        preventDefault: () => {
          prevented = true;
        },
      });
    if (source === "drop")
      h.drag("drop", {
        dataTransfer: { types: ["Files"], files: [file()] },
        preventDefault: () => {
          prevented = true;
        },
      });
    expect(h.requests).toHaveLength(1);
    const pending = h.render();
    expect(pending.find((n) => n.type === "img")?.props.src).toBe(
      h.previews[0],
    );
    const overlay = pending.find((n) => n.props.role === "progressbar")!;
    expect(overlay.props["aria-label"]).toBe("Uploading test.png");
    expect(overlay.props.className).toContain("absolute inset-0");
    expect(nodes(overlay).some((n) => n.type === "Spinner")).toBe(true);
    if (source !== "picker") expect(prevented).toBe(true);
    h.render().find((n) => n.type === "ChatToolbarTextarea")!.props.onSubmit!();
    expect(h.sent).toHaveLength(0);
    h.requests[0].resolve(url);
    await flush();
    expect(h.render().some((n) => n.props.role === "progressbar")).toBe(false);
    expect(h.render().find((n) => n.type === "img")?.props.src).toBe(url);
    h.render().find((n) => n.type === "ChatToolbarTextarea")!.props.onSubmit!();
    expect(h.sent).toEqual([["", { type: "images", images: [url] }]]);
    expect(h.revoked).toEqual(h.previews);
  },
);

test("attachment cap, removal and switching conversations prevent stale uploads", async () => {
  const h = harness();
  const select = (files: File[]) =>
    h.render().find((n) => n.type === "input")!.props.onChange!({
      target: { files, value: "" },
    });
  select(Array.from({ length: 5 }, file));
  expect(h.requests).toHaveLength(0);
  expect(h.infos[0]).toContain("4 images");
  expect(h.errors).toHaveLength(0);
  select([file(), file()]);
  expect(h.requests).toHaveLength(2);
  select([file(), file(), file()]);
  expect(h.requests).toHaveLength(2);
  expect(h.infos).toHaveLength(2);
  select([file(), file()]);
  expect(h.requests).toHaveLength(4);
  h.render().find((n) => n.props["aria-label"] === "Remove test.png")!.props
    .onClick!();
  expect(h.requests[0].signal.aborted).toBe(true);
  expect(h.revoked).toEqual([h.previews[0]]);
  h.props.conversationId = "group:next";
  h.changeConversation();
  expect(h.requests.every((request) => request.signal.aborted)).toBe(true);
  expect(h.revoked).toEqual(h.previews);
  h.requests.forEach((request) => request.resolve(url));
  await flush();
  h.render().find((n) => n.type === "ChatToolbarTextarea")!.props.onSubmit!();
  expect(h.sent).toHaveLength(0);
});

test("full-screen image drag overlay survives nested targets and clears on leave, drop and cancellation", () => {
  const h = harness();
  const event = {
    dataTransfer: {
      types: ["Files"],
      items: [{ kind: "file", type: "image/png" }],
      files: [file()],
      dropEffect: "none",
    },
    preventDefault: () => {},
  };
  const overlayVisible = () =>
    h.render().some((node) => node.props.role === "status");
  expect(overlayVisible()).toBe(false);
  h.drag("dragenter", event);
  expect(overlayVisible()).toBe(true);
  expect(
    h.render().find((node) => node.type === "portal")?.props.container,
  ).toBe("document-body");
  expect(
    h.render().find((node) => node.props.role === "status")?.props.className,
  ).toContain("fixed inset-0");
  expect(
    h.render().find((node) => node.props.role === "status")?.props.className,
  ).toContain("z-[2147483647]");
  h.drag("dragenter", event);
  h.drag("dragleave", event);
  expect(overlayVisible()).toBe(true);
  h.drag("dragover", event);
  expect(event.dataTransfer.dropEffect).toBe("copy");
  h.drag("dragleave", event);
  expect(overlayVisible()).toBe(false);
  h.drag("dragenter", event);
  h.windowEvent("dragend");
  expect(overlayVisible()).toBe(false);
  h.drag("dragenter", event);
  h.drag("drop", event);
  expect(overlayVisible()).toBe(false);
  expect(h.requests).toHaveLength(1);
  h.drag("dragenter", event);
  h.windowEvent("blur");
  expect(overlayVisible()).toBe(false);
  h.drag("dragenter", {
    ...event,
    dataTransfer: {
      ...event.dataTransfer,
      items: [{ kind: "file", type: "text/plain" }],
    },
  });
  expect(overlayVisible()).toBe(true);
  expect(
    h
      .render()
      .some((node) => node.props.children === "File type not supported"),
  ).toBe(true);
  h.windowEvent("dragend");
  expect(overlayVisible()).toBe(false);
  h.props.disabled = true;
  h.changeConversation();
  h.drag("dragenter", event);
  expect(overlayVisible()).toBe(false);
  h.drag("drop", event);
  expect(h.requests).toHaveLength(1);
});

test("attachments sit above the input and actions, with filenames and expiry in a tooltip", async () => {
  const h = harness();
  let chooseImages: (() => void) | undefined;
  h.props.actions = (choose) => {
    chooseImages = choose;
    return "Actions";
  };
  h.render().find((node) => node.type === "input")!.props.onChange!({
    target: { files: [file()], value: "" },
  });
  h.requests[0].resolve(url);
  await flush();
  const tree = h.render();
  const children = (tree[0].props.children as unknown[]).filter(
    (value): value is Node =>
      Boolean(value && typeof value === "object" && "props" in value),
  );
  const attachments = children.find(
    (node) => node.props["aria-label"] === "Image attachments",
  )!;
  const inputRow = children.find((node) =>
    nodes(node).some((child) => child.type === "ChatToolbarTextarea"),
  )!;
  expect(attachments).toBeDefined();
  expect(inputRow).toBeDefined();
  expect(children.indexOf(attachments)).toBeLessThan(
    children.indexOf(inputRow),
  );
  expect(
    nodes(inputRow).some(
      (node) => node.props["aria-label"] === "Image attachments",
    ),
  ).toBe(false);
  expect(inputRow.props.children).toContain("Actions");
  expect(chooseImages).toBeFunction();
  expect(tree.find((node) => node.type === "ImageLightbox")?.props.src).toBe(
    url,
  );
  expect(
    tree.find((node) => node.props["aria-label"] === "Preview test.png")?.type,
  ).toBe("button");
  expect(
    tree.find((node) => node.type === "p" && node.props.title === "test.png")
      ?.props.children,
  ).toBe("test.png");
  const expiry = tree.find(
    (node) =>
      typeof node.props.children === "string" &&
      node.props.children.includes("30 days"),
  );
  expect(expiry?.type).toBe("TooltipContent");
});

test.each(["video/mp4", "image/svg+xml", "application/pdf"])(
  "unsupported %s drags explain accepted formats before dropping",
  (type) => {
    const h = harness();
    const event = {
      dataTransfer: {
        types: ["Files"],
        items: [{ kind: "file", type }],
        dropEffect: "copy",
      },
      preventDefault: () => {},
    };
    h.drag("dragenter", event);
    expect(
      h
        .render()
        .some((node) => node.props.children === "File type not supported"),
    ).toBe(true);
    expect(
      h
        .render()
        .some(
          (node) =>
            node.props.children ===
            "Only PNG, JPG, WEBP or GIF images can be attached.",
        ),
    ).toBe(true);
    h.drag("dragover", event);
    expect(event.dataTransfer.dropEffect).toBe("none");
    expect(h.requests).toHaveLength(0);
    h.drag("dragleave", event);
    expect(h.render().some((node) => node.props.role === "status")).toBe(false);
  },
);

test("selecting an emoji restores the composer caret to the end and Enter sends the draft", () => {
  const h = harness();
  let focused = 0;
  let selection: number[] = [];
  const textarea = {
    value: "hello",
    focus: () => {
      focused++;
    },
    setSelectionRange: (...args: number[]) => {
      selection = args;
    },
  };
  const fileInput = h.render().find((node) => node.type === "input")!.props
    .ref as { current: unknown };
  fileInput.current = { parentElement: { querySelector: () => textarea } };
  h.render().find((node) => node.type === "ChatToolbarTextarea")!.props
    .onChange!({ target: { value: "hello", selectionStart: 1 } });
  const picker = h.render().find((node) => node.type === "EmojiPicker")!;
  (picker.props.onSelect as (emoji: string, keepOpen: boolean) => void)(
    "🐢",
    false,
  );
  const tree = h.render();
  const input = tree.find((node) => node.type === "ChatToolbarTextarea")!;
  textarea.value = input.props.value as string;
  h.flushFrames();
  expect(textarea.value).toBe("h🐢ello");
  expect(focused).toBe(1);
  expect(selection).toEqual([textarea.value.length, textarea.value.length]);
  let prevented = false;
  const content = tree.find((node) => node.type === "PopoverContent")!;
  (
    content.props.onCloseAutoFocus as (event: {
      preventDefault: () => void;
    }) => void
  )({
    preventDefault: () => {
      prevented = true;
    },
  });
  expect(prevented).toBe(true);
  input.props.onSubmit!();
  expect(h.sent).toEqual([["h🐢ello", undefined]]);
});
