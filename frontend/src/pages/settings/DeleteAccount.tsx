import React, { useState } from 'react';
import { ShieldAlert, Loader2, ArrowLeft, Lock, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../api/axiosInstance';

export const DeleteAccount: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { showToast } = useToast();

  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleDeleteAccount = async () => {
    if (!deleteConfirm) {
      showToast('error', 'Please confirm that you want to delete your account.');
      return;
    }
    if (!window.confirm('WARNING: Are you absolutely sure? This will delete all your transaction history, accounts, budgets, goals, and cannot be undone.')) {
      return;
    }
    if (!password) {
      showToast('error', 'Please enter your password to confirm deletion.');
      return;
    }
    setDeleteLoading(true);
    try {
      await api.delete('/users/me', {
        data: { password }
      });
      showToast('success', 'Your account has been deleted.');
      await logout();
      navigate('/login');
    } catch (err) {
      console.error(err);
      const apiError = err as { response?: { status?: number; data?: { message?: string } } };
      const message = apiError.response?.data?.message || 'Failed to delete account.';
      showToast('error', message);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-16 max-w-2xl mx-auto">
      <h2 className="text-xl lg:text-3xl font-semibold text-text-primary">Delete Account</h2>
      <button
        onClick={() => navigate('/profile')}
        className="flex items-center gap-2 text-brand hover:text-brand-hover transition-colors font-medium text-body-sm mb-4 cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Profile
      </button>

      <div className="card border-destructive/20 bg-destructive-bg/30 p-6 space-y-4">
        <div className="flex items-center gap-2 text-destructive pb-2 border-b border-destructive/10">
          <ShieldAlert className="h-5 w-5" />
          <h3 className="font-semibold text-destructive-text text-body-lg">Permanently Delete Account</h3>
        </div>
        <p className="text-text-secondary text-body-sm leading-relaxed">
          Deleting your account is permanent. It instantly and permanently wipes all your transaction history, categories, limits, financial targets, and access keys. <strong>This cannot be undone.</strong>
        </p>
        <div className="pt-2 space-y-4">
          <div>
            <label className="block text-body-sm font-semibold text-text-secondary mb-1">
              Confirm your password *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                <Lock className="h-5 w-5" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter current password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="input !pl-10 !pr-10"
                disabled={deleteLoading}
              />
              {password && (
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-muted hover:text-text-primary cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              )}
            </div>
          </div>
          
          <label className="flex items-center gap-2 text-body-sm text-text-secondary cursor-pointer select-none">
            <input
              type="checkbox"
              checked={deleteConfirm}
              onChange={e => setDeleteConfirm(e.target.checked)}
              className="rounded border-border text-destructive focus:ring-destructive"
            />
            <span>I confirm that I want to delete my account and destroy all associated data.</span>
          </label>
          <button
            onClick={handleDeleteAccount}
            disabled={deleteLoading || !deleteConfirm || !password}
            className="btn btn-destructive w-full py-3 flex items-center justify-center gap-2 cursor-pointer"
          >
            {deleteLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : null}
            <span>Delete My Account</span>
          </button>
        </div>
      </div>
    </div>
  );
};
