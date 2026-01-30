import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-bold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 focus-visible:ring-border-focus active:scale-95 focus-visible:ring-2 focus-visible:outline-none cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "!bg-button-info !text-form-button-text shadow-lg hover:!bg-button-info-hover active:!bg-button-info-active",
        destructive:
          "!bg-button-danger !text-form-button-text shadow-lg hover:!bg-button-danger-hover active:!bg-button-danger",
        outline:
          "!border-2 !border-form-button-text !text-form-button-text hover:!bg-button-info-hover active:!bg-button-info-active",
        secondary:
          "!bg-secondary-bg !text-primary-text shadow-md hover:!bg-quaternary-bg active:!bg-tertiary-bg border !border-border-primary",
        ghost:
          "!text-primary-text hover:!bg-secondary-bg active:!bg-tertiary-bg",
        link: "!text-link underline-offset-4 hover:underline active:scale-100",
      },
      size: {
        sm: "!h-8 !gap-1.5 !px-3 !text-xs",
        md: "!h-10 !px-5 !text-base",
        lg: "!px-8 !py-3 !text-lg",
        icon: "!size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
