import { expect, test } from "bun:test";
import * as settingsConfig from "@/config/settings";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, transpileModule } from "typescript";

type Element = { props: Record<string, unknown> };

function setup() {
  let loading = false;
  const cache = new Map<string, unknown>([
    ["email,linked,user", { linked: true }],
    ["email,notifications,user", { enabled: false }],
  ]);
  const requests: string[] = [];
  let resolveRequest: (result: unknown) => void = () => {};
  let rejectRequest: (error: Error) => void = () => {};
  const request = (operation: string) => {
    requests.push(operation);
    return new Promise((resolve, reject) => {
      resolveRequest = resolve;
      rejectRequest = reject;
    });
  };
  const exports = {} as Record<string, (props: unknown) => Element>;
  const jsx = (_type: unknown, props: Element["props"]) => ({ props });
  runInNewContext(
    transpileModule(
      readFileSync(
        new URL("./EmailNotificationSettings.tsx", import.meta.url),
        "utf8",
      ),
      {
        compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX },
      },
    ).outputText,
    {
      exports,
      require: (name: string) => {
        if (name === "@/config/settings") return settingsConfig;
        if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
        if (name === "react") return { useState: () => [false, () => {}] };
        if (name === "@tanstack/react-query")
          return {
            useQuery: ({ queryKey }: { queryKey: string[] }) => ({
              data: cache.get(queryKey.join()),
              isPending: false,
              isError: false,
            }),
            useQueryClient: () => ({
              setQueryData: (key: string[], data: unknown) =>
                cache.set(key.join(), data),
            }),
          };
        if (name === "@/utils/api/api")
          return {
            enableEmailNotifications: () => request("enable"),
            disableEmailNotifications: () => request("disable"),
            unlinkEmail: () => request("unlink"),
          };
        if (name === "sonner") return { toast: { success() {}, error() {} } };
        if (name === "@/services/logger")
          return { createLogger: () => ({ error() {} }) };
        return new Proxy({}, { get: (_, key) => String(key) });
      },
    },
  );
  const render = (component: string) =>
    exports[component]({
      userData: { id: "user" },
      loading,
      setLoading: (next: boolean) => {
        loading = next;
      },
    });
  const notifications = () => {
    const row = render("EmailNotificationSettings").props.children as Element;
    return row.props.action as Element;
  };
  const connectionRows = () =>
    render("EmailConnection").props.children as Element[];
  const confirmation = () => connectionRows()[1];
  return {
    notifications,
    connection: () => connectionRows()[0].props.action as Element,
    confirmation,
    toggle: (checked: boolean) =>
      (
        notifications().props.onCheckedChange as (
          checked: boolean,
        ) => Promise<void>
      )(checked),
    unlink: () => (confirmation().props.onConfirm as () => Promise<void>)(),
    requests,
    cache,
    resolve: (result: unknown) => resolveRequest(result),
    reject: () => rejectRequest(new Error("Offline")),
  };
}

for (const checked of [true, false]) {
  test(`notification ${checked ? "enable" : "disable"} blocks unlink until completion`, async () => {
    const email = setup();
    const pending = email.toggle(checked);
    expect(email.connection().props.disabled).toBe(true);
    expect(email.confirmation().props.confirmDisabled).toBe(true);
    await email.unlink();
    expect(email.requests).toEqual([checked ? "enable" : "disable"]);
    email.resolve({ ok: true });
    await pending;
    expect(email.connection().props.disabled).toBe(false);
    const unlink = email.unlink();
    expect(email.notifications().props.disabled).toBe(true);
    email.resolve({ ok: true });
    await unlink;
    expect(email.cache.get("email,linked,user")).toEqual({ linked: false });
    expect(email.cache.get("email,notifications,user")).toEqual({
      enabled: false,
    });
  });
}

test("unlink blocks notification updates and releases both controls on failure", async () => {
  const email = setup();
  const pending = email.unlink();
  expect(email.notifications().props.disabled).toBe(true);
  await email.toggle(true);
  expect(email.requests).toEqual(["unlink"]);
  email.reject();
  await pending;
  expect(email.notifications().props.disabled).toBe(false);
  expect(email.connection().props.disabled).toBe(false);
  expect(email.cache.get("email,linked,user")).toEqual({ linked: true });
});

test("failed notification updates release the shared pending state", async () => {
  const email = setup();
  const pending = email.toggle(true);
  email.reject();
  await pending;
  expect(email.notifications().props.disabled).toBe(false);
  expect(email.connection().props.disabled).toBe(false);
  expect(email.cache.get("email,notifications,user")).toEqual({
    enabled: false,
  });
});
