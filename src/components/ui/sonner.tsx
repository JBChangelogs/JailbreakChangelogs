"use client";

import { useTheme } from "@/contexts/ThemeContext";
import { Spinner } from "@/components/ui/Spinner";
import { Toaster as Sonner } from "sonner";
import type { CSSProperties } from "react";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const defaultClassNames: NonNullable<
  ToasterProps["toastOptions"]
>["classNames"] = {
  toast:
    "relative flex w-full flex-row items-start gap-3 overflow-hidden rounded-xl border border-border-card bg-[color:color-mix(in_srgb,var(--color-tertiary-bg),transparent_55%)] p-3 text-left text-primary-text shadow-(--color-card-shadow) backdrop-blur-xl",
  title: "text-left font-semibold text-primary-text",
  description: "text-left text-secondary-text",
  content: "min-w-0 flex-1 space-y-1 text-left",
  icon: "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center text-secondary-text [&>svg]:h-5 [&>svg]:w-5",
  loader: "text-secondary-text [--size:16px]",
  actionButton:
    "w-fit cursor-pointer rounded-lg bg-button-info px-3 py-1.5 text-xs font-semibold text-form-button-text hover:bg-button-info-hover",
  cancelButton: "hidden",
  closeButton:
    "bg-secondary-bg text-secondary-text border border-border-card hover:bg-quaternary-bg hover:text-primary-text",
  success:
    "[--toast-accent:var(--color-status-success)] [&_[data-icon]]:text-[var(--toast-accent)]",
  error:
    "[--toast-accent:var(--color-button-danger)] [&_[data-icon]]:text-[var(--toast-accent)]",
  warning:
    "[--toast-accent:var(--color-warning)] [&_[data-icon]]:text-[var(--toast-accent)]",
  info: "[--toast-accent:var(--color-button-info)] [&_[data-icon]]:text-[var(--toast-accent)] ",
  loading:
    "[&_.sonner-loader]:!static [&_.sonner-loader]:!translate-none [&_.sonner-loader]:!transform-none [&_.sonner-loader]:flex [&_.sonner-loader]:items-center [&_.sonner-loader]:justify-center",
};

function mergeToastClassNames(
  base: NonNullable<ToasterProps["toastOptions"]>["classNames"],
  extra?: NonNullable<ToasterProps["toastOptions"]>["classNames"],
) {
  if (!extra) return base;

  const merged = { ...base } as Record<string, string>;
  for (const [key, value] of Object.entries(extra as Record<string, string>)) {
    if (!value) continue;
    const existing = merged[key];
    merged[key] = existing ? `${existing} ${value}` : value;
  }

  return merged as NonNullable<ToasterProps["toastOptions"]>["classNames"];
}

const Toaster = ({ toastOptions, style, icons, ...props }: ToasterProps) => {
  const { theme } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group z-4000!"
      style={
        {
          "--width": "440px",
          ...style,
        } as CSSProperties
      }
      toastOptions={{
        ...toastOptions,
        unstyled: true,
        classNames: mergeToastClassNames(
          defaultClassNames,
          toastOptions?.classNames,
        ),
      }}
      icons={{
        loading: <Spinner className="h-4 w-4" />,
        ...icons,
      }}
      {...props}
    />
  );
};

export { Toaster };
