import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          User Not Found
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          The user you&apos;re looking for doesn&apos;t exist or has no dupe data available.
        </p>
        <Link
          href="/dupes"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#5865F2] text-white rounded-lg hover:bg-[#4752C4] transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Dupe Finder
        </Link>
      </div>
    </div>
  );
}
