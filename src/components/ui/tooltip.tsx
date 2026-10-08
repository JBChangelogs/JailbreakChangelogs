"use client";

import * as React from "react";
import { useLayoutEffect, useRef } from "react";
import twemoji from "@twemoji/api";
import { Tooltip as TooltipPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";
import { useTwemoji } from "@/contexts/TwemojiContext";

const TWEMOJI_OPTIONS = { className: "twemoji" } as const;

function TooltipTwemojiInner({ children }: { children: React.ReactNode }) {
  const { twemojiEnabled } = useTwemoji();
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!twemojiEnabled || !ref.current) return;
    twemoji.parse(ref.current, TWEMOJI_OPTIONS);
  });

  if (!twemojiEnabled) {
    return <>{children}</>;
  }

  return <div ref={ref}>{children}</div>;
}

function TooltipProvider({
  delayDuration = 0,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={delayDuration}
      {...props}
    />
  );
}

function Tooltip({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  return (
    <TooltipProvider>
      <TooltipPrimitive.Root data-slot="tooltip" {...props} />
    </TooltipProvider>
  );
}

function TooltipTrigger({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />;
}

function TooltipContent({
  className,
  sideOffset = 4,
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(
          "bg-secondary-bg/55 text-primary-text border-border-card animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-[10001] rounded-lg border px-3 py-2 text-xs font-medium backdrop-blur-3xl",
          className,
        )}
        {...props}
      >
        <TooltipTwemojiInner>{children}</TooltipTwemojiInner>
        <TooltipPrimitive.Arrow
          className="fill-border-primary"
          width={11}
          height={5}
        />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
}

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger };
