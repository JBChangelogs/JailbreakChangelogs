const UPDATES_URL = "https://updates.jailbreakchangelogs.com";

export interface Release {
  version: string;
  releasedAt: number | null;
  size: number | null;
}

export type Releases = Record<"Windows" | "macOS" | "Linux", Release | null>;

const toNumber = (value: string | null | undefined) =>
  value && Number.isFinite(Number(value)) ? Number(value) : null;

const toTime = (value: string | null | undefined) => {
  const time = value ? Date.parse(value) : NaN;
  return Number.isNaN(time) ? null : time;
};

/** Reads electron-builder's latest-linux.yml / latest-mac.yml without a YAML parser. */
export function parseYmlRelease(yml: string): Release | null {
  const version = yml.match(/^version:\s*['"]?([^'"\s]+)/m)?.[1];
  if (!version) return null;
  return {
    version,
    releasedAt: toTime(yml.match(/^releaseDate:\s*['"]?([^'"\n]+)/m)?.[1]),
    size: toNumber(yml.match(/^\s+size:\s*(\d+)/m)?.[1]),
  };
}

/** Compares semver-style versions; a prerelease sorts before its release. */
export function compareVersions(a: string, b: string): number {
  // Build metadata (+...) doesn't affect precedence.
  const [mainA, preA] = a.replace(/\+.*$/, "").split(/-(.*)/);
  const [mainB, preB] = b.replace(/\+.*$/, "").split(/-(.*)/);
  const partsA = mainA.split(".").map(Number);
  const partsB = mainB.split(".").map(Number);
  for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
    const diff = (partsA[i] || 0) - (partsB[i] || 0);
    if (diff) return diff;
  }
  if (!preA || !preB) return preA ? -1 : preB ? 1 : 0;
  return preA.localeCompare(preB, undefined, { numeric: true });
}

/** Reads the newest full package version from Velopack's releases.win.json. */
export function parseWindowsVersion(data: unknown): string | null {
  const assets = (data as { Assets?: unknown })?.Assets;
  if (!Array.isArray(assets)) return null;
  const versions = assets
    .filter(
      (asset): asset is { Version: string } =>
        asset?.Type === "Full" && typeof asset.Version === "string",
    )
    .map((asset) => asset.Version);
  return versions.sort(compareVersions).at(-1) ?? null;
}

/** The Tauri app's update manifest (tauri/latest.json): version and date. */
export function parseTauriManifest(
  data: unknown,
): Pick<Release, "version" | "releasedAt"> | null {
  const manifest = data as { version?: unknown; pub_date?: unknown } | null;
  if (typeof manifest?.version !== "string" || !manifest.version) return null;
  return {
    version: manifest.version,
    releasedAt: toTime(
      typeof manifest.pub_date === "string" ? manifest.pub_date : null,
    ),
  };
}

const options = { next: { revalidate: 300 } };
// A stalled request shouldn't hold up the page; the timer starts per call.
const withTimeout = () => ({ ...options, signal: AbortSignal.timeout(3000) });

const INSTALLERS = {
  Windows: "JBCLSetup.exe",
  macOS: "JBCLSetup.dmg",
  Linux: "JBCLSetup.AppImage",
} as const;

// Size and date are optional, so a slow or failed HEAD never blocks the
// version from a manifest.
const headInstaller = (file: string) =>
  fetch(`${UPDATES_URL}/${file}`, { ...withTimeout(), method: "HEAD" })
    .then((response) => (response.ok ? response.headers : null))
    .catch(() => null);

/**
 * Every platform from the Tauri release: one version from tauri/latest.json,
 * size and date from each installer. Null until the first Tauri release.
 */
async function fetchTauriReleases(): Promise<Releases | null> {
  const response = await fetch(
    `${UPDATES_URL}/tauri/latest.json`,
    withTimeout(),
  );
  if (!response.ok) return null;
  const manifest = parseTauriManifest(await response.json());
  if (!manifest) return null;
  const platforms = Object.keys(INSTALLERS) as (keyof Releases)[];
  const headers = await Promise.all(
    platforms.map((platform) => headInstaller(INSTALLERS[platform])),
  );
  return Object.fromEntries(
    platforms.map((platform, i) => [
      platform,
      {
        version: manifest.version,
        releasedAt:
          toTime(headers[i]?.get("last-modified")) ?? manifest.releasedAt,
        size: toNumber(headers[i]?.get("content-length")),
      },
    ]),
  ) as Releases;
}

// The Electron release files, frozen at 0.5.18 once the app moves to Tauri.
async function fetchWindowsRelease(): Promise<Release | null> {
  const [manifest, headers] = await Promise.all([
    fetch(`${UPDATES_URL}/releases.win.json`, withTimeout()),
    headInstaller(INSTALLERS.Windows),
  ]);
  if (!manifest.ok) return null;
  const version = parseWindowsVersion(await manifest.json());
  if (!version) return null;
  return {
    version,
    releasedAt: toTime(headers?.get("last-modified")),
    size: toNumber(headers?.get("content-length")),
  };
}

async function fetchYmlRelease(file: string): Promise<Release | null> {
  const response = await fetch(`${UPDATES_URL}/${file}`, withTimeout());
  return response.ok ? parseYmlRelease(await response.text()) : null;
}

/** The Tauri release when there is one, else the Electron files. */
export async function fetchReleases(): Promise<Releases> {
  // Both start at once; a Tauri result doesn't wait on the fallback.
  const tauri = fetchTauriReleases().catch(() => null);
  const electron = Promise.all([
    fetchWindowsRelease().catch(() => null),
    fetchYmlRelease("latest-mac.yml").catch(() => null),
    fetchYmlRelease("latest-linux.yml").catch(() => null),
  ]);
  const release = await tauri;
  if (release) return release;
  const [Windows, macOS, Linux] = await electron;
  return { Windows, macOS, Linux };
}
