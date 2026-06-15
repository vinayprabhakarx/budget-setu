import React, { useEffect, useState, useCallback } from "react";
import api from "../../api/axiosInstance";
import { useToast } from "../../context/ToastContext";
import { formatCurrency } from "../../utils/currency";
import { Search, X, Trash2, Edit3, Loader2, History, Filter } from "lucide-react";
import { Select } from "../../components/shared/Select";
import { TransactionsSkeleton } from "../../components/skeletons/TransactionsSkeleton";
import { StateDisplay } from "../../components/shared/StateDisplay";

interface Account {
  id: string;
  name: string;
  bankName: string;
  accountNumber: string;
}

interface Category {
  id: string;
  name: string;
  color: string;
  type: string;
}

interface Transaction {
  id: string;
  payee: string;
  amount: number;
  transactionType: string;
  transactionDate: string;
  category: Category | null;
  paymentMode: string | null;
  description: string | null;
  tags: string[];
  source: string;
  accountId: string;
  referenceNumber?: string;
}

interface AuditLog {
  id: string;
  fieldName: string;
  oldValue: string;
  newValue: string;
  actor: string;
  timestamp: string;
}

/**
 * Transactions Page Component
 * 
 * A comprehensive view of all user transactions.
 * Allows filtering, sorting, searching, editing, and deleting of individual transactions across all accounts.
 */
