import React from "react";
import { Button } from "./Button";

export interface PaginationProps {
  /** 0-indexed current page number */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Callback when page changes */
  onPageChange: (newPage: number) => void;
  /** Whether controls should be disabled */
  disabled?: boolean;
  /** Additional custom wrapper className */
  className?: string;
}

/**
 * Reusable Pagination Footer Component
 * Replaces redundant pagination controls across tables in User and Admin pages.
 */
export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  disabled = false,
  className = "",
}) => {
  if (totalPages <= 1) return null;

  return (
    <div className={`flex items-center justify-center gap-2 mt-4 ${className}`}>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => onPageChange(Math.max(0, currentPage - 1))}
        disabled={disabled || currentPage === 0}
      >
        Previous
      </Button>
      <span className="text-body-sm text-text-secondary font-medium mx-2">
        Page {currentPage + 1} of {totalPages}
      </span>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => onPageChange(Math.min(totalPages - 1, currentPage + 1))}
        disabled={disabled || currentPage >= totalPages - 1}
      >
        Next
      </Button>
    </div>
  );
};
