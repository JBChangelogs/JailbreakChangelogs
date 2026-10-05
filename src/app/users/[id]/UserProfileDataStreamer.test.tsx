import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, transpileModule } from "typescript";

test("client loader defers requests to its query and preserves loading, data, and access errors", async () => {
  const userId = "1234567890123456789";
  const user = { id: userId, username: "test-user" };
  const details = { followerCount: 2, followingCount: 1, bio: "Hello" };
  let requests = 0;
  let queryOptions: { queryKey: string[]; queryFn: () => Promise<unknown> };
  let queryResult: Record<string, unknown> = { isPending: true };
  const exports = {} as {
    default: (props: { userId: string }) => {
      type: string;
      props: { initialData?: unknown; error?: { code: number } };
    };
  };
  runInNewContext(
    transpileModule(
      readFileSync(
        new URL("./UserProfileDataStreamer.tsx", import.meta.url),
        "utf8",
      ),
      {
        compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX },
      },
    ).outputText,
    {
      exports,
      require: (name: string) => {
        if (name === "react/jsx-runtime")
          return { jsx: (type: string, props: unknown) => ({ type, props }) };
        if (name === "@tanstack/react-query")
          return {
            useQuery: (options: typeof queryOptions) => {
              queryOptions = options;
              return queryResult;
            },
          };
        if (name === "@/utils/api/api")
          return {
            PUBLIC_API_URL: "https://public-api.example.com",
            fetchUserById: async (id: string, base: string) => {
              expect(id).toBe(userId);
              expect(base).toBe("https://public-api.example.com");
              requests++;
              return user;
            },
          };
        if (name === "@/services/profileDataService")
          return {
            ProfileDataService: { fetchProfileData: async () => details },
          };
        return { default: name };
      },
    },
  );
  expect(exports.default({ userId }).type).toBe("./loading");
  expect(requests).toBe(0);
  expect(queryOptions!.queryKey).toEqual(["user-profile", userId]);
  const data = await queryOptions!.queryFn();
  expect(data).toEqual({ user, ...details });
  queryResult = { data, dataUpdatedAt: 1 };
  expect(exports.default({ userId }).props.initialData).toEqual(data);

  for (const [message, code] of [
    ["PRIVATE_PROFILE: Private", 403],
    ["BANNED_USER: Banned", 403],
    ["NOT_FOUND: Missing", 404],
    ["Failed to load user data", 500],
  ] as const) {
    queryResult = { isError: true, error: new Error(message), data };
    const result = exports.default({ userId });
    expect(result.type).toBe("./UserProfileClient");
    expect(result.props.error!.code).toBe(code);
    expect(result.props.initialData).toBeUndefined();
  }
});
