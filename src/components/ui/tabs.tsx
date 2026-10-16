"use client";

import * as React from "react";
import { Tabs as TabsPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

// Set when the tabs pick a value instead of switching panels.
const RadioContext = React.createContext<{ value?: string } | null>(null);

interface TabsProps extends React.ComponentPropsWithoutRef<
  typeof TabsPrimitive.Root
> {
  /** Tab looks with radio-group semantics, for value pickers with no panels. */
  radio?: boolean;
}

const Tabs = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Root>,
  TabsProps
>(({ activationMode, radio = false, ...props }, ref) => (
  <RadioContext.Provider value={radio ? { value: props.value } : null}>
    <TabsPrimitive.Root
      ref={ref}
      // Arrow keys select radios, but only move focus between real tabs.
      activationMode={activationMode ?? (radio ? "automatic" : "manual")}
      {...props}
    />
  </RadioContext.Provider>
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
  /** Hide the base line and active underline, for lists that draw their own. */
  hideIndicator?: boolean;
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
      hideIndicator = false,
      children,
      ...props
    },
    ref,
  ) => {
    const radio = React.useContext(RadioContext);
    const listRef =
      React.useRef<React.ComponentRef<typeof TabsPrimitive.List>>(null);
    const [indicator, setIndicator] = React.useState<{
      left: number;
      width: number;
      visible: boolean;
      animate: boolean;
    }>({ left: 0, width: 0, visible: false, animate: false });

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

      // offsetLeft/offsetWidth round to whole pixels, which lets the filled
      // pill spill into a neighbouring flex-1 tab, so measure fractionally.
      const activeRect = active.getBoundingClientRect();
      const left =
        activeRect.left -
        el.getBoundingClientRect().left -
        el.clientLeft +
        el.scrollLeft;
      const width = activeRect.width;

      setIndicator((prev) => {
        if (
          prev.left === left &&
          prev.width === width &&
          prev.visible === width > 0
        ) {
          return prev;
        }
        // Only slide once it has been shown, so it doesn't sweep in from 0.
        return { left, width, visible: width > 0, animate: prev.visible };
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
        data-slot="tabs-list"
        {...(radio && {
          role: "radiogroup",
          "aria-orientation": undefined,
        })}
        className={cn(
          "text-secondary-text relative inline-flex h-auto max-w-full min-w-max items-center justify-start gap-1 overflow-x-auto overflow-y-hidden bg-transparent p-0 [-webkit-overflow-scrolling:touch]",
          fullWidth && "w-full min-w-0 gap-0",
          noBottomRadius ? "rounded-t-lg rounded-b-none" : "rounded-lg",
          className,
        )}
        {...props}
      >
        {!hideIndicator && (
          <div
            aria-hidden="true"
            data-slot="tabs-baseline"
            className="bg-border-primary/60 pointer-events-none absolute inset-x-0 bottom-0 h-px"
          />
        )}
        {children}
        {!hideIndicator && (
          // Underline by default; globals.css turns it into a pill for the
          // filled tab style, using the same --tab-left/--tab-width.
          <div
            aria-hidden="true"
            data-slot="tabs-indicator"
            data-visible={indicator.visible || undefined}
            className={cn(
              "bg-border-focus pointer-events-none absolute bottom-0 left-0 h-0.5 w-[max(0px,calc(var(--tab-width)-8px))] [transform:translateX(calc(var(--tab-left)+4px))]",
              indicator.animate &&
                "transition-[transform,width,opacity] duration-200 ease-out motion-reduce:transition-none",
              indicator.visible ? "opacity-100" : "opacity-0",
            )}
            style={
              {
                "--tab-left": `${indicator.left}px`,
                "--tab-width": `${indicator.width}px`,
              } as React.CSSProperties
            }
          />
        )}
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
>(({ className, fullWidth = false, onMouseDown, ...props }, ref) => {
  const radio = React.useContext(RadioContext);
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      data-slot="tabs-trigger"
      {...(radio && {
        role: "radio",
        "aria-checked": radio.value === props.value,
        "aria-selected": undefined,
        "aria-controls": undefined,
      })}
      onMouseDown={(event) => {
        // Radix focuses the trigger programmatically on mousedown, which can
        // match :focus-visible and show the keyboard ring on a mouse click.
        event.currentTarget.focus({ focusVisible: false });
        onMouseDown?.(event);
      }}
      className={cn(
        "focus-visible:ring-border-focus text-secondary-text data-[state=inactive]:hover:bg-quaternary-bg hover:text-primary-text data-[state=active]:text-primary-text inline-flex cursor-pointer items-center justify-center rounded-md bg-transparent px-3 py-2 text-sm font-medium whitespace-nowrap transition-[color] focus-visible:ring-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-transparent data-[state=active]:shadow-none",
        fullWidth && "flex-1 px-2",
        className,
      )}
      {...props}
    />
  );
});
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "focus-visible:ring-border-focus mt-2 focus-visible:ring-2 focus-visible:outline-none",
      className,
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
