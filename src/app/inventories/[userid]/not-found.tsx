import Link from 'next/link';
import Breadcrumb from '@/components/Layout/Breadcrumb';

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb />
      <div className="text-center py-12">
        <h1 className="text-3xl font-bold mb-4">User Not Found</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          The Roblox user ID you&apos;re looking for doesn&apos;t exist or is invalid.
        </p>
        <Link
          href="/inventories"
          className="inline-flex items-center px-4 py-2 bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-lg transition-colors"
        >
          Back to Inventory Checker
        </Link>
      </div>
    </div>
  );
}
