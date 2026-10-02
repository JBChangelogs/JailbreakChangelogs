import Link from "next/link";
import { redirect } from "next/navigation";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import SubmitTestimonialButton from "@/components/Testimonials/SubmitTestimonialButton";
import TestimonialsSection from "@/components/Testimonials/TestimonialsSection";
import { badimoTestimonial } from "@/components/Testimonials/badimoTestimonial";
import { getTestimonials } from "@/components/Testimonials/testimonialsData";

type TestimonialsPageProps = {
  searchParams: Promise<{ page?: string | string[] }>;
};

export default async function TestimonialsPage({
  searchParams,
}: TestimonialsPageProps) {
  const params = await searchParams;
  const requestedPage = Number(params.page);
  const page =
    Number.isSafeInteger(requestedPage) && requestedPage > 0
      ? requestedPage
      : 1;
  const testimonials = await getTestimonials(page);
  const totalPages = Math.max(
    1,
    Math.ceil(testimonials.total / testimonials.size),
  );
  if (testimonials.total > 0 && page > totalPages) {
    redirect(
      totalPages === 1 ? "/testimonials" : `/testimonials?page=${totalPages}`,
    );
  }

  return (
    <main className="bg-primary-bg mb-8 min-h-screen">
      <div className="container mx-auto px-4">
        <Breadcrumb />
        <div className="mb-8 text-center">
          <h1 className="page-heading mb-2">Community Testimonials</h1>
          <p className="text-secondary-text mx-auto max-w-3xl text-lg">
            Here are some of the amazing testimonials from the Jailbreak
            community, content creators, and even the game developers.
            We&apos;re continuously adding more testimonials from our growing
            community!
          </p>
          <div className="mt-6 flex justify-center">
            <SubmitTestimonialButton />
          </div>
        </div>
        <TestimonialsSection
          testimonials={
            page === 1
              ? [badimoTestimonial, ...testimonials.items]
              : testimonials.items
          }
        />
        {totalPages > 1 && (
          <nav
            className="flex items-center justify-center gap-4 py-6"
            aria-label="Testimonial pages"
          >
            {page > 1 ? (
              <Link
                href={
                  page === 2
                    ? "/testimonials"
                    : `/testimonials?page=${page - 1}`
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
      </div>
    </main>
  );
}
