import Link from "next/link";
import Breadcrumb from "@/components/Layout/Breadcrumb";

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb />
      <div className="py-12 text-center">
        <h1 className="mb-4 text-3xl font-bold">User Not Found</h1>
        <p className="mb-6 text-gray-600 dark:text-gray-400">
          The Roblox user ID you&apos;re looking for doesn&apos;t exist or is
          invalid.
        </p>
        <Link
          href="/inventories"
          className="inline-flex items-center rounded-lg bg-[#5865F2] px-4 py-2 text-white transition-colors hover:bg-[#4752C4]"
        >
          Back to Inventory Checker
        </Link>
      </div>
    </div>
  );
}
