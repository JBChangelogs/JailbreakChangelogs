import { Children } from "react";

interface SupporterCarouselProps {
  children: React.ReactNode;
}

// data-state=open: a Radix profile popover trigger inside is open.
export default function SupporterCarousel({
  children,
}: SupporterCarouselProps) {
  return (
    <div className="group overflow-hidden">
      <div
        className="animate-marquee flex w-max group-hover:[animation-play-state:paused] has-[[data-state=open]]:[animation-play-state:paused] motion-reduce:animate-none"
        style={{ animationDuration: `${Children.count(children) * 8}s` }}
      >
        {/* pr-6, not gap, so the -50% loop lands exactly */}
        <div className="flex gap-6 pr-6">{children}</div>
        <div className="flex gap-6 pr-6" aria-hidden>
          {children}
        </div>
      </div>
    </div>
  );
}
