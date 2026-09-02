"use client";

import { Icon } from "@/components/ui/IconWrapper";
import { Button as CustomButton } from "@/components/ui/button";

const IMAGE_HOSTS = [
  { href: "https://imgbb.com/", label: "ImgBB" },
  { href: "https://postimages.org/", label: "PostImages" },
  { href: "https://tenor.com/", label: "Tenor" },
  { href: "https://imgur.com/", label: "Imgur" },
  { href: "https://vgy.me/", label: "vgy.me" },
] as const;

export default function ImageHostLinks() {
  return (
    <div className="flex flex-wrap gap-1.5">
      {IMAGE_HOSTS.map((host) => (
        <CustomButton
          key={host.href}
          variant="default"
          size="sm"
          onClick={() =>
            window.open(host.href, "_blank", "noopener,noreferrer")
          }
        >
          <Icon icon="akar-icons:link-out" className="h-4 w-4" />
          {host.label}
        </CustomButton>
      ))}
    </div>
  );
}
