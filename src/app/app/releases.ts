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
  const [mainA, preA] = a.split(/-(.*)/);
  const [mainB, preB] = b.split(/-(.*)/);
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

const options = { next: { revalidate: 300 } };

async function fetchWindowsRelease(): Promise<Release | null> {
  const [manifest, installer] = await Promise.all([
    fetch(`${UPDATES_URL}/releases.win.json`, options),
    // Size and date are optional, so a slow or failed HEAD never blocks the
    // version from the manifest.
    fetch(`${UPDATES_URL}/JBCLSetup.exe`, {
      ...options,
      method: "HEAD",
      signal: AbortSignal.timeout(3000),
    }).catch(() => null),
  ]);
  if (!manifest.ok) return null;
  const version = parseWindowsVersion(await manifest.json());
  if (!version) return null;
  const headers = installer?.ok ? installer.headers : null;
  return {
    version,
    releasedAt: toTime(headers?.get("last-modified")),
    size: toNumber(headers?.get("content-length")),
  };
}

async function fetchYmlRelease(file: string): Promise<Release | null> {
  const response = await fetch(`${UPDATES_URL}/${file}`, options);
  return response.ok ? parseYmlRelease(await response.text()) : null;
}

export async function fetchReleases(): Promise<Releases> {
  const [Windows, macOS, Linux] = await Promise.all([
    fetchWindowsRelease().catch(() => null),
    fetchYmlRelease("latest-mac.yml").catch(() => null),
    fetchYmlRelease("latest-linux.yml").catch(() => null),
  ]);
  return { Windows, macOS, Linux };
}
