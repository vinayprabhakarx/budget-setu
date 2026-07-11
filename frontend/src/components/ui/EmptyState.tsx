import React from "react";
import { Inbox } from "lucide-react";
import { Button } from "./Button";

export interface EmptyStateProps {
  title?: string;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick?: () => void;
    icon?: React.ReactNode;
  };
  secondaryAction?: {
    label: string;
    onClick?: () => void;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = "No items found",
  description,
  icon,
  action,
  secondaryAction,
  className = "",
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center py-14 px-4 text-center border border-dashed border-border/80 rounded-2xl bg-bg-surface/50 ${className}`}
    >
      <div className="h-12 w-12 rounded-full bg-bg-subtle flex items-center justify-center text-text-muted mb-3.5 shadow-inner">
        {icon || <Inbox className="h-6 w-6 opacity-80" />}
      </div>

      <h3 className="text-body-lg font-semibold text-text-primary mb-1">
        {title}
      </h3>

      {description && (
        <p className="text-body-sm text-text-secondary max-w-sm mb-5 leading-relaxed">
          {description}
        </p>
      )}

      {(action || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-3 mt-1">
          {action && (
            <Button
              variant="primary"
              size="md"
              onClick={action.onClick}
              leftIcon={action.icon}
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              variant="secondary"
              size="md"
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
