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
>(
  (
    { activationMode, radio = false, defaultValue, onValueChange, ...props },
    ref,
  ) => {
    // Radios report which one is checked, so follow the selection even
    // when it's uncontrolled (defaultValue).
    const [uncontrolled, setUncontrolled] = React.useState(defaultValue);
    return (
      <RadioContext.Provider
        value={radio ? { value: props.value ?? uncontrolled } : null}
      >
        <TabsPrimitive.Root
          ref={ref}
          // Arrow keys select radios, but only move focus between real tabs.
          activationMode={activationMode ?? (radio ? "automatic" : "manual")}
          defaultValue={defaultValue}
          onValueChange={(value) => {
            setUncontrolled(value);
            onValueChange?.(value);
          }}
          {...props}
        />
      </RadioContext.Provider>
    );
  },
);
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
      onKeyDown,
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
      top: number;
      height: number;
      visible: boolean;
      animate: boolean;
    }>({
      left: 0,
      width: 0,
      top: 0,
      height: 0,
      visible: false,
      animate: false,
    });

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
      // The filled pill also takes the tab's own top and height, so it sits
      // exactly where the tab (and its centered text) is.
      const activeRect = active.getBoundingClientRect();
      const listRect = el.getBoundingClientRect();
      const left =
        activeRect.left - listRect.left - el.clientLeft + el.scrollLeft;
      const width = activeRect.width;
      const top = activeRect.top - listRect.top - el.clientTop;
      const height = activeRect.height;

      setIndicator((prev) => {
        if (
          prev.left === left &&
          prev.width === width &&
          prev.top === top &&
          prev.height === height &&
          prev.visible === width > 0
        ) {
          return prev;
        }
        // Only slide once it has been shown, so it doesn't sweep in from 0.
        return {
          left,
          width,
          top,
          height,
          visible: width > 0,
          animate: prev.visible,
        };
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

      // Switching tab style animates the list's padding and border, moving
      // the tabs; follow them every frame until the list settles.
      let followId = 0;
      const follow = () => {
        updateIndicator();
        followId = requestAnimationFrame(follow);
      };
      const onListTransitionRun = (event: TransitionEvent) => {
        if (event.target === el && !followId) {
          followId = requestAnimationFrame(follow);
        }
      };
      const onListTransitionEnd = (event: TransitionEvent) => {
        if (event.target !== el) return;
        cancelAnimationFrame(followId);
        followId = 0;
        updateIndicator();
      };
      el.addEventListener("transitionrun", onListTransitionRun);
      el.addEventListener("transitionend", onListTransitionEnd);
      el.addEventListener("transitioncancel", onListTransitionEnd);

      window.addEventListener("resize", scheduleUpdate);
      return () => {
        if (rafId !== null) cancelAnimationFrame(rafId);
        cancelAnimationFrame(followId);
        observer.disconnect();
        resizeObserver.disconnect();
        el.removeEventListener("transitionrun", onListTransitionRun);
        el.removeEventListener("transitionend", onListTransitionEnd);
        el.removeEventListener("transitioncancel", onListTransitionEnd);
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
        onKeyDown={(event) => {
          onKeyDown?.(event);
          // Radix tabs only use Left/Right; radios also move with Up/Down.
          // Focusing one selects it (automatic activation).
          if (!radio || (event.key !== "ArrowUp" && event.key !== "ArrowDown"))
            return;
          const radios = [
            ...event.currentTarget.querySelectorAll<HTMLElement>(
              '[role="radio"]:not(:disabled)',
            ),
          ];
          const index = radios.indexOf(event.target as HTMLElement);
          if (index < 0) return;
          event.preventDefault();
          const step = event.key === "ArrowDown" ? 1 : -1;
          radios[(index + step + radios.length) % radios.length].focus();
        }}
        className={cn(
          "text-secondary-text relative inline-flex h-auto max-w-full min-w-max items-center justify-start gap-1 overflow-x-auto overflow-y-hidden border-0 border-transparent bg-transparent p-0 transition-[background-color,border-color,border-width,padding,gap] duration-200 ease-out motion-reduce:transition-none [-webkit-overflow-scrolling:touch]",
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
            className="bg-border-primary/60 pointer-events-none absolute inset-x-0 bottom-0 h-px transition-opacity duration-200 motion-reduce:transition-none"
          />
        )}
        {children}
        {!hideIndicator && (
          // Underline by default; globals.css turns it into a pill for the
          // filled tab style, using the same --tab-* measurements. Both use
          // the same properties (no transform), so switching styles morphs
          // the underline into the pill instead of snapping.
          <div
            aria-hidden="true"
            data-slot="tabs-indicator"
            data-visible={indicator.visible || undefined}
            className={cn(
              "bg-border-focus pointer-events-none absolute top-[calc(100%-2px)] left-[calc(var(--tab-left)+4px)] h-0.5 w-[max(0px,calc(var(--tab-width)-8px))] rounded-none",
              indicator.animate &&
                "transition-[top,left,width,height,border-radius,background-color,opacity] duration-200 ease-out motion-reduce:transition-none",
              indicator.visible ? "opacity-100" : "opacity-0",
            )}
            style={
              {
                "--tab-left": `${indicator.left}px`,
                "--tab-width": `${indicator.width}px`,
                "--tab-top": `${indicator.top}px`,
                "--tab-height": `${indicator.height}px`,
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
