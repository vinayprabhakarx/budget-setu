import React, { useState } from 'react';

interface MaskedDateInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: string; // YYYY-MM-DD format
  onChange: (value: string) => void;
}

export const MaskedDateInput: React.FC<MaskedDateInputProps> = ({ 
  value, 
  onChange, 
  className = '', 
  ...props 
}) => {
  // Convert YYYY-MM-DD to DD/MM/YYYY for display
  const toDisplay = (val: string) => {
    if (!val) return '';
    const parts = val.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`; // DD/MM/YYYY
    }
    return val;
  };

  // React recommended derived-state pattern:
  // Store the prop value we last synced from so we can detect external changes.
  const [prevPropValue, setPrevPropValue] = useState(value);
  const [displayValue, setDisplayValue] = useState(toDisplay(value));

  // When the parent changes the controlled value from outside (e.g. form reset),
  // update display state during render — the safe React pattern for derived state.
  if (value !== prevPropValue) {
    setPrevPropValue(value);
    setDisplayValue(toDisplay(value));
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    
    // Handle backspace properly if user deletes a slash
    if (displayValue.endsWith('/') && rawValue.length < displayValue.length) {
       const newVal = rawValue.slice(0, -1);
       setDisplayValue(newVal);
       if (newVal.replace(/\D/g, '').length === 0) onChange('');
       return;
    }

    // Keep only numbers
    const numbersOnly = rawValue.replace(/\D/g, '');
    
    // Mask as DD/MM/YYYY
    let masked = numbersOnly;
    if (numbersOnly.length > 2) {
      masked = `${numbersOnly.substring(0, 2)}/${numbersOnly.substring(2)}`;
    }
    if (numbersOnly.length > 4) {
      masked = `${masked.substring(0, 5)}/${numbersOnly.substring(4, 8)}`;
    }

    setDisplayValue(masked);

    // If fully valid 8-digit date, update the parent state
    if (numbersOnly.length === 8) {
      const d = numbersOnly.substring(0, 2);
      const m = numbersOnly.substring(2, 4);
      const y = numbersOnly.substring(4, 8);
      onChange(`${y}-${m}-${d}`);
    } else if (numbersOnly.length === 0) {
      onChange(''); // clear state when fully empty
    }
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      value={displayValue}
      onChange={handleChange}
      placeholder="DD/MM/YYYY"
      maxLength={10}
      className={`input ${className}`}
      {...props}
    />
  );
};
