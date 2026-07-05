import React, { useState } from 'react';

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onValueChange?: (value: string, numericValue: number) => void;
}

// Cache the formatter outside the component to prevent lag on every keystroke
const INRCurrencyFormatter = new Intl.NumberFormat('en-IN');

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onChange,
  onValueChange,
  className = '',
  placeholder = '0.00',
  ...props
}) => {
  // Helper to format string in Indian Rupee format (en-IN)
  const formatIndianNumber = (val: string | number): string => {
    if (val === undefined || val === null || val === '') return '';
    const strVal = String(val).replace(/[^0-9.]/g, '');
    if (!strVal) return '';
    
    const parts = strVal.split('.');
    let integerPart = parts[0];
    const decimalPart = parts.length > 1 ? '.' + parts[1] : '';

    if (integerPart !== '') {
      const num = Number(integerPart);
      if (!isNaN(num)) {
        integerPart = INRCurrencyFormatter.format(num);
      }
    }

    return integerPart + decimalPart;
  };

  const [displayValue, setDisplayValue] = useState<string>(() => formatIndianNumber(value));
  const [prevValueProp, setPrevValueProp] = useState(value);

  // Derive state from props during render (React recommended way to avoid effect cascading)
  if (value !== prevValueProp) {
    setPrevValueProp(value);
    setDisplayValue(formatIndianNumber(value));
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^0-9.]/g, '');
    
    // Ensure only one decimal point
    const parts = rawValue.split('.');
    const cleanValue = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : rawValue;

    setDisplayValue(formatIndianNumber(cleanValue));

    if (onChange) {
      const syntheticEvent = {
        ...e,
        target: {
          ...e.target,
          value: cleanValue,
          name: e.target.name || props.name || '',
        },
      } as React.ChangeEvent<HTMLInputElement>;
      onChange(syntheticEvent);
    }

    if (onValueChange) {
      onValueChange(cleanValue, Number(cleanValue) || 0);
    }
  };

  return (
    <div className="input-currency-wrapper w-full">
      <input
        type="text"
        inputMode="decimal"
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        className={`input input-currency ${className}`}
        {...props}
      />
    </div>
  );
};
