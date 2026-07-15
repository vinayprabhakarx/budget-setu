import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { Edit3, Lock, Loader2, CheckCircle, KeyRound } from "lucide-react";
import { validatePassword, validateEmail } from "../../utils/validation";
import { useGoogleLogin } from "@react-oauth/google";
import api from "../../api/axiosInstance";
import { GoogleLogo } from "../../components/shared/GoogleLogo";

export const Profile: React.FC = () => {
  const { user, updateUser, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState(user?.fullName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [emailError, setEmailError] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    if (user) {
      let active = true;
      Promise.resolve().then(() => {
        if (active) {
          setFullName(user.fullName);
          setEmail(user.email);
        }
      });
      return () => {
        active = false;
      };
    }
  }, [user]);

  const googleLoginHandler = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const res = await api.post("/users/link-google", {
          credential: tokenResponse.access_token,
        });
        updateUser({
          isGoogleLinked: res.data.isGoogleLinked,
          avatarUrl: res.data.avatarUrl,
          emailVerified: res.data.emailVerified,
        });
        showToast("success", "Google account linked!");
      } catch (err: unknown) {
        const errorMessage = (
          err as { response?: { data?: { message?: string } } }
        ).response?.data?.message;
        showToast("error", errorMessage || "Failed to link Google account.");
      }
    },
    onError: () => showToast("error", "Google authentication failed."),
  });

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim())
      return showToast("error", "Name and email are required.");
    setProfileLoading(true);
    try {
      const res = await api.put("/users/profile", {
        fullName: fullName.trim(),
        email: email.trim(),
      });
      if (res.data.emailVerified === false) {
        showToast("success", "Profile updated. Please verify your new email.");
        navigate(`/verify-email?email=${encodeURIComponent(res.data.email)}`);
        await logout();
        return;
      }
      updateUser({ fullName: res.data.fullName, email: res.data.email });
      showToast("success", "Profile updated.");
      setIsEditingProfile(false);
    } catch (err: unknown) {
      const errorMessage = (
        err as { response?: { data?: { message?: string } } }
      ).response?.data?.message;
      showToast("error", errorMessage || "Failed to update profile.");
    } finally {
      setProfileLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user?.hasLocalPassword !== false && !currentPassword.trim())
      return showToast("error", "Current password is required.");
    if (!newPassword.trim())
      return showToast("error", "New password is required.");
    if (newPassword !== confirmPassword)
      return showToast("error", "Passwords do not match.");
    const pwErr = validatePassword(newPassword);
    if (pwErr) return showToast("error", pwErr);
    setPasswordLoading(true);
    try {
      await api.put("/users/password", {
        currentPassword: currentPassword || "",
        newPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showToast(
        "success",
        user?.hasLocalPassword === false
          ? "Password set."
          : "Password updated.",
      );
      if (user?.hasLocalPassword === false)
        updateUser({ hasLocalPassword: true });
      setIsEditingPassword(false);
    } catch (err: unknown) {
      const errorMessage = (
        err as { response?: { data?: { message?: string } } }
      ).response?.data?.message;
      showToast("error", errorMessage || "Failed to update password.");
    } finally {
      setPasswordLoading(false);
    }
  };

  const cancelProfileEdit = () => {
    if (user) {
      setFullName(user.fullName);
      setEmail(user.email);
    }
    setEmailError("");
    setIsEditingProfile(false);
  };

  const cancelPasswordEdit = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError("");
    setConfirmPasswordError("");
    setIsEditingPassword(false);
  };

  const handleForgotPassword = async () => {
    if (
      !window.confirm(
        "You will be logged out and redirected to password recovery. Continue?",
      )
    )
      return;
    try {
      await logout();
      navigate("/login?recover=true");
    } catch {
      showToast("error", "Failed to log out.");
    }
  };

  const initials =
    user?.fullName
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";

  return (
    <div className="space-y-6 pb-16 max-w-2xl mx-auto">
      <div className="space-y-2">
        <h2 className="text-xl lg:text-3xl font-semibold text-text-primary">
          Profile
        </h2>
        <p className="text-text-secondary text-body-sm">
          Manage your personal details, password, and account settings.
        </p>
      </div>

      {/* ── Identity card ── */}
      <div className="card p-6 sm:p-7 space-y-4">
        <div className="flex items-center gap-4 sm:gap-5">
          {/* Avatar */}
          <div className="h-16 w-16 rounded-full bg-brand/10 text-brand font-bold text-lg flex items-center justify-center shrink-0 overflow-hidden ring-2 ring-border">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{initials}</span>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-text-primary text-base truncate">
              {user?.fullName}
            </p>
            <p className="text-sm text-text-secondary truncate">
              {user?.email}
            </p>
            {user?.createdAt && (
              <p className="text-xs text-text-muted mt-0.5">
                Member since{" "}
                {new Date(user.createdAt).toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </p>
            )}
          </div>
        </div>

        {/* Actions row */}
        <div className="mt-5 pt-5 border-t border-border/50 flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setIsEditingProfile((v) => !v);
              setIsEditingPassword(false);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              isEditingProfile
                ? "bg-brand text-brand-text"
                : "text-text-secondary hover:text-text-primary bg-bg-subtle hover:bg-border/40 border border-border/60"
            }`}
          >
            <Edit3 className="h-3.5 w-3.5" />
            {isEditingProfile ? "Cancel" : "Edit Profile"}
          </button>

          <button
            onClick={() => {
              setIsEditingPassword((v) => !v);
              setIsEditingProfile(false);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              isEditingPassword
                ? "bg-brand text-brand-text"
                : "text-text-secondary hover:text-text-primary bg-bg-subtle hover:bg-border/40 border border-border/60"
            }`}
          >
            <KeyRound className="h-3.5 w-3.5" />
            {isEditingPassword
              ? "Cancel"
              : user?.hasLocalPassword === false
                ? "Set Password"
                : "Change Password"}
          </button>

          {/* Google link — same row */}
          {user?.isGoogleLinked ? (
            <span className="flex items-center gap-1.5 text-xs font-medium text-success">
              <CheckCircle className="h-3.5 w-3.5" />
              Google linked
            </span>
          ) : (
            <button
              type="button"
              onClick={() => googleLoginHandler()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-text-muted hover:text-text-secondary bg-bg-subtle hover:bg-border/40 border border-border/60 transition-colors cursor-pointer"
            >
              <GoogleLogo className="h-3.5 w-3.5" />
              Link Google
            </button>
          )}
        </div>
      </div>

      {/* ── Edit Profile ── */}
      {isEditingProfile && (
        <div className="card p-6 sm:p-7 space-y-4">
          <p className="text-sm font-medium text-text-primary">Edit Profile</p>
          <form onSubmit={handleUpdateProfile} className="space-y-3">
            <div>
              <label className="block text-xs text-text-secondary mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="input w-full"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError("");
                }}
                onBlur={() => {
                  const e = validateEmail(email);
                  setEmailError(e || "");
                }}
                className={`input w-full ${emailError ? "input-error" : ""}`}
                required
              />
              {emailError && (
                <p className="text-xs text-destructive mt-1">{emailError}</p>
              )}
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={profileLoading}
                className="btn btn-primary flex-1 flex items-center justify-center gap-2 py-2 text-sm cursor-pointer"
              >
                {profileLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                Save
              </button>
              <button
                type="button"
                onClick={cancelProfileEdit}
                className="btn btn-secondary flex-1 py-2 text-sm cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Change / Set Password ── */}
      {isEditingPassword && (
        <div className="card p-6 sm:p-7 space-y-4">
          <p className="text-sm font-medium text-text-primary">
            {user?.hasLocalPassword === false
              ? "Set Password"
              : "Change Password"}
          </p>
          <form onSubmit={handleUpdatePassword} className="space-y-3">
            {user?.hasLocalPassword !== false && (
              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-xs text-text-secondary">
                    Current Password
                  </label>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-xs text-brand hover:underline cursor-pointer bg-transparent border-0 p-0"
                  >
                    Forgot?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="input pl-10! w-full"
                    placeholder="Current password"
                    required
                  />
                </div>
              </div>
            )}
            <div>
              <label className="block text-xs text-text-secondary mb-1">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setPasswordError("");
                  }}
                  onBlur={() => {
                    const e = validatePassword(newPassword);
                    setPasswordError(e || "");
                  }}
                  className={`input pl-10! w-full ${passwordError ? "input-error" : ""}`}
                  placeholder="New password"
                  required
                />
              </div>
              {passwordError && (
                <p className="text-xs text-destructive mt-1">{passwordError}</p>
              )}
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setConfirmPasswordError("");
                  }}
                  onBlur={() => {
                    if (confirmPassword && newPassword !== confirmPassword)
                      setConfirmPasswordError("Passwords do not match");
                    else setConfirmPasswordError("");
                  }}
                  className={`input pl-10! w-full ${confirmPasswordError ? "input-error" : ""}`}
                  placeholder="Confirm password"
                  required
                />
              </div>
              {confirmPasswordError && (
                <p className="text-xs text-destructive mt-1">
                  {confirmPasswordError}
                </p>
              )}
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={passwordLoading}
                className="btn btn-primary flex-1 flex items-center justify-center gap-2 py-2 text-sm cursor-pointer"
              >
                {passwordLoading && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                {user?.hasLocalPassword === false ? "Set Password" : "Update"}
              </button>
              <button
                type="button"
                onClick={cancelPasswordEdit}
                className="btn btn-secondary flex-1 py-2 text-sm cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Footer links ── */}
      <div className="flex items-center justify-center gap-5 pt-3">
        <button
          onClick={() => navigate("/backup-restore")}
          className="text-sm text-text-muted hover:text-text-secondary transition-colors cursor-pointer"
        >
          Backup & Restore
        </button>
        <span className="w-px h-3 bg-border" />
        <button
          onClick={() => navigate("/delete-account")}
          className="text-sm text-text-muted hover:text-destructive transition-colors cursor-pointer"
        >
          Delete Account
        </button>
      </div>
    </div>
  );
};
