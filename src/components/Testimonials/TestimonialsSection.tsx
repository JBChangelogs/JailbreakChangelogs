import Image from "next/image";
import { UserAvatar } from "@/utils/ui/avatar";
import type { Testimonial } from "@/components/Testimonials/testimonialsData";
import { highlightBrandName } from "@/components/Testimonials/testimonialText";

type TestimonialsSectionProps = {
  testimonials: Testimonial[];
};

export default function TestimonialsSection({
  testimonials,
}: TestimonialsSectionProps) {
  return (
    <section className="py-8">
      <div className="container mx-auto px-6">
        <div className="columns-1 gap-6 md:columns-2 lg:columns-3">
          {testimonials.map((testimonial) => (
            <a
              key={testimonial.id}
              href={testimonial.url}
              target={testimonial.url.startsWith("/") ? undefined : "_blank"}
              rel={
                testimonial.url.startsWith("/")
                  ? undefined
                  : "noopener noreferrer"
              }
              className="border-border-card bg-secondary-bg hover:bg-tertiary-bg group mb-6 block flex break-inside-avoid flex-col rounded-xl border p-6 shadow-md transition-all duration-200"
            >
              <div className="mb-4 flex items-start gap-4">
                <div className="shrink-0">
                  {testimonial.id === "badimo" ? (
                    <Image
                      src={testimonial.avatarUrl}
                      alt={testimonial.name}
                      width={56}
                      height={56}
                      className="h-14 w-14 object-contain"
                      loading="lazy"
                    />
                  ) : (
                    <UserAvatar
                      userId={testimonial.userId}
                      avatarHash={testimonial.avatarHash}
                      username={testimonial.name}
                      size={14}
                      cdnSize={128}
                      showBadge={false}
                    />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-card-headline group-hover:text-highlight mb-1 font-bold transition-colors">
                    {testimonial.name}
                  </h3>
                  <p className="text-primary-text bg-tertiary-bg border-border-card inline-flex h-6 w-fit items-center rounded-md border px-2.5 text-xs leading-none font-medium backdrop-blur-xl">
                    {testimonial.role}
                  </p>
                </div>
              </div>

              <blockquote className="text-card-paragraph text-sm leading-relaxed">
                &ldquo;{highlightBrandName(testimonial.quote)}&rdquo;
              </blockquote>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
