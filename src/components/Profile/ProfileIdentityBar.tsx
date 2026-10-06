"use client";

import { useEffect, useState, type RefObject } from "react";
import { UserAvatar } from "@/utils/ui/avatar";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/IconWrapper";

interface ProfileIdentityBarProps {
  identityRef: RefObject<HTMLHeadingElement | null>;
  user: {
    id: string;
    username: string;
    global_name?: string;
    avatar: string;
    custom_avatar?: string;
    premiumtype?: number;
    settings_v2?: { custom_avatar?: boolean; hide_presence?: boolean };
  };
}

export default function ProfileIdentityBar({
  identityRef,
  user,
}: ProfileIdentityBarProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let observer: IntersectionObserver | undefined;
    let frame: number;
    const observe = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const identity = identityRef.current;
        if (!identity) return;
        const headerHeight =
          parseFloat(
            getComputedStyle(document.documentElement).getPropertyValue(
              "--header-height",
            ),
          ) || 0;
        observer?.disconnect();
        observer = new IntersectionObserver(
          ([entry]) => {
            setVisible(entry.boundingClientRect.bottom <= headerHeight);
          },
          { rootMargin: `-${headerHeight}px 0px 0px 0px` },
        );
        observer.observe(identity);
      });
    };
    observe();
    window.addEventListener("resize", observe);
    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener("resize", observe);
    };
  }, [identityRef, user.id]);

  return (
    <div className="sticky top-(--header-height) z-40 h-0">
      {visible && (
        <div className="border-border-card bg-secondary-bg/95 flex h-16 items-center gap-3 rounded-b-xl border px-4 shadow-lg backdrop-blur-md sm:px-5">
          <UserAvatar
            userId={user.id}
            avatarHash={user.avatar}
            username={user.username}
            custom_avatar={user.custom_avatar}
            premiumType={user.premiumtype}
            settings={user.settings_v2}
            size={10}
            cdnSize={128}
            showBadge={false}
          />
          <div className="min-w-0 flex-1">
            <p className="text-primary-text truncate text-sm font-semibold">
              {user.global_name && user.global_name !== "None"
                ? user.global_name
                : user.username}
            </p>
            <p className="text-secondary-text truncate text-xs">
              @{user.username}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            aria-label="Back to profile header"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <span className="hidden sm:inline">Back to profile</span>
            <Icon icon="heroicons:arrow-up" />
          </Button>
        </div>
      )}
    </div>
  );
}
