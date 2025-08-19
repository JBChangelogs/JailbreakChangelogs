import { formatFullDate } from './timestamp';

export async function getWebsiteVersion() {
  try {
    const response = await fetch(
      "https://api.github.com/repos/JBChangelogs/JailbreakChangelogs/commits/main"
    );
    const data = await response.json();
    return {
      version: data.sha.substring(0, 7),
      date: formatFullDate(new Date(data.commit.committer.date).getTime()),
    };
  } catch (error) {
    console.error("Failed to fetch version data:", error);
    return {
      version: "unknown",
      date: "unknown",
    };
  }
}
