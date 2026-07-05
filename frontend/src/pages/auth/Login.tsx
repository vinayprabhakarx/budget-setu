import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
} from "lucide-react";
import { PublicLayout } from "../../components/layout/PublicLayout";
import { validatePassword, validateEmail } from "../../utils/validation";

export const Login: React.FC = () => {
  const { login, register, forgotPassword } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const isRegistering = location.pathname === "/register";
  const setIsRegistering = (value: boolean) => {
    if (value) {
      navigate("/register" + location.search, { replace: true });
    } else {
      navigate("/login" + location.search, { replace: true });
    }
  };

  const [isRecovering, setIsRecovering] = useState(
    location.state?.recover ||
      new URLSearchParams(location.search).get("recover") === "true",
  );
  const [recoverySent, setRecoverySent] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleEmailBlur = () => {
    const err = validateEmail(email);
    setFieldErrors((prev) => ({ ...prev, email: err || "" }));
  };

  const handlePasswordBlur = () => {
    const err = validatePassword(password);
    setFieldErrors((prev) => ({ ...prev, password: err || "" }));
  };

  const handleConfirmPasswordBlur = () => {
    if (confirmPassword && password !== confirmPassword) {
      setFieldErrors((prev) => ({
        ...prev,
        confirmPassword: "Passwords do not match",
      }));
    } else {
      setFieldErrors((prev) => ({ ...prev, confirmPassword: "" }));
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (isRegistering && !fullName.trim())
      errs.fullName = "Full Name is required";
    if (!email.trim()) {
      errs.email = "Email address is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errs.email = "Email format is invalid";
    }
    if (!isRecovering) {
      if (!password) {
        errs.password = "Password is required";
      } else if (password.length < 6) {
        errs.password = "Password must be at least 6 characters";
      }
      if (isRegistering) {
        if (!confirmPassword) {
          errs.confirmPassword = "Confirm Password is required";
        } else if (confirmPassword !== password) {
          errs.confirmPassword = "Passwords do not match";
        }
        if (!acceptedTerms) {
          errs.acceptedTerms =
            "You must agree to the Terms of Service and Privacy Policy to create an account";
        }
      }
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      if (isRecovering) {
        const message = await forgotPassword(email);
        showToast(
          "success",
          message || "If this email is registered, a reset link has been sent.",
        );
        navigate(`/reset-password?email=${encodeURIComponent(email)}`);
        return;
      } else if (isRegistering) {
        await register(fullName, email, password);
        showToast(
          "success",
          "Registration successful! Please verify your email.",
        );
        navigate(`/verify-email?email=${encodeURIComponent(email)}`);
        return;
      } else {
        await login(email, password);
        showToast("success", "Logged in successfully.");
      }
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      const apiError = err as {
        response?: { status?: number; data?: { message?: string } };
      };
      if (isRecovering) {
        const msg =
          apiError.response?.data?.message ||
          "Unable to send the reset link. Please try again.";
        showToast("error", msg);
      } else if (apiError.response?.status === 401) {
        showToast("error", "Invalid email or password.");
      } else if (apiError.response?.status === 409) {
        showToast("warning", "Email is already registered.");
      } else if (apiError.response?.data?.message) {
        const msg = apiError.response.data.message;
        if (msg.includes("Email is not verified")) {
          showToast("warning", "Please verify your email address to log in.");
          navigate(`/verify-email?email=${encodeURIComponent(email)}`);
        } else {
          showToast("error", msg);
        }
      } else {
        showToast("error", "An unexpected authentication error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicLayout>
      <div className="grow flex items-center justify-center py-12 md:py-20 px-4">
        <div className="card w-full max-w-105 p-8 space-y-6">
          <div className="text-center space-y-2">
            <h1 className="font-display text-text-primary text-3xl md:text-4xl leading-tight flex items-center justify-center gap-2">
              BudgetSetu
            </h1>
            <p className="text-text-secondary text-body-sm">
              {isRecovering
                ? recoverySent
                  ? "Password reset instructions requested"
                  : "Enter your email to receive a reset link"
                : isRegistering
                  ? "Create your account to get started"
                  : "Sign in to access your dashboard"}
            </p>
          </div>

          {recoverySent ? (
            <div className="space-y-6 text-center">
              <CheckCircle2 className="h-10 w-10 text-success mx-auto" />
              <p className="text-text-secondary text-body-sm leading-relaxed">
                If{" "}
                <span className="font-semibold text-text-primary">{email}</span>{" "}
                is registered, a password reset link has been sent.
              </p>
              <button
                type="button"
                onClick={() => {
                  setIsRecovering(false);
                  setRecoverySent(false);
                  setFieldErrors({});
                }}
                className="btn btn-secondary w-full py-3 flex items-center justify-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Sign In
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegistering && (
                <div>
                  <label className="block text-body-sm font-semibold text-text-secondary mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                      <User className="h-5 w-5" />
                    </div>
                    <input
                      type="text"
                      placeholder="Arjun Sharma"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      autoComplete="name"
                      className={`input pl-10! ${fieldErrors.fullName ? "input-error" : ""}`}
                      disabled={loading}
                    />
                  </div>
                  {fieldErrors.fullName && (
                    <p className="text-destructive text-body-sm mt-1">
                      {fieldErrors.fullName}
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-body-sm font-semibold text-text-secondary mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                    <Mail className="h-5 w-5" />
                  </div>
                  <input
                    type="email"
                    placeholder="arjun@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setFieldErrors((prev) => ({ ...prev, email: "" }));
                    }}
                    onBlur={handleEmailBlur}
                    autoComplete="email"
                    className={`input pl-10! ${fieldErrors.email ? "input-error" : ""}`}
                    disabled={loading}
                  />
                </div>
                {fieldErrors.email && (
                  <p className="text-destructive text-body-sm mt-1">
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              {!isRecovering && (
                <>
                  <div>
                    <label className="block text-body-sm font-semibold text-text-secondary mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                        <Lock className="h-5 w-5" />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onBlur={handlePasswordBlur}
                        autoComplete={
                          isRegistering ? "new-password" : "current-password"
                        }
                        className={`input pl-10! pr-10! ${fieldErrors.password ? "input-error" : ""}`}
                        disabled={loading}
                      />
                      {password.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      )}
                    </div>
                    {fieldErrors.password && (
                      <p className="text-destructive text-body-sm mt-1">
                        {fieldErrors.password}
                      </p>
                    )}
                  </div>

                  {isRegistering && (
                    <div>
                      <label className="block text-body-sm font-semibold text-text-secondary mb-1">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                          <Lock className="h-5 w-5" />
                        </div>
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          onBlur={handleConfirmPasswordBlur}
                          autoComplete="new-password"
                          className={`input pl-10! pr-10! ${fieldErrors.confirmPassword ? "input-error" : ""}`}
                          disabled={loading}
                        />
                        {confirmPassword.length > 0 && (
                          <button
                            type="button"
                            onClick={() =>
                              setShowConfirmPassword(!showConfirmPassword)
                            }
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-5 w-5" />
                            ) : (
                              <Eye className="h-5 w-5" />
                            )}
                          </button>
                        )}
                      </div>
                      {fieldErrors.confirmPassword && (
                        <p className="text-destructive text-body-sm mt-1">
                          {fieldErrors.confirmPassword}
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}

              {isRegistering && !isRecovering && (
                <div>
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(e) => {
                        setAcceptedTerms(e.target.checked);
                        setFieldErrors((prev) => ({
                          ...prev,
                          acceptedTerms: "",
                        }));
                      }}
                      disabled={loading}
                      className="mt-0.5 h-4 w-4 shrink-0 accent-brand cursor-pointer"
                    />
                    <span className="text-body-sm text-text-secondary leading-relaxed">
                      I agree to the{" "}
                      <Link
                        to="/terms"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand hover:text-brand-hover font-medium transition-colors"
                      >
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link
                        to="/privacy"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand hover:text-brand-hover font-medium transition-colors"
                      >
                        Privacy Policy
                      </Link>
                    </span>
                  </label>
                  {fieldErrors.acceptedTerms && (
                    <p className="text-destructive text-body-sm mt-1">
                      {fieldErrors.acceptedTerms}
                    </p>
                  )}
                </div>
              )}

              {!isRegistering && !isRecovering && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setIsRecovering(true);
                      setFieldErrors({});
                    }}
                    className="text-brand hover:text-brand-hover text-body-sm font-medium transition-colors cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full py-3 mt-2 flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    {isRecovering
                      ? "Sending reset link..."
                      : isRegistering
                        ? "Creating account..."
                        : "Signing in..."}
                  </>
                ) : isRecovering ? (
                  "Send Reset Link"
                ) : isRegistering ? (
                  "Create Account"
                ) : (
                  "Sign In"
                )}
              </button>
            </form>
          )}

          {!recoverySent && (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  if (isRecovering) {
                    setIsRecovering(false);
                  } else {
                    setIsRegistering(!isRegistering);
                  }
                  setConfirmPassword("");
                  setFieldErrors({});
                }}
                className="text-brand hover:text-brand-hover text-body-sm font-medium transition-colors cursor-pointer"
              >
                {isRecovering
                  ? "Back to Sign In"
                  : isRegistering
                    ? "Already have an account? Sign In"
                    : "Don't have an account? Sign Up"}
              </button>
            </div>
          )}
        </div>
      </div>
    </PublicLayout>
  );
};
