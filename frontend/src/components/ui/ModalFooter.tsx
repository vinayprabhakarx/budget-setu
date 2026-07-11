import React from "react";
import { Button } from "./Button";

export interface ModalFooterProps {
  onCancel: () => void;
  cancelText?: string;
  onSubmit?: (e?: React.MouseEvent) => void;
  submitText?: string;
  isLoading?: boolean;
  loadingText?: string;
  disabled?: boolean;
  submitButtonType?: "submit" | "button";
  variant?: "primary" | "danger" | "secondary";
  children?: React.ReactNode;
  className?: string;
}

/**
 * Reusable ModalFooter Component
 * Replaces redundant modal footer layout and action buttons across all Dialog modals.
 */
export const ModalFooter: React.FC<ModalFooterProps> = ({
  onCancel,
  cancelText = "Cancel",
  onSubmit,
  submitText = "Save",
  isLoading = false,
  loadingText,
  disabled = false,
  submitButtonType = "submit",
  variant = "primary",
  children,
  className = "",
}) => {
  return (
    <div className={`modal-footer ${className}`}>
      {children ? (
        children
      ) : (
        <>
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            type={submitButtonType}
            variant={variant}
            onClick={onSubmit}
            isLoading={isLoading}
            loadingText={loadingText}
            disabled={disabled}
            className="min-w-28"
          >
            {submitText}
          </Button>
        </>
      )}
    </div>
  );
};
