import type { SideButtonConfig } from "@/components/trading/TradeItemPickerV2";
import type { TradeVerdictKind } from "./calculatorUtils";

export type TradeSide = "offering" | "requesting";

export const FOCUS_RING =
  "focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:outline-none";

export const TINT_FRAME_BY_VERDICT = true;

export const SIDE_STYLES: Record<
  TradeSide,
  {
    label: string;
    shortLabel: string;
    icon: string;
    iconChip: string;
    panelBorder: string;
    slotBorder: string;
    slotHoverBorder: string;
    activeFill: string;
  }
> = {
  offering: {
    label: "You give",
    shortLabel: "Give",
    icon: "heroicons:arrow-up-right",
    iconChip: "bg-button-info text-form-button-text",
    panelBorder: "border-status-info/50",
    slotBorder: "border-status-info",
    slotHoverBorder: "hover:bg-status-info/10",
    activeFill: "bg-button-info text-form-button-text shadow-sm",
  },
  requesting: {
    label: "You receive",
    shortLabel: "Receive",
    icon: "heroicons:arrow-down-left",
    iconChip: "bg-status-warning text-black",
    panelBorder: "border-status-warning/50",
    slotBorder: "border-status-warning",
    slotHoverBorder: "hover:bg-status-warning/10",
    activeFill: "bg-status-warning text-black shadow-sm",
  },
};

export const VERDICT_STYLES: Record<
  TradeVerdictKind,
  { icon: string; pill: string; frame: string; frameTint: string }
> = {
  win: {
    icon: "heroicons:arrow-trending-up",
    pill: "border-status-success bg-status-success text-form-button-text",
    frame: "border-status-success/70",
    frameTint: "bg-status-success/5",
  },
  loss: {
    icon: "heroicons:arrow-trending-down",
    pill: "border-status-error bg-status-error text-form-button-text",
    frame: "border-status-error/70",
    frameTint: "bg-status-error/5",
  },
  fair: {
    icon: "heroicons:scale",
    pill: "border-status-info bg-status-info/15 text-primary-text",
    frame: "border-status-info/50",
    frameTint: "",
  },
  empty: {
    icon: "heroicons:information-circle",
    pill: "border-border-card bg-tertiary-bg text-secondary-text",
    frame: "border-border-card",
    frameTint: "",
  },
};

export const SIDE_BUTTONS: Record<TradeSide, SideButtonConfig> = {
  offering: {
    label: "Offer",
    activeClass: "bg-button-info text-form-button-text",
    inactiveClass: "border border-status-info bg-transparent text-primary-text",
    hintClass:
      "text-primary-text font-medium underline decoration-status-info decoration-2 underline-offset-4",
  },
  requesting: {
    label: "Request",
    activeClass: "bg-status-warning text-black",
    inactiveClass:
      "border border-status-warning bg-transparent text-primary-text",
    hintClass:
      "text-primary-text font-medium underline decoration-status-warning decoration-2 underline-offset-4",
  },
};
