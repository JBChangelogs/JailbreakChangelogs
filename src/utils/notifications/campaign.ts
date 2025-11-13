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
  token: string,
): Promise<void> {
  try {
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
      throw new Error("Failed to count campaign visit");
    }
  } catch (error) {
    console.error("Error counting campaign visit:", error);
    // Don't show error to user as this is a background operation
  }
}
