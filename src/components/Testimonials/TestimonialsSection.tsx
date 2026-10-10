import Image from "next/image";
import { Icon } from "@/components/ui/IconWrapper";
import { UserAvatar } from "@/utils/ui/avatar";
import { badimoTestimonial } from "@/components/Testimonials/badimoTestimonial";
import type { BadimoTestimonial } from "@/components/Testimonials/badimoTestimonial";
import type { Testimonial } from "@/components/Testimonials/testimonialsData";
import { highlightBrandName } from "@/components/Testimonials/testimonialText";

type TestimonialsSectionProps = {
  testimonials: Exclude<Testimonial, BadimoTestimonial>[];
};

export function FeaturedBadimoTestimonial() {
  return (
    <figure className="border-border-card bg-secondary-bg relative mx-auto max-w-4xl overflow-hidden rounded-2xl border p-6 shadow-md md:p-10">
      <Icon
        icon="mdi:format-quote-open"
        aria-hidden="true"
        className="text-secondary-text/10 pointer-events-none absolute -top-6 -left-4 hidden h-36 w-36 lg:block"
      />
      <blockquote className="text-primary-text relative text-lg leading-relaxed md:text-2xl md:leading-relaxed">
        &ldquo;{highlightBrandName(badimoTestimonial.quote)}&rdquo;
      </blockquote>
      <figcaption className="relative mt-6 flex flex-wrap items-center gap-x-4 gap-y-3">
        {/* Wordmark has ~30% transparent padding; cover-crop it to the lettering */}
        <Image
          src={badimoTestimonial.avatarUrl}
          alt=""
          width={1000}
          height={563}
          className="-mx-2 h-12 w-32 object-cover"
        />
        <div>
          <p className="text-primary-text font-bold">
            {badimoTestimonial.name}
          </p>
          <p className="text-secondary-text text-sm">
            {badimoTestimonial.role}
          </p>
        </div>
        <a
          href={badimoTestimonial.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-link ml-auto inline-flex items-center gap-1 text-sm font-medium hover:underline"
        >
          View on X
          <Icon icon="mdi:open-in-new" className="h-4 w-4" inline={true} />
        </a>
      </figcaption>
    </figure>
  );
}

export default function TestimonialsSection({
  testimonials,
}: TestimonialsSectionProps) {
  return (
    <section className="py-8">
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
            className="border-border-card bg-secondary-bg hover:bg-tertiary-bg group mb-6 flex break-inside-avoid flex-col rounded-xl border p-6 shadow-md transition-all duration-200"
          >
            <blockquote className="text-card-paragraph relative text-sm leading-relaxed">
              &ldquo;{highlightBrandName(testimonial.quote)}&rdquo;
            </blockquote>
            <div className="mt-5 flex items-center gap-3">
              <UserAvatar
                userId={testimonial.userId}
                avatarHash={testimonial.avatarHash}
                username={testimonial.name}
                size={10}
                cdnSize={128}
                showBadge={false}
              />
              <div className="min-w-0">
                <p className="text-card-headline group-hover:text-highlight truncate text-sm font-bold transition-colors">
                  {testimonial.name}
                </p>
                <p className="text-secondary-text text-xs">
                  {testimonial.role}
                </p>
              </div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
