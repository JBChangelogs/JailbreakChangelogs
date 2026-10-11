import Image from "next/image";

/**
 * A supporter's custom background, fixed behind the whole profile. The image
 * is always 16:9 and may be an animated GIF; the overlay keeps text readable.
 * Clip the fixed layer to the profile so it cannot paint over the footer.
 */
export function ProfileBackground({ src }: { src: string }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 [clip-path:inset(0)]"
    >
      <div className="fixed inset-0">
        <Image
          src={src}
          alt=""
          fill
          sizes="100vw"
          unoptimized
          draggable={false}
          className="object-cover"
        />
        <div className="bg-primary-bg/70 absolute inset-0" />
        <div className="from-primary-bg absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t to-transparent" />
      </div>
    </div>
  );
}
