"use client";

import React, { useRef } from "react";
import { Icon } from "../../ui/IconWrapper";
import { FOCUS_RING } from "./calculatorStyles";

interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  icon?: string;
  iconClassName?: string;
  activeClassName?: string;
  ariaLabel?: string;
}

interface SegmentedControlProps<T extends string> {
  options: ReadonlyArray<SegmentedOption<T>>;
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  className?: string;
}

const SIZE_CLASSES = {
  sm: "h-7 px-2.5 text-xs pointer-coarse:h-10",
  md: "h-8 px-3 text-xs pointer-coarse:h-10",
  lg: "h-10 px-4 text-sm",
} as const;

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  size = "md",
  fullWidth = false,
  className = "",
}: SegmentedControlProps<T>) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  const move = (fromIndex: number, delta: number | "first" | "last") => {
    const count = options.length;
    const nextIndex =
      delta === "first"
        ? 0
        : delta === "last"
          ? count - 1
          : (fromIndex + delta + count) % count;
    onChange(options[nextIndex].value);
    refs.current[nextIndex]?.focus();
  };

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        event.preventDefault();
        move(index, 1);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        event.preventDefault();
        move(index, -1);
        break;
      case "Home":
        event.preventDefault();
        move(index, "first");
        break;
      case "End":
        event.preventDefault();
        move(index, "last");
        break;
      default:
    }
  };

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={`border-border-card bg-tertiary-bg items-center gap-0.5 rounded-lg border p-0.5 ${
        fullWidth ? "flex w-full" : "inline-flex"
      } ${className}`}
    >
      {options.map((option, index) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            ref={(node) => {
              refs.current[index] = node;
            }}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={option.ariaLabel}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(option.value)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={`inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-md font-semibold whitespace-nowrap transition-colors ${FOCUS_RING} ${SIZE_CLASSES[size]} ${
              fullWidth ? "flex-1" : ""
            } ${
              isActive
                ? (option.activeClassName ??
                  "bg-button-info text-form-button-text shadow-sm")
                : "text-secondary-text hover:text-primary-text hover:bg-quaternary-bg"
            }`}
          >
            {option.icon && (
              <Icon
                icon={option.icon}
                className={`h-4 w-4 ${option.iconClassName ?? ""}`}
                aria-hidden="true"
              />
            )}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
