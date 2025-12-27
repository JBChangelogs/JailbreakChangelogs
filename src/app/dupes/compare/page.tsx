import { fetchDuplicateVariants, fetchItems } from "@/utils/api";
import DupeComparisonClient from "@/components/Dupes/DupeComparisonClient";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ id: string }>;
}

export default async function DupeComparisonPage({ searchParams }: PageProps) {
  const { id } = await searchParams;

  if (!id) {
    notFound();
  }

  const [variantsData, itemsData] = await Promise.all([
    fetchDuplicateVariants(id),
    fetchItems(),
  ]);

  if (!variantsData) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 pb-8">
      <Breadcrumb />

      <div className="mb-8">
        <h1 className="text-primary-text text-3xl font-bold">
          Duplicate Comparison
        </h1>
        <p className="text-secondary-text mt-2">
          Comparing item variants to verify duplicates.
        </p>
      </div>

      <DupeComparisonClient
        ogItem={variantsData.og}
        duplicateItem={variantsData.duplicate}
        itemsData={itemsData}
      />
    </div>
  );
}
