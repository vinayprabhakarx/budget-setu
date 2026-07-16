import React, { useEffect, useState, useCallback } from "react";
import { Dialog, Button, Pagination, ModalFooter, Dropdown } from "../../components/ui";
import { useNavigate } from "react-router-dom";
import api from "../../api/axiosInstance";
import { useToast } from "../../context/ToastContext";
import { formatCurrency } from "../../utils/currency";
import { Edit3, Trash2, Loader2, History, Plus, MoreHorizontal } from "lucide-react";
import { Select } from "../../components/shared/Select";
import { TransactionsSkeleton } from "../../components/skeletons/TransactionsSkeleton";
import { StateDisplay } from "../../components/shared/StateDisplay";
import { CurrencyInput } from "../../components/shared/CurrencyInput";
import { MaskedDateInput } from "../../components/shared/MaskedDateInput";
import { PageHeader } from "../../components/shared/PageHeader";
import { FilterSection } from "../../components/shared/FilterSection";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../../components/shared/Table";

interface Account {
  id: string;
  bankName: string;
  accountNumber: string;
  accountType: string;
  balance: number | null;
}

const getAccountDisplayName = (acc: Account) => {
  if (!acc.bankName && !acc.accountNumber) return "Account";
  const bank = acc.bankName || acc.accountType || "Account";
  const num = acc.accountNumber ? acc.accountNumber.slice(-4) : "";
  return num ? `${bank} - ${num}` : bank;
};

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
  categoryId?: string;
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
  const navigate = useNavigate();
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
  const [applyMerchantRule, setApplyMerchantRule] = useState(false);
  const [contributeGlobally, setContributeGlobally] = useState(false);
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
      if (response.data.totalPages > 0 && page >= response.data.totalPages) {
        setPage(response.data.totalPages - 1);
      } else {
        setTransactions(response.data.content);
        setTotalPages(response.data.totalPages);
        setTotalElements(response.data.totalElements);
      }
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
    const handleTransactionAdded = () => {
      setPage(0);
      setRefreshCounter((prev) => prev + 1);
    };
    const handleTransactionUpdated = () => {
      setRefreshCounter((prev) => prev + 1);
    };
    window.addEventListener("transaction-added", handleTransactionAdded);
    window.addEventListener("transactions-updated", handleTransactionUpdated);
    return () => {
      window.removeEventListener("transaction-added", handleTransactionAdded);
      window.removeEventListener("transactions-updated", handleTransactionUpdated);
    };
  }, []);

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
      window.dispatchEvent(new CustomEvent("transactions-updated"));
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to delete transaction.");
    }
  };

  const openEditModal = async (tx: Transaction) => {
    setEditingTx(tx);
    setEditCategory(tx.category?.id || tx.categoryId || "");
    setEditPaymentMode(tx.paymentMode || "");
    setEditDescription(tx.description || "");
    setEditPayee(tx.payee || "");
    setEditReferenceNumber(tx.referenceNumber || "");
    setApplyMerchantRule(false);
    setContributeGlobally(false);
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

      if (applyMerchantRule && editPayee.trim() && editCategory) {
        try {
          const ruleRes = await api.post("/merchant-rules", {
            merchantPattern: editPayee.trim(),
            categoryId: editCategory,
            matchType: "CONTAINS",
          });
          const newRuleId =
            (ruleRes as { data?: { id?: string }; id?: string }).data?.id ||
            (ruleRes as { id?: string }).id;

          if (contributeGlobally && newRuleId) {
            try {
              await api.post(`/merchant-rules/${newRuleId}/contribute`);
            } catch (cErr) {
              console.error("Failed to contribute rule globally:", cErr);
            }
          }

          const recatRes = await api.post("/merchant-rules/recategorize", {
            merchantPattern: editPayee.trim(),
            categoryId: editCategory,
          });
          const count =
            (
              recatRes as {
                data?: { updated?: number; updatedCount?: number };
                updated?: number;
              }
            ).data?.updated ??
            (recatRes as { data?: { updatedCount?: number } }).data
              ?.updatedCount ??
            (recatRes as { updated?: number }).updated ??
            0;

          if (count > 0) {
            showToast(
              "success",
              `Updated transaction & ${count} other matching transactions.`,
            );
          } else {
            showToast(
              "success",
              "Transaction updated & merchant rule saved for future.",
            );
          }
        } catch (err) {
          console.error("Failed to apply merchant rule:", err);
          showToast(
            "success",
            "Transaction updated (note: rule creation had an issue).",
          );
        }
      } else {
        showToast("success", "Transaction details updated.");
      }
      setEditingTx(null);
      fetchTransactions();
      window.dispatchEvent(new CustomEvent("transactions-updated"));
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
      <PageHeader
        title="Transactions"
        subtitle="A comprehensive view of all your recorded transactions."
        onFilterClick={() => setShowFilters(!showFilters)}
        showFilters={showFilters}
        onRefreshClick={fetchTransactions}
        isRefreshing={loading}
      >
        <Button
          variant="primary"
          size="sm"
          onClick={() =>
            accounts.length > 0
              ? setIsAddModalOpen(true)
              : navigate("/accounts#new")
          }
          leftIcon={<Plus className="h-4 w-4" />}
        >
          {accounts.length > 0 ? "Add Transaction" : "Add Bank Account"}
        </Button>
      </PageHeader>

      {/* 1. Filter Controls */}
      <FilterSection
        isOpen={showFilters}
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search merchant, purpose, or note..."
        onSearchSubmit={handleSearchSubmit}
        hasActiveFilters={Boolean(
          search || startDate || endDate || categoryId || accountId || type,
        )}
        onReset={resetFilters}
        layout="stack"
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Start Date */}
          <div>
            <label className="block text-body-xs font-semibold text-text-secondary mb-1">
              From Date
            </label>
            <MaskedDateInput
              value={startDate}
              onChange={(val) => {
                setStartDate(val);
                setPage(0);
              }}
              size="sm"
              className="w-full"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-body-xs font-semibold text-text-secondary mb-1">
              To Date
            </label>
            <MaskedDateInput
              value={endDate}
              onChange={(val) => {
                setEndDate(val);
                setPage(0);
              }}
              size="sm"
              className="w-full"
            />
          </div>

          {/* Category Dropdown */}
          <div>
            <label className="block text-body-xs font-semibold text-text-secondary mb-1">
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
              size="sm"
            />
          </div>

          {/* Account Dropdown */}
          <div>
            <label className="block text-body-xs font-semibold text-text-secondary mb-1">
              Account
            </label>
            <Select
              value={accountId}
              onChange={(val) => {
                setAccountId(val);
                setPage(0);
              }}
              options={[
                { value: "ALL", label: "All Accounts" },
                ...accounts.map((acc) => {
                  const bank = acc.bankName || acc.accountType || "Account";
                  const num = acc.accountNumber
                    ? acc.accountNumber.slice(-4)
                    : "";
                  const displayName = num ? `${bank} - ${num}` : bank;
                  return { value: acc.id, label: displayName };
                }),
              ]}
              size="sm"
            />
          </div>

          {/* Type Dropdown */}
          <div>
            <label className="block text-body-xs font-semibold text-text-secondary mb-1">
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
              size="sm"
            />
          </div>
        </div>
      </FilterSection>

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
      <section
        className={
          transactions.length === 0 && !loading
            ? ""
            : "card p-0 overflow-hidden"
        }
      >
        {loading ? (
          <TransactionsSkeleton />
        ) : transactions.length === 0 ? (
          <div className="animate-fade-in">
            <StateDisplay
            type="empty"
            title="No transactions found"
            description={
              search || startDate || endDate || categoryId || accountId || type
                ? "No transactions match your current filters."
                : "You don't have any transactions yet."
            }
            className="py-16"
            action={
              search || startDate || endDate || categoryId || accountId || type
                ? { label: "Clear Filters", onClick: resetFilters }
                : {
                    label:
                      accounts.length > 0
                        ? "Add Transaction"
                        : "Add Bank Account",
                    onClick: () =>
                      accounts.length > 0
                        ? setIsAddModalOpen(true)
                        : navigate("/accounts#new"),
                  }
            }
          />
          </div>
        ) : (
          <div className="animate-fade-in">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Payee</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx) => {
                const isNegative = ["EXPENSE", "TRANSFER"].includes(
                  tx.transactionType,
                );
                const isExpanded = expandedRows.has(tx.id);
                const catObj =
                  tx.category || categories.find((c) => c.id === tx.categoryId);
                return (
                  <TableRow
                    key={tx.id}
                    onClick={() => toggleRow(tx.id)}
                    className="cursor-pointer md:cursor-default text-body-md"
                  >
                    <TableCell className="text-body-md text-text-secondary whitespace-nowrap">
                      {new Date(tx.transactionDate).toLocaleDateString(
                        "en-IN",
                        {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        },
                      )}
                    </TableCell>
                    <TableCell className="text-body-lg font-semibold text-text-primary">
                      <div
                        className={`max-w-36 sm:max-w-64 transition-all duration-200 ${isExpanded ? "whitespace-normal wrap-break-word" : "truncate"}`}
                        title={tx.payee}
                      >
                        {tx.payee}
                      </div>
                    </TableCell>
                    <TableCell className="text-text-secondary">
                      {(() => {
                        const acc = accounts.find((a) => a.id === tx.accountId);
                        let accountName = "";
                        if (acc) {
                          const bank =
                            acc.bankName || acc.accountType || "Account";
                          const num = acc.accountNumber
                            ? acc.accountNumber.slice(-4)
                            : "";
                          accountName = num ? `${bank} - ${num}` : bank;
                        }
                        return accountName ? (
                          <span
                            className={`inline-block px-2 py-0.5 rounded-md text-body-sm font-medium bg-bg-muted text-text-secondary max-w-36 sm:max-w-none transition-all duration-200 align-bottom truncate`}
                            title={accountName}
                          >
                            {accountName}
                          </span>
                        ) : (
                          <span className="text-text-muted italic">—</span>
                        );
                      })()}
                    </TableCell>
                    <TableCell>
                      {catObj ? (
                        <span
                          className={`badge text-body-sm font-medium px-2.5 py-0.5 rounded-md max-w-36 sm:max-w-none transition-all duration-200 align-bottom ${isExpanded ? "whitespace-normal wrap-break-word" : "truncate"}`}
                          style={{
                            backgroundColor: `${catObj.color}15`,
                            color: catObj.color,
                          }}
                          title={catObj.name}
                        >
                          {catObj.name}
                        </span>
                      ) : (
                        <span className="text-text-muted italic">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div
                        className={`max-w-36 sm:max-w-64 transition-all duration-200 ${isExpanded ? "whitespace-normal wrap-break-word" : "truncate"}`}
                      >
                        {tx.description ? (
                          <p
                            className="text-body-md text-text-secondary font-normal"
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
                                className="text-body-sm font-medium bg-bg-subtle text-text-secondary px-2 py-0.5 rounded-md"
                              >
                                #{t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell
                      className={`text-right num text-mono-lg font-bold whitespace-nowrap ${
                        isNegative ? "num-negative" : "num-positive"
                      }`}
                    >
                      {isNegative ? "−" : "+"}
                      {formatCurrency(tx.amount)}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                        <Dropdown
                          align="right"
                          menuClassName="w-44"
                          trigger={
                            <button
                              className="p-1.5 rounded-md hover:bg-bg-subtle text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                              title="Actions"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                          }
                          items={[
                            {
                              id: "edit",
                              label: "Edit / Audit Log",
                              icon: <Edit3 className="h-4 w-4" />,
                              onClick: () => openEditModal(tx),
                            },
                            {
                              id: "delete",
                              label: "Delete",
                              icon: <Trash2 className="h-4 w-4" />,
                              variant: "danger",
                              onClick: () => handleDelete(tx.id),
                            },
                          ]}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          </div>
        )}
      </section>

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />

      {/* Edit / Audit History Modal */}
      <Dialog
        isOpen={!!editingTx}
        onClose={() => setEditingTx(null)}
        title="Edit Transaction"
        maxWidth="2xl"
      >

            {/* Modal Body & Form */}
            <form
              onSubmit={handleEditSubmit}
              className="flex-1 flex flex-col overflow-y-auto max-h-[80vh]"
            >
              <div className="p-6 space-y-4 flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                </div>

                {editPayee.trim() && editCategory && (
                  <div className="space-y-2.5 pt-2 border-t border-border mt-3">
                    <div className="flex items-start gap-2.5 bg-bg-subtle/80 p-3.5 rounded-xl border border-border">
                      <input
                        type="checkbox"
                        id="applyMerchantRule"
                        checked={applyMerchantRule}
                        onChange={(e) => setApplyMerchantRule(e.target.checked)}
                        className="mt-0.5 rounded border-border text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                      />
                      <label
                        htmlFor="applyMerchantRule"
                        className="text-body-sm text-text-secondary leading-tight cursor-pointer flex-1"
                      >
                        <span className="font-semibold text-text-primary block mb-0.5 text-body-sm">
                          Always categorize "{editPayee.trim()}" as this
                          category?
                        </span>
                        Automatically saves a rule for future imports and
                        recategorizes all past matching transactions.
                      </label>
                    </div>

                    {applyMerchantRule && (
                      <div className="flex items-start gap-2.5 bg-primary/5 p-3.5 rounded-xl border border-primary/20 ml-6 animate-in fade-in slide-in-from-top-1 duration-200">
                        <input
                          type="checkbox"
                          id="contributeGlobally"
                          checked={contributeGlobally}
                          onChange={(e) =>
                            setContributeGlobally(e.target.checked)
                          }
                          className="mt-0.5 rounded border-border text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                        />
                        <label
                          htmlFor="contributeGlobally"
                          className="text-body-sm text-text-secondary leading-tight cursor-pointer flex-1"
                        >
                          <span className="font-semibold text-primary block mb-0.5 text-body-sm">
                            Contribute this merchant mapping globally
                          </span>
                          Help improve BudgetSetu by sharing this
                          payee-to-category mapping with the community database.
                        </label>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                {/* Audit History Accordion / Section */}
                <div className="pt-4 border-t border-border-muted mt-2">
                  <details className="group">
                    <summary className="flex items-center justify-between text-body-sm font-semibold text-text-secondary hover:text-text-primary cursor-pointer select-none py-1">
                      <div className="flex items-center gap-2">
                        <History className="h-4 w-4 text-text-muted group-hover:text-primary transition-colors" />
                        <span>Audit History</span>
                        {auditLogs.length > 0 && (
                          <span className="px-1.5 py-0.5 text-caption font-bold rounded-full bg-brand/10 text-brand">
                            {auditLogs.length}
                          </span>
                        )}
                      </div>
                      <span className="text-body-sm text-text-muted group-open:hidden">
                        View edits
                      </span>
                      <span className="text-body-sm text-text-muted hidden group-open:inline">
                        Hide edits
                      </span>
                    </summary>

                    <div className="mt-3 bg-bg-subtle/50 rounded-xl p-4 max-h-52 overflow-y-auto border border-border-muted">
                      {loadingAudit ? (
                        <div className="flex items-center justify-center py-6 text-brand">
                          <Loader2 className="h-5 w-5 animate-spin" />
                        </div>
                      ) : auditLogs.length === 0 ? (
                        <p className="text-body-sm text-text-muted text-center py-4">
                          No historical edits found for this transaction.
                        </p>
                      ) : (
                        <div className="relative border-l-2 border-border pl-4 ml-2 space-y-4 my-2">
                          {auditLogs.map((log) => (
                            <div key={log.id} className="relative space-y-1">
                              <div className="absolute -left-5.25 top-1.5 h-2 w-2 rounded-full bg-brand border-2 border-bg-surface" />
                              <p className="text-body-sm font-semibold text-text-primary">
                                Edited field:{" "}
                                <span className="text-brand font-mono text-caption">
                                  {log.fieldName}
                                </span>
                              </p>
                              <p className="text-body-sm text-text-secondary">
                                Changed:{" "}
                                <span className="line-through text-text-muted">
                                  {log.oldValue || "null"}
                                </span>{" "}
                                →{" "}
                                <span className="font-semibold text-text-primary">
                                  {log.newValue || "null"}
                                </span>
                              </p>
                              <p className="text-micro text-text-muted">
                                by {log.actor} on{" "}
                                {new Date(log.timestamp).toLocaleString(
                                  "en-IN",
                                  {
                                    day: "numeric",
                                    month: "short",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </details>
                </div>
              </div>

              <div className="flex justify-end gap-3 p-6 pt-4 border-t border-border-muted bg-bg-surface/50">
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
      </Dialog>

      {/* Add Transaction Modal */}
      <Dialog
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Transaction"
        maxWidth="md"
      >
            <form onSubmit={handleAddSubmit}>
              <div className="modal-body space-y-4">
                {/* Date */}
                <div>
                  <label className="block text-body-sm font-semibold text-text-secondary mb-1">
                    Date *
                  </label>
                  <MaskedDateInput
                    value={addDate}
                    onChange={setAddDate}
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
                        label: getAccountDisplayName(acc),
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
                  <CurrencyInput
                    placeholder="0.00"
                    value={addAmount}
                    onChange={(e) => setAddAmount(e.target.value)}
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

              <ModalFooter
                onCancel={() => setIsAddModalOpen(false)}
                submitText="Log Transaction"
                isLoading={addSubmitting}
                loadingText="Logging..."
              />
            </form>
      </Dialog>
    </div>
  );
};
