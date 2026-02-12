"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  useFloating,
  useClick,
  useDismiss,
  useRole,
  useInteractions,
  offset,
  flip,
  shift,
  autoUpdate,
} from "@floating-ui/react";
import { Icon } from "@/components/ui/IconWrapper";

interface FloatingDropdownOption {
  value: string;
  label: string;
}

interface FloatingDropdownProps {
  options: FloatingDropdownOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
  onOpenChange?: (isOpen: boolean) => void;
  stopPropagation?: boolean;
}

export default function FloatingDropdown({
  options,
  value,
  onChange,
  className = "",
  buttonClassName = "",
  menuClassName = "",
  onOpenChange,
  stopPropagation = true,
}: FloatingDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: (newOpen) => {
      setIsOpen(newOpen);
      onOpenChange?.(newOpen);
    },
    middleware: [offset(8), flip({ padding: 8 }), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  });

  const click = useClick(context);
  const dismiss = useDismiss(context);
  const role = useRole(context);

  const { getReferenceProps, getFloatingProps } = useInteractions([
    click,
    dismiss,
    role,
  ]);

  const selectedOption = options.find((opt) => opt.value === value);
  const displayLabel = selectedOption?.label || "Select...";

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (stopPropagation) {
      e.stopPropagation();
    }
  };

  return (
    <div className={className}>
      <button
        ref={refs.setReference}
        {...getReferenceProps({ onClick: handleClick })}
        className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 transition-colors ${
          buttonClassName ||
          "border-border-card bg-secondary-bg text-primary-text hover:border-border-focus cursor-pointer text-xs sm:text-sm"
        }`}
      >
        <span className="truncate">{displayLabel}</span>
        <Icon
          icon="heroicons-outline:chevron-down"
          className={`ml-2 h-4 w-4 shrink-0 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          inline={true}
        />
      </button>

      {isMounted &&
        isOpen &&
        createPortal(
          <div
            // eslint-disable-next-line react-hooks/refs
            ref={refs.setFloating}
            style={floatingStyles}
            {...getFloatingProps()}
            className={`bg-secondary-bg z-50 rounded-lg border shadow-lg ${
              menuClassName || "border-border-card"
            }`}
          >
            <div className="max-h-60 overflow-y-auto">
              {options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleSelect(option.value)}
                  className={`w-full px-3 py-2 text-left text-xs transition-colors sm:text-sm ${
                    value === option.value
                      ? "bg-button-info text-form-button-text"
                      : "text-primary-text hover:bg-primary-bg"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
