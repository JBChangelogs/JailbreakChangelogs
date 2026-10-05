import { afterEach, expect, spyOn, test } from "bun:test";
import { QueryClient, queryOptions } from "@tanstack/react-query";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { ModuleKind, transpileModule } from "typescript";
import { buildApiFetchRequest } from "./apiDevToken";
import { fetchWithRetry } from "./fetchWithRetry";
import type {
  profileSocialQueryOptions,
  ProfileFollowing,
} from "./profileSocialQueries";
import type { fetchProfileData } from "@/services/profileDataService";

const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
});

test("profile counts, follow status, and modals share complete lists without duplicate requests", async () => {
  const socialExports = {} as {
    profileSocialQueryOptions: typeof profileSocialQueryOptions;
  };
  const serviceExports = {} as { fetchProfileData: typeof fetchProfileData };
  for (const [path, exports] of [
    [new URL("./profileSocialQueries.ts", import.meta.url), socialExports],
    [
      new URL("../../services/profileDataService.ts", import.meta.url),
      serviceExports,
    ],
  ] as const) {
    runInNewContext(
      transpileModule(readFileSync(path, "utf8"), {
        compilerOptions: { module: ModuleKind.CommonJS },
      }).outputText,
      {
        exports,
        require: (name: string) => {
          if (name === "@tanstack/react-query") return { queryOptions };
          if (name === "./api" || name === "@/utils/api/api")
            return { PUBLIC_API_URL: "https://public-api.example.com" };
          if (name === "./apiDevToken") return { buildApiFetchRequest };
          if (
            name === "./fetchWithRetry" ||
            name === "@/utils/api/fetchWithRetry"
          )
            return { fetchWithRetry };
          if (name === "@/utils/api/profileSocialQueries") return socialExports;
          if (name === "@/services/logger")
            return { createLogger: () => ({ error: () => {} }) };
          throw new Error(`Unexpected import: ${name}`);
        },
      },
    );
  }
  const userId = "123";
  const socialUser = {
    avatar: "",
    global_name: "",
    usernumber: 1,
    accent_color: "",
  };
  const follower = {
    user_id: userId,
    follower_id: "456",
    created_at: "2026-10-06",
    user: { ...socialUser, id: "456", username: "Follower" },
  };
  const following = {
    user_id: userId,
    following_id: "789",
    created_at: "2026-10-06",
    user: { ...socialUser, id: "789", username: "Following" },
  };
  let privateResponse = false;
  const fetchMock = spyOn(globalThis, "fetch").mockImplementation((async (
    input: RequestInfo | URL,
  ) => {
    const url = String(input);
    if (url.endsWith("/description"))
      return Response.json({ description: "Bio", last_updated: 123 });
    if (privateResponse)
      return Response.json({ message: "Private" }, { status: 403 });
    return Response.json(url.endsWith("/followers") ? [follower] : [following]);
  }) as typeof fetch);
  const client = new QueryClient();
  try {
    const details = await serviceExports.fetchProfileData(
      userId,
      client,
      userId,
    );
    expect(details).toEqual({
      followerCount: 1,
      followingCount: 1,
      bio: "Bio",
      bioLastUpdated: 123,
    });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    const followersOptions = socialExports.profileSocialQueryOptions(
      "followers",
      userId,
      userId,
    );
    const followingOptions = socialExports.profileSocialQueryOptions(
      "following",
      userId,
      userId,
    );
    const lists = await Promise.all([
      client.fetchQuery(followingOptions),
      client.fetchQuery(followersOptions),
      client.fetchQuery(followingOptions),
    ]);
    expect(lists).toEqual([[following], [follower], [following]]);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[0]?.[1]?.credentials).toBe("include");

    await client.fetchQuery(
      socialExports.profileSocialQueryOptions("following", userId, "456"),
    );
    expect(fetchMock).toHaveBeenCalledTimes(4);
    await client.invalidateQueries({ queryKey: ["following", userId] });
    await client.fetchQuery(followingOptions);
    expect(fetchMock).toHaveBeenCalledTimes(5);

    privateResponse = true;
    const privateOptions = socialExports.profileSocialQueryOptions(
      "following",
      userId,
      "789",
    );
    await expect(client.fetchQuery(privateOptions)).rejects.toThrow(
      "Failed to load following",
    );
    expect(client.getQueryData(privateOptions.queryKey)).toBeUndefined();
    expect(
      client.getQueryData<ProfileFollowing[]>(followingOptions.queryKey),
    ).toEqual([following]);
    expect(fetchMock).toHaveBeenCalledTimes(6);
    await expect(
      client.fetchQuery(
        socialExports.profileSocialQueryOptions("following", "../admin", null),
      ),
    ).rejects.toThrow("Invalid user ID");
    expect(fetchMock).toHaveBeenCalledTimes(6);
  } finally {
    client.clear();
  }
});
