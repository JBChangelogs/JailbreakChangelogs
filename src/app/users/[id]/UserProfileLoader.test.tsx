import { expect, test } from "bun:test";
import { QueryClient } from "@tanstack/react-query";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, transpileModule } from "typescript";

test("client loader defers requests to its query and preserves loading, data, and access errors", async () => {
  const userId = "1234567890123456789";
  const user = { id: userId, username: "test-user" };
  const details = { followerCount: 2, followingCount: 1, bio: "Hello" };
  let requests = 0;
  let currentUser: { id: string; username: string; banner: null } | null = null;
  const queryClient = new QueryClient();
  let queryOptions: {
    queryKey: Array<string | null>;
    queryFn: () => Promise<unknown>;
  };
  let queryResult: Record<string, unknown> = { isPending: true };
  const exports = {} as {
    default: (props: { userId: string }) => {
      type: string;
      key: string;
      props: {
        profileData?: unknown;
        error?: { code: number };
        onProfileDataChange: (
          update: (data: { user: typeof user } & typeof details) => unknown,
        ) => void;
      };
    };
  };
  runInNewContext(
    transpileModule(
      readFileSync(new URL("./UserProfileLoader.tsx", import.meta.url), "utf8"),
      {
        compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX },
      },
    ).outputText,
    {
      exports,
      require: (name: string) => {
        if (name === "react/jsx-runtime")
          return {
            jsx: (type: string, props: unknown, key: string) => ({
              type,
              props,
              key,
            }),
          };
        if (name === "@tanstack/react-query")
          return {
            useQueryClient: () => queryClient,
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
          return { fetchProfileData: async () => details };
        if (name === "@/contexts/AuthContext")
          return {
            useAuthContext: () => ({ user: currentUser, isLoading: false }),
          };
        return { default: name };
      },
    },
  );
  expect(exports.default({ userId }).type).toBe("./loading");
  expect(requests).toBe(0);
  expect(queryOptions!.queryKey).toEqual(["user-profile", userId, null]);
  const data = await queryOptions!.queryFn();
  expect(data).toEqual({ user, ...details });
  queryResult = { data, dataUpdatedAt: 1 };
  expect(exports.default({ userId }).props.profileData).toEqual(data);

  for (const [message, code] of [
    ["PRIVATE_PROFILE: Private", 403],
    ["BANNED_USER: Banned", 403],
    ["NOT_FOUND: Missing", 404],
  ] as const) {
    queryResult = { isError: true, error: new Error(message), data };
    const result = exports.default({ userId });
    expect(result.type).toBe("./UserProfileClient");
    expect(result.props.error!.code).toBe(code);
    expect(result.props.profileData).toBeUndefined();
  }

  queryResult = { isError: true, error: new Error("Network error"), data };
  expect(exports.default({ userId }).props.profileData).toEqual(data);
  queryResult = { isError: true, error: new Error("Network error") };
  expect(exports.default({ userId }).props.error?.code).toBe(500);

  queryClient.setQueryData(["user-profile", userId, null], data);
  queryResult = { data, dataUpdatedAt: 1 };
  const initial = exports.default({ userId });
  let finishRefetch: (data: unknown) => void = () => {};
  const refetch = queryClient
    .fetchQuery({
      queryKey: ["user-profile", userId, null],
      queryFn: () =>
        new Promise((resolve) => {
          finishRefetch = resolve;
        }),
    })
    .catch(() => undefined);
  initial.props.onProfileDataChange((current) => ({
    ...current,
    bio: "Updated",
    followerCount: 3,
  }));
  finishRefetch(data);
  await refetch;
  const updated = queryClient.getQueryData(["user-profile", userId, null]);
  expect(updated).toEqual({
    user,
    ...details,
    bio: "Updated",
    followerCount: 3,
  });
  queryResult = { data: updated, dataUpdatedAt: 2 };
  const refreshed = exports.default({ userId });
  expect(refreshed.key).toBe(initial.key);
  expect(refreshed.props.profileData).toEqual(updated);

  currentUser = { ...user, banner: null };
  queryResult = { isError: true, error: new Error("PRIVATE_PROFILE: Private") };
  const ownPrivateProfile = exports.default({ userId });
  expect(ownPrivateProfile.props.profileData).toMatchObject({ user });
  expect(ownPrivateProfile.props.error).toBeUndefined();
  queryClient.clear();
  ownPrivateProfile.props.onProfileDataChange((current) => ({
    ...current,
    user: { ...current.user, avatar: "Uploaded" },
  }));
  expect(
    queryClient.getQueryData(["user-profile", userId, userId]),
  ).toMatchObject({
    user: { id: userId, avatar: "Uploaded" },
  });
  currentUser = null;
  expect(exports.default({ userId }).props.profileData).toBeUndefined();
  expect(queryOptions!.queryKey).toEqual(["user-profile", userId, null]);
  queryClient.clear();
});
