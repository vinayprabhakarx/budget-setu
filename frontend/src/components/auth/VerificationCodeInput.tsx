import React, { useRef } from 'react';
import type { KeyboardEvent, ClipboardEvent } from 'react';
import { CheckCircle } from 'lucide-react';

interface VerificationCodeInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  isVerified?: boolean;
  autoFocus?: boolean;
}

export const VerificationCodeInput: React.FC<VerificationCodeInputProps> = ({
  id,
  value,
  onChange,
  error,
  disabled,
  isVerified,
  autoFocus,
}) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Ensure value is always exactly 6 characters for the controlled inputs
  const safeValue = (value || '').padEnd(6, ' ').slice(0, 6);

  const handleInput = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    
    if (!val) {
      // If it becomes empty, update parent with a space at this position
      const newValue = safeValue.substring(0, index) + ' ' + safeValue.substring(index + 1);
      onChange(newValue);
      return;
    }
    
    // Grab just the last character if they somehow typed more
    const char = val.slice(-1);
    
    const newValue = safeValue.substring(0, index) + char + safeValue.substring(index + 1);
    onChange(newValue);

    // Auto-advance
    if (index < 5 && inputRefs.current[index + 1]) {
      // Use setTimeout to allow React to update state and DOM before focus triggers onFocus
      setTimeout(() => {
        inputRefs.current[index + 1]?.focus();
      }, 0);
    }
  };

  const handleFocus = (index: number) => {
    // Read directly from DOM to bypass React's async state delay during programmatic focus
    const currentString = inputRefs.current.map(el => el?.value || ' ').join('');
    let activeIndex = currentString.indexOf(' ');
    
    // If all boxes are filled, the active box is the very last one
    if (activeIndex === -1) {
      activeIndex = 5;
    }
    
    // STRICT MODE: If they try to click ANY box that is not the active box, instantly snap them to the active box.
    // This forces them to use Backspace to move backward, and prevents jumping forward.
    if (index !== activeIndex && inputRefs.current[activeIndex]) {
      inputRefs.current[activeIndex]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      
      const isCurrentBoxEmpty = safeValue[index] === ' ';
      
      if (isCurrentBoxEmpty) {
        // If empty, move back and delete the previous box's content
        if (index > 0) {
          const newValue = safeValue.substring(0, index - 1) + ' ' + safeValue.substring(index);
          onChange(newValue);
          // Use setTimeout so React can update the DOM before the strict handleFocus checks it
          setTimeout(() => {
            inputRefs.current[index - 1]?.focus();
          }, 0);
        }
      } else {
        // If not empty, just delete current box
        const newValue = safeValue.substring(0, index) + ' ' + safeValue.substring(index + 1);
        onChange(newValue);
      }
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData) {
      onChange(pastedData);
      // Use setTimeout to allow React to update state and DOM before focus triggers onFocus
      setTimeout(() => {
        const nextIndex = Math.min(pastedData.length, 5);
        inputRefs.current[nextIndex]?.focus();
      }, 0);
    }
  };

  return (
    <div>
      <label htmlFor={`${id}-0`} className="block text-body-sm font-semibold text-text-secondary mb-2">
        Verification Code
      </label>
      <div className="relative">
        <div className="flex gap-2 justify-center">
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <input
              key={index}
              ref={(el) => { inputRefs.current[index] = el; }}
              id={`${id}-${index}`}
              type="text"
              inputMode="numeric"
              autoComplete={index === 0 ? "one-time-code" : "off"}
              maxLength={1}
              value={safeValue[index] !== ' ' ? safeValue[index] : ''}
              onChange={(e) => handleInput(index, e)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              onFocus={() => handleFocus(index)}
              className={`input w-10 h-12 md:w-12 md:h-14 px-1 text-center font-mono! text-3xl! md:text-4xl! leading-none font-semibold text-text-primary ${
                error && !isVerified ? 'input-error' : ''
              } ${isVerified ? 'bg-bg-disabled border-success text-success' : ''}`}
              disabled={disabled || isVerified}
              autoFocus={index === 0 && autoFocus}
            />
          ))}
        </div>
        
        {isVerified && (
          <div className="absolute -right-2 top-1/2 -translate-y-1/2 text-success translate-x-full">
            <CheckCircle className="h-6 w-6" />
          </div>
        )}
      </div>
      {error && !isVerified && (
        <p className="text-destructive text-body-sm mt-2 text-center">
          {error}
        </p>
      )}
    </div>
  );
};
