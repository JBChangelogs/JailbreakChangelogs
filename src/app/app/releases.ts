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

/** Reads the newest full package version from Velopack's releases.win.json. */
export function parseWindowsVersion(data: unknown): string | null {
  const assets = (data as { Assets?: unknown })?.Assets;
  if (!Array.isArray(assets)) return null;
  const full = assets.filter(
    (asset): asset is { Version: string } =>
      asset?.Type === "Full" && typeof asset.Version === "string",
  );
  return full.at(-1)?.Version ?? null;
}

const options = { next: { revalidate: 300 } };

async function fetchWindowsRelease(): Promise<Release | null> {
  const [manifest, installer] = await Promise.all([
    fetch(`${UPDATES_URL}/releases.win.json`, options),
    fetch(`${UPDATES_URL}/JBCLSetup.exe`, { ...options, method: "HEAD" }),
  ]);
  if (!manifest.ok) return null;
  const version = parseWindowsVersion(await manifest.json());
  if (!version) return null;
  return {
    version,
    releasedAt: installer.ok
      ? toTime(installer.headers.get("last-modified"))
      : null,
    size: installer.ok
      ? toNumber(installer.headers.get("content-length"))
      : null,
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
