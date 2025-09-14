import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold text-white">User Not Found</h1>
        <p className="mb-8 text-white">
          The user you&apos;re looking for doesn&apos;t exist or has no dupe
          data available.
        </p>
        <Link
          href="/dupes"
          className="inline-flex items-center gap-2 rounded-lg bg-[#5865F2] px-4 py-2 text-white transition-colors hover:bg-[#4752C4]"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Dupe Finder
        </Link>
      </div>
    </div>
  );
}
