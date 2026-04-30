"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "@/lib/utils";

const Tabs = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root>
>(({ activationMode = "manual", ...props }, ref) => (
  <TabsPrimitive.Root ref={ref} activationMode={activationMode} {...props} />
));
Tabs.displayName = "Tabs";

const setRefs =
  <T,>(...refs: Array<React.Ref<T> | undefined>) =>
  (value: T | null) => {
    refs.forEach((ref) => {
      if (!ref) return;
      if (typeof ref === "function") ref(value);
      else {
        (ref as React.MutableRefObject<T | null>).current = value;
      }
    });
  };

interface TabsListProps extends React.ComponentPropsWithoutRef<
  typeof TabsPrimitive.List
> {
  noBottomRadius?: boolean;
  fullWidth?: boolean;
}

const TabsList = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.List>,
  TabsListProps
>(
  (
    {
      className,
      noBottomRadius = false,
      fullWidth = false,
      children,
      ...props
    },
    ref,
  ) => {
    const listRef =
      React.useRef<React.ComponentRef<typeof TabsPrimitive.List>>(null);
    const [indicator, setIndicator] = React.useState<{
      left: number;
      width: number;
      visible: boolean;
    }>({ left: 0, width: 0, visible: false });

    const updateIndicator = React.useCallback(() => {
      const el = listRef.current as unknown as HTMLElement | null;
      if (!el) return;
      const active = el.querySelector(
        '[data-state="active"]',
      ) as HTMLElement | null;
      if (!active) {
        setIndicator((prev) =>
          prev.visible ? { ...prev, visible: false } : prev,
        );
        return;
      }

      const left = active.offsetLeft;
      const width = active.offsetWidth;

      setIndicator((prev) => {
        if (
          prev.left === left &&
          prev.width === width &&
          prev.visible === width > 0
        ) {
          return prev;
        }
        return { left, width, visible: width > 0 };
      });
    }, []);

    React.useLayoutEffect(() => {
      updateIndicator();

      const el = listRef.current as unknown as HTMLElement | null;
      if (!el) return;

      let rafId: number | null = null;
      const scheduleUpdate = () => {
        if (rafId !== null) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          rafId = null;
          updateIndicator();
        });
      };

      const observer = new MutationObserver(scheduleUpdate);
      observer.observe(el, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["data-state", "data-disabled"],
      });

      const resizeObserver = new ResizeObserver(scheduleUpdate);
      resizeObserver.observe(el);

      window.addEventListener("resize", scheduleUpdate);
      return () => {
        if (rafId !== null) cancelAnimationFrame(rafId);
        observer.disconnect();
        resizeObserver.disconnect();
        window.removeEventListener("resize", scheduleUpdate);
      };
    }, [updateIndicator]);

    return (
      <TabsPrimitive.List
        ref={setRefs(listRef, ref)}
        className={cn(
          "text-secondary-text relative inline-flex h-auto max-w-full min-w-max items-center justify-start gap-1 overflow-x-auto overflow-y-hidden bg-transparent p-0 [-webkit-overflow-scrolling:touch]",
          fullWidth && "w-full min-w-0",
          noBottomRadius ? "rounded-t-lg rounded-b-none" : "rounded-lg",
          className,
        )}
        {...props}
      >
        <div
          aria-hidden="true"
          className="bg-border-primary/60 pointer-events-none absolute inset-x-0 bottom-0 h-px"
        />
        {children}
        <div
          aria-hidden="true"
          className={cn(
            "bg-border-focus pointer-events-none absolute bottom-0 h-0.5 transition-[transform,width,opacity] duration-200 ease-out",
            indicator.visible ? "opacity-100" : "opacity-0",
          )}
          style={{
            width: `${Math.max(0, indicator.width - 8)}px`,
            transform: `translateX(${indicator.left + 4}px)`,
          }}
        />
      </TabsPrimitive.List>
    );
  },
);
TabsList.displayName = TabsPrimitive.List.displayName;

interface TabsTriggerProps extends React.ComponentPropsWithoutRef<
  typeof TabsPrimitive.Trigger
> {
  fullWidth?: boolean;
}

const TabsTrigger = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Trigger>,
  TabsTriggerProps
>(({ className, fullWidth = false, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "ring-offset-background focus-visible:ring-ring text-secondary-text hover:bg-quaternary-bg hover:text-primary-text data-[state=active]:text-primary-text inline-flex cursor-pointer items-center justify-center rounded-md bg-transparent px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-transparent data-[state=active]:shadow-none",
      fullWidth && "flex-1",
      className,
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "ring-offset-background focus-visible:ring-ring mt-2 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
      className,
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
