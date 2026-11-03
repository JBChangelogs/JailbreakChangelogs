"use client";

import * as React from "react";
import {
  DayButton,
  Day,
  DayPicker,
  getDefaultClassNames,
  type DropdownProps,
} from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Icon } from "@/components/ui/IconWrapper";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "dropdown",
  buttonVariant = "ghost",
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"];
}) {
  const defaultClassNames = getDefaultClassNames();

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "bg-background group/calendar p-3 [--cell-size:2rem] [[data-slot=card-content]_&]:bg-transparent [[data-slot=popover-content]_&]:bg-transparent",
        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
        className,
      )}
      captionLayout={captionLayout}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString("default", { month: "short" }),
        ...formatters,
      }}
      classNames={{
        root: cn("w-fit", defaultClassNames.root),
        months: cn(
          "relative flex flex-col gap-4 md:flex-row",
          defaultClassNames.months,
        ),
        month: cn("flex w-full flex-col gap-4", defaultClassNames.month),
        nav: cn(
          "pointer-events-none absolute inset-x-0 top-0 flex h-10 w-full items-center justify-between gap-1",
          defaultClassNames.nav,
        ),
        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          "pointer-events-auto size-8! select-none p-0! aria-disabled:opacity-50",
          defaultClassNames.button_previous,
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          "pointer-events-auto size-8! select-none p-0! aria-disabled:opacity-50",
          defaultClassNames.button_next,
        ),
        month_caption: cn(
          "flex h-10 w-full items-center justify-center px-8",
          defaultClassNames.month_caption,
        ),
        dropdowns: cn(
          "flex h-[--cell-size] w-full items-center justify-center gap-1.5 text-sm font-medium",
          defaultClassNames.dropdowns,
        ),
        dropdown_root: cn(
          "focus-within:ring-border-focus relative rounded-md focus-within:ring-2",
          defaultClassNames.dropdown_root,
        ),
        dropdown: cn(
          "bg-secondary-bg text-primary-text absolute inset-0 cursor-pointer opacity-0",
          defaultClassNames.dropdown,
        ),
        caption_label: cn(
          "select-none font-medium",
          captionLayout === "label"
            ? "text-sm"
            : "[&>svg]:text-muted-foreground flex h-8 items-center gap-1 rounded-md pl-2 pr-1 text-sm [&>svg]:size-3.5",
          defaultClassNames.caption_label,
        ),
        table: "w-full border-collapse",
        weekdays: cn("flex", defaultClassNames.weekdays),
        weekday: cn(
          "text-muted-foreground flex-1 select-none rounded-md text-[0.8rem] font-normal",
          defaultClassNames.weekday,
        ),
        week: cn("mt-2 flex w-full", defaultClassNames.week),
        week_number_header: cn(
          "w-[--cell-size] select-none",
          defaultClassNames.week_number_header,
        ),
        week_number: cn(
          "text-muted-foreground select-none text-[0.8rem]",
          defaultClassNames.week_number,
        ),
        day: cn(
          "group/day relative aspect-square h-full w-full select-none p-0 text-center [&:first-child[data-selected=true]_button]:rounded-l-md [&:last-child[data-selected=true]_button]:rounded-r-md",
          defaultClassNames.day,
        ),
        range_start: cn(
          "bg-button-info/20 rounded-l-md",
          defaultClassNames.range_start,
        ),
        range_middle: cn("rounded-none", defaultClassNames.range_middle),
        range_end: cn(
          "bg-button-info/20 rounded-r-md",
          defaultClassNames.range_end,
        ),
        today: cn(
          "bg-quaternary-bg text-primary-text rounded-full",
          defaultClassNames.today,
        ),
        outside: cn(
          "text-muted-foreground aria-selected:text-muted-foreground",
          defaultClassNames.outside,
        ),
        disabled: cn(
          "text-muted-foreground opacity-50",
          defaultClassNames.disabled,
        ),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => {
          return (
            <div
              data-slot="calendar"
              ref={rootRef}
              className={cn(className)}
              {...props}
            />
          );
        },
        Chevron: ({ className, orientation }) => {
          if (orientation === "left") {
            return (
              <Icon
                icon="lucide:chevron-left"
                className={cn("size-4", className)}
              />
            );
          }

          if (orientation === "right") {
            return (
              <Icon
                icon="lucide:chevron-right"
                className={cn("size-4", className)}
              />
            );
          }

          return (
            <Icon
              icon="lucide:chevron-down"
              className={cn("size-4", className)}
            />
          );
        },
        Day: ({ day, modifiers, children, className, ...dayProps }) => {
          const showBoundaryDate =
            showOutsideDays &&
            !props.hidden &&
            modifiers.outside &&
            modifiers.hidden;
          return (
            <Day
              {...dayProps}
              day={day}
              modifiers={modifiers}
              className={cn(
                className,
                showBoundaryDate && "visible opacity-50",
              )}
              data-hidden={
                showBoundaryDate ? undefined : modifiers.hidden || undefined
              }
              aria-disabled={showBoundaryDate || dayProps["aria-disabled"]}
            >
              {showBoundaryDate ? (
                <span className="text-primary-text flex size-10 items-center justify-center">
                  {day.date.getDate()}
                </span>
              ) : (
                children
              )}
            </Day>
          );
        },
        DayButton: CalendarDayButton,
        Dropdown: CalendarDropdown,
        WeekNumber: ({ children, ...props }) => {
          return (
            <td {...props}>
              <div className="flex size-[--cell-size] items-center justify-center text-center">
                {children}
              </div>
            </td>
          );
        },
        ...components,
      }}
      {...props}
    />
  );
}

