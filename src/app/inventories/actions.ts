'use server'

import { fetchRobloxUsersBatch, fetchRobloxAvatars } from '@/utils/api';

export async function fetchMissingRobloxData(userIds: string[]) {
  try {
    const numericUserIds = userIds.filter(id => /^\d+$/.test(id));
    
    if (numericUserIds.length === 0) {
      return { userData: {}, avatarData: {} };
    }
    
    // Fetch both usernames and avatars for all batches
    const [userData, avatarData] = await Promise.all([
      fetchRobloxUsersBatch(numericUserIds),
      fetchRobloxAvatars(numericUserIds)
    ]);
    
    // Process avatar data to extract imageUrl strings
    const processedAvatarData: Record<string, string> = {};
    if (avatarData && typeof avatarData === 'object') {
      Object.values(avatarData).forEach((avatar) => {
        const avatarData = avatar as { targetId: number; state: string; imageUrl?: string; version: string };
        if (avatarData && avatarData.targetId && avatarData.imageUrl) {
          // Include both completed and blocked avatars since blocked avatars still have valid images
          processedAvatarData[avatarData.targetId.toString()] = avatarData.imageUrl;
        }
      });
    }
    
    return { 
      userData: userData || {}, 
      avatarData: processedAvatarData 
    };
  } catch (error) {
    console.error('[SERVER ACTION] Failed to fetch missing Roblox data:', error);
    return { userData: {}, avatarData: {} };
  }
}

export async function fetchOriginalOwnerAvatars(userIds: string[]) {
  try {
    const numericUserIds = userIds.filter(id => /^\d+$/.test(id));
    
    if (numericUserIds.length === 0) {
      return {};
    }
    
    // Always fetch avatars for original owners (these are typically small batches)
    const avatarData = await fetchRobloxAvatars(numericUserIds);
    
    // Process avatar data to extract imageUrl strings
    const processedAvatarData: Record<string, string> = {};
    if (avatarData && typeof avatarData === 'object') {
      Object.values(avatarData).forEach((avatar) => {
        const avatarData = avatar as { targetId: number; state: string; imageUrl?: string; version: string };
        if (avatarData && avatarData.targetId && avatarData.state === 'Completed' && avatarData.imageUrl) {
          // Only add completed avatars to the data
          processedAvatarData[avatarData.targetId.toString()] = avatarData.imageUrl;
        }
        // For blocked avatars, don't add them to the data so components can use their own fallback
      });
    }
    
    return processedAvatarData;
  } catch (error) {
    console.error('[SERVER ACTION] Failed to fetch original owner avatars:', error);
    return {};
  }
}
