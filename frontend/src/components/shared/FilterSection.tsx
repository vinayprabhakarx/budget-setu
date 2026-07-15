import React from 'react';
import { Search, X, RotateCcw } from 'lucide-react';
import { Button } from '../ui/Button';

export interface FilterSectionProps {
  /** Whether the filter panel is currently visible */
  isOpen: boolean;
  /** Value of the search input */
  searchQuery?: string;
  /** Callback when search input value changes */
  onSearchChange?: (query: string) => void;
  /** Placeholder for search input */
  searchPlaceholder?: string;
  /** Callback when search form is submitted */
  onSearchSubmit?: (e: React.FormEvent) => void;
  /** Whether any filters/search are currently active (to display Reset button) */
  hasActiveFilters?: boolean;
  /** Callback to reset all search & filters */
  onReset?: () => void;
  /** Layout mode (legacy prop kept for backward compatibility, both now render uniform structure) */
  layout?: 'row' | 'stack';
  /** Additional filter controls (dropdowns, selectors, date inputs, etc.) */
  children?: React.ReactNode;
  /** Additional custom class names for the card wrapper */
  className?: string;
}

/**
 * FilterSection
 * 
 * Reusable, standardized filter control panel used across all pages in BudgetSetu.
 * Ensures 100% consistent design aesthetic, glassmorphic card styling, responsive layout,
 * and unified search bar and reset button behaviors.
 * 
 * Specifically guarantees:
 * - Reset option is ALWAYS rendered in the exact same top-right position across all pages.
 * - Uniform 2-row layout structure: Search bar on top left, Reset button on top right,
 *   and secondary filter controls arranged cleanly in the row below.
 */
export const FilterSection: React.FC<FilterSectionProps> = ({
  isOpen,
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Search...",
  onSearchSubmit,
  hasActiveFilters = false,
  onReset,
  children,
  className = "",
}) => {
  if (!isOpen) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && onSearchSubmit) {
      e.preventDefault();
      onSearchSubmit(e as unknown as React.FormEvent);
    }
  };

  return (
    <section className={`card p-4 sm:p-5 transition-all duration-200 animate-in fade-in slide-in-from-top-2 shadow-sm border border-border-muted/80 bg-bg-surface/95 backdrop-blur-sm ${className}`}>
      <div className="flex flex-col gap-3.5 sm:gap-4">
        {/* Header Row: Primary Search Bar (or Title) on left, Reset Button anchored on top right */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {onSearchChange !== undefined ? (
            <div className="relative flex-1 min-w-60 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchQuery ?? ""}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={handleKeyDown}
                className="input input-sm w-full pl-10! pr-8! text-body-sm bg-bg-card/90 focus:bg-bg-surface border-border transition-colors shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary p-0.5 rounded transition-colors"
                  title="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ) : (
            <div className="flex-1 min-w-37.5 flex items-center gap-2">
              <span className="text-body-sm font-semibold text-text-primary">Filter & Grouping Controls</span>
            </div>
          )}

          {onReset && (
            <Button
              type="button"
              variant="subtle"
              size="sm"
              onClick={onReset}
              disabled={!hasActiveFilters}
              leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
              className="ml-auto shrink-0"
            >
              Reset Filters
            </Button>
          )}
        </div>

        {/* Secondary Filter Controls Row (Dropdowns, Presets, Date Pickers) */}
        {children && (
          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-border-muted/40">
            {children}
          </div>
        )}
      </div>
    </section>
  );
};

