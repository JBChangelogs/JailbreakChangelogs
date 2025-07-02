import { redirect } from 'next/navigation';
import { PROD_API_URL } from '@/services/api';

export const dynamic = "force-dynamic";

export default async function ChangelogsPage() {
  const response = await fetch(`${PROD_API_URL}/changelogs/latest`, { cache: 'no-store' });
  const data = await response.json();
  
  redirect(`/changelogs/${data.id}`);
} 