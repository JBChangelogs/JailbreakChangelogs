import { Metadata } from 'next';
import { fetchChangelog } from '@/utils/api';
import { defaultMetadata } from './metadata';

export async function generateMetadata({ params }: { params: { id?: string } }): Promise<Metadata> {
  if (!params.id) {
    return defaultMetadata;
  }

  try {
    const changelog = await fetchChangelog(params.id);

    return {
      title: `${changelog.title} - Jailbreak Changelogs`,
      description: `View the complete changelog for ${changelog.title}. Track updates, features, and modifications in this Jailbreak update.`,
      openGraph: {
        title: `${changelog.title} - Jailbreak Changelogs`,
        description: `View the complete changelog for ${changelog.title}. Track updates, features, and modifications in this Jailbreak update.`,
        type: 'article',
        siteName: 'Jailbreak Changelogs',
        url: `https://jailbreakchangelogs.xyz/changelogs/${params.id}`,
        images: changelog.image_url ? [`https://assets.jailbreakchangelogs.xyz${changelog.image_url}`] : [],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${changelog.title} - Jailbreak Changelogs`,
        description: `View the complete changelog for ${changelog.title}. Track updates, features, and modifications in this Jailbreak update.`,
        images: changelog.image_url ? [`https://assets.jailbreakchangelogs.xyz${changelog.image_url}`] : [],
      },
    };
  } catch {
    return {
      title: 'Changelog Not Found - Jailbreak Changelogs',
      description: 'The requested changelog could not be found.',
    };
  }
}

export default function ChangelogsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#2E3944]">
      {children}
    </div>
  );
} 