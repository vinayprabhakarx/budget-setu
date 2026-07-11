import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../api/axiosInstance';
import { useToast } from '../../context/ToastContext';
import { useImportProcess } from '../../context/ImportProcessContext';
import { FileUp, FileText } from 'lucide-react';
import { Select } from './Select';
import { Dialog, ModalFooter } from '../ui';

interface Account {
  id: string;
  name: string;
  bankName: string;
}

interface UploadStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  preSelectedAccountId?: string;
}

export const UploadStatementModal: React.FC<UploadStatementModalProps> = ({ isOpen, onClose, preSelectedAccountId }) => {
  const { showToast } = useToast();
  const { startUpload } = useImportProcess();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [banks, setBanks] = useState<{key: string, displayName: string}[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState(preSelectedAccountId || '');
  const [selectedBankKey, setSelectedBankKey] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  // Password modal states
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [pdfPassword, setPdfPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  const [passwordQueue, setPasswordQueue] = useState<File[]>([]);
  const [currentPasswordFile, setCurrentPasswordFile] = useState<File | null>(null);
  const [isRetryingWithPassword, setIsRetryingWithPassword] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const fetchAccounts = useCallback(async () => {
    try {
      const [{ data: accData }, { data: bankData }] = await Promise.all([
        api.get<Account[]>('/accounts'),
        api.get<{key: string, displayName: string}[]>('/import/banks')
      ]);
      setAccounts(accData);
      setBanks(bankData);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    Promise.resolve().then(() => {
      if (active) setSelectedAccountId(preSelectedAccountId || '');
      if (active) fetchAccounts();
    });
    return () => { active = false; };
  }, [isOpen, fetchAccounts, preSelectedAccountId]);

  // Reset state when modal closes
  const handleClose = () => {
    if (passwordQueue.length > 0 || currentPasswordFile) {
      // Cannot close if there are pending passwords, unless user cancels
      return;
    }
    setSelectedFiles([]);
    setSelectedAccountId('');
    setSelectedBankKey('');
    setIsPasswordModalOpen(false);
    setPdfPassword('');
    setPasswordError('');
    setPasswordQueue([]);
    setCurrentPasswordFile(null);
    onClose();
  };

  const forceClose = () => {
    setSelectedFiles([]);
    setPasswordQueue([]);
    setCurrentPasswordFile(null);
    setIsPasswordModalOpen(false);
    setPdfPassword('');
    setPasswordError('');
    onClose();
  };

  const validateAndSetFiles = (files: FileList | File[]) => {
    const validFiles: File[] = [];
    Array.from(files).forEach(file => {
      if (file.size / (1024 * 1024) > 20) {
        showToast('error', `File ${file.name} exceeds the 20 MB limit.`);
      } else {
        validFiles.push(file);
      }
    });
    setSelectedFiles(validFiles);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.length > 0) validateAndSetFiles(e.dataTransfer.files);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) validateAndSetFiles(e.target.files);
  };

  const uploadFile = async (file: File, password?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    
    let sourceName = 'AUTO';
    if (selectedBankKey) {
      const bank = banks.find(b => b.key === selectedBankKey);
      if (bank) sourceName = bank.displayName;
    }
    formData.append('sourceName', sourceName);

    if (selectedAccountId) formData.append('accountId', selectedAccountId);
    if (selectedBankKey) formData.append('bankKey', selectedBankKey);
    if (password) formData.append('password', password);

    try {
      await startUpload(file, formData, password);
      return true;
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      const errorMsg = e.response?.data?.message;
      if (errorMsg === 'PASSWORD_REQUIRED' || errorMsg === 'INCORRECT_PASSWORD') {
        throw err;
      }
      return false; // Handled by context
    }
  };

  // Pop next password request
  useEffect(() => {
    if (!isPasswordModalOpen && passwordQueue.length > 0 && !currentPasswordFile) {
      const nextFile = passwordQueue[0];
      let active = true;
      Promise.resolve().then(() => {
        if (!active) return;
        setCurrentPasswordFile(nextFile);
        setPasswordQueue(prev => prev.slice(1));
        setPdfPassword('');
        setPasswordError('');
        setIsPasswordModalOpen(true);
      });
      return () => { active = false; };
    } else if (passwordQueue.length === 0 && !currentPasswordFile && !isUploading && selectedFiles.length === 0 && isOpen) {
      // If we finished everything, close
      // forceClose(); -> handled in submit
    }
  }, [passwordQueue, isPasswordModalOpen, currentPasswordFile, isUploading, selectedFiles.length, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      showToast('warning', 'Please select a file to upload.');
      return;
    }

    setIsUploading(true);
    const pwdQueue: File[] = [];

    const promises = selectedFiles.map(async (file) => {
      try {
        await uploadFile(file);
      } catch (err: unknown) {
        const e = err as { response?: { data?: { message?: string } } };
        if (e.response?.data?.message === 'PASSWORD_REQUIRED' || e.response?.data?.message === 'INCORRECT_PASSWORD') {
          pwdQueue.push(file);
        }
      }
    });

    await Promise.all(promises);
    setIsUploading(false);
    setSelectedFiles([]); // clear selected files once started

    if (pwdQueue.length > 0) {
      setPasswordQueue(pwdQueue);
    } else {
      forceClose();
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPasswordFile) return;
    if (!pdfPassword.trim()) { setPasswordError('Password is required.'); return; }
    
    setIsRetryingWithPassword(true);
    try {
      await uploadFile(currentPasswordFile, pdfPassword);
      // Success
      setIsPasswordModalOpen(false);
      setCurrentPasswordFile(null);
      if (passwordQueue.length === 0) {
        forceClose();
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      if (e.response?.data?.message === 'INCORRECT_PASSWORD') {
        setPasswordError('Incorrect password. Please try again.');
      }
    } finally {
      setIsRetryingWithPassword(false);
    }
  };



  if (!isOpen) return null;

  // Show password sub-modal on top
  if (isPasswordModalOpen) {
    return (
      <Dialog isOpen={true} onClose={() => { setIsPasswordModalOpen(false); setCurrentPasswordFile(null); setPasswordError(''); }} title="Password Required" maxWidth="sm">
          <form onSubmit={handlePasswordSubmit}>
            <div className="modal-body space-y-4">
              <p className="text-body-sm text-text-secondary leading-relaxed">
                <span className="font-semibold">{currentPasswordFile?.name}</span> is password-protected. Enter the password to decrypt and parse it.
              </p>
              {passwordError && (
                <p className="text-body-xs font-semibold text-expense flex items-center gap-1.5 bg-expense-bg/20 p-2 rounded-md border border-expense/10">
                  <span className="h-1.5 w-1.5 rounded-full bg-expense shrink-0" />
                  <span>{passwordError}</span>
                </p>
              )}
              <div>
                <label className="block text-body-sm font-medium text-text-primary mb-1">
                  Document Password
                </label>
                <input
                  type="password"
                  placeholder="Enter password..."
                  value={pdfPassword}
                  onChange={e => setPdfPassword(e.target.value)}
                  className="input bg-bg-card"
                  autoFocus
                />
              </div>
            </div>
            <ModalFooter
              onCancel={() => {
                setIsPasswordModalOpen(false);
                setPdfPassword('');
                setPasswordError('');
              }}
              submitText="Unlock PDF"
              disabled={!pdfPassword}
              isLoading={isRetryingWithPassword}
              loadingText="Unlocking..."
            />
          </form>
      </Dialog>
    );
  }

  return (
    <Dialog isOpen={isOpen} onClose={handleClose} title="Upload Statement" maxWidth="lg">
        <form onSubmit={handleSubmit}>
          <div className="modal-body space-y-5">
            <p className="text-body-sm text-text-secondary">
              Upload any bank or UPI statement. BudgetSetu automatically identifies the bank and links transactions to the correct account.
            </p>

            {/* Bank selector */}
            <div>
              <label className="block text-body-sm font-medium text-text-primary mb-1">
                Bank / UPI Statement
              </label>
              <p className="text-body-xs text-text-muted mb-1.5">
                Select your bank manually, or leave on auto-detect.
              </p>
              <Select
                value={selectedBankKey}
                onChange={setSelectedBankKey}
                options={[
                  { value: '', label: 'Auto-detect Bank' },
                  ...banks.map(bank => ({ value: bank.key, label: bank.displayName }))
                ]}
                placeholder="Auto-detect Bank"
              />
            </div>

            {/* Account selector */}
            <div>
              <label className="block text-body-sm font-medium text-text-primary mb-1">
                Link to Account (Optional)
              </label>
              <p className="text-body-xs text-text-muted mb-1.5">
                Attach transactions to an existing account, or let the system create one.
              </p>
              <Select
                value={selectedAccountId}
                onChange={setSelectedAccountId}
                options={[
                  { value: '', label: 'Create new account automatically' },
                  ...accounts.map(acc => ({ value: acc.id, label: `${acc.name} (${acc.bankName})` }))
                ]}
                placeholder="Create new account automatically"
              />
            </div>

            {/* Drop zone */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl py-10 px-6 text-center cursor-pointer transition-colors ${
                dragActive
                  ? 'border-brand bg-brand/5'
                  : selectedFiles.length > 0
                  ? 'border-brand bg-bg-subtle/40'
                  : 'border-border hover:border-brand/50 hover:bg-bg-subtle/20'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.csv,.xlsx,.xls,.zip,.html,.htm"
                onChange={handleFileChange}
                className="hidden"
                multiple
              />
              <div className="flex flex-col items-center gap-3">
                {selectedFiles.length > 0 ? (
                  <>
                    <div className="p-3 bg-brand/10 text-brand rounded-xl">
                      <FileText className="h-7 w-7" />
                    </div>
                    <div>
                      <p className="text-body-md font-medium text-text-primary truncate max-w-xs mx-auto">
                        {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} selected
                      </p>
                      <ul className="text-body-sm text-text-secondary mt-1 flex flex-col gap-0.5">
                        {selectedFiles.slice(0, 3).map((f, i) => (
                          <li key={i} className="truncate max-w-52 mx-auto">{f.name}</li>
                        ))}
                        {selectedFiles.length > 3 && <li>+ {selectedFiles.length - 3} more...</li>}
                      </ul>
                      <p className="text-body-xs text-brand mt-2 text-center">Click to change selection</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-3 bg-bg-subtle text-text-muted rounded-xl">
                      <FileUp className="h-7 w-7" />
                    </div>
                    <div>
                      <p className="text-body-md font-medium text-text-primary">
                        Click to upload or drag &amp; drop
                      </p>
                      <p className="text-body-sm text-text-muted mt-1">
                        PDF, CSV, Excel, HTML &middot; Max 20 MB
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <ModalFooter
            onCancel={handleClose}
            submitText={`Upload ${selectedFiles.length > 1 ? 'Files' : 'Statement'}`}
            isLoading={isUploading}
            loadingText="Starting..."
            disabled={selectedFiles.length === 0}
          />
        </form>
    </Dialog>
  );
};
