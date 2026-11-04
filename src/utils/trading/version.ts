export function getGitHubUrl(): string {
  return "https://github.com/JBChangelogs/JailbreakChangelogs";
}

export async function getWebsiteVersion(): Promise<{
  version: string;
  date: number;
  branch: string;
  commitUrl: string;
}> {
  const sha = process.env.NEXT_PUBLIC_BUILD_COMMIT_SHA;
  const railwayEnv = process.env.RAILWAY_ENVIRONMENT_NAME;

  return {
    version: sha ? sha.slice(0, 7) : "unknown",
    date: Number(process.env.NEXT_PUBLIC_BUILD_TIME) || Date.now(),
    branch: railwayEnv || "development",
    commitUrl: sha
      ? `https://github.com/JBChangelogs/JailbreakChangelogs/commit/${sha}`
      : "#",
  };
}
