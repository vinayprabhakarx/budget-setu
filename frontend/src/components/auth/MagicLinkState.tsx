import React from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Check, Copy } from 'lucide-react';

export type MagicLinkStatus = 'loading' | 'success' | 'expired' | 'invalid';

interface MagicLinkStateProps {
  status: MagicLinkStatus;
  
  // Success state props
  codeTitle?: string;
  codeDesc?: string;
  code?: string;
  copied?: boolean;
  onCopy?: () => void;

  // Expired state props
  expiredDesc?: React.ReactNode;
  emailForResend?: string;
  onResend?: () => void;
  resending?: boolean;
  resendLabel?: string;
  onGoToFallback?: () => void;
  goToFallbackLabel?: string;

  // Invalid state props
  invalidTitle?: string;
  invalidDesc?: React.ReactNode;
}

export const MagicLinkState: React.FC<MagicLinkStateProps> = ({
  status,
  codeTitle = 'Your Code',
  codeDesc = 'Copy this code to proceed.',
  code = '',
  copied = false,
  onCopy,
  expiredDesc,
  emailForResend,
  onResend,
  resending = false,
  resendLabel = 'Resend Link',
  onGoToFallback,
  goToFallbackLabel = 'Go to Page',
  invalidTitle = 'We were unable to verify you with this link',
  invalidDesc = (
    <>
      If the problem persists, please{' '}
      <Link to="/contact" className="underline text-text-primary hover:text-brand transition-colors">
        contact support
      </Link>
      .
    </>
  ),
}) => {
  return (
    <>
      {status === 'loading' && (
        <div className="space-y-4">
          <Loader2 className="h-14 w-14 text-brand animate-spin mx-auto" />
          <div className="space-y-2">
            <h1 className="font-display text-text-primary text-3xl md:text-4xl leading-tight">
              Opening your link
            </h1>
            <p className="text-text-secondary text-body-sm leading-relaxed">
              Please wait a moment…
            </p>
          </div>
        </div>
      )}

      {status === 'success' && (
        <div className="space-y-7">
          <div className="space-y-3">
            <h1 className="font-display text-text-primary text-3xl md:text-4xl leading-tight">
              {codeTitle}
            </h1>
            <p className="text-text-secondary text-body-sm leading-relaxed">
              {codeDesc}
            </p>
          </div>
          <div className="flex flex-col items-center gap-4 w-full">
            <div className="flex items-center justify-center rounded-md border border-border bg-bg-surface px-5 py-3 font-mono text-3xl md:text-4xl leading-none font-semibold text-text-primary shadow-sm">
              {code}
            </div>
            {onCopy && (
              <div className="w-full flex justify-center mt-2">
                <button
                  type="button"
                  onClick={onCopy}
                  className="btn btn-secondary w-fit inline-flex items-center justify-center gap-2 py-2.5 text-base cursor-pointer px-8"
                  aria-label="Copy code"
                >
                  {copied ? <Check className="h-5 w-5 text-success" /> : <Copy className="h-5 w-5" />}
                  <span>{copied ? 'Copied' : 'Copy Code'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {status === 'expired' && (
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="font-display text-text-primary text-3xl md:text-4xl leading-tight">
              Link Expired
            </h1>
            <p className="text-text-secondary text-body-sm leading-relaxed">
              {expiredDesc || invalidDesc}
            </p>
          </div>
          <div className="w-full flex justify-center">
            {emailForResend && onResend ? (
              <button
                type="button"
                onClick={onResend}
                disabled={resending}
                className="btn btn-primary w-fit inline-flex py-3 px-8 items-center justify-center gap-2 cursor-pointer"
              >
                {resending && <Loader2 className="h-5 w-5 animate-spin" />}
                <span>{resending ? 'Resending…' : resendLabel}</span>
              </button>
            ) : onGoToFallback ? (
              <button
                type="button"
                onClick={onGoToFallback}
                className="btn btn-primary w-fit inline-flex py-3 px-8 items-center justify-center cursor-pointer"
              >
                {goToFallbackLabel}
              </button>
            ) : null}
          </div>
        </div>
      )}

      {status === 'invalid' && (
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="font-display text-text-primary text-3xl md:text-4xl leading-tight">
              {invalidTitle}
            </h1>
            <p className="text-text-secondary text-body-sm leading-relaxed">
              {invalidDesc}
            </p>
          </div>
        </div>
      )}
    </>
  );
};
