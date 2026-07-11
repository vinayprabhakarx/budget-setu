import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import { Button } from "./Button";

export interface DropdownItem {
  /** Unique identifier for the item */
  id: string | number;
  /** Primary label displayed for the menu item */
  label: React.ReactNode;
  /** Optional leading icon */
  icon?: React.ReactNode;
  /** Optional secondary description text below the label */
  description?: string;
  /** Action handler when clicking this item */
  onClick?: () => void;
  /** Whether the item is disabled */
  disabled?: boolean;
  /** Visual variant ('default' or 'danger' for destructive actions) */
  variant?: "default" | "danger";
  /** Whether to render a horizontal divider immediately after this item */
  dividerAfter?: boolean;
}

export interface DropdownProps {
  /** Optional custom trigger element. If omitted, renders a standardized Button with `label` */
  trigger?: React.ReactNode;
  /** Text label for default trigger button */
  label?: string;
  /** List of dropdown menu items */
  items: DropdownItem[];
  /** Popover alignment relative to trigger ('left' | 'right') */
  align?: "left" | "right";
  /** Button variant when using default trigger */
  triggerVariant?: "primary" | "secondary" | "ghost" | "outline" | "subtle";
  /** Button size when using default trigger (default md = 42px height) */
  triggerSize?: "sm" | "md" | "lg";
  /** Additional custom class names for the container */
  className?: string;
  /** Optional width class for the popover menu (defaults to 'w-56') */
  menuClassName?: string;
}

/**
 * Dropdown
 *
 * Standardized, accessible floating Dropdown Menu component for BudgetSetu.
 * Renders the menu via createPortal into document.body so it is never clipped
 * by parent overflow or stacking contexts. Supports rich action items,
 * descriptions, destructive variants, dividers, keyboard escape dismissal,
 * and click-outside closing.
 */
export const Dropdown: React.FC<DropdownProps> = ({
  trigger,
  label = "Options",
  items,
  align = "left",
  triggerVariant = "secondary",
  triggerSize = "md",
  className = "",
  menuClassName = "w-56",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuId = React.useId();

  const updateMenuPosition = React.useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setMenuStyle({
      position: "fixed",
      top: rect.bottom + 4,
      left: align === "right" ? undefined : rect.left,
      right: align === "right" ? window.innerWidth - rect.right : undefined,
      zIndex: 9999,
    });
  }, [align]);

  useEffect(() => {
    if (!isOpen) return;
    updateMenuPosition();

    const handleClickOutside = (event: MouseEvent) => {
      const menu = document.getElementById(`dropdown-menu-${menuId}`);
      if (
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node) &&
        !(menu && menu.contains(event.target as Node))
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    const handleScroll = () => updateMenuPosition();
    const handleResize = () => updateMenuPosition();

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleResize);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleResize);
    };
  }, [isOpen, menuId, updateMenuPosition]);

  const toggleDropdown = () => {
    if (!isOpen) updateMenuPosition();
    setIsOpen((prev) => !prev);
  };

  const handleItemClick = (item: DropdownItem) => {
    if (item.disabled) return;
    setIsOpen(false);
    item.onClick?.();
  };

  const dropdownMenu = isOpen && (
    <div
      id={`dropdown-menu-${menuId}`}
      style={menuStyle}
      className={`${menuClassName} rounded-lg border border-border bg-bg-surface/95 backdrop-blur-md shadow-xl py-1.5 animate-in fade-in zoom-in-95 duration-150`}
      role="menu"
      aria-orientation="vertical"
    >
      {items.map((item) => (
        <React.Fragment key={item.id}>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              handleItemClick(item);
            }}
            disabled={item.disabled}
            role="menuitem"
            className={`w-full text-left px-3.5 py-2.5 flex items-start gap-2.5 transition-colors ${
              item.disabled
                ? "opacity-40 cursor-not-allowed text-text-muted"
                : item.variant === "danger"
                ? "text-error hover:bg-error/10 cursor-pointer"
                : "text-text-primary hover:bg-bg-subtle cursor-pointer"
            }`}
          >
            {item.icon && (
              <span
                className={`mt-0.5 shrink-0 h-4 w-4 ${
                  item.variant === "danger"
                    ? "text-error"
                    : "text-text-secondary"
                }`}
              >
                {item.icon}
              </span>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-body-sm font-medium leading-tight truncate">
                {item.label}
              </div>
              {item.description && (
                <div className="text-caption text-text-secondary mt-0.5 leading-snug">
                  {item.description}
                </div>
              )}
            </div>
          </button>
          {item.dividerAfter && (
            <div className="my-1 border-t border-border/60" />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <div ref={triggerRef} className={`relative inline-block text-left ${className}`}>
      {/* Trigger */}
      <div onClick={toggleDropdown} className="cursor-pointer select-none">
        {trigger ? (
          trigger
        ) : (
          <Button
            type="button"
            variant={triggerVariant}
            size={triggerSize}
            rightIcon={
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-200 ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            }
          >
            {label}
          </Button>
        )}
      </div>

      {typeof document !== "undefined" && createPortal(dropdownMenu, document.body)}
    </div>
  );
};
