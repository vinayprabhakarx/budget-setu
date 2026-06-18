import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { PublicLayout } from '../../components/layout/PublicLayout';
import { useToast } from '../../context/ToastContext';
import { validatePassword, validateEmail } from '../../utils/validation';
import { VerificationCodeInput } from '../../components/auth/VerificationCodeInput';
import { ResendLink } from '../../components/auth/ResendLink';
import api from '../../api/axiosInstance';

export const PasswordReset: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [emailInput, setEmailInput] = useState(searchParams.get('email') || '');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [isVerified, setIsVerified] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const handleEmailBlur = () => {
    const err = validateEmail(emailInput);
    setEmailError(err || '');
  };

  const handlePasswordBlur = () => {
    const err = validatePassword(password);
    setPasswordError(err || '');
  };

  const handleConfirmPasswordBlur = () => {
    if (confirmPassword && password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
    } else if (!confirmPassword) {
      setConfirmPasswordError('');
    } else {
      setConfirmPasswordError('');
    }
  };

  const handleCodeChange = (value: string) => {
    setCode(value.replace(/\D/g, '').slice(0, 6));
    setError('');
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) {
      setError('Email address is required');
      return;
    }
    if (code.length !== 6) {
      setError('Enter the complete 6-digit verification code');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await api.post('/auth/reset-password/verify-code', {
        email: emailInput.trim(),
        code
      });
      setIsVerified(true);
      showToast('success', 'Verification code accepted. Please enter your new password.');
    } catch (err: unknown) {
      console.error(err);
      const apiError = err as { response?: { data?: { message?: string } } };
      const message = apiError.response?.data?.message || 'Invalid or expired verification code.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password) {
      setError('Password is required');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        email: emailInput.trim(),
        code,
        password
      });
      showToast('success', 'Password reset successfully. Please sign in with your new password.');
      navigate('/login');
    } catch (err: unknown) {
      console.error(err);
      const apiError = err as { response?: { data?: { message?: string } } };
      const message = apiError.response?.data?.message || 'Failed to reset password. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!emailInput.trim()) {
      showToast('error', 'Email is required to resend reset code.');
      return;
    }
    setResendLoading(true);
    setError('');
    try {
      await api.post('/auth/forgot-password', {
        email: emailInput.trim()
      });
      showToast('success', 'Password reset link and code sent.');
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
      const message = apiError.response?.data?.message || 'Failed to resend reset link.';
      setError(message);
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
                Reset Password
              </h1>
              <p className="text-text-secondary text-body-sm leading-relaxed">
                {isVerified 
                  ? 'Please set a secure new password for your account.' 
                  : `Enter the 6-digit verification code sent to your email.`
                }
              </p>
            </div>
          </div>

          <form onSubmit={isVerified ? handleResetPassword : handleVerifyCode} className="space-y-5">
            {!searchParams.get('email') && !isVerified && (
              <div>
                <label htmlFor="reset-email-address" className="block text-body-sm font-semibold text-text-secondary mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                    <Mail className="h-5 w-5" />
                  </div>
                  <input
                    id="reset-email-address"
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
              id="reset-verification-code"
              value={code}
              onChange={handleCodeChange}
              error={error && !isVerified ? error : undefined}
              disabled={loading || isVerified}
              isVerified={isVerified}
              autoFocus={!isVerified}
            />

            {isVerified && (
              <div className="space-y-5 animate-fade-in">
                <div>
                  <label htmlFor="new-password" className="block text-body-sm font-semibold text-text-secondary mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                      <Lock className="h-5 w-5" />
                    </div>
                    <input
                      id="new-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setPasswordError('');
                      }}
                      onBlur={handlePasswordBlur}
                      className={`input !pl-10 !pr-10 ${passwordError ? 'input-error' : ''}`}
                      disabled={loading}
                      required
                      autoFocus
                    />
                    {password.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    )}
                  </div>
                  {passwordError && (
                    <p className="text-destructive text-body-sm mt-1">{passwordError}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="confirm-new-password" className="block text-body-sm font-semibold text-text-secondary mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                      <Lock className="h-5 w-5" />
                    </div>
                    <input
                      id="confirm-new-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setConfirmPasswordError('');
                      }}
                      onBlur={handleConfirmPasswordBlur}
                      className={`input !pl-10 !pr-10 ${confirmPasswordError ? 'input-error' : ''}`}
                      disabled={loading}
                      required
                    />
                    {confirmPassword.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    )}
                  </div>
                  {confirmPasswordError && (
                    <p className="text-destructive text-body-sm mt-1">{confirmPasswordError}</p>
                  )}
                </div>
                
                {error && (
                  <p className="text-destructive text-body-sm mt-2">
                    {error}
                  </p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || (!isVerified && code.length !== 6)}
              className="btn btn-primary w-full py-3 mt-2 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>
                {loading 
                  ? (isVerified ? 'Resetting...' : 'Verifying...') 
                  : (isVerified ? 'Reset Password' : 'Verify Code')
                }
              </span>
            </button>
          </form>

          {!isVerified && (
            <div className="space-y-4 text-center">
              <ResendLink
                label="Didn't receive code?"
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
          )}
        </div>
      </div>
    </PublicLayout>
  );
};
