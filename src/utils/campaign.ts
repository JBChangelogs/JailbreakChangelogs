export function storeCampaign(campaign: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem("campaign", campaign);
}

export function getStoredCampaign(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem("campaign");
}

export function clearStoredCampaign(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem("campaign");
}

export async function countCampaignVisit(
  campaign: string,
  token?: string,
): Promise<void> {
  const response = await fetch("/api/campaigns/count", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      campaign,
      token,
    }),
  });

  if (!response.ok) {
    let errorMessage = "Failed to count campaign visit";
    try {
      const data = await response.json();
      if (data.error) {
        errorMessage = data.error;
      }
    } catch {
      // Ignore parse error
    }
    throw new Error(errorMessage);
  }
}
