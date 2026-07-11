import React, { useState, useRef } from 'react';
import { Dialog, ModalFooter } from '../../components/ui';
import { Database, Download, Upload, AlertTriangle, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import api from '../../api/axiosInstance';

interface RestoreSummary {
  accountsRestored: number;
  transactionsRestored: number;
  budgetsRestored: number;
  goalsRestored: number;
  rulesRestored: number;
  skipped: number;
}

export const BackupRestore: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [backupExportLoading, setBackupExportLoading] = useState(false);
  const [backupRestoreLoading, setBackupRestoreLoading] = useState(false);
  const [restoreSummary, setRestoreSummary] = useState<RestoreSummary | null>(null);

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [accountPassword, setAccountPassword] = useState('');
  const [zipPassword, setZipPassword] = useState('');
  const [skipZipPassword, setSkipZipPassword] = useState(false);
  const [zipPasswordRequired, setZipPasswordRequired] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showAccountPassword, setShowAccountPassword] = useState(false);
  const [showZipPassword, setShowZipPassword] = useState(false);

  const resetPasswords = () => {
    setAccountPassword('');
    setZipPassword('');
    setSkipZipPassword(false);
    setZipPasswordRequired(false);
    setShowAccountPassword(false);
    setShowZipPassword(false);
  };

  const handleExportBackup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountPassword) {
      showToast('error', 'Please provide your account password.');
      return;
    }
    
    setBackupExportLoading(true);
    try {
      const response = await api.post('/backup/export', { accountPassword, zipPassword }, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/zip' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const dateStr = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `budgetsetu-backup-${dateStr}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showToast('success', 'Backup exported successfully.');
      setIsExportModalOpen(false);
      resetPasswords();
    } catch (err: unknown) {
      console.error(err);
      const e = err as { response?: { status?: number } };
      if (e.response?.status === 401) {
        showToast('error', 'Invalid account password.');
      } else {
        showToast('error', 'Failed to generate backup archive.');
      }
    } finally {
      setBackupExportLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.zip')) {
      showToast('error', 'Please select a valid .zip backup file.');
      return;
    }

    setSelectedFile(file);
    setIsRestoreModalOpen(true);
  };

  const handleRestoreBackup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !accountPassword) {
      showToast('error', 'Please provide your account password and select a file.');
      return;
    }
    
    if (zipPasswordRequired && !zipPassword) {
      showToast('error', 'This backup is encrypted. Please provide the zip password.');
      return;
    }

    if (!window.confirm('Restoring will add data from the backup file. Existing matching data will be OVERWRITTEN. Do you want to proceed?')) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      setIsRestoreModalOpen(false);
      resetPasswords();
      setSelectedFile(null);
      return;
    }

    setBackupRestoreLoading(true);
    setRestoreSummary(null);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('accountPassword', accountPassword);
    formData.append('zipPassword', zipPassword);

    try {
      const response = await api.post<RestoreSummary>('/backup/restore', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setRestoreSummary(response.data);
      showToast('success', 'Backup restored successfully!');
      setIsRestoreModalOpen(false);
      resetPasswords();
      setSelectedFile(null);
    } catch (e: unknown) {
      console.error(e);
      const apiError = e as { response?: { data?: { message?: string } } };
      if (apiError.response?.data?.message === 'ZIP_PASSWORD_REQUIRED') {
        setZipPasswordRequired(true);
        showToast('error', 'This backup is encrypted. Please enter the zip password.');
        return;
      }
      
      const message = apiError.response?.data?.message || 'Failed to restore backup archive.';
      showToast('error', message);
    } finally {
      setBackupRestoreLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-16 max-w-2xl mx-auto">
      <h2 className="text-xl lg:text-3xl font-semibold text-text-primary">Backup & Restore</h2>
      <button
        onClick={() => navigate('/profile')}
        className="flex items-center gap-2 text-brand hover:text-brand-hover transition-colors font-medium text-body-sm mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Profile
      </button>

      <div className="card space-y-4">
        <div className="flex items-center gap-2 text-brand pb-2 border-b border-border-muted">
          <Database className="h-5 w-5" />
          <h3 className="font-semibold text-text-primary text-body-lg">Backup & Restore Workspace</h3>
        </div>
        <p className="text-text-secondary text-body-sm leading-relaxed">
          Export your entire BudgetSetu workspace (including accounts, transactions, budgets, goals, and rules) as a single compressed zip file, or import it to sync across devices.
        </p>

        {/* Warning Alert Banner */}
        <div className="flex items-start gap-3 p-3.5 bg-warning/5 border border-warning/10 text-warning-text rounded-lg text-body-sm leading-relaxed">
          <AlertTriangle className="h-5 w-5 shrink-0 text-warning" />
          <span>
            <strong>Warning:</strong> Restoring from a backup will merge data into your workspace. Existing records matching backup IDs will be <strong>overwritten</strong>. New records will be inserted.
          </span>
        </div>

        {/* Restore Summary Display */}
        {restoreSummary && (
          <div className="p-4 bg-success-bg/20 border border-success/20 rounded-lg space-y-2 animate-fade-in">
            <h4 className="font-bold text-success-text text-body-sm">Restore Summary:</h4>
            <ul className="text-body-xs space-y-1 text-text-secondary list-disc pl-4">
              <li>Accounts Restored: {restoreSummary.accountsRestored}</li>
              <li>Transactions Restored: {restoreSummary.transactionsRestored}</li>
              <li>Budgets Restored: {restoreSummary.budgetsRestored}</li>
              <li>Goals Restored: {restoreSummary.goalsRestored}</li>
              <li>Merchant Rules Restored: {restoreSummary.rulesRestored}</li>
              {restoreSummary.skipped > 0 && (
                <li className="text-text-muted">Skipped (Already Existed): {restoreSummary.skipped}</li>
              )}
            </ul>
            <button
              onClick={() => setRestoreSummary(null)}
              className="text-body-xs text-brand hover:underline font-semibold cursor-pointer"
            >
              Dismiss Summary
            </button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 pt-2">
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="btn btn-secondary flex-1 py-3 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <span>Export Full Backup</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn btn-primary flex-1 py-3 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Upload className="h-4 w-4" />
            <span>Restore from Backup</span>
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".zip"
            className="hidden"
          />
        </div>
      </div>

      {/* Password Modals */}
      <Dialog
        isOpen={isExportModalOpen || isRestoreModalOpen}
        onClose={() => {
          setIsExportModalOpen(false);
          setIsRestoreModalOpen(false);
          resetPasswords();
          setSelectedFile(null);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }}
        title={isExportModalOpen ? 'Secure Backup Export' : 'Secure Backup Restore'}
        maxWidth="md"
      >
            
            <form onSubmit={isExportModalOpen ? handleExportBackup : handleRestoreBackup}>
              <div className="modal-body space-y-4">
                <p className="text-body-sm text-text-secondary">
                {isExportModalOpen 
                  ? "Please verify your account and set a password to encrypt your backup zip file." 
                  : "Please verify your account to restore. You will be prompted for a zip password if the backup is encrypted."}
              </p>
              
              <div className="space-y-1">
                <label className="text-body-xs font-medium text-text-secondary">Current Account Password</label>
                <div className="relative">
                  <input
                    type={showAccountPassword ? "text" : "password"}
                    value={accountPassword}
                    onChange={(e) => setAccountPassword(e.target.value)}
                    className="input w-full pr-10"
                    required
                    placeholder="Enter your BudgetSetu password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAccountPassword(!showAccountPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                  >
                    {showAccountPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {isExportModalOpen && (
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    id="skipZipPassword"
                    checked={skipZipPassword}
                    onChange={(e) => {
                      setSkipZipPassword(e.target.checked);
                      if (e.target.checked) setZipPassword('');
                    }}
                    className="w-4 h-4 text-brand bg-surface border-border-muted rounded focus:ring-brand cursor-pointer"
                  />
                  <label htmlFor="skipZipPassword" className="text-body-sm text-text-secondary cursor-pointer select-none">
                    Skip zip encryption (Not recommended)
                  </label>
                </div>
              )}

              {((isExportModalOpen && !skipZipPassword) || zipPasswordRequired) && (
                <div className="space-y-1">
                  <label className="text-body-xs font-medium text-text-secondary">
                    {isExportModalOpen ? 'New Zip Encryption Password' : 'Zip Decryption Password'}
                  </label>
                  <div className="relative">
                    <input
                      type={showZipPassword ? "text" : "password"}
                      value={zipPassword}
                      onChange={(e) => setZipPassword(e.target.value)}
                      className="input w-full pr-10"
                      required={zipPasswordRequired}
                      placeholder={isExportModalOpen ? "Set a strong password for the zip" : "Enter the zip password"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowZipPassword(!showZipPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                    >
                      {showZipPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}

              </div>


              <ModalFooter
                onCancel={() => {
                  setIsExportModalOpen(false);
                  setIsRestoreModalOpen(false);
                  resetPasswords();
                  setSelectedFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                submitText={isExportModalOpen ? 'Export' : 'Restore'}
                isLoading={backupExportLoading || backupRestoreLoading}
              />
            </form>
      </Dialog>
    </div>
  );
};
