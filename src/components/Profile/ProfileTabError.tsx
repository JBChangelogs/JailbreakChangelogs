import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/IconWrapper";

interface ProfileTabErrorProps {
  title: string;
  message: string;
  signInRequired?: boolean;
  onRetry?: () => void;
  children?: ReactNode;
}

export default function ProfileTabError({
  title,
  message,
  signInRequired = false,
  onRetry,
  children,
}: ProfileTabErrorProps) {
  return (
    <div className="mx-auto max-w-lg px-4 py-8 text-center">
      <div className="mb-3 flex justify-center">
        <Icon
          icon={
            signInRequired
              ? "heroicons:lock-closed"
              : "heroicons:exclamation-triangle"
          }
          className={`h-8 w-8 ${signInRequired ? "text-secondary-text" : "text-button-info"}`}
        />
      </div>
      <h3 className="text-primary-text mb-2 text-lg font-semibold">{title}</h3>
      <p className="text-secondary-text mb-6 leading-relaxed">{message}</p>
      <div className="flex flex-wrap justify-center gap-4">
        {children}
        {onRetry && (
          <Button variant="secondary" onClick={onRetry}>
            Try again
          </Button>
        )}
      </div>
    </div>
  );
}
