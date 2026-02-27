"use client";

import { useTheme } from "@/contexts/ThemeContext";
import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group !z-[4000]"
      richColors
      {...props}
    />
  );
};

export { Toaster };
