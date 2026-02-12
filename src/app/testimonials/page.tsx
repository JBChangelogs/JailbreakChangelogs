import Breadcrumb from "@/components/Layout/Breadcrumb";
import TestimonialsSection from "@/components/Testimonials/TestimonialsSection";

export default function TestimonialsPage() {
  return (
    <main className="bg-primary-bg mb-8 min-h-screen">
      <div className="container mx-auto px-4">
        <Breadcrumb />
        <div className="mb-8 text-center">
          <h1 className="text-primary-text mb-4 text-4xl font-bold md:text-5xl">
            Community Testimonials
          </h1>
          <p className="text-secondary-text mx-auto max-w-3xl text-lg">
            Here are some of the amazing testimonials from the Jailbreak
            community, content creators, and even the game developers.
            We&apos;re continuously adding more testimonials from our growing
            community!
          </p>
        </div>
        <TestimonialsSection />
      </div>
    </main>
  );
}
