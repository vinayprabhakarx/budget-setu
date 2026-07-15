import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  label?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  size?: "sm" | "md";
  error?: string | boolean;
  helperText?: React.ReactNode;
}

export const Select: React.FC<SelectProps> = ({
  value,
  onChange,
  options,
  placeholder = "Select...",
  label,
  className = "",
  disabled = false,
  size = "md",
  error = false,
  helperText,
}) => {
  const [open, setOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const selectedItemRef = useRef<HTMLLIElement>(null);
  const generatedId = React.useId();

  const selected = options.find((o) => o.value === value);

  // Position the portal dropdown relative to the trigger button
  const updateDropdownPosition = () => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setDropdownStyle({
      position: "fixed",
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      minWidth: rect.width,
      zIndex: 9999,
    });
  };

  useEffect(() => {
    if (!open) return;
    updateDropdownPosition();

    const handleScroll = () => updateDropdownPosition();
    const handleResize = () => updateDropdownPosition();
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleResize);
    };
  }, [open]);

  useEffect(() => {
    if (open && listRef.current && selectedItemRef.current) {
      const list = listRef.current;
      const item = selectedItemRef.current;
      const itemOffset = item.offsetTop;
      list.scrollTop = itemOffset - (list.clientHeight / 2) + (item.clientHeight / 2);
    }
  }, [open]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        // Also check if the click is inside the portal dropdown
        const dropdown = document.getElementById(`select-dropdown-${generatedId}`);
        if (dropdown && dropdown.contains(e.target as Node)) return;
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [generatedId]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const isSmall = size === "sm";

  const dropdownMenu = open && (
    <div
      id={`select-dropdown-${generatedId}`}
      style={dropdownStyle}
      className="border border-border rounded-md shadow-2xl overflow-hidden bg-bg-surface"
    >
      <ul ref={listRef} className="max-h-60 overflow-y-auto py-1 relative">
        {options.map((option) => {
          const isSelected = option.value === value;
          return (
            <li key={option.value} ref={isSelected ? selectedItemRef : null}>
              <button
                type="button"
                onMouseDown={(e) => {
                  // Use onMouseDown to fire before the blur/outside-click handler
                  e.preventDefault();
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 text-left text-body-sm transition-colors cursor-pointer
                  ${
                    isSelected
                      ? "bg-brand/10 text-brand font-medium"
                      : "text-text-primary hover:bg-bg-subtle"
                  }
                `}
              >
                <span>{option.label}</span>
                {isSelected && <Check className="h-4 w-4 shrink-0" />}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );

  return (
    <div ref={containerRef} className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={generatedId}
          className="block text-body-sm font-medium text-text-secondary"
        >
          {label}
        </label>
      )}
      <button
        ref={buttonRef}
        id={generatedId}
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!open) updateDropdownPosition();
          setOpen((prev) => !prev);
        }}
        className={`w-full flex items-center justify-between gap-2 bg-bg-surface border rounded-md text-left transition-colors cursor-pointer
          hover:border-brand/60 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand
          disabled:opacity-50 disabled:cursor-not-allowed
          ${error ? "border-destructive ring-1 ring-destructive/30" : "border-border"}
          ${open && !error ? "border-brand ring-1 ring-brand" : ""}
          ${isSmall ? "px-3 py-1.5 text-body-sm h-control-sm min-h-control-sm" : "px-3.5 text-body-md h-control-md min-h-control-md"}
        `}
      >
        <span className={selected ? "text-text-primary truncate" : "text-text-muted truncate"}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          className={`shrink-0 text-text-muted transition-transform duration-150 ${open ? "rotate-180" : ""} ${isSmall ? "h-3.5 w-3.5" : "h-4 w-4"}`}
        />
      </button>

      {typeof document !== "undefined" && createPortal(dropdownMenu, document.body)}

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
};
