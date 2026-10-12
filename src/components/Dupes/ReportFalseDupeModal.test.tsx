import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, transpileModule } from "typescript";

test("false-dupe reports use the catalog ID in the URL and retain the original owner", async () => {
  const requests: { url: string; options: RequestInit }[] = [];
  let resolveReport!: (status: string) => void;
  const resolved = new Promise<string>((resolve) => {
    resolveReport = resolve;
  });
  const exports = {} as {
    default: (props: unknown) => { props: { onConfirm: () => void } };
  };
  const jsx = (type: unknown, props: unknown) => ({ type, props });
  runInNewContext(
    transpileModule(
      readFileSync(
        new URL("./ReportFalseDupeModal.tsx", import.meta.url),
        "utf8",
      ),
      {
        compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX },
      },
    ).outputText,
    {
      exports,
      fetch: async (url: string, options: RequestInit) => {
        requests.push({ url, options });
        return { ok: true };
      },
      require: (name: string) => {
        if (name === "react")
          return {
            useState: (initial: unknown) => [
              initial === "" ? "Incorrect detection" : initial,
              () => {},
            ],
          };
        if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
        if (name === "sonner")
          return {
            toast: {
              loading: () => "toast-id",
              success: () => {},
              error: () => {},
            },
          };
        if (name === "@/components/ui/ConfirmDialog")
          return { ConfirmDialog: "Dialog" };
        if (name === "@/utils/api/apiDevToken")
          return {
            buildApiFetchRequest: (base: string, path: string) => ({
              url: base + path,
              headers: {},
            }),
          };
        if (name === "@/utils/api/api")
          return { PUBLIC_API_URL: "https://api.jailbreakchangelogs.com" };
        if (name === "@/utils/ui/sanitizeText")
          return { sanitizeText: (text: string) => text };
        if (name === "@/services/logger")
          return { createLogger: () => ({ error: () => {} }) };
        if (name === "@/utils/items/categoryIcons")
          return {
            getCategoryColor: () => "#fff",
            getCategoryIcon: () => null,
          };
        throw new Error(`Unexpected import: ${name}`);
      },
    },
  );
  const dialog = exports.default({
    open: true,
    onClose: () => {},
    item: {
      id: "w4&H<P%N)ra$",
      item_id: 49,
      title: "Laser Cannon",
      categoryTitle: "Rim",
    },
    originalOwner: { id: "235642012", displayName: "hamsterskyyy" },
    onReportResolved: resolveReport,
  });
  dialog.props.onConfirm();
  expect(await resolved).toBe("submitted");
  expect(requests).toHaveLength(1);
  expect(requests[0].url).toBe(
    "https://api.jailbreakchangelogs.com/v2/items/49/duplicate-reports",
  );
  expect(requests[0].options.method).toBe("POST");
  expect(requests[0].options.credentials).toBe("include");
  expect(JSON.parse(requests[0].options.body as string)).toEqual({
    reason: "Incorrect detection",
    item_id: 49,
    original_owner: "235642012",
  });
});
