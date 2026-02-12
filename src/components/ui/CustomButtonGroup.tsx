import React from "react";

interface CustomButtonGroupProps {
  children: React.ReactNode;
  className?: string;
}

interface CustomButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  selected?: boolean;
  disabled?: boolean;
  className?: string;
}

export const CustomButtonGroup: React.FC<CustomButtonGroupProps> = ({
  children,
  className = "",
}) => {
  return (
    <div
      role="group"
      className={`border-border-card inline-flex w-fit rounded-lg border ${className}`}
    >
      {children}
    </div>
  );
};

export const CustomButton: React.FC<CustomButtonProps> = ({
  children,
  onClick,
  selected = false,
  disabled = false,
  className = "",
}) => {
  const baseClasses = `
    px-3 py-2 text-sm font-medium transition-all duration-200
    border-r border-border-card last:border-r-0
    first:rounded-l-md last:rounded-r-md
    focus:outline-none focus:ring-2 focus:ring-button-info focus:ring-opacity-50
  `;

  const stateClasses = selected
    ? `
      bg-button-info text-form-button-text
      hover:bg-button-info-hover
    `
    : `
      bg-primary-bg text-primary-text
      hover:bg-button-info/10 hover:text-primary-text
    `;

  const disabledClasses = disabled
    ? `
      opacity-50 cursor-not-allowed
      hover:bg-transparent hover:text-primary-text
    `
    : `
      cursor-pointer
    `;

  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`${baseClasses} ${stateClasses} ${disabledClasses} ${className}`}
      aria-pressed={selected}
    >
      {children}
    </button>
  );
};
