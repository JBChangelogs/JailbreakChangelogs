import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";

test("OG watches use the v2 POST body and DELETE item path", async () => {
  const source = ts.createSourceFile(
    "OGNotificationSheet.tsx",
    readFileSync(new URL("./OGNotificationSheet.tsx", import.meta.url), "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  let handler = "";
  const visit = (node: ts.Node) => {
    if (
      ts.isVariableDeclaration(node) &&
      node.name.getText(source) === "toggleNotification"
    )
      handler = node.initializer!.getText(source);
    ts.forEachChild(node, visit);
  };
  visit(source);
  expect(handler).not.toBe("");

  for (const subscribed of [false, true]) {
    const requests: Array<{ url: string; init: RequestInit }> = [];
    let saved: string[] = [];
    const toggle = runInNewContext(
      ts.transpileModule(`(${handler})`, {
        compilerOptions: { target: ts.ScriptTarget.ES2022 },
      }).outputText,
      {
        INVENTORY_API_URL: "https://inventory.example",
        user: { roblox_id: "123" },
        processingItemId: null,
        notifiedItemIds: subscribed ? ["49"] : [],
        setProcessingItemId: () => {},
        toast: { loading: () => 1, success: () => {} },
        trackEvent: () => {},
        queryClient: {
          cancelQueries: async () => {},
          setQueryData: (
            _key: string[],
            update: (old: string[]) => string[],
          ) => {
            saved = update(subscribed ? ["49"] : []);
          },
          invalidateQueries: () => {},
        },
        fetch: async (url: string, init: RequestInit) => {
          requests.push({ url, init });
          return Response.json({ success: true });
        },
        log: { error: () => {} },
      },
    ) as (item: { id: number; name: string; type: string }) => Promise<void>;
    await toggle({ id: 49, name: "Torpedo", type: "Vehicle" });
    expect(requests).toHaveLength(1);
    expect(requests[0].url).toBe(
      `https://inventory.example/v2/users/123/og-notifications${subscribed ? "/49" : ""}`,
    );
    expect(requests[0].init.method).toBe(subscribed ? "DELETE" : "POST");
    expect(requests[0].init.credentials).toBe("include");
    if (subscribed) expect(requests[0].init.body).toBeUndefined();
    else
      expect(JSON.parse(requests[0].init.body as string)).toEqual({
        item_id: "49",
      });
    expect(saved).toEqual(subscribed ? [] : ["49"]);
  }
});
