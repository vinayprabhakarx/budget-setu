import React from "react";

export type BadgeVariant =
  | "brand"
  | "income"
  | "success"
  | "expense"
  | "danger"
  | "warning"
  | "neutral"
  | "info";

export type BadgeSize = "sm" | "md";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "neutral",
  size = "md",
  icon,
  className = "",
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center font-medium rounded-full transition-colors shrink-0";

  const variantStyles: Record<BadgeVariant, string> = {
    brand: "bg-brand/10 text-brand border border-brand/20",
    income: "bg-income/10 text-income border border-income/20",
    success: "bg-success/10 text-success border border-success/20",
    expense: "bg-destructive/10 text-destructive border border-destructive/20",
    danger: "bg-destructive/10 text-destructive border border-destructive/20",
    warning: "bg-warning/10 text-warning border border-warning/20",
    neutral: "bg-bg-subtle text-text-secondary border border-border",
    info: "bg-info/10 text-info border border-info/20",
  };

  const sizeStyles: Record<BadgeSize, string> = {
    sm: "px-2 py-0.5 text-[0.6875rem] gap-1",
    md: "px-2.5 py-1 text-caption gap-1.5",
  };

  return (
    <span
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </span>
  );
};
