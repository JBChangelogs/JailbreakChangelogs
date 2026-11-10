import { expect, test } from "bun:test";
import { DialogScrollBody } from "./dialog";

test("dialog body fades follow overflow, scrolling and resizing, and clean up", () => {
  const original = globalThis.ResizeObserver;
  let resize = () => {};
  let disconnected = false;
  const observed: Element[] = [];
  globalThis.ResizeObserver = class {
    constructor(callback: () => void) {
      resize = callback;
    }
    observe(node: Element) {
      observed.push(node);
    }
    disconnect() {
      disconnected = true;
    }
  } as unknown as typeof ResizeObserver;

  try {
    const attributes = new Set<string>();
    const listeners = new Map<string, () => void>();
    const node = {
      scrollTop: 0,
      clientHeight: 100,
      scrollHeight: 300,
      firstElementChild: {} as Element,
      toggleAttribute(name: string, enabled: boolean) {
        if (enabled) attributes.add(name);
        else attributes.delete(name);
      },
      addEventListener(name: string, callback: () => void) {
        listeners.set(name, callback);
      },
      removeEventListener(name: string) {
        listeners.delete(name);
      },
    };
    const element = node as unknown as HTMLDivElement;
    const body = DialogScrollBody({ children: "Rules" });
    const cleanup = body.props.ref(element);
    expect([...attributes]).toEqual(["data-fade-end"]);
    expect(observed).toEqual([element, node.firstElementChild]);

    node.scrollTop = 80;
    listeners.get("scroll")!();
    expect(attributes.has("data-fade-start")).toBe(true);
    expect(attributes.has("data-fade-end")).toBe(true);

    node.scrollTop = 200;
    listeners.get("scroll")!();
    expect([...attributes]).toEqual(["data-fade-start"]);

    node.scrollTop = 0;
    node.clientHeight = 300;
    resize();
    expect(attributes.size).toBe(0);
    cleanup?.();
    expect(disconnected).toBe(true);
    expect(listeners.size).toBe(0);
  } finally {
    globalThis.ResizeObserver = original;
  }
});
