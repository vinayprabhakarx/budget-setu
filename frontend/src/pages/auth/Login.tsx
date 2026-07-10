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
import { useGoogleLogin } from "@react-oauth/google";
import { GoogleLogo } from "../../components/shared/GoogleLogo";
import { PublicLayout } from "../../components/layout/PublicLayout";
import {
  validatePassword,
  validateEmail,
  validateName,
} from "../../utils/validation";

const PasswordStrengthMeter = ({ password }: { password: string }) => {
  const requirements = [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "One uppercase letter", met: /[A-Z]/.test(password) },
    { label: "One lowercase letter", met: /[a-z]/.test(password) },
    { label: "One number", met: /\d/.test(password) },
    {
      label: "One special character",
      met: /[!@#$%^&*(),.?":{}|<>\-_]/.test(password),
    },
  ];

  return (
    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
      {requirements.map((req, idx) => (
        <div
          key={idx}
          className={`flex items-center gap-2 text-body-sm transition-colors ${req.met ? "text-success" : "text-text-muted"}`}
        >
          {req.met ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <div className="h-4 w-4 rounded-full border border-current opacity-40 shrink-0" />
          )}
          <span className="truncate">{req.label}</span>
        </div>
      ))}
    </div>
  );
};

export const Login: React.FC = () => {
  const { login, register, forgotPassword, googleLogin } = useAuth();
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
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // All 5 password requirements must be met before allowing register submit
  const passwordMeetsAllCriteria =
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password) &&
    /[!@#$%^&*(),.?":{}|<>\-_]/.test(password);

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

  const handleGoogleSuccess = async (tokenResponse: {
    access_token?: string;
  }) => {
    if (tokenResponse.access_token) {
      setLoading(true);
      try {
        await googleLogin(tokenResponse.access_token);
        showToast("success", "Successfully logged in with Google!");
        navigate("/dashboard", { replace: true });
      } catch (err: unknown) {
        const apiError = err as {
          response?: { data?: { message?: string } };
        };
        const msg =
          apiError.response?.data?.message ||
          "Google login failed. Please try again.";
        showToast("error", msg);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleGoogleError = () => {
    showToast("error", "Google login failed. Please try again.");
  };

  const loginWithGoogle = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: handleGoogleError,
  });

  return (
    <PublicLayout>
      <div className="grow flex items-center justify-center py-2 px-4">
        <div className="card w-full max-w-120 p-5 sm:p-6 space-y-3">
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
            <>
              {!isRecovering && (
                <>
                  <div className="flex justify-center mb-4">
                    <button
                      type="button"
                      onClick={() => loginWithGoogle()}
                      className="btn btn-primary w-full py-3 flex items-center justify-center gap-2 transition-colors"
                    >
                      <GoogleLogo className="w-5 h-5" />
                      {isRegistering
                        ? "Sign up with Google"
                        : "Sign in with Google"}
                    </button>
                  </div>

                  <div className="relative mb-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border-color"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-surface text-text-muted">
                        Or
                      </span>
                    </div>
                  </div>
                </>
              )}
              <form onSubmit={handleSubmit} className="space-y-3">
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
                        onChange={(e) => {
                          const val = e.target.value;
                          setFullName(val);
                          const err = validateName(val);
                          if (err)
                            setFieldErrors((prev) => ({
                              ...prev,
                              fullName: err,
                            }));
                          else
                            setFieldErrors((prev) => ({
                              ...prev,
                              fullName: "",
                            }));
                        }}
                        id="name"
                        name="name"
                        autoComplete="name"
                        maxLength={25}
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
                        const val = e.target.value;
                        setEmail(val);
                        if (val.length > 50) {
                          setFieldErrors((prev) => ({
                            ...prev,
                            email: "Email cannot exceed 50 characters",
                          }));
                        } else {
                          setFieldErrors((prev) => ({ ...prev, email: "" }));
                        }
                      }}
                      onBlur={handleEmailBlur}
                      id="email"
                      name="email"
                      autoComplete="email"
                      maxLength={50}
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
                          onChange={(e) => {
                            const val = e.target.value;
                            setPassword(val);
                            if (val.length > 25) {
                              setFieldErrors((prev) => ({
                                ...prev,
                                password:
                                  "Password cannot exceed 25 characters",
                              }));
                            } else {
                              setFieldErrors((prev) => ({
                                ...prev,
                                password: "",
                              }));
                            }
                          }}
                          onBlur={handlePasswordBlur}
                          id="password"
                          name="password"
                          autoComplete={
                            isRegistering ? "new-password" : "current-password"
                          }
                          maxLength={25}
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
                      {isRegistering && (
                        <PasswordStrengthMeter password={password} />
                      )}
                    </div>
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
                  disabled={
                    loading || (isRegistering && !passwordMeetsAllCriteria)
                  }
                  className="btn btn-primary w-full py-3 mt-2 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
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
            </>
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
