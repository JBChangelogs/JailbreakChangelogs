import { redirect } from 'next/navigation';
import { PUBLIC_API_URL } from "@/utils/api";

export const dynamic = "force-dynamic";

export default async function ChangelogsPage() {
  const response = await fetch(`${PUBLIC_API_URL}/changelogs/latest`);
  const data = await response.json();
  
  redirect(`/changelogs/${data.id}`);
} 