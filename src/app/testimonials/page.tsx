import { Suspense } from "react";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import SubmitTestimonialButton from "@/components/Testimonials/SubmitTestimonialButton";
import TestimonialsClient from "@/components/Testimonials/TestimonialsClient";

export default function TestimonialsPage() {
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
          <div className="mt-6 flex min-h-10 items-center justify-center">
            <SubmitTestimonialButton />
          </div>
        </div>
        <Suspense>
          <TestimonialsClient />
        </Suspense>
      </div>
    </main>
  );
}
