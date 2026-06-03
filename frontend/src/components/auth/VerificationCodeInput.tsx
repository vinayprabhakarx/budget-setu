import React from 'react';
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
  return (
    <div>
      <label htmlFor={id} className="block text-body-sm font-semibold text-text-secondary mb-2">
        Verification Code
      </label>
      <div className="relative">
        <input
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="000000"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`input h-16 text-center font-mono !text-3xl md:!text-4xl leading-none font-semibold tracking-widest ${error && !isVerified ? 'input-error' : ''} ${isVerified ? 'bg-bg-disabled border-success text-success' : ''}`}
          disabled={disabled || isVerified}
          required
          autoFocus={autoFocus}
        />
        {isVerified && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-success">
            <CheckCircle className="h-6 w-6" />
          </div>
        )}
      </div>
      {error && !isVerified && (
        <p className="text-destructive text-body-sm mt-2">
          {error}
        </p>
      )}
    </div>
  );
};
