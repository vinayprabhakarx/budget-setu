import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";

import api from "../../api/axiosInstance";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { Import } from "./Import";
import { formatCurrency } from "../../utils/currency";
import { CreditCard, Plus, Edit2, FileUp, GitMerge } from "lucide-react";
import { AccountsSkeleton } from "../../components/skeletons/AccountsSkeleton";
import { Select } from "../../components/shared/Select";
import { UploadStatementModal } from "../../components/shared/UploadStatementModal";
import { StateDisplay } from "../../components/shared/StateDisplay";
import { Dialog, Button, ModalFooter } from "../../components/ui";
import { CurrencyInput } from "../../components/shared/CurrencyInput";
import { PageHeader } from "../../components/shared/PageHeader";
import { FilterSection } from "../../components/shared/FilterSection";

interface Account {
  id: string;
  bankName: string;
  accountHolderName?: string;
  accountNumber: string;
  accountType: string;
  balance: number | null;
  isActive: boolean;
  manualBalance?: number | null;
  manualBalanceDate?: string | null;
}

const getAccountDisplayName = (acc: Account) => {
  if (!acc.bankName && !acc.accountNumber) return "Account";
  const bank = acc.bankName || acc.accountType || "Account";
  const num = acc.accountNumber ? acc.accountNumber.slice(-4) : "";
  return num ? `${bank} - ${num}` : bank;
};

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
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();

  // Tab is driven entirely by the URL path
  const activeTab: "accounts" | "upload" =
    location.pathname === "/accounts/import" ? "upload" : "accounts";

  const setActiveTab = (tab: "accounts" | "upload") => {
    navigate(tab === "upload" ? "/accounts/import" : "/accounts", {
      replace: false,
    });
  };

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // History tab filters
  const [historySearchQuery, setHistorySearchQuery] = useState("");
  const [historySourceFilter, setHistorySourceFilter] = useState("ALL");
  const [historyStatusFilter, setHistoryStatusFilter] = useState("ALL");

  const filteredAccounts = accounts.filter((acc) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const displayName = getAccountDisplayName(acc).toLowerCase();
      const matchName = displayName.includes(q);
      const matchBank = acc.bankName?.toLowerCase().includes(q);
      const matchNumber = acc.accountNumber?.toLowerCase().includes(q);
      if (!matchName && !matchBank && !matchNumber) return false;
    }
    if (typeFilter !== "ALL" && acc.accountType !== typeFilter) {
      return false;
    }
    if (statusFilter === "ACTIVE" && !acc.isActive) {
      return false;
    }
    if (statusFilter === "INACTIVE" && acc.isActive) {
      return false;
    }
    return true;
  });

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeAccount, setActiveAccount] = useState<Account | null>(null); // null -> Create, set -> Edit
  const [accountHolderName, setAccountHolderName] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountType, setAccountType] = useState("SAVINGS");
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
    if (location.hash === "#new" && !isModalOpen) {
      setTimeout(() => {
        setActiveAccount(null);
        setAccountHolderName(user?.fullName || "");
        setBankName("");
        setAccountNumber("");
        setAccountType("SAVINGS");
        setManualBalance("");
        setManualBalanceDate("");
        setIsModalOpen(true);
        navigate(location.pathname, { replace: true, state: location.state });
      }, 0);
    }
  }, [
    location.hash,
    location.pathname,
    location.state,
    isModalOpen,
    navigate,
    user?.fullName,
  ]);

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
    setAccountHolderName(user?.fullName || "");
    setBankName("");
    setAccountNumber("");
    setAccountType("SAVINGS");
    setManualBalance("");
    setManualBalanceDate("");
    setIsModalOpen(true);
  };

  const openEditModal = (acc: Account) => {
    setActiveAccount(acc);
    setAccountHolderName(acc.accountHolderName || "");
    setBankName(acc.bankName || "");
    setAccountNumber(acc.accountNumber || "");
    setAccountType(acc.accountType);
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
    if (!accountType) return showToast("warning", "Account type is required.");

    setSubmitting(true);
    try {
      const payload = {
        accountHolderName: accountHolderName.trim() || undefined,
        bankName: bankName.trim() || undefined,
        accountNumber: accountNumber.trim() || undefined,
        accountType,
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
    const displayName = getAccountDisplayName(activeAccount);
    const confirmMessage = `Are you sure you want to delete the account "${displayName}"?\n\nThis will permanently delete the account, all of its uploaded statement history, and all associated transactions. This action cannot be undone.`;
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

    const sourceDisplayName = getAccountDisplayName(sourceAcc);
    const destDisplayName = getAccountDisplayName(destAcc);
    const confirmMsg = `Are you sure you want to merge "${sourceDisplayName}" into "${destDisplayName}"?\n\nThis will transfer all transactions and statement imports to "${destDisplayName}", and then permanently delete "${sourceDisplayName}".\n\nThis action cannot be undone.`;
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
      <PageHeader
        title="Bank Accounts"
        subtitle="Manage bank accounts, view balances, and import transaction statements."
        onFilterClick={() => setShowFilters(!showFilters)}
        onRefreshClick={() => {
          fetchAccounts();
          if (activeTab === "upload") {
            window.dispatchEvent(new CustomEvent("import-history-updated"));
          }
        }}
        isRefreshing={loading}
      >
        {activeTab === "accounts" && (
          <>
            {accounts.length >= 2 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={openMergeModal}
                leftIcon={<GitMerge className="h-4 w-4" />}
              >
                <span className="hidden sm:inline">Merge Accounts</span>
              </Button>
            )}
            <Button
              variant="primary"
              size="sm"
              onClick={openCreateModal}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              Add Account
            </Button>
          </>
        )}
      </PageHeader>

      {/* Filter Controls */}
      {activeTab === "accounts" ? (
        <FilterSection
          isOpen={showFilters}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search accounts by name, bank..."
          hasActiveFilters={Boolean(
            searchQuery || typeFilter !== "ALL" || statusFilter !== "ALL",
          )}
          onReset={() => {
            setSearchQuery("");
            setTypeFilter("ALL");
            setStatusFilter("ALL");
          }}
        >
          <Select
            value={typeFilter}
            onChange={setTypeFilter}
            options={[
              { value: "ALL", label: "All Account Types" },
              { value: "SAVINGS", label: "Savings Account" },
              { value: "CURRENT", label: "Current Account" },
              { value: "CREDIT_CARD", label: "Credit Card" },
              { value: "WALLET", label: "Wallet" },
            ]}
            size="sm"
          />
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: "ALL", label: "All Status" },
              { value: "ACTIVE", label: "Active Only" },
              { value: "INACTIVE", label: "Inactive Only" },
            ]}
            size="sm"
          />
        </FilterSection>
      ) : (
        <FilterSection
          isOpen={showFilters}
          searchQuery={historySearchQuery}
          onSearchChange={setHistorySearchQuery}
          searchPlaceholder="Search filename or parser source..."
          hasActiveFilters={Boolean(
            historySearchQuery ||
            historySourceFilter !== "ALL" ||
            historyStatusFilter !== "ALL",
          )}
          onReset={() => {
            setHistorySearchQuery("");
            setHistorySourceFilter("ALL");
            setHistoryStatusFilter("ALL");
          }}
        >
          <Select
            value={historySourceFilter}
            onChange={setHistorySourceFilter}
            options={[
              { value: "ALL", label: "All Sources" },
              { value: "AUTO", label: "Auto-Detected" },
              { value: "HDFC", label: "HDFC Bank" },
              { value: "ICICI", label: "ICICI Bank" },
              { value: "SBI", label: "SBI" },
              { value: "PHONEPE", label: "PhonePe" },
              { value: "PAYTM", label: "Paytm" },
              { value: "GPAY", label: "Google Pay" },
              { value: "BOB", label: "Bank of Baroda" },
              { value: "PNB", label: "PNB" },
            ]}
            size="sm"
          />
          <Select
            value={historyStatusFilter}
            onChange={setHistoryStatusFilter}
            options={[
              { value: "ALL", label: "All Status" },
              { value: "DONE", label: "Completed" },
              { value: "FAILED", label: "Failed" },
              { value: "PROCESSING", label: "Processing" },
            ]}
            size="sm"
          />
        </FilterSection>
      )}
      {/* Top section */}
      <section className="flex border-b border-border-muted pb-4 w-full">
        <div className="flex gap-4 overflow-x-auto hide-scrollbar">
          <button
            className={`text-body-lg font-semibold px-2 py-1 border-b-2 transition-colors whitespace-nowrap ${activeTab === "accounts" ? "border-primary text-text-primary" : "border-transparent text-text-muted hover:text-text-primary"}`}
            onClick={() => setActiveTab("accounts")}
          >
            Bank Accounts ({accounts.length})
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
          {/* Accounts grid */}
          {loading ? (
            <AccountsSkeleton />
          ) : accounts.length === 0 ? (
            <section className="animate-fade-in max-w-xl mx-auto mt-10">
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
          ) : filteredAccounts.length === 0 ? (
            <section className="animate-fade-in max-w-xl mx-auto mt-10">
              <StateDisplay
                type="empty"
                title="No accounts found"
                description="Try adjusting your search or filter criteria."
                action={{
                  label: "Reset Filters",
                  onClick: () => {
                    setSearchQuery("");
                    setTypeFilter("ALL");
                    setStatusFilter("ALL");
                  },
                }}
              />
            </section>
          ) : (
            <section className="animate-fade-in grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {filteredAccounts.map((acc) => {
                const isUpi =
                  acc.accountType === "UPI" ||
                  acc.bankName?.match(/paytm|phone ?pe|google pay|gpay|bhim/i);

                return (
                  <div
                    key={acc.id}
                    className="card p-5 sm:p-6 min-h-56 flex flex-col justify-between h-full space-y-4 transition-all duration-200 shadow-xs hover:shadow-md hover:border-border-muted/80 bg-bg-surface/95 relative group"
                  >
                    {/* Header */}
                    <div className="flex justify-between items-start">
                      <div className="space-y-1 flex-1 pr-3">
                        <span className="badge badge-brand font-semibold">
                          {acc.accountType || "N/A"}
                        </span>
                        <p className="text-body-xs text-text-muted mt-1 uppercase tracking-wider font-semibold">
                          {acc.accountHolderName ||
                            user?.fullName ||
                            "Account Holder"}
                        </p>
                        <h4 className="font-semibold text-text-primary text-body-lg leading-tight line-clamp-2 mt-1">
                          {acc.bankName || "Account"} {isUpi ? "· Mob:" : "·"}{" "}
                          <span className="font-mono text-body-md tracking-tight">
                            •••• {acc.accountNumber?.slice(-4) || "XXXX"}
                          </span>
                        </h4>
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
                    <div className="space-y-1">
                      <span className="text-text-secondary text-caption font-semibold uppercase tracking-wider">
                        Current Balance
                      </span>
                      <p className="num text-mono-xl font-bold text-text-primary">
                        {acc.balance !== null && acc.balance !== undefined
                          ? formatCurrency(acc.balance)
                          : "N/A"}
                      </p>
                    </div>

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
          <Dialog
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title={activeAccount ? "Modify Bank Profile" : "Link Bank Account"}
            maxWidth="md"
          >
            <form onSubmit={handleSubmit}>
              <div className="modal-body space-y-4">
                {/* Account Holder Name */}
                <div>
                  <label className="block text-body-sm font-semibold text-text-secondary mb-1">
                    Account Holder Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. John Doe"
                    value={accountHolderName}
                    onChange={(e) => setAccountHolderName(e.target.value)}
                    className="input"
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

                {/* Account Number / Mobile Number (last 4 digits only) */}
                <div>
                  <label className="block text-body-sm font-semibold text-text-secondary mb-1">
                    {accountType === "UPI" ||
                    bankName?.match(/paytm|phone ?pe|google pay|gpay|bhim/i)
                      ? "Mobile Number (Last 4 digits preferred)"
                      : "Account Number (Last 4 digits preferred)"}
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

                {/* Manual Balance Initializer (mostly for UPI/CASH, but support for all) */}
                <div className="p-4 bg-bg-subtle rounded-lg border border-border-muted space-y-4">
                  <h4 className="text-body-sm font-bold text-text-primary">
                    Manual Balance Initialization
                  </h4>
                  <p className="text-text-secondary text-caption leading-relaxed">
                    Set a manual starting balance at a specific date.
                    Transactions logged on or after this date will dynamically
                    increment (credit) or decrement (debit) this starting value.
                    Leave blank to disable this override.
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-body-xs font-semibold text-text-secondary mb-1">
                        Starting Balance
                      </label>
                      <CurrencyInput
                        placeholder="0.00"
                        value={manualBalance}
                        onChange={(e) => setManualBalance(e.target.value)}
                        className="bg-bg-card"
                      />
                    </div>
                    <div>
                      <label className="block text-body-xs font-semibold text-text-secondary mb-1">
                        As of Date
                      </label>
                      <input
                        type="date"
                        value={manualBalanceDate}
                        onChange={(e) => setManualBalanceDate(e.target.value)}
                        className="input bg-bg-card"
                        required={!!manualBalance}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer justify-between">
                {activeAccount ? (
                  <Button
                    type="button"
                    variant="danger"
                    onClick={handleDeleteAccount}
                    disabled={submitting}
                  >
                    Delete Account
                  </Button>
                ) : (
                  <div />
                )}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setIsModalOpen(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={submitting}
                    loadingText="Saving..."
                  >
                    Save Profile
                  </Button>
                </div>
              </div>
            </form>
          </Dialog>

          {/* Merge Accounts Modal */}
          <Dialog
            isOpen={isMergeModalOpen}
            onClose={() => setIsMergeModalOpen(false)}
            title="Merge Accounts"
            maxWidth="md"
          >
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
                        label: `${getAccountDisplayName(acc)}${acc.balance !== null && acc.balance !== undefined ? ` (${formatCurrency(acc.balance)})` : ""}`,
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
                          label: `${getAccountDisplayName(acc)}${acc.balance !== null && acc.balance !== undefined ? ` (${formatCurrency(acc.balance)})` : ""}`,
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
                        onChange={(e) => setMergeCustomBankName(e.target.value)}
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

                    {/* Balance */}
                    <div>
                      <label className="block text-body-xs font-semibold text-text-secondary mb-1">
                        Manual Balance Override (Leave empty to sum balances)
                      </label>
                      <CurrencyInput
                        placeholder="0.00"
                        value={mergeCustomBalance}
                        onChange={(e) => setMergeCustomBalance(e.target.value)}
                        className="bg-bg-card"
                      />
                    </div>
                  </div>
                )}

                {/* Warning message */}
                <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-body-xs">
                  <strong>Warning:</strong> Merging accounts is permanent. The
                  source account will be deleted, but all its transactions and
                  statements will be safely moved.
                </div>
              </div>

              <ModalFooter
                onCancel={() => setIsMergeModalOpen(false)}
                submitText="Confirm Merge"
                isLoading={mergeSubmitting}
                loadingText="Merging..."
              />
            </form>
          </Dialog>
        </>
      ) : (
        <section className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <Import
            onUploadClick={() => setIsUploadModalOpen(true)}
            searchQuery={historySearchQuery}
            sourceFilter={historySourceFilter}
            statusFilter={historyStatusFilter}
          />
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
