import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../api/axiosInstance';
import { useToast } from '../../context/ToastContext';
import { FileUp, FileText, Loader2, Sparkles } from 'lucide-react';
import { useImportProcess } from '../../context/ImportProcessContext';
import { Select } from '../../components/shared/Select';

interface Account {
  id: string;
  name: string;
  bankName: string;
  accountNumber: string;
}



interface ImportProps {
  preSelectedAccountId?: string;
}

export const UploadStatementForm: React.FC<ImportProps> = ({ preSelectedAccountId }) => {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [banks, setBanks] = useState<{key: string, displayName: string}[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState(preSelectedAccountId || '');
  const [selectedBankKey, setSelectedBankKey] = useState('');

  const [prevPreSelectedAccountId, setPrevPreSelectedAccountId] = useState(preSelectedAccountId);

  if (preSelectedAccountId !== prevPreSelectedAccountId) {
    setPrevPreSelectedAccountId(preSelectedAccountId);
    if (preSelectedAccountId) {
      setSelectedAccountId(preSelectedAccountId);
    }
  }

  const { startUpload } = useImportProcess();
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [pdfPassword, setPdfPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isRetryingWithPassword, setIsRetryingWithPassword] = useState(false);



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
    let active = true;
    Promise.resolve().then(() => {
      if (active) fetchAccounts();
    });
    return () => { active = false; };
  }, [fetchAccounts]);



  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    const sizeInMB = file.size / (1024 * 1024);
    if (sizeInMB > 20) {
      showToast('error', 'File size exceeds the 20 MB limit.');
      return;
    }
    setSelectedFile(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      showToast('warning', 'Please select a statement file to upload.');
      return;
    }
    await uploadFile(selectedFile);
  };

  const uploadFile = async (file: File, password?: string) => {
    if (password) {
      setIsRetryingWithPassword(true);
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('sourceName', 'AUTO');
    if (selectedAccountId) formData.append('accountId', selectedAccountId);
    if (selectedBankKey) formData.append('bankKey', selectedBankKey);
    if (password) formData.append('password', password);

    try {
      await startUpload(file, formData, password);
      setSelectedFile(null);
      setPendingFile(null);
      setPdfPassword('');
      setIsPasswordModalOpen(false);
      setPasswordError('');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      const errorMsg = e.response?.data?.message;
      if (errorMsg === 'PASSWORD_REQUIRED') {
        setPendingFile(file);
        setIsPasswordModalOpen(true);
        setPasswordError('');
      } else if (errorMsg === 'INCORRECT_PASSWORD') {
        setPendingFile(file);
        setIsPasswordModalOpen(true);
        setPasswordError('Incorrect password. Please try again.');
      }
      // other errors are handled by context which shows a FAILED indicator
    } finally {
      setIsRetryingWithPassword(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingFile) return;
    if (!pdfPassword.trim()) {
      setPasswordError('Password is required.');
      return;
    }
    await uploadFile(pendingFile, pdfPassword);
  };

  const handlePasswordCancel = () => {
    setIsPasswordModalOpen(false);
    setPendingFile(null);
    setPdfPassword('');
    setPasswordError('');
  };

  return (
    <div className="space-y-8">

      {/* Top section: Upload form + Info panel */}
      <section className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Upload Card */}
        <div className="card lg:col-span-3 space-y-6">
          <div className="space-y-1">
            <h3 className="font-semibold text-text-primary text-heading-md">Upload Statement</h3>
            <p className="text-text-secondary text-body-sm">
              Upload any bank or UPI statement. BudgetSetu automatically identifies the bank and links transactions to the correct account.
            </p>
          </div>

          <form onSubmit={handleUploadSubmit} className="space-y-5">
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
              onClick={triggerFileInput}
              className={`border-2 border-dashed rounded-xl py-12 px-6 text-center cursor-pointer transition-colors ${
                dragActive
                  ? 'border-brand bg-brand/5'
                  : selectedFile
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
              />

              <div className="flex flex-col items-center gap-3">
                {selectedFile ? (
                  <>
                    <div className="p-3 bg-brand/10 text-brand rounded-xl">
                      <FileText className="h-7 w-7" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-body-md font-medium text-text-primary truncate max-w-sm mx-auto">
                        {selectedFile.name}
                      </p>
                      <p className="text-body-sm text-text-secondary">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB &middot; Click to change
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-3 bg-bg-subtle text-text-muted rounded-xl">
                      <FileUp className="h-7 w-7" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-body-md font-medium text-text-primary">
                        Click to upload or drag &amp; drop
                      </p>
                      <p className="text-body-sm text-text-muted">
                        PDF, CSV, Excel, HTML &middot; Max 20 MB
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={!selectedFile}
              className="btn btn-primary w-full py-2.5"
            >
              Import Statement
            </button>
          </form>
        </div>

        {/* Info sidebar */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card border-border bg-bg-subtle/30 shadow-none space-y-5">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-brand" />
              <h4 className="font-semibold text-text-primary text-body-lg">How it works</h4>
            </div>
            <ol className="space-y-4">
              {[
                {
                  step: '1',
                  title: 'Auto-Discovery',
                  desc: 'The parser reads the bank header and uses the last 4 digits to identify and link the account automatically.',
                },
                {
                  step: '2',
                  title: 'Zero Setup',
                  desc: 'No need to create accounts first. Unrecognised accounts are created automatically on the first import.',
                },
                {
                  step: '3',
                  title: 'Duplicate-Proof',
                  desc: 'Every transaction is fingerprinted. Re-uploading the same statement will never create duplicates.',
                },
              ].map(item => (
                <li key={item.step} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-bg-surface border border-border text-xs font-semibold text-text-secondary flex items-center justify-center mt-0.5">
                    {item.step}
                  </span>
                  <div>
                    <p className="text-body-sm font-medium text-text-primary">{item.title}</p>
                    <p className="text-body-xs text-text-secondary mt-0.5 leading-relaxed">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ol>

            <hr className="border-border" />

            <div className="space-y-1.5">
              <p className="text-body-xs font-semibold text-text-muted uppercase tracking-wider">Supported Formats</p>
              <div className="flex flex-wrap gap-1.5">
                {['PDF', 'CSV', 'XLSX', 'XLS', 'HTML'].map(fmt => (
                  <span key={fmt} className="px-2 py-0.5 rounded-md bg-bg-surface border border-border text-body-xs font-medium text-text-secondary">
                    {fmt}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* Password Prompt Modal */}
      {isPasswordModalOpen && (
        <div className="modal-overlay">
          <div className="modal max-w-sm">
            <div className="modal-header">
              <h3 className="font-display text-text-primary text-heading-md">Password Required</h3>
            </div>
            <form onSubmit={handlePasswordSubmit}>
              <div className="modal-body space-y-4">
                <p className="text-body-sm text-text-secondary leading-relaxed">
                  This PDF statement is password-protected. Enter the password to decrypt and parse it.
                </p>
                <div>
                  <label className="block text-body-sm font-semibold text-text-secondary mb-1">
                    Document Password
                  </label>
                  <input
                    type="password"
                    placeholder="Enter password..."
                    value={pdfPassword}
                    onChange={e => setPdfPassword(e.target.value)}
                    className="input"
                    disabled={isRetryingWithPassword}
                    autoFocus
                    required
                  />
                </div>
                {passwordError && (
                  <p className="text-body-xs font-semibold text-expense flex items-center gap-1.5 bg-expense-bg/20 p-2 rounded-md border border-expense/10">
                    <span className="h-1.5 w-1.5 rounded-full bg-expense shrink-0" />
                    <span>{passwordError}</span>
                  </p>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  onClick={handlePasswordCancel}
                  disabled={isRetryingWithPassword}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRetryingWithPassword}
                  className="btn btn-primary min-w-32 flex items-center justify-center gap-1.5"
                >
                  {isRetryingWithPassword ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Unlocking...</span>
                    </>
                  ) : (
                    <span>Unlock PDF</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
