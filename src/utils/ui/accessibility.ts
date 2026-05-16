/**
 * Accessibility utility functions for consistent patterns across the application
 */

/**
 * Creates an aria-label for status indicators
 */
export const createStatusAriaLabel = (type: string, status: string): string => {
  return `${type}: ${status}`;
};

/**
 * Creates an aria-label for progress bars
 */
export const createProgressAriaLabel = (
  label: string,
  current: number,
  max: number = 100,
): string => {
  return `${label}: ${current}% of ${max}%`;
};

/**
 * Creates an aria-label for value indicators
 */
export const createValueAriaLabel = (
  type: string,
  value: string | number,
  unit?: string,
): string => {
  const unitText = unit ? ` ${unit}` : "";
  return `${type}: ${value}${unitText}`;
};

/**
 * Creates an aria-label for trend indicators
 */
export const createTrendAriaLabel = (trend: string): string => {
  return `Price trend: ${trend}`;
};

/**
 * Creates an aria-label for demand indicators
 */
export const createDemandAriaLabel = (demand: string): string => {
  return `Demand level: ${demand}`;
};

/**
 * Creates an aria-label for item type indicators
 */
export const createItemTypeAriaLabel = (type: string): string => {
  return `Item type: ${type}`;
};

/**
 * Creates an aria-label for duplicate indicators
 */
export const createDuplicateAriaLabel = (number: number): string => {
  return `Duplicate item number ${number}`;
};

/**
 * Creates an aria-label for online/offline status
 */
export const createPresenceAriaLabel = (
  isOnline: boolean,
  lastSeen?: string,
): string => {
  if (isOnline) {
    return "User is currently online";
  }
  return lastSeen ? `User was last seen ${lastSeen}` : "User is offline";
};

/**
 * Creates an aria-label for data freshness indicators
 */
export const createDataFreshnessAriaLabel = (isFresh: boolean): string => {
  return isFresh ? "Data is fresh and up to date" : "Data may be outdated";
};

/**
 * Creates an aria-label for achievement status indicators
 */
export const createAchievementAriaLabel = (isAchievable: boolean): string => {
  return isAchievable ? "Achievable" : "Not achievable";
};

/**
 * Common accessibility props for interactive elements
 */
export const getInteractiveAriaProps = (label: string, expanded?: boolean) => ({
  "aria-label": label,
  "aria-expanded": expanded,
  role: "button" as const,
});

/**
 * Common accessibility props for progress indicators
 */
export const getProgressAriaProps = (
  label: string,
  current: number,
  max: number = 100,
) => ({
  role: "progressbar" as const,
  "aria-valuenow": current,
  "aria-valuemin": 0,
  "aria-valuemax": max,
  "aria-label": createProgressAriaLabel(label, current, max),
});

/**
 * Common accessibility props for status indicators
 */
export const getStatusAriaProps = (type: string, status: string) => ({
  "aria-label": createStatusAriaLabel(type, status),
});

/**
 * Common accessibility props for value indicators
 */
export const getValueAriaProps = (
  type: string,
  value: string | number,
  unit?: string,
) => ({
  "aria-label": createValueAriaLabel(type, value, unit),
});