export const Transactions: React.FC = () => {
  const { showToast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [type, setType] = useState("");

  // Pagination State
  const [page, setPage] = useState(0);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // Edit Modal State
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [editCategory, setEditCategory] = useState("");
  const [editPaymentMode, setEditPaymentMode] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPayee, setEditPayee] = useState("");
  const [editReferenceNumber, setEditReferenceNumber] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Add Transaction Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addAccountId, setAddAccountId] = useState("");
  const [addCategoryId, setAddCategoryId] = useState("");
  const [addAmount, setAddAmount] = useState("");
  const [addType, setAddType] = useState("EXPENSE");
  const [addDate, setAddDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [addPayee, setAddPayee] = useState("");
  const [addPaymentMode, setAddPaymentMode] = useState("");
  const [addDescription, setAddDescription] = useState("");
  const [addTags, setAddTags] = useState("");
  const [addSubmitting, setAddSubmitting] = useState(false);

  const fetchMeta = useCallback(async () => {
    try {
      const [accRes, catRes] = await Promise.all([
        api.get<Account[]>("/accounts"),
        api.get<Category[]>("/categories"),
      ]);
      setAccounts(accRes.data);
      setCategories(catRes.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number | boolean | undefined> = {
        page,
        size: 25,
        sort: "transactionDate,desc",
      };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (categoryId) params.categoryId = categoryId;
      if (accountId) params.accountId = accountId;
      if (type) params.type = type;
      if (search) params.search = search;

      const response = await api.get<{
        content: Transaction[];
        totalPages: number;
        totalElements: number;
      }>("/transactions", { params });
      setTransactions(response.data.content);
      setTotalPages(response.data.totalPages);
      setTotalElements(response.data.totalElements);
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to retrieve transactions.");
    } finally {
      setLoading(false);
    }
  }, [
    page,
    startDate,
    endDate,
    categoryId,
    accountId,
    type,
    search,
    showToast,
  ]);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) {
        fetchMeta();
      }
    });
    return () => {
      active = false;
    };
  }, [fetchMeta]);

  useEffect(() => {
    void refreshCounter;
    let active = true;
    Promise.resolve().then(() => {
      if (active) {
        fetchTransactions();
      }
    });
    return () => {
      active = false;
    };
  }, [fetchTransactions, refreshCounter]);

  useEffect(() => {
    const handleRefresh = () => {
      setPage(0);
      setRefreshCounter((prev) => prev + 1);
    };
    window.addEventListener("transaction-added", handleRefresh);
    window.addEventListener("transactions-updated", handleRefresh);
    return () => {
      window.removeEventListener("transaction-added", handleRefresh);
      window.removeEventListener("transactions-updated", handleRefresh);
    };
  }, [fetchTransactions]);

  // Handle Search input debounce or trigger on Enter/click
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    fetchTransactions();
  };

  const resetFilters = () => {
    setSearch("");
    setStartDate("");
    setEndDate("");
    setCategoryId("");
    setAccountId("");
    setType("");
    setPage(0);
  };

  const handleDelete = async (id: string) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this transaction? This action can be audited.",
      )
    )
      return;
    try {
      await api.delete(`/transactions/${id}`);
      showToast("success", "Transaction successfully removed.");
      fetchTransactions();
      window.dispatchEvent(new CustomEvent("transaction-added"));
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to delete transaction.");
    }
  };

  const openEditModal = async (tx: Transaction) => {
    setEditingTx(tx);
    setEditCategory(tx.category?.id || "");
    setEditPaymentMode(tx.paymentMode || "");
    setEditDescription(tx.description || "");
    setEditPayee(tx.payee || "");
    setEditReferenceNumber(tx.referenceNumber || "");
    setAuditLogs([]);

    // Fetch audit history asynchronously
    setLoadingAudit(true);
    try {
      const res = await api.get<AuditLog[]>(`/transactions/${tx.id}/history`);
      setAuditLogs(res.data);
    } catch (err) {
      console.error("Failed to load transaction audit history", err);
    } finally {
      setLoadingAudit(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTx) return;

    setEditSubmitting(true);
    try {
      const payload = {
        categoryId: editCategory || null,
        paymentMode: editPaymentMode.trim() || null,
        description: editDescription.trim() || null,
        payee: editPayee.trim() || null,
        referenceNumber: editReferenceNumber.trim() || null,
      };

      await api.patch(`/transactions/${editingTx.id}`, payload);
      showToast("success", "Transaction details updated.");
      setEditingTx(null);
      fetchTransactions();
      window.dispatchEvent(new CustomEvent("transaction-added"));
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to update transaction.");
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addAccountId) return showToast("warning", "Please select an account.");
    if (!addAmount || parseFloat(addAmount) <= 0)
      return showToast("warning", "Please enter a valid amount.");
    if (!addType)
      return showToast("warning", "Please select a transaction type.");
    if (!addDate)
      return showToast("warning", "Please enter a transaction date.");

    setAddSubmitting(true);
    try {
      const tags = addTags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const payload = {
        accountId: addAccountId,
        categoryId: addCategoryId || null,
        amount: parseFloat(addAmount),
        transactionType: addType,
        transactionDate: addDate,
        payee: addPayee.trim() || undefined,
        paymentMode: addPaymentMode.trim() || null,
        description: addDescription.trim() || null,
        tags,
      };

      await api.post("/transactions", payload);
      showToast("success", "Transaction successfully logged.");
      setIsAddModalOpen(false);
      // Reset values
      setAddAccountId("");
      setAddCategoryId("");
      setAddAmount("");
      setAddType("EXPENSE");
      setAddDate(new Date().toISOString().split("T")[0]);
      setAddPayee("");
      setAddPaymentMode("");
      setAddDescription("");
      setAddTags("");
      // Refresh
      fetchTransactions();
      window.dispatchEvent(new CustomEvent("transaction-added"));
    } catch (err) {
      console.error(err);
      const apiError = err as { response?: { data?: { message?: string } } };
      showToast(
        "error",
        apiError.response?.data?.message || "Failed to save transaction.",
      );
    } finally {
      setAddSubmitting(false);
    }
  };

  // Calculate net value of current transactions shown
  const netSum = transactions.reduce((acc, tx) => {
    const isNegative = ["EXPENSE", "TRANSFER"].includes(tx.transactionType);
    return acc + (isNegative ? -tx.amount : tx.amount);
  }, 0);

  return (
    <div className="space-y-6 pb-16">
      <div className="flex items-center justify-between">
        <h2 className="text-xl lg:text-3xl font-semibold text-text-primary">Transactions</h2>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`p-2 rounded-lg border transition-colors flex items-center justify-center ${
            showFilters
              ? "bg-primary-50 text-primary-600 border-primary-200"
              : "bg-bg-surface text-text-secondary border-border hover:bg-bg-muted"
          }`}
          title="Toggle Filters"
        >
          <Filter className="h-5 w-5" />
        </button>
      </div>
      
      {/* 1. Filter Controls */}
      <section className={`card p-5 space-y-4 ${showFilters ? 'block' : 'hidden'}`}>
        <form
          onSubmit={handleSearchSubmit}
          className="flex flex-col md:flex-row gap-4"
        >
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-text-muted" />
            <input
              type="text"
              placeholder="Search merchant, purpose, or note..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input"
              style={{ paddingLeft: "2.5rem" }}
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Apply Search
          </button>
        </form>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Start Date */}
          <div>
            <label className="block text-body-sm font-semibold text-text-secondary mb-1">
              From Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(0);
              }}
              className="input"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-body-sm font-semibold text-text-secondary mb-1">
              To Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(0);
              }}
              className="input"
            />
          </div>

          {/* Category Dropdown */}
          <div>
            <label className="block text-body-sm font-semibold text-text-secondary mb-1">
              Category
            </label>
            <Select
              value={categoryId}
              onChange={(val) => {
                setCategoryId(val);
                setPage(0);
              }}
              options={[
                { value: "", label: "All Categories" },
                ...categories.map((cat) => ({
                  value: cat.id,
                  label: cat.name,
                })),
              ]}
            />
          </div>

          {/* Account Dropdown */}
          <div>
            <label className="block text-body-sm font-semibold text-text-secondary mb-1">
              Account
            </label>
            <Select
              value={accountId}
              onChange={(val) => {
                setAccountId(val);
                setPage(0);
              }}
              options={[
                { value: "", label: "All Accounts" },
                ...accounts.map((acc) => ({ value: acc.id, label: acc.name })),
              ]}
            />
          </div>

          {/* Type Dropdown */}
          <div>
            <label className="block text-body-sm font-semibold text-text-secondary mb-1">
              Type
            </label>
            <Select
              value={type}
              onChange={(val) => {
                setType(val);
                setPage(0);
              }}
              options={[
                { value: "", label: "All Types" },
                { value: "EXPENSE", label: "Expense" },
                { value: "INCOME", label: "Income" },
                { value: "TRANSFER", label: "Transfer" },
                { value: "REFUND", label: "Refund" },
              ]}
            />
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-border-muted">
          <button
            onClick={resetFilters}
            className="btn btn-secondary btn-sm flex items-center gap-1.5"
          >
            <X className="h-4 w-4" />
            <span>Reset Filters</span>
          </button>
        </div>
      </section>

      {/* 2. Stats Bar */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-bg-surface p-4 rounded-xl border border-border shadow-sm">
        <div className="text-body-md text-text-secondary font-medium">
          Found{" "}
          <span className="font-semibold text-text-primary">
            {totalElements}
          </span>{" "}
          transactions
        </div>
        <div className="text-body-md text-text-secondary font-medium">
          Net Page Total:{" "}
          <span
            className={`num font-semibold text-mono-lg ${netSum < 0 ? "text-expense" : "text-income"}`}
          >
            {netSum < 0 ? "−" : "+"}
            {formatCurrency(Math.abs(netSum))}
          </span>
        </div>
      </section>

      {/* 3. Transaction List Table */}
      <section className={transactions.length === 0 && !loading ? "" : "card p-0 overflow-hidden"}>
        {loading ? (
          <TransactionsSkeleton />
        ) : transactions.length === 0 ? (
          <StateDisplay
            type="empty"
            title="No transactions found"
            description={
              (search || startDate || endDate || categoryId || accountId || type) 
                ? "No transactions match your current filters." 
                : "You don't have any transactions yet."
            }
            className="py-16"
            action={(search || startDate || endDate || categoryId || accountId || type)
              ? { label: "Clear Filters", onClick: resetFilters }
              : { label: "Add Transaction", onClick: () => setIsAddModalOpen(true) }
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-bg-subtle/40 text-text-secondary text-body-sm font-semibold">
                  <th className="py-3 px-2 sm:px-4">Date</th>
                  <th className="py-3 px-2 sm:px-4">Payee</th>
                  <th className="py-3 px-2 sm:px-4">Payment Mode</th>
                  <th className="py-3 px-2 sm:px-4">Category</th>
                  <th className="py-3 px-2 sm:px-4">Description</th>
                  <th className="py-3 px-2 sm:px-4 text-right">Amount</th>
                  <th className="py-3 px-2 sm:px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => {
                  const isNegative = ["EXPENSE", "TRANSFER"].includes(
                    tx.transactionType,
                  );
                  const isExpanded = expandedRows.has(tx.id);
                  return (
                    <tr
                      key={tx.id}
                      onClick={() => toggleRow(tx.id)}
                      className="border-b border-border-muted hover:bg-bg-subtle/25 transition-colors text-body-md cursor-pointer md:cursor-default"
                    >
                      <td className="py-3 px-2 sm:px-4 text-text-secondary whitespace-nowrap">
                        {new Date(tx.transactionDate).toLocaleDateString(
                          "en-IN",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          },
                        )}
                      </td>
                      <td className="py-3 px-2 sm:px-4 font-medium text-text-primary">
                        <div
                          className={`max-w-20 sm:max-w-48 transition-all duration-200 ${isExpanded ? "whitespace-normal wrap-break-word" : "truncate"}`}
                          title={tx.payee}
                        >
                          {tx.payee}
                        </div>
                      </td>
                      <td className="py-3 px-2 sm:px-4 text-text-secondary">
                        {tx.paymentMode && tx.paymentMode !== "OTHER" ? (
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded text-xs sm:text-xs font-medium bg-bg-muted text-text-muted max-w-15 sm:max-w-none transition-all duration-200 align-bottom ${isExpanded ? "whitespace-normal wrap-break-word" : "truncate"}`}
                            title={tx.paymentMode}
                          >
                            {tx.paymentMode}
                          </span>
                        ) : (
                          <span className="text-text-muted italic">—</span>
                        )}
                      </td>
                      <td className="py-3 px-2 sm:px-4">
                        {tx.category ? (
                          <span
                            className={`badge max-w-15 sm:max-w-none transition-all duration-200 align-bottom ${isExpanded ? "whitespace-normal wrap-break-word" : "truncate"}`}
                            style={{
                              backgroundColor: `${tx.category.color}15`,
                              color: tx.category.color,
                            }}
                            title={tx.category.name}
                          >
                            {tx.category.name}
                          </span>
                        ) : (
                          <span className="text-text-muted italic">—</span>
                        )}
                      </td>
                      <td className="py-3 px-2 sm:px-4">
                        <div
                          className={`max-w-20 sm:max-w-52 transition-all duration-200 ${isExpanded ? "whitespace-normal wrap-break-word" : "truncate"}`}
                        >
                          {tx.description ? (
                            <p
                              className="text-body-sm text-text-secondary font-normal"
                              title={tx.description}
                            >
                              {tx.description}
                            </p>
                          ) : (
                            <span className="text-text-muted italic">—</span>
                          )}
                          {tx.tags && tx.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {tx.tags.map((t) => (
                                <span
                                  key={t}
                                  className="text-xs sm:text-xs bg-bg-subtle text-text-secondary px-1.5 py-0.5 rounded"
                                >
                                  #{t}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td
                        className={`py-3 px-2 sm:px-4 text-right num font-semibold whitespace-nowrap ${
                          isNegative ? "num-negative" : "num-positive"
                        }`}
                      >
                        {isNegative ? "−" : "+"}
                        {formatCurrency(tx.amount)}
                      </td>
                      <td className="py-3 px-2 sm:px-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal(tx);
                            }}
                            className="p-1.5 rounded-md hover:bg-bg-subtle text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                            title="Edit / Audit Log"
                          >
                            <Edit3 className="h-4.5 w-4.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(tx.id);
                            }}
                            className="p-1.5 rounded-md hover:bg-destructive-bg text-text-secondary hover:text-destructive transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="h-4.5 w-4.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* 4. Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="btn btn-secondary btn-sm"
          >
            Previous
          </button>
          <span className="text-body-sm text-text-secondary font-medium mx-2">
            Page {page + 1} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="btn btn-secondary btn-sm"
          >
            Next
          </button>
        </div>
      )}

      {/* Edit / Audit History Modal */}
      {editingTx && (
        <div className="modal-overlay">
          <div className="modal max-w-4xl flex flex-col md:flex-row overflow-hidden">
            {/* Left Column: Form Edit */}
            <form
              onSubmit={handleEditSubmit}
              className="flex-1 p-6 space-y-4 border-b md:border-b-0 md:border-r border-border"
            >
              <div className="flex items-center justify-between pb-3 border-b border-border-muted">
                <h3 className="font-display text-text-primary text-heading-md">
                  Edit Transaction
                </h3>
                <button
                  type="button"
                  onClick={() => setEditingTx(null)}
                  className="lg:hidden text-text-secondary hover:text-text-primary p-1 rounded-md hover:bg-bg-subtle cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-3 mt-4">
                <div>
                  <label className="block text-body-sm font-semibold text-text-secondary mb-1">
                    Payee
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={editPayee}
                    onChange={(e) => setEditPayee(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-body-sm font-semibold text-text-secondary mb-1">
                    Category
                  </label>
                  <Select
                    value={editCategory}
                    onChange={setEditCategory}
                    options={[
                      { value: "", label: "Select Category" },
                      ...categories.map((cat) => ({
                        value: cat.id,
                        label: cat.name,
                      })),
                    ]}
                  />
                </div>

                <div>
                  <label className="block text-body-sm font-semibold text-text-secondary mb-1">
                    Payment Mode
                  </label>
                  <Select
                    value={editPaymentMode}
                    onChange={setEditPaymentMode}
                    options={[
                      { value: "", label: "Select Mode" },
                      { value: "UPI", label: "UPI" },
                      { value: "CARD", label: "Card" },
                      { value: "NETBANKING", label: "Net Banking" },
                      { value: "WALLET", label: "Wallet" },
                      { value: "CASH", label: "Cash" },
                      { value: "OTHER", label: "Other" },
                    ]}
                  />
                </div>

                <div>
                  <label className="block text-body-sm font-semibold text-text-secondary mb-1">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Extra transaction information..."
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="input resize-none"
                  />
                </div>

                <div>
                  <label className="block text-body-sm font-semibold text-text-secondary mb-1">
                    Reference Number
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={editReferenceNumber}
                    onChange={(e) => setEditReferenceNumber(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border-muted">
                <button
                  type="button"
                  onClick={() => setEditingTx(null)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="btn btn-primary min-w-28"
                >
                  {editSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>

            {/* Right Column: Transaction Audit Trail */}
            <div className="w-full md:w-[20rem] bg-bg-subtle/50 p-6 flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-border-muted mb-4">
                <div className="flex items-center gap-2 text-text-primary font-semibold">
                  <History className="h-5 w-5 text-text-secondary" />
                  <span>Audit History</span>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingTx(null)}
                  className="hidden lg:block text-text-secondary hover:text-text-primary p-1 rounded-md hover:bg-bg-subtle cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 max-h-75 md:max-h-105 pr-1">
                {loadingAudit ? (
                  <div className="flex items-center justify-center py-10 text-brand">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : auditLogs.length === 0 ? (
                  <p className="text-body-sm text-text-muted text-center py-6">
                    No historical edits found.
                  </p>
                ) : (
                  <div className="relative border-l-2 border-border pl-4 ml-2 space-y-6">
                    {auditLogs.map((log) => (
                      <div key={log.id} className="relative space-y-1">
                        {/* Dot */}
                        <div className="absolute -left-5.75 top-1.5 h-2.5 w-2.5 rounded-full bg-brand border-2 border-bg-surface" />

                        <p className="text-body-sm font-semibold text-text-primary">
                          Edited field:{" "}
                          <span className="text-brand font-mono text-[0.6875rem]">
                            {log.fieldName}
                          </span>
                        </p>
                        <p className="text-body-sm text-text-secondary">
                          Changed:{" "}
                          <span className="line-through">
                            {log.oldValue || "null"}
                          </span>{" "}
                          →{" "}
                          <span className="font-semibold text-text-primary">
                            {log.newValue || "null"}
                          </span>
                        </p>
                        <p className="text-[0.625rem] text-text-muted">
                          by {log.actor} on{" "}
                          {new Date(log.timestamp).toLocaleString("en-IN", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Transaction Modal */}
      {isAddModalOpen && (
        <div className="modal-overlay">
          <div className="modal max-w-md">
            <div className="modal-header">
              <h3 className="font-display text-text-primary text-heading-md">
                Add Transaction
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-text-secondary hover:text-text-primary p-1 rounded-md hover:bg-bg-subtle cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit}>
              <div className="modal-body space-y-4">
                {/* Date */}
                <div>
                  <label className="block text-body-sm font-semibold text-text-secondary mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={addDate}
                    onChange={(e) => setAddDate(e.target.value)}
                    className="input"
                    required
                  />
                </div>

                {/* Account */}
                <div>
                  <label className="block text-body-sm font-semibold text-text-secondary mb-1">
                    Account *
                  </label>
                  <Select
                    value={addAccountId}
                    onChange={setAddAccountId}
                    options={[
                      { value: "", label: "Select Account" },
                      ...accounts.map((acc) => ({
                        value: acc.id,
                        label: acc.name,
                      })),
                    ]}
                  />
                </div>

                {/* Transaction Type */}
                <div>
                  <label className="block text-body-sm font-semibold text-text-secondary mb-1">
                    Type *
                  </label>
                  <Select
                    value={addType}
                    onChange={setAddType}
                    options={[
                      { value: "EXPENSE", label: "Expense (Spending)" },
                      { value: "INCOME", label: "Income (Gain)" },
                      { value: "TRANSFER", label: "Transfer" },
                      { value: "REFUND", label: "Refund" },
                    ]}
                  />
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-body-sm font-semibold text-text-secondary mb-1">
                    Amount (INR) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    value={addAmount}
                    onChange={(e) => setAddAmount(e.target.value)}
                    className="input"
                    required
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-body-sm font-semibold text-text-secondary mb-1">
                    Category
                  </label>
                  <Select
                    value={addCategoryId}
                    onChange={setAddCategoryId}
                    options={[
                      { value: "", label: "Uncategorized" },
                      ...categories.map((cat) => ({
                        value: cat.id,
                        label: cat.name,
                      })),
                    ]}
                  />
                </div>

                {/* Payee */}
                <div>
                  <label className="block text-body-sm font-semibold text-text-secondary mb-1">
                    Payee
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Amazon, Salary, Cash spending"
                    value={addPayee}
                    onChange={(e) => setAddPayee(e.target.value)}
                    className="input"
                  />
                </div>

                {/* Payment Mode */}
                <div>
                  <label className="block text-body-sm font-semibold text-text-secondary mb-1">
                    Payment Mode
                  </label>
                  <Select
                    value={addPaymentMode}
                    onChange={setAddPaymentMode}
                    options={[
                      { value: "", label: "Select Mode" },
                      { value: "UPI", label: "UPI" },
                      { value: "CARD", label: "Card" },
                      { value: "NETBANKING", label: "Net Banking" },
                      { value: "WALLET", label: "Wallet" },
                      { value: "CASH", label: "Cash" },
                      { value: "OTHER", label: "Other" },
                    ]}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-body-sm font-semibold text-text-secondary mb-1">
                    Description
                  </label>
                  <textarea
                    placeholder="Any extra details..."
                    value={addDescription}
                    onChange={(e) => setAddDescription(e.target.value)}
                    className="input h-20 resize-none"
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-body-sm font-semibold text-text-secondary mb-1">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. food, trip, cash"
                    value={addTags}
                    onChange={(e) => setAddTags(e.target.value)}
                    className="input"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addSubmitting}
                  className="btn btn-primary min-w-30"
                >
                  {addSubmitting ? "Logging..." : "Log Transaction"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
