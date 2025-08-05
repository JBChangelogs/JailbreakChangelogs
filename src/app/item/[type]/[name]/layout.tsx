import { Metadata } from 'next';
import { BASE_API_URL } from '@/utils/api';
import { getItemImagePath } from '@/utils/images';
import { getMaintenanceMetadata } from '@/utils/maintenance';
import { formatFullValue, formatPrice } from '@/utils/values';
import { WithContext, FAQPage, BreadcrumbList, ListItem } from 'schema-dts';
import type { ItemDetails } from '@/types/index';

const FALLBACK_IMAGE = 'https://assets.jailbreakchangelogs.xyz/assets/logos/collab/JBCL_X_TC_Logo_Long_Dark_Background.webp';

interface Props {
  params: Promise<{
    type: string;
    name: string;
  }>;
}

async function fetchItem(type: string, name: string): Promise<ItemDetails | null> {
  const itemName = decodeURIComponent(name);
  const itemType = decodeURIComponent(type);
  try {
    const response = await fetch(
      `${BASE_API_URL}/items/get?name=${encodeURIComponent(itemName)}&type=${encodeURIComponent(itemType)}`,
      { next: { revalidate: 300 } }
    );
    if (!response.ok) return null;
    return await response.json() as ItemDetails;
  } catch {
    return null;
  }
}

function sanitizeJsonLd(jsonLd: WithContext<FAQPage | BreadcrumbList>): string {
  return JSON.stringify(jsonLd);
}

async function generateFAQJsonLd(item: ItemDetails | null): Promise<string | null> {
  if (!item) return null;
  
  const faqs = [
    {
      question: `What is the cash value of ${item.name}?`,
      answer: `The cash value of ${item.name} is ${formatFullValue(item.cash_value)}.`
    }
  ];

  // Only add duped value if it's not N/A
  if (item.duped_value && item.duped_value !== 'N/A') {
    faqs.push({
      question: `What is the duped value of ${item.name}?`,
      answer: `The duped value of ${item.name} is ${formatFullValue(item.duped_value)}.`
    });
  }

  faqs.push(
    {
      question: `Is ${item.name} limited?`,
      answer: item.is_limited === 1 ? `${item.name} is a limited item.` : (item.is_limited === 0 ? `${item.name} is not a limited item.` : `It is unknown if ${item.name} is a limited item.`)
    },
    {
      question: `Is ${item.name} seasonal?`,
      answer: item.is_seasonal === 1 ? `${item.name} is a seasonal item.` : (item.is_seasonal === 0 ? `${item.name} is not a seasonal item.` : `It is unknown if ${item.name} is a seasonal item.`)
    },
    {
      question: `Can ${item.name} be traded?`,
      answer: item.tradable === 1 ? `${item.name} can be traded.` : `${item.name} cannot be traded.`
    },
    {
      question: `What is the demand for ${item.name}?`,
      answer: `The demand for ${item.name} is ${item.demand}.`
    }
  );

  // Add creator info if available and clean up the name
  if (item.creator && item.creator !== 'N/A') {
    // Remove the ID in brackets from creator name
    const cleanCreatorName = item.creator.replace(/\s*\(\d+\)$/, '');
    faqs.push({
      question: `Who created ${item.name}?`,
      answer: `${item.name} was created by ${cleanCreatorName}.`
    });
  }

  // Add price info if available
  if (item.price && item.price !== 'N/A') {
    faqs.push({
      question: `What is the price of ${item.name}?`,
      answer: `The price of ${item.name} is ${formatPrice(item.price)}.`
    });
  }

  const jsonLd: WithContext<FAQPage> = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    name: `Frequently Asked Questions about ${item.name}`,
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  };

  return sanitizeJsonLd(jsonLd);
}

async function generateBreadcrumbJsonLd(item: ItemDetails | null, itemType: string, itemName: string): Promise<string | null> {
  if (!item) return null;
  
  const breadcrumbItems: ListItem[] = [
    {
      '@type': 'ListItem',
      'position': 1,
      'name': 'Home',
      'item': 'https://jailbreakchangelogs.xyz'
    },
    {
      '@type': 'ListItem',
      'position': 2,
      'name': 'Values',
      'item': 'https://jailbreakchangelogs.xyz/values'
    },
    {
      '@type': 'ListItem',
      'position': 3,
      'name': item.type.charAt(0).toUpperCase() + item.type.slice(1),
      'item': `https://jailbreakchangelogs.xyz/values?filterSort=name-${decodeURIComponent(itemType).replace(/\s+/g, '-')}s`
    },
    {
      '@type': 'ListItem',
      'position': 4,
      'name': item.name,
      'item': `https://jailbreakchangelogs.xyz/item/${itemType}/${itemName}`
    }
  ];

  const jsonLd: WithContext<BreadcrumbList> = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': breadcrumbItems
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
      description: item.description && item.description !== 'N/A'
        ? `${item.description.slice(0, 155)}...` 
        : `View details about ${item.name}, a ${item.type} in Jailbreak.`,
      alternates: {
        canonical: `/item/${itemType}/${itemName}`,
      },
      openGraph: {
        title: `${item.name} (${item.type}) | Roblox Jailbreak`,
        description: item.description && item.description !== 'N/A'
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
        description: item.description && item.description !== 'N/A'
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
  const faqJsonLdData = await generateFAQJsonLd(item);
  const breadcrumbJsonLdData = await generateBreadcrumbJsonLd(item, type, name);

  return (
    <>
      {item && faqJsonLdData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: faqJsonLdData,
          }}
        />
      )}
      {item && breadcrumbJsonLdData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: breadcrumbJsonLdData,
          }}
        />
      )}
      {/* SEO-friendly H1 that's always present */}
      {item && <h1 className="sr-only">{item.name} ({item.type})</h1>}
      {children}
    </>
  );
} 