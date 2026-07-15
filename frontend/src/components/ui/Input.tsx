import React, { forwardRef } from "react";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
  error?: string | boolean;
  helperText?: React.ReactNode;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  inputSize?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      inputSize = "md",
      fullWidth = true,
      className = "",
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;

    // Note: size uses control-height tokens to match app standard without hardcoded px/rem values
    const sizeStyles = {
      sm: "h-control-sm text-body-sm px-3",
      md: "h-control-md text-body-md px-3.5",
      lg: "h-control-lg text-body-lg px-4",
    }[inputSize];

    const leftPadding = leftIcon ? "pl-10" : "";
    const rightPadding = rightIcon ? "pr-10" : "";

    const borderStyle = error
      ? "border-destructive focus:border-destructive focus:ring-1 focus:ring-destructive/30"
      : "border-border focus:border-brand focus:ring-1 focus:ring-brand";

    const widthStyle = fullWidth ? "w-full" : "";

    return (
      <div className={`flex flex-col gap-1.5 ${widthStyle}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-body-sm font-medium text-text-secondary"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 flex items-center pointer-events-none text-text-muted">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            className={`w-full rounded-md bg-bg-surface border transition-colors outline-none text-text-primary placeholder:text-text-muted disabled:opacity-50 disabled:cursor-not-allowed ${sizeStyles} ${leftPadding} ${rightPadding} ${borderStyle} ${className}`}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 flex items-center text-text-muted">
              {rightIcon}
            </div>
          )}
        </div>
        {(typeof error === "string" && error) || helperText ? (
          <p
            className={`text-caption ${
              error ? "text-destructive" : "text-text-tertiary"
            }`}
          >
            {typeof error === "string" && error ? error : helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
