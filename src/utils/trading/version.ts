import { isTestingDeploy } from "@/utils/deployment";

/**
 * Determines which GitHub branch to fetch version data from based on Railway environment
 */
function getGitBranch(): string {
  const railwayEnv = process.env.RAILWAY_ENVIRONMENT_NAME;

  if (railwayEnv === "production" && !isTestingDeploy()) {
    return "main";
  }

  return "testing";
}

/**
 * Gets the appropriate GitHub URL based on the current environment
 */
export function getGitHubUrl(): string {
  const branch = getGitBranch();

  if (branch === "main") {
    return "https://github.com/JBChangelogs/JailbreakChangelogs";
  }

  return "https://github.com/JBChangelogs/JailbreakChangelogs/tree/testing";
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
    branch: isTestingDeploy() ? "testing" : railwayEnv || "development",
    commitUrl: sha
      ? `https://github.com/JBChangelogs/JailbreakChangelogs/commit/${sha}`
      : "#",
  };
}
