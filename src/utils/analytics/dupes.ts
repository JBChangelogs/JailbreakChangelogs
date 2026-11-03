import { trackEvent } from "./rybbit";
import { trackWebEvent } from "./web";

export function trackDupeEvent(
  name:
    | "dupe_comparison_view"
    | "dupe_comparison_switch"
    | "dupe_tree_open"
    | "dupe_tree_history_open"
    | "false_dupe_report_open"
    | "false_dupe_report_submitted",
  props: Record<string, string | number | boolean> = {},
): void {
  // Either analytics provider may be blocked; neither should interrupt the UI.
  try {
    trackWebEvent(name, props);
  } catch {}
  try {
    trackEvent(name, props);
  } catch {}
}
