import { PUBLIC_API_URL } from "@/utils/api";

export function storeCampaign(campaign: string): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem('campaign', campaign);
}

export function getStoredCampaign(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('campaign');
}

export function clearStoredCampaign(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem('campaign');
}

export async function countCampaignVisit(campaign: string, token: string): Promise<void> {
  try {
    const response = await fetch(
      `${PUBLIC_API_URL}/campaigns/count?campaign=${campaign}&token=${token}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to count campaign visit');
    }
  } catch (error) {
    console.error('Error counting campaign visit:', error);
    // Don't show error to user as this is a background operation
  }
} 