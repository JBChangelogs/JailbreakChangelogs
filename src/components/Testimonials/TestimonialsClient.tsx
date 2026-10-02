"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import TestimonialsSection from "@/components/Testimonials/TestimonialsSection";
import { badimoTestimonial } from "@/components/Testimonials/badimoTestimonial";
import { fetchTestimonials } from "@/components/Testimonials/testimonialsData";
import { Skeleton } from "@/components/ui/skeleton";

function TestimonialsSkeleton() {
  return (
    <div className="container mx-auto px-6 py-8">
      <div className="columns-1 gap-6 md:columns-2 lg:columns-3">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="mb-6 h-44 break-inside-avoid" />
        ))}
      </div>
    </div>
  );
}

export default function TestimonialsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedPage = Number(searchParams.get("page"));
  const page =
    Number.isSafeInteger(requestedPage) && requestedPage > 0
      ? requestedPage
      : 1;

  const { data, isPending, isError } = useQuery({
    queryKey: ["testimonials", page],
    queryFn: ({ signal }) => fetchTestimonials(page, signal),
    placeholderData: keepPreviousData,
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.size)) : 1;

  useEffect(() => {
    if (data && data.total > 0 && page > totalPages) {
      router.replace(
        totalPages === 1 ? "/testimonials" : `/testimonials?page=${totalPages}`,
      );
    }
  }, [data, page, totalPages, router]);

  if (isPending) return <TestimonialsSkeleton />;

  const items = isError || !data ? [] : data.items;

  return (
    <>
      <TestimonialsSection
        testimonials={page === 1 ? [badimoTestimonial, ...items] : items}
      />
      {isError && (
        <p className="text-secondary-text pb-6 text-center">
          Failed to load community testimonials. Please try again later.
        </p>
      )}
      {totalPages > 1 && (
        <nav
          className="flex items-center justify-center gap-4 py-6"
          aria-label="Testimonial pages"
        >
          {page > 1 ? (
            <Link
              href={
                page === 2 ? "/testimonials" : `/testimonials?page=${page - 1}`
              }
              className="text-link hover:underline"
            >
              Previous
            </Link>
          ) : (
            <span className="text-secondary-text">Previous</span>
          )}
          <span className="text-primary-text">
            Page {page} of {totalPages}
          </span>
          {page < totalPages ? (
            <Link
              href={`/testimonials?page=${page + 1}`}
              className="text-link hover:underline"
            >
              Next
            </Link>
          ) : (
            <span className="text-secondary-text">Next</span>
          )}
        </nav>
      )}
    </>
  );
}
