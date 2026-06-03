import React from 'react';
import { Loader2 } from 'lucide-react';

interface ResendLinkProps {
  label?: string;
  onResend: () => void;
  resendLoading: boolean;
  resendCooldown: number;
}

export const ResendLink: React.FC<ResendLinkProps> = ({
  label = "Didn't receive it?",
  onResend,
  resendLoading,
  resendCooldown,
}) => {
  return (
    <p className="text-text-secondary text-body-sm">
      {label}{' '}
      {resendCooldown > 0 ? (
        <span className="text-text-disabled">Resend in {resendCooldown}s</span>
      ) : (
        <button
          type="button"
          onClick={onResend}
          disabled={resendLoading}
          className="inline-flex items-center gap-1 font-medium text-brand hover:underline disabled:opacity-50 transition-opacity cursor-pointer"
        >
          {resendLoading && <Loader2 className="h-3 w-3 animate-spin" />}
          {resendLoading ? 'Sending...' : 'Resend email'}
        </button>
      )}
    </p>
  );
};
