import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { PublicLayout } from '../../components/layout/PublicLayout';
import { MagicLinkState, type MagicLinkStatus } from '../../components/auth/MagicLinkState';
import { useToast } from '../../context/ToastContext';
import api from '../../api/axiosInstance';

export const PasswordResetConfirm: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<MagicLinkStatus>('loading');
  const [verificationCode, setVerificationCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [emailForResend, setEmailForResend] = useState('');
  const [resending, setResending] = useState(false);
  const lastFetchedTokenRef = useRef<string | null>(null);

  useEffect(() => {
    const fetchCode = async () => {
      if (!token) {
        setStatus('invalid');
        return;
      }
      setStatus('loading');
      try {
        const response = await api.get<{ code: string; email: string }>(
          `/auth/reset-password/magic-link?token=${encodeURIComponent(token)}`
        );
        setVerificationCode(response.data.code);
        setEmailForResend(response.data.email);
        setStatus('success');
      } catch (err: unknown) {
        const error = err as {
          response?: {
            status?: number;
            data?: { code?: string; message?: string; email?: string };
          };
        };
        const isExpired =
          error.response?.status === 410 ||
          error.response?.data?.code === 'TOKEN_EXPIRED';
        
        if (isExpired && error.response?.data?.email) {
          setEmailForResend(error.response.data.email);
        }
        setStatus(isExpired ? 'expired' : 'invalid');
      }
    };

    if (token && lastFetchedTokenRef.current !== token) {
      lastFetchedTokenRef.current = token;
      fetchCode();
    }
  }, [token]);


  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(verificationCode);
      setCopied(true);
      showToast('success', 'Verification code copied.');
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('error', 'Unable to copy the code.');
    }
  };

  const handleResend = async () => {
    if (!emailForResend) {
      showToast('error', 'Email address not found.');
      return;
    }
    setResending(true);
    try {
      await api.post('/auth/forgot-password', { email: emailForResend });
      showToast('success', 'Password reset email resent successfully.');
      navigate(`/reset-password?email=${encodeURIComponent(emailForResend)}`);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      const msg = error.response?.data?.message || 'Failed to resend reset email.';
      showToast('error', msg);
    } finally {
      setResending(false);
    }
  };

  return (
    <PublicLayout>
      <div className="flex-grow flex items-center justify-center px-4 py-12 md:py-20">
        <div className="w-full max-w-[27.5rem] text-center space-y-7">

          <MagicLinkState
            status={status}
            codeTitle="Your Reset Code"
            codeDesc="Copy this code and return to the reset page to enter it."
            code={verificationCode}
            copied={copied}
            onCopy={handleCopy}
            expiredDesc={
              <>
                This reset link has expired.{' '}
                If the problem persists, please{' '}
                <Link to="/contact" className="underline text-text-primary hover:text-brand transition-colors">
                  contact support
                </Link>
                .
              </>
            }
            emailForResend={emailForResend}
            onResend={handleResend}
            resending={resending}
            resendLabel="Resend Reset Email"
            onGoToFallback={() => navigate(`/reset-password${emailForResend ? `?email=${encodeURIComponent(emailForResend)}` : ''}`)}
            goToFallbackLabel="Go to Reset Page"
          />

        </div>
      </div>
    </PublicLayout>
  );
};
