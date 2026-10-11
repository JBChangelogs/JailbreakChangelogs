import { cn } from "@/lib/utils";

interface NotFoundIllustrationProps {
  alt: string;
  width: number;
  height: number;
  className?: string;
}

export default function NotFoundIllustration({
  alt,
  width,
  className,
}: NotFoundIllustrationProps) {
  return (
    <div
      role="img"
      aria-label={alt}
      style={{ maxWidth: width }}
      className={cn(
        "text-primary-text block w-full aspect-[1500/700] bg-current [mask:url(/assets/images/404.png)_center/contain_no-repeat]",
        className,
      )}
    />
  );
}
