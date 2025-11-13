import { Changelog } from "../api/api";

/**
 * Extracts the year from a changelog title
 * Expected format: "Month Day[st/nd/rd/th] Year / UPDATE NAME"
 * Example: "May 1st 2021 / MID-SEASON UPDATE"
 */
export function extractYearFromTitle(title: string): number | null {
  // Match pattern: Month Day[st/nd/rd/th] Year
  const yearMatch = title.match(
    /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:st|nd|rd|th)?\s+(\d{4})\b/i,
  );

  if (yearMatch && yearMatch[2]) {
    return parseInt(yearMatch[2], 10);
  }

  return null;
}

/**
 * Calculates the number of changelogs per year
 */
export function calculateChangelogsByYear(
  changelogs: Changelog[],
): Map<number, number> {
  const yearCounts = new Map<number, number>();

  changelogs.forEach((changelog) => {
    const year = extractYearFromTitle(changelog.title);
    if (year) {
      yearCounts.set(year, (yearCounts.get(year) || 0) + 1);
    }
  });

  return yearCounts;
}

/**
 * Gets a sorted array of year statistics
 */
export function getYearStatistics(
  changelogs: Changelog[],
): Array<{ year: number; count: number }> {
  const yearCounts = calculateChangelogsByYear(changelogs);

  return Array.from(yearCounts.entries())
    .map(([year, count]) => ({ year, count }))
    .sort((a, b) => a.year - b.year);
}

/**
 * Checks if a year is the current year
 */
export function isCurrentYear(year: number): boolean {
  return year === new Date().getFullYear();
}

/**
 * Gets the current month and day for display
 */
export function getCurrentDateString(): string {
  const now = new Date();
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const month = months[now.getMonth()];
  const day = now.getDate();

  // Add ordinal suffix
  let suffix = "th";
  if (day === 1 || day === 21 || day === 31) suffix = "st";
  else if (day === 2 || day === 22) suffix = "nd";
  else if (day === 3 || day === 23) suffix = "rd";

  return `${month} ${day}${suffix}`;
}
