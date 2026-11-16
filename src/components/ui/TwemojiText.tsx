"use client";

import Twemoji from "react-twemoji";
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
  return (
    <Twemoji tag={Tag} options={{ className: "twemoji" }} className={className}>
      {children}
    </Twemoji>
  );
}
