import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Mail } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { PublicLayout } from '../../components/layout/PublicLayout';
import { VerificationCodeInput } from '../../components/auth/VerificationCodeInput';
import { ResendLink } from '../../components/auth/ResendLink';
import api from '../../api/axiosInstance';
import { validateEmail } from '../../utils/validation';

export const EmailVerification: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [emailInput, setEmailInput] = useState(searchParams.get('email') || '');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const handleEmailBlur = () => {
    const err = validateEmail(emailInput);
    setEmailError(err || '');
  };

  const handleCodeChange = (value: string) => {
    setCode(value.replace(/\D/g, '').slice(0, 6));
    setError('');
  };

  const handleSubmit = async (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!emailInput.trim()) {
      setError('Email address is required');
      return;
    }

    if (code.length !== 6) {
      setError('Enter the complete 6-digit verification code');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/verify-email', {
        email: emailInput.trim(),
        code
      });
      showToast('success', 'Email verification code accepted.');
      navigate('/verify-email/confirm');
    } catch (err: unknown) {
      console.error(err);
      const apiError = err as { response?: { data?: { message?: string } } };
      const message = apiError.response?.data?.message || 'Invalid or expired verification code.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!emailInput.trim()) {
      showToast('error', 'Email is required to resend verification.');
      return;
    }
    setResendLoading(true);
    try {
      await api.post('/auth/resend-verification', {
        email: emailInput.trim()
      });
      showToast('success', 'Verification email resent.');
      let seconds = 30;
      setResendCooldown(seconds);
      const interval = window.setInterval(() => {
        seconds -= 1;
        setResendCooldown(seconds);
        if (seconds <= 0) window.clearInterval(interval);
      }, 1000);
    } catch (err: unknown) {
      console.error(err);
      const apiError = err as { response?: { data?: { message?: string } } };
      const message = apiError.response?.data?.message || 'Failed to resend verification.';
      showToast('error', message);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <PublicLayout>
      <div className="grow flex items-center justify-center px-4 py-12 md:py-20">
        <div className="card w-full max-w-110 p-8 space-y-7">
          <div className="text-center space-y-3">
            <div className="space-y-2">
              <h1 className="font-display text-text-primary text-3xl md:text-4xl leading-tight">
                Verify Your Email
              </h1>
              <p className="text-text-secondary text-body-sm leading-relaxed">
                Check your inbox at{' '}
                <span className="font-semibold text-text-primary">
                  {emailInput || 'your email'}
                </span>
                {' '}for the verification code.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!searchParams.get('email') && (
              <div>
                <label htmlFor="email-address" className="block text-body-sm font-semibold text-text-secondary mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                    <Mail className="h-5 w-5" />
                  </div>
                  <input
                    id="email-address"
                    type="email"
                    placeholder="arjun@example.com"
                    value={emailInput}
                    onChange={(event) => {
                      setEmailInput(event.target.value);
                      setEmailError('');
                    }}
                    onBlur={handleEmailBlur}
                    className={`input !pl-10 animate-fade-in ${emailError ? 'input-error' : ''}`}
                    disabled={loading}
                    required
                  />
                </div>
                {emailError && (
                  <p className="text-destructive text-body-sm mt-1">{emailError}</p>
                )}
              </div>
            )}

            <VerificationCodeInput
              id="verification-code"
              value={code}
              onChange={handleCodeChange}
              error={error}
              disabled={loading}
              autoFocus
            />

            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="btn btn-primary w-full py-3"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? 'Verifying...' : 'Verify Email'}
            </button>
          </form>

          <div className="space-y-4 text-center">
            <ResendLink
              label="Didn't receive it?"
              onResend={handleResend}
              resendLoading={resendLoading}
              resendCooldown={resendCooldown}
            />
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-text-secondary hover:text-brand text-body-sm font-medium transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};
