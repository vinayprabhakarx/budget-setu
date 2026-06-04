import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
  error?: boolean;
}

export const Select: React.FC<SelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  className = '',
  disabled = false,
  size = 'md',
  error = false,
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = options.find(o => o.value === value);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const isSmall = size === 'sm';

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(prev => !prev)}
        className={`w-full flex items-center justify-between gap-2 bg-bg-surface border rounded-md text-left transition-colors cursor-pointer
          hover:border-brand/60 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand
          disabled:opacity-50 disabled:cursor-not-allowed
          ${error ? 'border-destructive ring-1 ring-destructive/30' : 'border-border'}
          ${open && !error ? 'border-brand ring-1 ring-brand' : ''}
          ${isSmall ? 'px-3 py-1.5 text-body-sm' : 'px-3 py-2.5 text-body-md'}
        `}
      >
        <span className={selected ? 'text-text-primary' : 'text-text-muted'}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          className={`shrink-0 text-text-muted transition-transform duration-150 ${open ? 'rotate-180' : ''} ${isSmall ? 'h-3.5 w-3.5' : 'h-4 w-4'}`}
        />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute z-50 mt-1 w-full min-w-max bg-bg-surface border border-border rounded-md shadow-md overflow-hidden">
          <ul className="max-h-60 overflow-y-auto py-1">
            {options.map(option => {
              const isSelected = option.value === value;
              return (
                <li key={option.value}>
                  <button
                    type="button"
                    onClick={() => { onChange(option.value); setOpen(false); }}
                    className={`w-full flex items-center justify-between gap-3 px-3 py-2 text-left text-body-sm transition-colors cursor-pointer
                      ${isSelected
                        ? 'bg-brand/10 text-brand'
                        : 'text-text-primary hover:bg-bg-subtle'
                      }
                    `}
                  >
                    <span>{option.label}</span>
                    {isSelected && <Check className="h-3.5 w-3.5 shrink-0" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};
