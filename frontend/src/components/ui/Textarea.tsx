import React, { forwardRef } from "react";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: React.ReactNode;
  error?: string | boolean;
  helperText?: React.ReactNode;
  fullWidth?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      helperText,
      fullWidth = true,
      className = "",
      id,
      disabled,
      rows = 3,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const textareaId = id || generatedId;

    const borderStyle = error
      ? "border-destructive focus:border-destructive focus:ring-1 focus:ring-destructive/30"
      : "border-border focus:border-brand focus:ring-1 focus:ring-brand";

    const widthStyle = fullWidth ? "w-full" : "";

    return (
      <div className={`flex flex-col gap-1.5 ${widthStyle}`}>
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-body-sm font-medium text-text-secondary"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          disabled={disabled}
          rows={rows}
          className={`w-full rounded-md bg-bg-surface border transition-colors outline-none text-text-primary placeholder:text-text-muted p-3 text-body-md disabled:opacity-50 disabled:cursor-not-allowed ${borderStyle} ${className}`}
          {...props}
        />
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

Textarea.displayName = "Textarea";
