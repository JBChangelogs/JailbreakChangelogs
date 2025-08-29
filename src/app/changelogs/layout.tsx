import { Metadata } from 'next';
import { defaultMetadata } from './metadata';

export async function generateMetadata(): Promise<Metadata> {
  return defaultMetadata;
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