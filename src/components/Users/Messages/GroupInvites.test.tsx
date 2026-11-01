import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, ScriptTarget, transpileModule } from "typescript";
import * as links from "@/utils/messages/groupInvites";
import { GroupChatError } from "@/utils/api/groupChats";
import type { GroupInvitePreview } from "@/utils/api/groupChats";

type Node = { type: unknown; props: Record<string, unknown> };
function nodes(value: unknown): Node[] {
  if (Array.isArray(value)) return value.flatMap(nodes);
  if (!value || typeof value !== "object" || !("props" in value)) return [];
  const node = value as Node;
  return [node, ...nodes(node.props.children), ...nodes(node.props.footer)];
}
function label(value: unknown): string {
  if (Array.isArray(value)) return value.map(label).join("");
  if (value && typeof value === "object" && "props" in value)
    return label((value as Node).props.children);
  return typeof value === "string" || typeof value === "number"
    ? String(value)
    : "";
}
const settle = () => new Promise<void>((resolve) => setImmediate(resolve));

function load(file: string, imports: Record<string, unknown>, globals = {}) {
  const slots: unknown[] = [];
  let cursor = 0;
  const effects: (() => unknown)[] = [];
  const exports: Record<string, (props?: unknown) => Node> = {};
  const jsx = (type: unknown, props: Node["props"]) => ({ type, props });
  runInNewContext(
    transpileModule(readFileSync(new URL(file, import.meta.url), "utf8"), {
      compilerOptions: {
        module: ModuleKind.CommonJS,
        jsx: JsxEmit.ReactJSX,
        target: ScriptTarget.ES2022,
      },
    }).outputText,
    {
      exports,
      ...globals,
      require: (name: string) => {
        if (name in imports) return imports[name];
        if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
        if (name === "react")
          return {
            useState: (initial: unknown) => {
              const index = cursor++;
              if (!(index in slots)) slots[index] = initial;
              return [
                slots[index],
                (next: unknown) => {
                  slots[index] = next;
                },
              ];
            },
            useRef: (initial: unknown) => {
              const index = cursor++;
              if (!(index in slots)) slots[index] = { current: initial };
              return slots[index];
            },
            useEffect: (effect: () => unknown) => {
              effects.push(effect);
            },
          };
        if (name === "@/utils/messages/groupInvites") return links;
        return new Proxy({}, { get: (_, key) => String(key) });
      },
    },
  );
  return {
    render(name: string, props?: unknown) {
      cursor = 0;
      return exports[name](props);
    },
    effects() {
      effects.splice(0).forEach((effect) => effect());
    },
  };
}

test("app links attempt once, keep the web invite, and reject invalid codes", () => {
  for (const search of [
    "",
    "?invite=K7MPX4QD",
    "?invite=K7MPX4QD&app=true",
    "?invite=bad%2Fcode&app=true",
    "?invite=K7MPX4QD&app=false",
  ]) {
    const attempts: string[] = [];
    const location = {
      set href(value: string) {
        attempts.push(value);
        throw new Error("Protocol blocked");
      },
    };
    const harness = load(
      "./MessagesPageClient.tsx",
      {
        "next/navigation": {
          useSearchParams: () => new URLSearchParams(search),
        },
      },
      { window: { location } },
    );
    const page = harness.render("default");
    harness.effects();
    harness.render("default");
    harness.effects();
    if (search === "") {
      expect(page.type).toBe("default");
    } else {
      expect(page.props.code).toBe(new URLSearchParams(search).get("invite"));
    }
    const opensApp = search === "?invite=K7MPX4QD&app=true";
    expect(attempts).toEqual(
      opensApp ? ["jailbreakchangelogs://invite/K7MPX4QD"] : [],
    );
    expect(page.props.appUrl ?? null).toBe(
      opensApp ? "jailbreakchangelogs://invite/K7MPX4QD" : null,
    );
  }
});

