import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../api/axiosInstance';
import { Loader2, User as UserIcon, Edit3, Lock, Mail } from 'lucide-react';
import { validatePassword, validateEmail } from '../../utils/validation';

export const Profile: React.FC = () => {
  const { user, updateUser, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Input states
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [emailError, setEmailError] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  const handleNewPasswordBlur = () => {
    const err = validatePassword(newPassword);
    setPasswordError(err || '');
  };

  const handleEmailBlur = () => {
    const err = validateEmail(email);
    setEmailError(err || '');
  };

  const handleConfirmPasswordBlur = () => {
    if (confirmPassword && newPassword !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
    } else if (!confirmPassword) {
      setConfirmPasswordError('');
    } else {
      setConfirmPasswordError('');
    }
  };

  // Mode toggles
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);

  // Loading states
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Sync inputs with user object on change
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

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) {
      showToast('error', 'Full name and email are required.');
      return;
    }
    setProfileLoading(true);
    try {
      const response = await api.put('/users/profile', {
        fullName: fullName.trim(),
        email: email.trim()
      });
      if (response.data.emailVerified === false) {
        showToast('success', 'Profile updated. Please verify your new email address.');
        const newEmail = response.data.email;
        navigate(`/verify-email?email=${encodeURIComponent(newEmail)}`);
        await logout();
        return;
      }
      updateUser({
        fullName: response.data.fullName,
        email: response.data.email
      });
      showToast('success', 'Profile updated successfully.');
      setIsEditingProfile(false);
    } catch (err) {
      console.error(err);
      const apiError = err as { response?: { status?: number; data?: { message?: string } } };
      const message = apiError.response?.data?.message || 'Failed to update profile.';
      showToast('error', message);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword.trim()) {
      showToast('error', 'Current password is required.');
      return;
    }
    if (!newPassword.trim()) {
      showToast('error', 'New password is required.');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('error', 'New passwords do not match.');
      return;
    }
    setPasswordLoading(true);
    try {
      await api.put('/users/password', {
        currentPassword,
        newPassword
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast('success', 'Password updated successfully.');
      setIsEditingPassword(false);
    } catch (err) {
      console.error(err);
      const apiError = err as { response?: { status?: number; data?: { message?: string } } };
      const message = apiError.response?.data?.message || 'Failed to update password.';
      showToast('error', message);
    } finally {
      setPasswordLoading(false);
    }
  };

  const cancelProfileEdit = () => {
    if (user) {
      setFullName(user.fullName);
      setEmail(user.email);
    }
    setEmailError('');
    setIsEditingProfile(false);
  };

  const cancelPasswordEdit = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setIsEditingPassword(false);
  };

  const handleForgotCurrentPassword = async () => {
    if (window.confirm('To reset your password, you will be logged out and redirected to the password recovery page. Do you want to proceed?')) {
      try {
        await logout();
        navigate('/login?recover=true', { state: { recover: true } });
      } catch (err) {
        console.error(err);
        showToast('error', 'Failed to log out.');
      }
    }
  };

  return (
    <div className="space-y-6 pb-16 max-w-2xl mx-auto">
      <h2 className="text-xl lg:text-3xl font-semibold text-text-primary">User Profile</h2>
      
      {/* Header card */}
      <div className="flex flex-col items-center sm:flex-row sm:items-start gap-5 p-6 bg-bg-surface border border-border rounded-xl shadow-sm">
        <div className="h-20 w-20 rounded-full bg-brand/10 text-brand text-3xl font-bold flex items-center justify-center border border-brand/20 shrink-0">
          {user?.fullName?.charAt(0) || 'U'}
        </div>
        <div className="text-center sm:text-left space-y-2 flex-1">
          <div>
            <h2 className="text-heading-lg font-bold text-text-primary">
              {user?.fullName || 'User Profile'}
            </h2>
            <p className="text-body-md text-text-secondary">
              {user?.email}
            </p>
          </div>
          
          <div className="flex items-center justify-center sm:justify-start gap-3">
            <span className="inline-block px-2.5 py-0.5 text-body-xs font-semibold bg-brand/10 text-brand rounded-full">
              {(user as {role?: string} | null)?.role === 'ADMIN' ? 'Admin' : 'Member'}
            </span>
            {user?.createdAt && (
              <span className="text-body-xs font-medium text-text-muted">
                Joined {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-3 border-t border-border/40">
            <button
              onClick={() => {
                setIsEditingProfile(!isEditingProfile);
                setIsEditingPassword(false);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-body-sm font-semibold text-brand hover:text-brand-hover bg-brand/5 hover:bg-brand/10 rounded-md transition-colors cursor-pointer"
            >
              <Edit3 className="h-4 w-4" />
              <span>{isEditingProfile ? 'Close Edit Profile' : 'Edit Profile'}</span>
            </button>
            <button
              onClick={() => {
                setIsEditingPassword(!isEditingPassword);
                setIsEditingProfile(false);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-body-sm font-semibold text-text-secondary hover:text-text-primary bg-bg-subtle hover:bg-border/30 rounded-md transition-colors cursor-pointer"
            >
              <Lock className="h-4 w-4" />
              <span>{isEditingPassword ? 'Close Password Change' : 'Change Password'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Profile Edit Form Card */}
      {isEditingProfile && (
        <div className="card space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2 pb-2 border-b border-border-muted text-brand">
            <UserIcon className="h-5 w-5" />
            <h3 className="font-semibold text-text-primary text-body-lg">Edit Personal Information</h3>
          </div>
          <form onSubmit={handleUpdateProfile} className="space-y-4 pt-2">
            <div>
              <label className="block text-body-sm font-semibold text-text-secondary mb-1">
                Full Name *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                  <UserIcon className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="input !pl-10"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-body-sm font-semibold text-text-secondary mb-1">
                Email Address *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={e => {
                    setEmail(e.target.value);
                    setEmailError('');
                  }}
                  onBlur={handleEmailBlur}
                  className={`input !pl-10 ${emailError ? 'input-error' : ''}`}
                  required
                />
              </div>
            </div>
            {emailError && (
              <p className="text-destructive text-body-sm mt-1">{emailError}</p>
            )}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="submit"
                disabled={profileLoading}
                className="btn btn-primary flex-1 py-2.5 flex items-center justify-center gap-2 cursor-pointer"
              >
                {profileLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                <span>Save Changes</span>
              </button>
              <button
                type="button"
                onClick={cancelProfileEdit}
                disabled={profileLoading}
                className="btn btn-secondary flex-1 py-2.5 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Password Edit Form Card */}
      {isEditingPassword && (
        <div className="card space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2 pb-2 border-b border-border-muted text-brand">
            <Lock className="h-5 w-5" />
            <h3 className="font-semibold text-text-primary text-body-lg">Change Account Password</h3>
          </div>
          <form onSubmit={handleUpdatePassword} className="space-y-4 pt-2">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-body-sm font-semibold text-text-secondary">
                  Current Password *
                </label>
                <button
                  type="button"
                  onClick={handleForgotCurrentPassword}
                  className="text-body-xs font-semibold text-brand hover:text-brand-hover hover:underline cursor-pointer bg-transparent border-0 p-0"
                >
                  Forgot current password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type="password"
                  placeholder="Enter current account password"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  className="input !pl-10"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-body-sm font-semibold text-text-secondary mb-1">
                New Password *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type="password"
                  placeholder="Enter new account password"
                  value={newPassword}
                  onChange={e => {
                    setNewPassword(e.target.value);
                    setPasswordError('');
                  }}
                  onBlur={handleNewPasswordBlur}
                  className={`input !pl-10 ${passwordError ? 'input-error' : ''}`}
                  required
                />
              </div>
              {passwordError && (
                <p className="text-destructive text-body-sm mt-1">{passwordError}</p>
              )}
            </div>
            <div>
              <label className="block text-body-sm font-semibold text-text-secondary mb-1">
                Confirm New Password *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type="password"
                  placeholder="Confirm new account password"
                  value={confirmPassword}
                  onChange={e => {
                    setConfirmPassword(e.target.value);
                    setConfirmPasswordError('');
                  }}
                  onBlur={handleConfirmPasswordBlur}
                  className={`input !pl-10 ${confirmPasswordError ? 'input-error' : ''}`}
                  required
                />
              </div>
              {confirmPasswordError && (
                <p className="text-destructive text-body-sm mt-1">{confirmPasswordError}</p>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <button
                type="submit"
                disabled={passwordLoading}
                className="btn btn-primary py-2.5 flex-1 text-body-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                {passwordLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                <span>Update Password</span>
              </button>
              <button
                type="button"
                onClick={cancelPasswordEdit}
                disabled={passwordLoading}
                className="btn btn-secondary py-2.5 flex-1 text-body-sm cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Advanced Settings */}
      <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 pt-4">
        <button
          onClick={() => navigate('/backup-restore')}
          className="text-body-sm font-semibold text-text-secondary hover:text-brand transition-colors cursor-pointer"
        >
          Backup & Restore
        </button>
        <div className="w-1 h-1 rounded-full bg-border-muted"></div>
        <button
          onClick={() => navigate('/delete-account')}
          className="text-body-sm font-semibold text-text-secondary hover:text-destructive transition-colors cursor-pointer"
        >
          Delete Account
        </button>
      </div>
    </div>
  );
};
