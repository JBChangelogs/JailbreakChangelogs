import { expect, mock, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, transpileModule } from "typescript";

interface Element {
  type: (props: Record<string, unknown>) => Promise<Element>;
  props: Record<string, unknown> & { children?: Element };
}

for (const file of ["UserDataStreamer", "InventoryDataStreamer"]) {
  test(`${file} suppresses banned-user logs and preserves unexpected failures`, async () => {
    let failure: unknown;
    const logError = mock(() => {});
    const connection = { id: "123" };
    const exports = {} as {
      default: (props: Record<string, unknown>) => Element;
    };
    runInNewContext(
      transpileModule(
        readFileSync(new URL(`./${file}.tsx`, import.meta.url), "utf8"),
        {
          compilerOptions: {
            module: ModuleKind.CommonJS,
            jsx: JsxEmit.ReactJSX,
          },
        },
      ).outputText,
      {
        exports,
        Error,
        require: (name: string) => {
          if (name === "react/jsx-runtime")
            return {
              jsx: (type: unknown, props: unknown) => ({ type, props }),
            };
          if (name === "react") return { Suspense: "Suspense" };
          if (name === "@/services/logger")
            return { createLogger: () => ({ error: logError }) };
          if (name === "@/utils/api/routeAuth")
            return { getServerVerificationHeaders: async () => ({}) };
          if (name === "@/services/userDataService")
            return {
              UserDataService: {
                extractUserIdsFromInventory: () => ["123"],
                fetchUserData: async () => ({ robloxUsers: {} }),
              },
            };
          if (name === "@/utils/api/api")
            return {
              fetchUserByRobloxId: async () => {
                if (failure !== undefined) throw failure;
                return connection;
              },
              fetchInventoryData: async () => ({
                error: true,
                message: "Inventory not found for this user.",
              }),
              fetchUserNetworth: async () => [],
              fetchUserMoneyHistory: async () => [],
            };
          return { default: name };
        },
      },
    );

    for (failure of [
      new Error("BANNED_USER: This user is banned."),
      new Error("Network failure"),
      "Unexpected rejection",
      undefined,
    ]) {
      logError.mockClear();
      const root = exports.default({ robloxId: "123", inventoryData: {} });
      const fetcher = root.props.children ?? root;
      const result = await fetcher.type(fetcher.props);
      expect(result.props.userConnectionData).toEqual(
        failure === undefined ? connection : null,
      );
      const shouldLog =
        failure !== undefined &&
        !(
          failure instanceof Error && failure.message.startsWith("BANNED_USER:")
        );
      expect(logError).toHaveBeenCalledTimes(shouldLog ? 1 : 0);
      if (shouldLog)
        expect(logError).toHaveBeenCalledWith(
          "Failed to fetch user connection data",
          failure,
        );
    }
  });
}
