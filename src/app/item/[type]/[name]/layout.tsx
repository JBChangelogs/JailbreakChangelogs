import { Metadata } from "next";
import { fetchItem } from "@/utils/api";
import { getItemImagePath } from "@/utils/images";
import { getMaintenanceMetadata } from "@/utils/maintenance";
import { formatFullValue, formatPrice } from "@/utils/values";
import { WithContext, FAQPage, BreadcrumbList, ListItem } from "schema-dts";
import type { ItemDetails } from "@/types/index";

const FALLBACK_IMAGE =
  "https://assets.jailbreakchangelogs.com/assets/logos/embeds/JBCL_X_TC_Embed_Graphic.png";

interface Props {
  params: Promise<{
    type: string;
    name: string;
  }>;
}

function sanitizeJsonLd(jsonLd: WithContext<FAQPage | BreadcrumbList>): string {
  return JSON.stringify(jsonLd);
}

async function generateFAQJsonLd(
  item: ItemDetails | null,
): Promise<string | null> {
  if (!item) return null;

  const faqs = [
    {
      question: `What is the cash value of ${item.name}?`,
      answer: `The cash value of ${item.name} is ${formatFullValue(item.cash_value)}.`,
    },
  ];

  // Only add duped value if it's not N/A
  if (item.duped_value && item.duped_value !== "N/A") {
    faqs.push({
      question: `What is the duped value of ${item.name}?`,
      answer: `The duped value of ${item.name} is ${formatFullValue(item.duped_value)}.`,
    });
  }

  faqs.push(
    {
      question: `Is ${item.name} limited?`,
      answer:
        item.is_limited === 1
          ? `${item.name} is a limited item.`
          : item.is_limited === 0
            ? `${item.name} is not a limited item.`
            : `It is unknown if ${item.name} is a limited item.`,
    },
    {
      question: `Is ${item.name} seasonal?`,
      answer:
        item.is_seasonal === 1
          ? `${item.name} is a seasonal item.`
          : item.is_seasonal === 0
            ? `${item.name} is not a seasonal item.`
            : `It is unknown if ${item.name} is a seasonal item.`,
    },
    {
      question: `Can ${item.name} be traded?`,
      answer:
        item.tradable === 1
          ? `${item.name} can be traded.`
          : `${item.name} cannot be traded.`,
    },
    {
      question: `What is the demand for ${item.name}?`,
      answer: `The demand for ${item.name} is ${item.demand}.`,
    },
  );

  // Add creator info if available and clean up the name
  if (item.creator && item.creator !== "N/A") {
    // Remove the ID in brackets from creator name
    const cleanCreatorName = item.creator.replace(/\s*\(\d+\)$/, "");
    faqs.push({
      question: `Who created ${item.name}?`,
      answer: `${item.name} was created by ${cleanCreatorName}.`,
    });
  }

  // Add price info if available
  if (item.price && item.price !== "N/A") {
    faqs.push({
      question: `What is the price of ${item.name}?`,
      answer: `The price of ${item.name} is ${formatPrice(item.price)}.`,
    });
  }

  const jsonLd: WithContext<FAQPage> = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    name: `Frequently Asked Questions about ${item.name}`,
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return sanitizeJsonLd(jsonLd);
}

async function generateBreadcrumbJsonLd(
  item: ItemDetails | null,
  itemType: string,
): Promise<string | null> {
  if (!item) return null;

  const breadcrumbItems: ListItem[] = [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: "https://jailbreakchangelogs.com",
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Values",
      item: "https://jailbreakchangelogs.com/values",
    },
    {
      "@type": "ListItem",
      position: 3,
      name: item.type.charAt(0).toUpperCase() + item.type.slice(1),
      item: `https://jailbreakchangelogs.com/values?filterSort=name-${decodeURIComponent(itemType).replace(/\s+/g, "-")}s`,
    },
    {
      "@type": "ListItem",
      position: 4,
      name: item.name,
      item: `https://jailbreakchangelogs.com/item/${encodeURIComponent(item.type)}/${encodeURIComponent(item.name)}`,
    },
  ];

  const jsonLd: WithContext<BreadcrumbList> = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbItems,
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
    if (!item) {
      return {
        metadataBase: new URL("https://jailbreakchangelogs.com"),
        title: "Item Not Found",
        description: "The requested item could not be found.",
        alternates: {
          canonical: "/values",
        },
        openGraph: {
          title: "Item Not Found",
          description: "The requested item could not be found.",
          type: "website",
          url: "https://jailbreakchangelogs.com/values",
          images: [
            {
              url: FALLBACK_IMAGE,
              width: 2400,
              height: 1260,
              alt: "Jailbreak Changelogs Banner",
            },
          ],
        },
        twitter: {
          card: "summary_large_image",
          title: "Item Not Found",
          description: "The requested item could not be found.",
          images: [FALLBACK_IMAGE],
        },
      };
    }
    const imageUrl = getItemImagePath(item.type, item.name, false, true);
    const finalImageUrl = imageUrl || FALLBACK_IMAGE;
    const isFallbackImage = finalImageUrl === FALLBACK_IMAGE;

    // Use the exact case from the database for canonical URLs
    const canonicalPath = `/item/${encodeURIComponent(item.type)}/${encodeURIComponent(item.name)}`;
    const fullUrl = `https://jailbreakchangelogs.com${canonicalPath}`;

    return {
      metadataBase: new URL("https://jailbreakchangelogs.com"),
      title: `${item.name} (${item.type})`,
      description:
        item.description && item.description !== "N/A"
          ? `${item.description.slice(0, 155)}...`
          : `View details about ${item.name}, a ${item.type} in Jailbreak.`,
      alternates: {
        canonical: canonicalPath,
      },
      openGraph: {
        title: `${item.name} (${item.type}) | Roblox Jailbreak`,
        description:
          item.description && item.description !== "N/A"
            ? `${item.description.slice(0, 155)}...`
            : `View details about ${item.name}, a ${item.type} in Jailbreak.`,
        type: "website",
        url: fullUrl,
        siteName: "Jailbreak Changelogs",
        images: [
          {
            url: finalImageUrl,
            width: isFallbackImage ? 2400 : 854,
            height: isFallbackImage ? 1260 : 480,
            alt: `${item.name} (${item.type})`,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: `${item.name} (${item.type}) | Roblox Jailbreak`,
        description:
          item.description && item.description !== "N/A"
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
      metadataBase: new URL("https://jailbreakchangelogs.com"),
      title: "Error",
      description: "An error occurred while loading the item details.",
      alternates: {
        canonical: `/item/${encodeURIComponent(itemType)}/${encodeURIComponent(itemName)}`,
      },
      openGraph: {
        title: "Error | Jailbreak Changelogs",
        description: "An error occurred while loading the item details.",
        type: "website",
        url: "https://jailbreakchangelogs.com/values",
        siteName: "Jailbreak Changelogs",
        images: [
          {
            url: FALLBACK_IMAGE,
            width: 2400,
            height: 1260,
            alt: "Jailbreak Changelogs Banner",
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: "Error | Jailbreak Changelogs",
        description: "An error occurred while loading the item details.",
        images: [FALLBACK_IMAGE],
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
  const breadcrumbJsonLdData = await generateBreadcrumbJsonLd(item, type);

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
      {item && (
        <h1 className="sr-only">
          {item.name} ({item.type})
        </h1>
      )}
      {children}
    </>
  );
}
