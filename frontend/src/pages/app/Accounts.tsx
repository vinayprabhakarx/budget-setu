import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";

import api from "../../api/axiosInstance";
import { useLocation, useNavigate } from "react-router-dom";
import { useToast } from "../../context/ToastContext";
import { Import } from "./Import";
import { formatCurrency } from "../../utils/currency";
import { CreditCard, Plus, Edit2, FileUp, X, GitMerge } from "lucide-react";
import { AccountsSkeleton } from "../../components/skeletons/AccountsSkeleton";
import { Select } from "../../components/shared/Select";
import { UploadStatementModal } from "../../components/shared/UploadStatementModal";
import { StateDisplay } from "../../components/shared/StateDisplay";

interface Account {
  id: string;
  name: string;
  bankName: string;
  accountNumber: string;
  accountType: string;
  balance: number | null;
  currency: string;
  isActive: boolean;
  manualBalance?: number | null;
  manualBalanceDate?: string | null;
}

const getErrorMessage = (error: unknown): string | null => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message ?? null;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return null;
};

/**
 * Accounts Page Component
 * 
 * Displays and manages all user financial accounts including banks, credit cards, and cash.
 * Allows users to add, edit, or delete accounts, and view the current balance of each.
 */
export const Accounts: React.FC = () => {
  const { showToast } = useToast();

  const location = useLocation();
  const navigate = useNavigate();

  // Tab is driven entirely by the URL path
  const activeTab: 'accounts' | 'upload' = location.pathname === '/accounts/import' ? 'upload' : 'accounts';

  const setActiveTab = (tab: 'accounts' | 'upload') => {
    navigate(tab === 'upload' ? '/accounts/import' : '/accounts', { replace: false });
  };

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeAccount, setActiveAccount] = useState<Account | null>(null); // null -> Create, set -> Edit
  const [name, setName] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountType, setAccountType] = useState("SAVINGS");
  const [currency, setCurrency] = useState("INR");
  const [manualBalance, setManualBalance] = useState("");
  const [manualBalanceDate, setManualBalanceDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Merge Accounts state
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [mergeSourceId, setMergeSourceId] = useState("");
  const [mergeDestId, setMergeDestId] = useState("");
  const [mergeDetailsSource, setMergeDetailsSource] = useState("DESTINATION");
  const [mergeCustomName, setMergeCustomName] = useState("");
  const [mergeCustomBankName, setMergeCustomBankName] = useState("");
  const [mergeCustomAccountNumber, setMergeCustomAccountNumber] = useState("");
  const [mergeCustomAccountType, setMergeCustomAccountType] =
    useState("SAVINGS");
  const [mergeCustomCurrency, setMergeCustomCurrency] = useState("INR");
  const [mergeCustomBalance, setMergeCustomBalance] = useState("");
  const [mergeSubmitting, setMergeSubmitting] = useState(false);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get<Account[]>("/accounts");
      setAccounts(response.data);
    } catch (err: unknown) {
      console.error(err);
      showToast("error", "Failed to retrieve accounts.");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) {
        fetchAccounts();
      }
    });

    const handleRefresh = () => {
      fetchAccounts();
    };
    window.addEventListener("transaction-added", handleRefresh);
    window.addEventListener("transactions-updated", handleRefresh);

    return () => {
      active = false;
      window.removeEventListener("transaction-added", handleRefresh);
      window.removeEventListener("transactions-updated", handleRefresh);
    };
  }, [fetchAccounts]);

  const openCreateModal = () => {
    setActiveAccount(null);
    setName("");
    setBankName("");
    setAccountNumber("");
    setAccountType("SAVINGS");
    setCurrency("INR");
    setManualBalance("");
    setManualBalanceDate("");
    setIsModalOpen(true);
  };

  const openEditModal = (acc: Account) => {
    setActiveAccount(acc);
    setName(acc.name);
    setBankName(acc.bankName || "");
    setAccountNumber(acc.accountNumber || "");
    setAccountType(acc.accountType);
    setCurrency(acc.currency || "INR");
    setManualBalance(
      acc.manualBalance !== undefined && acc.manualBalance !== null
        ? acc.manualBalance.toString()
        : "",
    );
    setManualBalanceDate(acc.manualBalanceDate || "");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return showToast("warning", "Profile name is required.");
    if (!accountType) return showToast("warning", "Account type is required.");

    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        bankName: bankName.trim() || undefined,
        accountNumber: accountNumber.trim() || undefined,
        accountType,
        currency,
        manualBalance: manualBalance ? parseFloat(manualBalance) : null,
        manualBalanceDate: manualBalanceDate || null,
      };

      if (activeAccount) {
        await api.put(`/accounts/${activeAccount.id}`, payload);
        showToast("success", "Account configuration updated.");
      } else {
        await api.post("/accounts", payload);
        showToast("success", "New bank account profile created.");
      }
      setIsModalOpen(false);
      fetchAccounts();
    } catch (err: unknown) {
      console.error(err);
      showToast("error", getErrorMessage(err) || "Failed to save account.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!activeAccount) return;
    const confirmMessage = `Are you sure you want to delete the account "${activeAccount.name}"?\n\nThis will permanently delete the account, all of its uploaded statement history, and all associated transactions. This action cannot be undone.`;
    if (!window.confirm(confirmMessage)) return;

    setSubmitting(true);
    try {
      await api.delete(`/accounts/${activeAccount.id}`);
      showToast(
        "success",
        "Account, associated transactions, and statements deleted successfully.",
      );
      setIsModalOpen(false);
      fetchAccounts();
    } catch (err: unknown) {
      console.error(err);
      showToast("error", getErrorMessage(err) || "Failed to delete account.");
    } finally {
      setSubmitting(false);
    }
  };

  const openMergeModal = () => {
    setMergeSourceId("");
    setMergeDestId("");
    setMergeDetailsSource("DESTINATION");
    setMergeCustomName("");
    setMergeCustomBankName("");
    setMergeCustomAccountNumber("");
    setMergeCustomAccountType("SAVINGS");
    setMergeCustomCurrency("INR");
    setMergeCustomBalance("");
    setIsMergeModalOpen(true);
  };

  const handleMergeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mergeSourceId)
      return showToast("warning", "Source account is required.");
    if (!mergeDestId)
      return showToast("warning", "Destination account is required.");
    if (mergeSourceId === mergeDestId)
      return showToast(
        "warning",
        "Source and destination accounts must be different.",
      );

    const sourceAcc = accounts.find((a) => a.id === mergeSourceId);
    const destAcc = accounts.find((a) => a.id === mergeDestId);
    if (!sourceAcc || !destAcc)
      return showToast("error", "Selected accounts are invalid.");

    const confirmMsg = `Are you sure you want to merge "${sourceAcc.name}" into "${destAcc.name}"?\n\nThis will transfer all transactions and statement imports to "${destAcc.name}", and then permanently delete "${sourceAcc.name}".\n\nThis action cannot be undone.`;
    if (!window.confirm(confirmMsg)) return;

    setMergeSubmitting(true);
    try {
      const payload: {
        sourceAccountId: string;
        destinationAccountId: string;
        detailsSource: string;
        customName?: string;
        customBankName?: string;
        customAccountNumber?: string;
        customAccountType?: string;
        customCurrency?: string;
        customBalance?: number;
      } = {
        sourceAccountId: mergeSourceId,
        destinationAccountId: mergeDestId,
        detailsSource: mergeDetailsSource,
      };

      if (mergeDetailsSource === "CUSTOM") {
        if (!mergeCustomName.trim()) {
          showToast("warning", "Custom name is required.");
          setMergeSubmitting(false);
          return;
        }
        if (!mergeCustomAccountType) {
          showToast("warning", "Custom account type is required.");
          setMergeSubmitting(false);
          return;
        }
        payload.customName = mergeCustomName.trim();
        payload.customBankName = mergeCustomBankName.trim() || undefined;
        payload.customAccountNumber =
          mergeCustomAccountNumber.trim() || undefined;
        payload.customAccountType = mergeCustomAccountType;
        payload.customCurrency = mergeCustomCurrency;
        payload.customBalance = mergeCustomBalance
          ? parseFloat(mergeCustomBalance)
          : undefined;
      }

      await api.post("/accounts/merge", payload);
      showToast("success", "Accounts merged successfully.");
      setIsMergeModalOpen(false);
      fetchAccounts();
    } catch (err: unknown) {
      console.error(err);
      showToast("error", getErrorMessage(err) || "Failed to merge accounts.");
    } finally {
      setMergeSubmitting(false);
    }
  };

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadModalAccountId, setUploadModalAccountId] = useState<
    string | undefined
  >();

  const handleUploadShortcut = (accountId: string) => {
    setUploadModalAccountId(accountId);
    setIsUploadModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-16">
      <h2 className="text-xl lg:text-3xl font-semibold text-text-primary">Bank Accounts</h2>
      {/* Top section */}
      <section className="flex border-b border-border-muted pb-4 w-full">
        <div className="flex gap-4 overflow-x-auto hide-scrollbar">
          <button
            className={`text-body-lg font-semibold px-2 py-1 border-b-2 transition-colors whitespace-nowrap ${activeTab === "accounts" ? "border-primary text-text-primary" : "border-transparent text-text-muted hover:text-text-primary"}`}
            onClick={() => setActiveTab("accounts")}
          >
            Bank Accounts
          </button>
          <button
            className={`text-body-lg font-semibold px-2 py-1 border-b-2 transition-colors whitespace-nowrap ${activeTab === "upload" ? "border-primary text-text-primary" : "border-transparent text-text-muted hover:text-text-primary"}`}
            onClick={() => setActiveTab("upload")}
          >
            Import History
          </button>
        </div>
      </section>

      {activeTab === "accounts" ? (
        <>
          <div className="flex justify-end gap-2">
            {accounts.length >= 2 && (
              <button
                onClick={openMergeModal}
                className="btn btn-secondary flex items-center justify-center gap-2"
              >
                <GitMerge className="h-4.5 w-4.5" />
                <span>Merge Accounts</span>
              </button>
            )}
            <button
              onClick={openCreateModal}
              className="btn btn-primary flex items-center justify-center gap-2"
            >
              <Plus className="h-4.5 w-4.5" />
              <span>Add Account</span>
            </button>
          </div>
          
          {/* Accounts grid */}
          {loading ? (
            <AccountsSkeleton />
          ) : accounts.length === 0 ? (
            <section className="max-w-xl mx-auto mt-10">
              <StateDisplay
                type="empty"
                title="No bank accounts registered"
                description="Create a profile to start tracking balances and logging manual transactions."
                action={{
                  label: "Create First Account",
                  onClick: openCreateModal,
                }}
                icon={
                  <CreditCard className="h-10 w-10 text-text-muted opacity-50" />
                }
              />
            </section>
          ) : (
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {accounts.map((acc) => {
                const last4 = acc.accountNumber
                  ? acc.accountNumber.length > 4
                    ? acc.accountNumber.slice(-4)
                    : acc.accountNumber
                  : "N/A";

                const isBankNameRedundant = acc.bankName && acc.name.toLowerCase().includes(acc.bankName.toLowerCase());
                const isAccNumberRedundant = acc.accountNumber && acc.name.includes(last4);
                const showBankDetails = acc.bankName && !(isBankNameRedundant && isAccNumberRedundant);

                // Remove the account type in brackets if it exists (e.g. " (SAVINGS)")
                const typePattern = new RegExp(`\\s*\\(${acc.accountType}\\)`, "i");
                const displayName = acc.name.replace(typePattern, "").trim();

                return (
                  <div
                    key={acc.id}
                    className="card p-6 flex flex-col justify-between space-y-4"
                  >
                    {/* Header */}
                    <div className="flex justify-between items-start">
                      <div className="space-y-1 flex-1 pr-3">
                        <span className="badge badge-brand font-semibold">
                          {acc.accountType}
                        </span>
                        <h4 className="font-semibold text-text-primary text-body-lg line-clamp-2">
                          {displayName}
                        </h4>
                        {showBankDetails && (
                          <p className="text-body-sm text-text-secondary">
                            {acc.bankName} ·{" "}
                            <span className="font-mono text-body-xs">
                              •••• {last4}
                            </span>
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => openEditModal(acc)}
                        className="p-1.5 rounded-md hover:bg-bg-subtle text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                        title="Edit account details"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Balance display */}
                    {acc.balance !== null && acc.balance !== undefined && (
                      <div className="space-y-1">
                        <span className="text-text-secondary text-[0.6875rem] font-semibold uppercase tracking-wider">
                          Current Balance
                        </span>
                        <p className="num text-mono-xl font-bold text-text-primary">
                          {formatCurrency(acc.balance)}
                        </p>
                      </div>
                    )}

                    {/* Footer buttons */}
                    <div className="pt-2 border-t border-border-muted flex gap-2">
                      <button
                        onClick={() => handleUploadShortcut(acc.id)}
                        className="btn btn-secondary flex-1 py-1.5 text-body-xs flex items-center justify-center gap-1"
                      >
                        <FileUp className="h-3.5 w-3.5" />
                        <span>Upload Statement</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </section>
          )}

          {/* Create / Edit Modal */}
          {isModalOpen && (
            <div className="modal-overlay">
              <div className="modal max-w-md">
                <div className="modal-header">
                  <h3 className="font-display text-text-primary text-heading-md">
                    {activeAccount
                      ? "Modify Bank Profile"
                      : "Link Bank Account"}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="text-text-secondary hover:text-text-primary p-1 rounded-md hover:bg-bg-subtle cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="modal-body space-y-4">
                    {/* Account Profile Name */}
                    <div>
                      <label className="block text-body-sm font-semibold text-text-secondary mb-1">
                        Profile Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. My Savings Card, Office Account"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="input"
                        required
                      />
                    </div>

                    {/* Bank Name */}
                    <div>
                      <label className="block text-body-sm font-semibold text-text-secondary mb-1">
                        Bank Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. HDFC, SBI, ICICI"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        className="input"
                      />
                    </div>

                    {/* Account Number (last 4 digits only) */}
                    <div>
                      <label className="block text-body-sm font-semibold text-text-secondary mb-1">
                        Account Number (Last 4 digits preferred)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 9876"
                        maxLength={10}
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        className="input"
                      />
                    </div>

                    {/* Account Type */}
                    <div>
                      <label className="block text-body-sm font-semibold text-text-secondary mb-1">
                        Account Type *
                      </label>
                      <Select
                        value={accountType}
                        onChange={setAccountType}
                        options={[
                          { value: "SAVINGS", label: "Savings Account" },
                          { value: "CURRENT", label: "Current Account" },
                          { value: "CREDIT_CARD", label: "Credit Card" },
                          { value: "CASH", label: "Cash Wallet" },
                          { value: "UPI", label: "UPI Virtual Wallet" },
                        ]}
                      />
                    </div>

                    {/* Currency select */}
                    <div>
                      <label className="block text-body-sm font-semibold text-text-secondary mb-1">
                        Base Currency
                      </label>
                      <Select
                        value={currency}
                        onChange={setCurrency}
                        options={[
                          { value: "INR", label: "INR (₹)" },
                          { value: "USD", label: "USD ($)" },
                          { value: "EUR", label: "EUR (€)" },
                        ]}
                      />
                    </div>

                    {/* Manual Balance Initializer (mostly for UPI/CASH, but support for all) */}
                    <div className="p-4 bg-bg-subtle rounded-lg border border-border-muted space-y-4">
                      <h4 className="text-body-sm font-bold text-text-primary">
                        Manual Balance Initialization
                      </h4>
                      <p className="text-text-secondary text-[0.6875rem] leading-relaxed">
                        Set a manual starting balance at a specific date.
                        Transactions logged on or after this date will
                        dynamically increment (credit) or decrement (debit) this
                        starting value. Leave blank to disable this override.
                      </p>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-body-xs font-semibold text-text-secondary mb-1">
                            Starting Balance
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="e.g. 5000.00"
                            value={manualBalance}
                            onChange={(e) => setManualBalance(e.target.value)}
                            className="input bg-bg-card"
                          />
                        </div>
                        <div>
                          <label className="block text-body-xs font-semibold text-text-secondary mb-1">
                            As of Date
                          </label>
                          <input
                            type="date"
                            value={manualBalanceDate}
                            onChange={(e) =>
                              setManualBalanceDate(e.target.value)
                            }
                            className="input bg-bg-card"
                            required={!!manualBalance}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="modal-footer justify-between">
                    {activeAccount ? (
                      <button
                        type="button"
                        onClick={handleDeleteAccount}
                        disabled={submitting}
                        className="btn btn-destructive"
                      >
                        Delete Account
                      </button>
                    ) : (
                      <div />
                    )}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="btn btn-secondary"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="btn btn-primary min-w-25"
                      >
                        {submitting ? "Saving..." : "Save Profile"}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Merge Accounts Modal */}
          {isMergeModalOpen && (
            <div className="modal-overlay">
              <div className="modal max-w-md">
                <div className="modal-header">
                  <h3 className="font-display text-text-primary text-heading-md">
                    Merge Accounts
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsMergeModalOpen(false)}
                    className="text-text-secondary hover:text-text-primary p-1 rounded-md hover:bg-bg-subtle cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleMergeSubmit}>
                  <div className="modal-body space-y-4">
                    {/* Source Account (Will be deleted) */}
                    <div>
                      <label className="block text-body-sm font-semibold text-text-secondary mb-1">
                        Source Account (will be deleted) *
                      </label>
                      <Select
                        value={mergeSourceId}
                        onChange={setMergeSourceId}
                        options={[
                          { value: "", label: "Select Source Account" },
                          ...accounts.map((acc) => ({
                            value: acc.id,
                            label: `${acc.name}${acc.balance !== null && acc.balance !== undefined ? ` (${formatCurrency(acc.balance)})` : ""}`,
                          })),
                        ]}
                      />
                    </div>

                    {/* Destination Account (Will be kept) */}
                    <div>
                      <label className="block text-body-sm font-semibold text-text-secondary mb-1">
                        Destination Account (will be kept) *
                      </label>
                      <Select
                        value={mergeDestId}
                        onChange={setMergeDestId}
                        options={[
                          { value: "", label: "Select Destination Account" },
                          ...accounts
                            .filter((acc) => acc.id !== mergeSourceId)
                            .map((acc) => ({
                              value: acc.id,
                              label: `${acc.name}${acc.balance !== null && acc.balance !== undefined ? ` (${formatCurrency(acc.balance)})` : ""}`,
                            })),
                        ]}
                      />
                    </div>

                    {/* Details Source Option */}
                    <div>
                      <label className="block text-body-sm font-semibold text-text-secondary mb-1">
                        Details to Keep *
                      </label>
                      <Select
                        value={mergeDetailsSource}
                        onChange={setMergeDetailsSource}
                        options={[
                          {
                            value: "DESTINATION",
                            label: "Keep Destination Account Details",
                          },
                          {
                            value: "SOURCE",
                            label: "Keep Source Account Details",
                          },
                          {
                            value: "CUSTOM",
                            label: "Enter Custom Details (Manually fill)",
                          },
                        ]}
                      />
                    </div>

                    {/* Custom Details Fields */}
                    {mergeDetailsSource === "CUSTOM" && (
                      <div className="p-4 bg-bg-subtle rounded-lg border border-border-muted space-y-4">
                        <h4 className="text-body-sm font-bold text-text-primary">
                          Custom Profile Data
                        </h4>

                        {/* Name */}
                        <div>
                          <label className="block text-body-xs font-semibold text-text-secondary mb-1">
                            Profile Name *
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Merged Savings Account"
                            value={mergeCustomName}
                            onChange={(e) => setMergeCustomName(e.target.value)}
                            className="input bg-bg-card"
                            required
                          />
                        </div>

                        {/* Bank Name */}
                        <div>
                          <label className="block text-body-xs font-semibold text-text-secondary mb-1">
                            Bank Name
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. HDFC Bank"
                            value={mergeCustomBankName}
                            onChange={(e) =>
                              setMergeCustomBankName(e.target.value)
                            }
                            className="input bg-bg-card"
                          />
                        </div>

                        {/* Account Number */}
                        <div>
                          <label className="block text-body-xs font-semibold text-text-secondary mb-1">
                            Account Number (Last 4 digits)
                          </label>
                          <input
                            type="text"
                            maxLength={4}
                            placeholder="e.g. 1234"
                            value={mergeCustomAccountNumber}
                            onChange={(e) =>
                              setMergeCustomAccountNumber(e.target.value)
                            }
                            className="input bg-bg-card"
                          />
                        </div>

                        {/* Account Type */}
                        <div>
                          <label className="block text-body-xs font-semibold text-text-secondary mb-1">
                            Account Type *
                          </label>
                          <Select
                            value={mergeCustomAccountType}
                            onChange={setMergeCustomAccountType}
                            options={[
                              { value: "SAVINGS", label: "Savings Account" },
                              { value: "CURRENT", label: "Current Account" },
                              { value: "CREDIT_CARD", label: "Credit Card" },
                              { value: "UPI", label: "UPI Handle" },
                              { value: "CASH", label: "Cash Wallet" },
                              { value: "VIRTUAL", label: "Virtual Card" },
                            ]}
                          />
                        </div>

                        {/* Currency */}
                        <div>
                          <label className="block text-body-xs font-semibold text-text-secondary mb-1">
                            Base Currency
                          </label>
                          <Select
                            value={mergeCustomCurrency}
                            onChange={setMergeCustomCurrency}
                            options={[
                              { value: "INR", label: "INR (₹)" },
                              { value: "USD", label: "USD ($)" },
                              { value: "EUR", label: "EUR (€)" },
                            ]}
                          />
                        </div>

                        {/* Balance */}
                        <div>
                          <label className="block text-body-xs font-semibold text-text-secondary mb-1">
                            Manual Balance Override (Leave empty to sum
                            balances)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={mergeCustomBalance}
                            onChange={(e) =>
                              setMergeCustomBalance(e.target.value)
                            }
                            className="input bg-bg-card"
                          />
                        </div>
                      </div>
                    )}

                    {/* Warning message */}
                    <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-body-xs">
                      <strong>Warning:</strong> Merging accounts is permanent.
                      The source account will be deleted, but all its
                      transactions and statements will be safely moved.
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button
                      type="button"
                      onClick={() => setIsMergeModalOpen(false)}
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={mergeSubmitting}
                      className="btn btn-primary min-w-30"
                    >
                      {mergeSubmitting ? "Merging..." : "Confirm Merge"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      ) : (
        <section className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <Import onUploadClick={() => setIsUploadModalOpen(true)} />
        </section>
      )}

      {/* Upload Statement Modal (triggered from account card) */}
      <UploadStatementModal
        isOpen={isUploadModalOpen}
        onClose={() => {
          setIsUploadModalOpen(false);
          setUploadModalAccountId(undefined);
        }}
        preSelectedAccountId={uploadModalAccountId}
      />
    </div>
  );
};
