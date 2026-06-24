import { toast } from "sonner";
import { createElement } from "react";
import { formatFullDate } from "@/utils/helpers/timestamp";

export class BanError extends Error {
  constructor() {
    super("banned");
  }
}

export interface BanInfo {
  reason: string;
  expiresAt: number;
  banType: string;
}

export function parseBan(res: Response): BanInfo | null {
  if (res.headers.get("banned") !== "true") return null;
  return {
    reason: res.headers.get("ban-reason") ?? "unspecified",
    expiresAt: (() => {
      const v = res.headers.get("ban-expires-at");
      if (!v || v === "permanent") return 0;
      return parseInt(v, 10);
    })(),
    banType: res.headers.get("ban-type") ?? "",
  };
}

export function showBanToast(ban: BanInfo) {
  const feature = ban.banType
    ? ban.banType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "this feature";
  toast.error(
    `You have been banned${feature !== "this feature" ? ` (${feature})` : ""}.`,
    {
      description: createElement(
        "div",
        { className: "flex flex-col gap-0.5" },
        createElement("span", null, `Reason: ${ban.reason}`),
        ban.expiresAt
          ? createElement(
              "span",
              null,
              `Expires: ${formatFullDate(ban.expiresAt)}`,
            )
          : createElement("span", null, "This ban is permanent."),
      ),
    },
  );
}
