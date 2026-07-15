import React, { forwardRef } from "react";
import { Loader2 } from "lucide-react";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "danger"
  | "ghost"
  | "outline"
  | "subtle";

export type ButtonSize = "sm" | "md" | "lg" | "icon";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className = "",
      variant = "primary",
      size = "md",
      isLoading = false,
      loadingText,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      type = "button",
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-md transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer select-none";

    const variantStyles: Record<ButtonVariant, string> = {
      primary:
        "bg-brand text-brand-text hover:bg-brand-hover active:scale-[0.98] shadow-sm",
      secondary:
        "bg-bg-subtle text-text-primary hover:bg-bg-subtle/80 border border-border active:scale-[0.98]",
      danger:
        "bg-destructive text-destructive-foreground hover:bg-destructive/90 active:scale-[0.98] shadow-sm",
      ghost:
        "bg-transparent text-text-secondary hover:text-text-primary hover:bg-bg-subtle",
      outline:
        "bg-transparent border border-border text-text-primary hover:bg-bg-subtle hover:border-brand/40",
      subtle:
        "bg-brand/10 text-brand hover:bg-brand/20 active:scale-[0.98]",
    };

    // Note: 'md' size uses 2.625rem (42px) height to match app standard
    const sizeStyles: Record<ButtonSize, string> = {
      sm: "h-8 px-3 text-body-sm gap-1.5",
      md: "h-[2.625rem] px-4 text-body-md gap-2",
      lg: "h-12 px-6 text-body-lg gap-2.5",
      icon: "h-[2.625rem] w-[2.625rem] p-0",
    };

    const widthStyle = fullWidth ? "w-full" : "";

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyle} ${className}`}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin shrink-0" />
            {loadingText || children}
          </>
        ) : (
          <>
            {leftIcon && <span className="shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
