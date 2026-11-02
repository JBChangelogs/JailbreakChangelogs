export const SUGGESTION_FIELDS = [
  "cash_value",
  "duped_value",
  "trend",
  "demand",
  "duped_demand",
  "notes",
];

export const SUGGESTION_CHART_METRICS: Partial<
  Record<string, "cash" | "duped" | "traded">
> = {
  cash_value: "cash",
  duped_value: "duped",
  demand: "traded",
  duped_demand: "traded",
  trend: "cash",
};

export const fieldLabel = (field: string) =>
  field
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

export const statusColors: Record<string, string> = {
  pending: "bg-status-warning/20 text-primary-text border-status-warning/30",
  approved: "bg-status-success/20 text-primary-text border-status-success/30",
  accepted: "bg-status-success/20 text-primary-text border-status-success/30",
  rejected: "bg-status-error/20 text-primary-text border-status-error/30",
};

export const stripHtml = (raw: string) =>
  DOMPurify.sanitize(raw, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });

export const badgeBase =
  "inline-flex h-6 items-center rounded-md border px-2.5 text-xs leading-none font-medium backdrop-blur-xl";

export const GUIDELINES_DISMISSED_KEY = "suggestion_guidelines_v1_dismissed";
import DOMPurify from "dompurify";
