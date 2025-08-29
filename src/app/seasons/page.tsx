import { redirect } from 'next/navigation';
import { fetchLatestSeason } from '@/utils/api';

export default async function SeasonsPage() {
  try {
    // Fetch the latest season and redirect directly to it
    const latestSeason = await fetchLatestSeason();
    if (latestSeason && latestSeason.season) {
      redirect(`/seasons/${latestSeason.season}`);
    } else {
      // Fallback to season 27 if API fails
      redirect('/seasons/27');
    }
  } catch (error) {
    // Check if this is a Next.js redirect (expected behavior)
    if (error && typeof error === 'object' && 'message' in error && error.message === 'NEXT_REDIRECT') {
      // This is expected behavior, re-throw to let Next.js handle it
      throw error;
    }
    
    // This is an actual error, redirect to fallback
    console.error('Error fetching latest season:', error);
    redirect('/seasons/27'); // Fallback to season 27
  }
} 