import { fetchItem } from '@/utils/api';
import ItemDetailsClient from '@/components/Items/ItemDetailsClient';
import { notFound } from 'next/navigation';

// ISR configuration - cache for 5 minutes
export const revalidate = 300;

interface Props {
  params: Promise<{
    type: string;
    name: string;
  }>;
}

export default async function ItemDetailsPage({ params }: Props) {
  const { type, name } = await params;
  const item = await fetchItem(type, name);
  
  if (!item) {
    notFound();
  }

  return <ItemDetailsClient item={item} />;
} 