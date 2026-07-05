import React from "react";
import { Filter, RefreshCw } from "lucide-react";

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  onFilterClick?: () => void;
  showFilters?: boolean;
  onRefreshClick?: () => void;
  isRefreshing?: boolean;
  children?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  onFilterClick,
  showFilters,
  onRefreshClick,
  isRefreshing,
  children,
}) => {
  return (
    <div className="grid grid-cols-[1fr_auto] gap-x-4">
      <h1 className="text-2xl font-display font-semibold tracking-tight text-text-primary min-w-0 col-start-1 row-start-1 self-center">
        {title}
      </h1>
      {subtitle && (
        <p className="text-body-sm text-text-secondary mt-1.5 sm:mt-0 col-span-2 sm:col-span-1 col-start-1 row-start-2">
          {subtitle}
        </p>
      )}
      <div className="col-start-2 row-start-1 sm:row-span-2 flex items-center gap-2 flex-wrap justify-end self-start sm:self-center">
        {onFilterClick && (
          <button
            type="button"
            onClick={onFilterClick}
            className={`p-2 rounded-lg border transition-colors flex items-center justify-center ${
              showFilters
                ? "bg-primary-50 text-primary-600 border-primary-200 dark:bg-primary-950/50 dark:border-primary-800"
                : "bg-bg-surface text-text-secondary border-border hover:bg-bg-muted hover:text-text-primary"
            }`}
            title="Toggle Filters"
          >
            <Filter className="h-4 w-4" />
          </button>
        )}
        {onRefreshClick && (
          <button
            type="button"
            onClick={onRefreshClick}
            disabled={isRefreshing}
            className="p-2 rounded-lg border border-border bg-bg-surface text-text-secondary hover:bg-bg-muted hover:text-text-primary transition-colors flex items-center justify-center disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>
        )}
        {children}
      </div>
    </div>
  );
};