test("web preview signs in, joins, opens existing membership, and explains join failures", async () => {
  const group: GroupInvitePreview = {
    id: "1234567890123456789",
    name: "Crew",
    ownerId: "owner",
    createdAt: 0,
    memberIds: ["owner"],
    memberCount: 1,
    maxMembers: 10,
    isMember: false,
  };
  const auth = {
    user: { id: "me" },
    isAuthenticated: false,
    isLoading: false,
    setLoginModal: () => {
      signIns++;
    },
  };
  const query = {
    data: group,
    isPending: false,
    isError: false,
    error: null as Error | null,
    refetch: async () => {},
  };
  let signIns = 0;
  let enabled = false;
  const joined: string[] = [];
  const paths: string[] = [];
  const attempts: string[] = [];
  const invalidations: unknown[] = [];
  let failure: GroupChatError | null = null;
  const harness = load(
    "./MessagesPageClient.tsx",
    {
      "@/contexts/AuthContext": { useAuthContext: () => auth },
      "nextjs-toploader/app": {
        useRouter: () => ({ push: (path: string) => paths.push(path) }),
      },
      "@tanstack/react-query": {
        useQuery: (options: { enabled: boolean }) => {
          enabled = options.enabled;
          return query;
        },
        useQueryClient: () => ({
          invalidateQueries: async (options: unknown) => {
            invalidations.push(options);
          },
        }),
      },
      "@/utils/api/groupChats": {
        GroupChatError,
        joinGroupInvite: async (code: string) => {
          joined.push(code);
          if (failure) throw failure;
          return group;
        },
      },
    },
    {
      window: {
        location: {
          set href(value: string) {
            attempts.push(value);
          },
        },
      },
    },
  );
  const props = {
    code: "K7MPX4QD",
    appUrl: "jailbreakchangelogs://invite/K7MPX4QD",
  };
  const render = () => nodes(harness.render("GroupInvitePage", props));
  const button = (text: string) =>
    render().find((node) => node.type === "Button" && label(node) === text)!;
  const click = async (text: string) => {
    (button(text).props.onClick as () => void)();
    await settle();
  };
  auth.isLoading = true;
  expect(label(render().find((node) => node.props.role === "status"))).toBe(
    "Loading invite…",
  );
  expect(button("Sign in")).toBeUndefined();
  auth.isLoading = false;
  await click("Sign in");
  expect(signIns).toBe(1);
  expect(enabled).toBe(false);
  await click("Open in app");
  expect(attempts).toEqual([props.appUrl]);
  auth.isAuthenticated = true;
  query.isPending = true;
  expect(label(render().find((node) => node.props.role === "status"))).toBe(
    "Loading invite…",
  );
  expect(button("Join group")).toBeUndefined();
  query.isPending = false;
  expect(label(harness.render("GroupInvitePage", props))).toContain(
    "1 / 10 members",
  );
  expect(enabled).toBe(true);
  await click("Join group");
  expect(joined).toEqual([props.code]);
  expect(paths).toEqual([`/messages/group/${group.id}`]);
  expect(invalidations).toEqual([{ queryKey: ["group-chats", "me"] }]);
  group.memberCount = 10;
  expect(button("Group full").props.disabled).toBe(true);
  group.isMember = true;
  await click("Open group");
  expect(paths).toHaveLength(2);
  expect(joined).toHaveLength(1);
  group.isMember = false;
  group.memberCount = 1;
  for (const [code, status, text] of [
    ["group_full", 400, "This group is full."],
    ["blocked", 403, "blocked each other"],
    ["invite_not_found", 404, "expired or been revoked"],
  ] as const) {
    failure = new GroupChatError(status, code, code);
    await click("Join group");
    expect(label(harness.render("GroupInvitePage", props))).toContain(text);
  }
  expect(paths).toHaveLength(2);
  props.code = "bad/code";
  expect(label(harness.render("GroupInvitePage", props))).toContain(
    "This invite link is invalid.",
  );
  expect(enabled).toBe(false);
});

test("owner invite controls copy, revoke before replacing, and hide a revoked link if creation fails", async () => {
  const calls: string[] = [];
  const copied: string[] = [];
  let code = "K7MPX4QD";
  let failCreate = false;
  const harness = load(
    "./GroupInviteDialog.tsx",
    {
      "@/utils/api/groupChats": {
        createGroupInvite: async (id: string) => {
          calls.push(`POST ${id}`);
          if (failCreate) throw new Error("Unavailable");
          return { code, expires_in: 604800 };
        },
        revokeGroupInvite: async (id: string) => {
          calls.push(`DELETE ${id}`);
        },
      },
      "./GroupChatDialogs": {
        AppDialog: "AppDialog",
        groupErrorMessage: (error: Error) => error.message,
      },
      sonner: { toast: { success: () => {} } },
    },
    {
      navigator: {
        clipboard: {
          writeText: async (value: string) => {
            copied.push(value);
          },
        },
      },
    },
  );
  const render = () =>
    nodes(
      harness.render("GroupInviteDialog", {
        groupId: "group",
        onClose: () => {},
      }),
    );
  const button = (text: string) =>
    render().find((node) => node.type === "Button" && label(node) === text)!;
  const click = async (text: string) => {
    (button(text).props.onClick as () => void)();
    await settle();
  };
  render();
  harness.effects();
  await settle();
  await click("Copy link");
  expect(copied).toEqual([links.groupInviteUrl(code)]);
  code = "NEW12345";
  await click("Reset link");
  expect(calls).toEqual(["POST group", "DELETE group", "POST group"]);
  expect(render().find((node) => node.type === "input")?.props.value).toBe(
    links.groupInviteUrl(code),
  );
  failCreate = true;
  await click("Reset link");
  expect(render().find((node) => node.type === "input")).toBeUndefined();
  expect(button("Copy link").props.disabled).toBe(true);
  failCreate = false;
  await click("Retry");
  expect(calls.slice(-3)).toEqual(["DELETE group", "POST group", "POST group"]);
});
