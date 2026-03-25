import { toast } from "sonner";

const STORAGE_KEY = "jbcl_pending_make_offer_toast";

type StoredToast = {
  id: string | number;
  createdAt: number;
};

export function startMakeOfferLoadingToast(
  message: string = "Preparing offer...",
): string | number {
  const id = toast.loading(message, { duration: Infinity });
  try {
    const payload: StoredToast = { id, createdAt: Date.now() };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage failures (private mode / blocked storage).
  }
  return id;
}

export function consumeMakeOfferLoadingToastId(
  maxAgeMs: number = 20_000,
): string | number | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(STORAGE_KEY);

    const parsed = JSON.parse(raw) as Partial<StoredToast> | null;
    if (!parsed || typeof parsed.createdAt !== "number") return null;
    if (Date.now() - parsed.createdAt > maxAgeMs) return null;

    const id = parsed.id;
    if (typeof id !== "string" && typeof id !== "number") return null;
    return id;
  } catch {
    return null;
  }
}
