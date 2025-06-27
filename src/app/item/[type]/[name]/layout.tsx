import { Metadata } from 'next';
import { PROD_API_URL } from '@/services/api';
import { getItemImagePath } from '@/utils/images';
import { getMaintenanceMetadata } from '@/utils/maintenance';
import { WithContext, Product } from 'schema-dts';
import type { Item } from '@/types/index';
import { notFound } from 'next/navigation';

const FALLBACK_IMAGE = 'https://assets.jailbreakchangelogs.xyz/assets/logos/collab/JBCL_X_TC_Logo_Long_Dark_Background.webp';

interface Props {
  params: Promise<{
    type: string;
    name: string;
  }>;
}

async function fetchItem(type: string, name: string): Promise<Item | null> {
  const itemName = decodeURIComponent(name);
  const itemType = decodeURIComponent(type);
  try {
    const response = await fetch(
      `${PROD_API_URL}/items/get?name=${encodeURIComponent(itemName)}&type=${encodeURIComponent(itemType)}`,
      { next: { revalidate: 3600 } }
    );
    if (!response.ok) return null;
    return await response.json() as Item;
  } catch {
    return null;
  }
}

function sanitizeJsonLd(jsonLd: WithContext<Product>): string {
  return JSON.stringify(jsonLd).replace(/</g, '\u003c');
}

async function generateJsonLd(item: Item | null): Promise<string | null> {
  if (!item) return null;
  const imageUrl = getItemImagePath(item.type, item.name, false, true);
  const finalImageUrl = imageUrl || FALLBACK_IMAGE;
  const jsonLd: WithContext<Product> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: item.name,
    description: item.description || `View details about ${item.name}, a ${item.type} in Jailbreak.`,
    image: finalImageUrl,
    url: `https://jailbreakchangelogs.xyz/item/${item.type}/${item.name}`,
    category: item.type,
    brand: {
      '@type': 'Brand',
      name: 'Roblox Jailbreak'
    }
  };
  return sanitizeJsonLd(jsonLd);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // Check for maintenance mode first
  const maintenanceMetadata = await getMaintenanceMetadata();
  if (maintenanceMetadata) {
    return maintenanceMetadata;
  }

  try {
    const { type, name } = await params;
    const item = await fetchItem(type, name);
    const itemName = decodeURIComponent(name);
    const itemType = decodeURIComponent(type);
    if (!item) {
      return {
        metadataBase: new URL('https://jailbreakchangelogs.xyz'),
        title: 'Item Not Found',
        description: 'The requested item could not be found.',
        alternates: {
          canonical: `/item/${itemType}/${itemName}`,
        },
      };
    }
    const imageUrl = getItemImagePath(item.type, item.name, false, true);
    const finalImageUrl = imageUrl || FALLBACK_IMAGE;
    return {
      metadataBase: new URL('https://jailbreakchangelogs.xyz'),
      title: `${item.name} (${item.type}) | Roblox Jailbreak`,
      description: item.description 
        ? `${item.description.slice(0, 155)}...` 
        : `View details about ${item.name}, a ${item.type} in Jailbreak.`,
      alternates: {
        canonical: `/item/${itemType}/${itemName}`,
      },
      openGraph: {
        title: `${item.name} (${item.type}) | Roblox Jailbreak`,
        description: item.description 
          ? `${item.description.slice(0, 155)}...` 
          : `View details about ${item.name}, a ${item.type} in Jailbreak.`,
        type: 'website',
        url: `https://jailbreakchangelogs.xyz/item/${itemType}/${itemName}`,
        siteName: 'Jailbreak Changelogs',
        images: [
          {
            url: finalImageUrl,
            width: 854,
            height: 480,
            alt: `${item.name} (${item.type})`,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${item.name} (${item.type}) | Roblox Jailbreak`,
        description: item.description 
          ? `${item.description.slice(0, 155)}...` 
          : `View details about ${item.name}, a ${item.type} in Jailbreak.`,
        images: [finalImageUrl],
      },
    };
  } catch {
    const { type, name } = await params;
    const itemName = decodeURIComponent(name);
    const itemType = decodeURIComponent(type);
    return {
      metadataBase: new URL('https://jailbreakchangelogs.xyz'),
      title: 'Error',
      description: 'An error occurred while loading the item details.',
      alternates: {
        canonical: `/item/${itemType}/${itemName}`,
      },
      openGraph: {
        title: 'Error | Jailbreak Changelogs',
        description: 'An error occurred while loading the item details.',
        type: 'website',
        url: `https://jailbreakchangelogs.xyz/item/${itemType}/${itemName}`,
        siteName: 'Jailbreak Changelogs',
      },
      twitter: {
        card: 'summary',
        title: 'Error | Jailbreak Changelogs',
        description: 'An error occurred while loading the item details.',
      },
    };
  }
}

export default async function ItemLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ type: string; name: string }>;
}) {
  const { type, name } = await params;
  const item = await fetchItem(type, name);
  if (!item) {
    notFound();
  }
  const jsonLdData = await generateJsonLd(item);

  return (
    <>
      {jsonLdData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: jsonLdData,
          }}
        />
      )}
      {/* SEO-friendly H1 that's always present */}
      <h1 className="sr-only">{item.name} ({item.type})</h1>
      {children}
    </>
  );
} 