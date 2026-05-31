"use client";

import Twemoji from "react-twemoji";
import { useTwemoji } from "@/contexts/TwemojiContext";
import type { ElementType, ReactNode } from "react";

type TwemojiTextProps = {
  children: ReactNode;
  tag?: ElementType;
  className?: string;
};

export function TwemojiText({
  children,
  tag: Tag = "span",
  className,
}: TwemojiTextProps) {
  const { twemojiEnabled } = useTwemoji();

  if (!twemojiEnabled) {
    return className ? (
      <Tag className={className}>{children}</Tag>
    ) : (
      <>{children}</>
    );
  }

  return (
    <Twemoji tag={Tag} options={{ className: "twemoji" }} className={className}>
      {children}
    </Twemoji>
  );
}