function CalendarDropdown({
  options,
  value,
  onChange,
  disabled,
  "aria-label": ariaLabel,
}: DropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          disabled={disabled}
          aria-label={ariaLabel}
          className="text-primary-text h-8 gap-1 px-2 font-medium"
        >
          {options?.find((option) => option.value === Number(value))?.label}
          <Icon icon="lucide:chevron-down" className="size-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-64 min-w-24">
        <DropdownMenuRadioGroup
          value={String(value)}
          onValueChange={(nextValue) =>
            // DayPicker's navigation handlers read the selected value from target.
            onChange?.({
              target: { value: nextValue },
            } as React.ChangeEvent<HTMLSelectElement>)
          }
        >
          {options?.map((option) => (
            <DropdownMenuRadioItem
              key={option.value}
              value={String(option.value)}
              disabled={option.disabled}
            >
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const defaultClassNames = getDefaultClassNames();

  const ref = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);

  return (
    <Button
      ref={ref}
      variant={
        modifiers.selected && !modifiers.range_middle ? "default" : "ghost"
      }
      size="icon"
      data-day={day.date.toLocaleDateString()}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        "data-[selected-single=true]:bg-button-info data-[selected-single=true]:text-form-button-text! data-[range-middle=true]:bg-button-info/20 data-[range-middle=true]:text-primary-text data-[range-start=true]:bg-button-info data-[range-start=true]:text-form-button-text! data-[range-end=true]:bg-button-info data-[range-end=true]:text-form-button-text! group-data-[focused=true]/day:border-button-info group-data-[focused=true]/day:ring-button-info/40 flex aspect-square h-auto w-full min-w-[--cell-size] flex-col gap-1 leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px] data-[range-end=true]:rounded-md data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-md [&>span]:text-xs [&>span]:opacity-70",
        defaultClassNames.day,
        // The day cell owns disabled opacity.
        "disabled:opacity-100",
        !modifiers.range_start &&
          !modifiers.range_end &&
          !modifiers.range_middle &&
          "rounded-full!",
        !modifiers.selected &&
          "enabled:hover:bg-quaternary-bg! enabled:active:bg-quaternary-bg!",
        modifiers.range_middle &&
          "enabled:hover:bg-button-info/30! enabled:active:bg-button-info/30!",
        className,
      )}
      {...props}
    />
  );
}

export { Calendar };
