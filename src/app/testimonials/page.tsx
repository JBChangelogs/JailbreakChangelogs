import { Suspense } from "react";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import SubmitTestimonialButton from "@/components/Testimonials/SubmitTestimonialButton";
import TestimonialsClient from "@/components/Testimonials/TestimonialsClient";
import { fetchTestimonials } from "@/components/Testimonials/testimonialsData";
import { BASE_API_URL } from "@/utils/api/api";
import ShareTestimonialLink from "@/components/Testimonials/ShareTestimonialLink";
import { FeaturedBadimoTestimonial } from "@/components/Testimonials/TestimonialsSection";

type PageProps = {
  searchParams: Promise<{ page?: string }>;
};

export default async function TestimonialsPage({ searchParams }: PageProps) {
  const requestedPage = Number((await searchParams).page);
  const page =
    Number.isSafeInteger(requestedPage) && requestedPage > 0
      ? requestedPage
      : 1;
  // On failure the client query fetches it again in the browser
  const initialData = await fetchTestimonials(
    page,
    undefined,
    BASE_API_URL,
  ).catch(() => undefined);

  return (
    <main className="bg-primary-bg mb-8 min-h-screen">
      <div className="container mx-auto px-4">
        <Breadcrumb />
        <div className="mb-8 text-center">
          <h1 className="page-heading mb-2">
            Loved by the Jailbreak Community
          </h1>
          <p className="text-secondary-text mx-auto max-w-3xl text-lg">
            What players, content creators, and the game&apos;s own developers
            say about Jailbreak Changelogs. <ShareTestimonialLink />
          </p>
        </div>
        <FeaturedBadimoTestimonial />
        <Suspense>
          <TestimonialsClient initialPage={page} initialData={initialData} />
        </Suspense>
        <div
          id="share-testimonial"
          className="border-border-card bg-secondary-bg mx-auto flex max-w-2xl scroll-mt-24 flex-col items-center gap-4 rounded-2xl border p-6 text-center sm:flex-row sm:justify-between sm:text-left"
        >
          <div>
            <p className="text-primary-text font-bold">
              Enjoy using Jailbreak Changelogs?
            </p>
            <p className="text-secondary-text text-sm">
              Share your experience with the community.
            </p>
          </div>
          <div className="flex min-h-10 shrink-0 items-center">
            <SubmitTestimonialButton />
          </div>
        </div>
      </div>
    </main>
  );
}
