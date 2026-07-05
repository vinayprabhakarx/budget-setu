import React, { useState, useEffect, useCallback } from "react";
import { Trash2, X, Play, Pause, Edit2 } from "lucide-react";
import { Select } from "../../../components/shared/Select";
import { RecurringExpensesSkeleton } from "../../../components/skeletons/RecurringExpensesSkeleton";
import { StateDisplay } from "../../../components/shared/StateDisplay";
import { CurrencyInput } from "../../../components/shared/CurrencyInput";
import { formatCurrency } from "../../../utils/currency";
import type { RecurringExpense, Category } from "./types";
import api from "../../../api/axiosInstance";
import { useToast } from "../../../context/ToastContext";

interface Props {
  expenses: RecurringExpense[];
  categories: Category[];
  loading: boolean;
  onRefresh: () => void;
}

/**
 * Recurring Expenses Sub-Component
 *
 * Manages fixed/recurring bills (e.g. rent, subscriptions, utilities).
 * Displays frequency, amount, and next due date, allowing users to track their fixed costs.
 */
export const RecurringExpenses: React.FC<Props> = ({
  expenses,
  categories,
  loading,
  onRefresh,
}) => {
  const { showToast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pauseConfig, setPauseConfig] = useState<{
    isOpen: boolean;
    exp: RecurringExpense | null;
    date: string;
  }>({ isOpen: false, exp: null, date: "" });
  const [form, setForm] = useState<Partial<RecurringExpense>>({
    name: "",
    frequency: "MONTHLY",
    amount: 0,
    startDate: new Date().toISOString().split("T")[0],
    status: "ACTIVE",
    categoryId: "",
  });

  const openCreate = useCallback(() => {
    setForm({
      name: "",
      frequency: "MONTHLY",
      amount: 0,
      startDate: new Date().toISOString().split("T")[0],
      status: "ACTIVE",
      categoryId: categories[0]?.id || "",
    });
    setIsModalOpen(true);
  }, [categories]);

  useEffect(() => {
    const handleOpen = () => openCreate();
    window.addEventListener('open-add-recurring', handleOpen);
    return () => window.removeEventListener('open-add-recurring', handleOpen);
  }, [openCreate]);



  const handleDelete = async (id: string) => {
    if (
      !window.confirm("Are you sure you want to delete this recurring expense?")
    )
      return;
    try {
      await api.delete(`/recurring-expenses/${id}`);
      showToast("success", "Recurring expense deleted.");
      onRefresh();
    } catch {
      showToast("error", "Failed to delete recurring expense.");
    }
  };

  const handleToggleStatus = async (
    exp: RecurringExpense,
    overrideStatus?: string,
    pausedUntil?: string | null,
  ) => {
    try {
      const updatedStatus =
        overrideStatus || (exp.status === "ACTIVE" ? "PAUSED" : "ACTIVE");
      await api.put(`/recurring-expenses/${exp.id}`, {
        ...exp,
        status: updatedStatus,
        pausedUntil: pausedUntil || null,
      });
      showToast("success", `Recurring expense ${updatedStatus.toLowerCase()}.`);
      setPauseConfig({ isOpen: false, exp: null, date: "" });
      onRefresh();
    } catch {
      showToast("error", "Failed to update status.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (form.id) {
        await api.put(`/recurring-expenses/${form.id}`, form);
        showToast("success", "Recurring expense updated.");
      } else {
        await api.post("/recurring-expenses", form);
        showToast("success", "Recurring expense created.");
      }
      setIsModalOpen(false);
      onRefresh();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      showToast(
        "error",
        e.response?.data?.message || "Failed to save recurring expense.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>


      {loading ? (
        <RecurringExpensesSkeleton />
      ) : expenses.length === 0 ? (
        <StateDisplay
          type="empty"
          title="No recurring expenses found"
          className="py-12"
          action={{ label: "Add Recurring", onClick: openCreate }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {expenses.map((exp) => (
            <div
              key={exp.id}
              className={`card p-5 sm:p-6 min-h-56 flex flex-col justify-between h-full space-y-4 transition-all duration-200 shadow-xs hover:shadow-md hover:border-border-muted/80 bg-bg-surface/95 relative group ${exp.status === "PAUSED" ? "opacity-70" : ""}`}
            >
              <div className="flex justify-between items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 mb-1">
                    <h3 className="font-semibold text-text-primary text-body-lg leading-tight truncate max-w-full">
                      {exp.name || "N/A"}
                    </h3>
                    <span className="text-[0.65rem] font-semibold tracking-wider uppercase px-1.5 py-0.5 bg-primary/10 text-primary rounded border border-primary/20 shrink-0">
                      {exp.frequency || "N/A"}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 text-[0.65rem] font-semibold tracking-wider uppercase rounded shrink-0 ${exp.status === "ACTIVE" ? "badge-income" : "badge-warning"}`}
                    >
                      {exp.status || "N/A"}
                    </span>
                  </div>
                  <p className="text-body-sm text-text-secondary truncate">
                    {exp.categoryName
                      ? `Category: ${exp.categoryName}`
                      : "Category: N/A"}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-1">
                  <button
                    onClick={() => {
                      setForm(exp);
                      setIsModalOpen(true);
                    }}
                    className="text-text-muted hover:text-primary p-1"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (exp.status === "ACTIVE") {
                        setPauseConfig({ isOpen: true, exp, date: "" });
                      } else {
                        handleToggleStatus(exp, "ACTIVE", null);
                      }
                    }}
                    className="text-text-muted hover:text-primary p-1"
                  >
                    {exp.status === "ACTIVE" ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(exp.id)}
                    className="text-text-muted hover:text-expense p-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="mt-auto pt-4 border-t border-border space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-body-sm">
                  <div className="whitespace-nowrap">
                    <p className="text-body-sm font-medium text-text-primary">
                      Next Due:{" "}
                      <b className="text-text-primary">
                        {exp.nextDueDate || "N/A"}
                      </b>
                    </p>
                    {exp.status === "PAUSED" && exp.pausedUntil && (
                      <p className="text-xs text-warning mt-0.5">
                        Paused until {exp.pausedUntil}
                      </p>
                    )}
                  </div>
                  <p className="num text-heading-3 font-bold text-text-primary whitespace-nowrap">
                    {exp.amount !== null && exp.amount !== undefined
                      ? formatCurrency(exp.amount)
                      : "N/A"}
                  </p>
                </div>
                <div className="h-2 w-full bg-bg-subtle rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-deliberate ease-standard ${exp.status === "ACTIVE" ? "bg-income w-full" : "bg-warning w-1/2"}`}
                  />
                </div>
                <div className="flex justify-between items-center pt-1 text-[0.6875rem]">
                  <span
                    className={`font-semibold ${exp.status === "ACTIVE" ? "text-income" : "text-warning"}`}
                  >
                    {exp.status === "ACTIVE"
                      ? "Active Schedule"
                      : "Paused Schedule"}
                  </span>
                  <span className="text-text-muted">Auto-recurring</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-background card w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-body-lg font-semibold text-text-primary">
                Recurring Expense
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-text-muted hover:text-text-primary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-body-sm text-text-secondary mb-1">
                  Expense Name
                </label>
                <input
                  required
                  type="text"
                  className="input"
                  value={form.name || ""}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Netflix Subscription"
                />
              </div>
              <div>
                <label className="block text-body-sm text-text-secondary mb-1">
                  Amount
                </label>
                <CurrencyInput
                  required
                  value={form.amount || ""}
                  onChange={(e) =>
                    setForm({ ...form, amount: Number(e.target.value) })
                  }
                />
              </div>
              <div>
                <label className="block text-body-sm text-text-secondary mb-1">
                  Category
                </label>
                <Select
                  value={form.categoryId || ""}
                  onChange={(val) => setForm({ ...form, categoryId: val })}
                  options={categories.map((c) => ({
                    value: c.id,
                    label: c.name,
                  }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-body-sm text-text-secondary mb-1">
                    Frequency
                  </label>
                  <Select
                    value={form.frequency || "MONTHLY"}
                    onChange={(val) => setForm({ ...form, frequency: val })}
                    options={[
                      { value: "MONTHLY", label: "Monthly" },
                      { value: "QUARTERLY", label: "Quarterly" },
                      { value: "YEARLY", label: "Yearly" },
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-body-sm text-text-secondary mb-1">
                    Start Date
                  </label>
                  <input
                    required
                    type="date"
                    className="input"
                    value={form.startDate || ""}
                    onChange={(e) =>
                      setForm({ ...form, startDate: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3">
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
                  className="btn btn-primary"
                >
                  {submitting ? "Saving..." : "Save Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {pauseConfig.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-background card w-full max-w-sm overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-body-lg font-semibold text-text-primary">
                Pause Subscription
              </h2>
              <button
                onClick={() =>
                  setPauseConfig({ isOpen: false, exp: null, date: "" })
                }
                className="text-text-muted hover:text-text-primary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-body-sm text-text-secondary">
                You are about to pause <strong>{pauseConfig.exp?.name}</strong>.
                You can optionally set a date for when it should automatically
                resume.
              </p>
              <div>
                <label className="block text-body-sm text-text-secondary mb-1">
                  Pause Until (Optional)
                </label>
                <input
                  type="date"
                  className="input"
                  value={pauseConfig.date}
                  onChange={(e) =>
                    setPauseConfig({ ...pauseConfig, date: e.target.value })
                  }
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setPauseConfig({ isOpen: false, exp: null, date: "" })
                  }
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() =>
                    pauseConfig.exp &&
                    handleToggleStatus(
                      pauseConfig.exp,
                      "PAUSED",
                      pauseConfig.date || null,
                    )
                  }
                  className="btn btn-primary"
                >
                  Confirm Pause
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
