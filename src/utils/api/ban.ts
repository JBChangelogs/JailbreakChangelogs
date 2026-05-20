import { toast } from "sonner";

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
  const feature = ban.banType ? ban.banType.replace(/_/g, " ") : "this feature";
  const expires = ban.expiresAt
    ? new Date(ban.expiresAt * 1000).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "permanently";
  toast.error(
    `You have been banned${feature !== "this feature" ? ` (${feature})` : ""}.`,
    {
      description: `Reason: ${ban.reason} · Expires: ${expires}`,
    },
  );
}
