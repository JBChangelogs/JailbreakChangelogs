import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none shrink-0 [&_svg]:shrink-0 focus-visible:ring-border-focus active:scale-95 focus-visible:ring-2 focus-visible:outline-none cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-button-info! text-form-button-text! shadow-lg hover:bg-button-info-hover! active:bg-button-info-active!",
        destructive:
          "bg-status-error! text-form-button-text! shadow-lg hover:bg-status-error/90! active:bg-status-error!",
        success:
          "bg-status-success! text-form-button-text! shadow-lg hover:bg-status-success/90! active:bg-status-success!",
        outline:
          "border-2! border-form-button-text! text-form-button-text! hover:bg-button-info-hover! active:bg-button-info-active!",
        secondary:
          "bg-button-secondary! text-primary-text! hover:bg-button-secondary-hover! active:bg-button-secondary-active!",
        ghost:
          "text-primary-text! hover:bg-secondary-bg! active:bg-tertiary-bg!",
        link: "text-link! underline-offset-4 hover:underline active:scale-100",
      },
      size: {
        sm: "h-8! gap-1.5! px-3! text-xs! [&_svg]:size-4!",
        md: "h-10! px-5! text-base! [&_svg]:size-5!",
        lg: "h-12! px-8! py-3! text-lg! [&_svg]:size-6!",
        icon: "size-10! [&_svg]:size-5!",
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
  color?: string;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, color, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }), color)}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
