import { formatFullDate } from "./timestamp";

/**
 * Determines which GitHub branch to fetch version data from based on Railway environment
 */
function getGitBranch(): string {
  const railwayEnv = process.env.RAILWAY_ENVIRONMENT_NAME;

  if (railwayEnv === "production") {
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

export async function getWebsiteVersion() {
  try {
    const branch = getGitBranch();
    const railwayEnv = process.env.RAILWAY_ENVIRONMENT_NAME;
    const environment = railwayEnv || "development";

    const response = await fetch(
      `https://api.github.com/repos/JBChangelogs/JailbreakChangelogs/commits/${branch}`,
      {
        next: { revalidate: 3600 },
      },
    );
    const data = await response.json();
    return {
      version: data.sha.substring(0, 7),
      date: formatFullDate(new Date(data.commit.committer.date).getTime()),
      branch: environment,
    };
  } catch (error) {
    console.error("Failed to fetch version data:", error);
    return {
      version: "unknown",
      date: "unknown",
      branch: "development",
    };
  }
}
