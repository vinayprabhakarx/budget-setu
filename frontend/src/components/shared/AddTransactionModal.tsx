import React, { useState, useEffect, useCallback, useRef } from "react";
import api from "../../api/axiosInstance";
import { useToast } from "../../context/ToastContext";
import { Select } from "./Select";
import { CurrencyInput } from "./CurrencyInput";
import { Dialog, ModalFooter } from "../ui";

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

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { showToast } = useToast();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [accountId, setAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [transactionType, setTransactionType] = useState("EXPENSE");
  const [transactionDate, setTransactionDate] = useState(
    () => new Date().toISOString().split("T")[0],
  );
  const [payee, setPayee] = useState("");
  const [paymentMode, setPaymentMode] = useState("");
  const [description, setDescription] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const hasData = useRef(false);

  const fetchMeta = useCallback(
    async (showLoader = true) => {
      if (showLoader) setLoading(true);
      try {
        const [accRes, catRes] = await Promise.all([
          api.get<Account[]>("/accounts"),
          api.get<Category[]>("/categories"),
        ]);
        setAccounts(accRes.data);
        setCategories(catRes.data);

        if (accRes.data.length > 0)
          setAccountId((prev) => (prev ? prev : accRes.data[0].id));
        if (catRes.data.length > 0)
          setCategoryId((prev) => (prev ? prev : catRes.data[0].id));

        hasData.current = true;
      } catch (err) {
        console.error("Failed to load accounts/categories", err);
        if (showLoader)
          showToast(
            "error",
            "Failed to retrieve accounts and categories list.",
          );
      } finally {
        if (showLoader) setLoading(false);
      }
    },
    [showToast],
  );

  useEffect(() => {
    if (isOpen) {
      let active = true;
      Promise.resolve().then(() => {
        if (active) {
          // Reset Form State
          setAccountId("");
          setCategoryId("");
          setAmount("");
          setTransactionType("EXPENSE");
          setTransactionDate(new Date().toISOString().split("T")[0]);
          setPayee("");
          setPaymentMode("");
          setDescription("");
          setReferenceNumber("");
          setErrors({});
          fetchMeta(!hasData.current);
        }
      });
      return () => {
        active = false;
      };
    }
  }, [isOpen, fetchMeta]);

  const validate = () => {
    const tempErrors: Record<string, string> = {};
    if (!accountId) tempErrors.accountId = "Account is required";
    if (!categoryId) tempErrors.categoryId = "Category is required";
    if (!amount || Number(amount) <= 0)
      tempErrors.amount = "Please enter a positive amount";
    if (!transactionDate) tempErrors.transactionDate = "Date is required";
    if (!payee.trim()) tempErrors.payee = "Payee is required";

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = {
        accountId,
        categoryId,
        amount: Number(amount),
        transactionType,
        transactionDate,
        payee: payee.trim(),
        paymentMode: paymentMode.trim() || undefined,
        description: description.trim() || undefined,
        referenceNumber: referenceNumber.trim() || undefined,
      };

      await api.post("/transactions", payload);
      showToast("success", "Manual transaction added successfully.");

      // Dispatch standard refresh event
      window.dispatchEvent(new CustomEvent("transaction-added"));
      onClose();
    } catch (err) {
      console.error(err);
      const apiError = err as { response?: { data?: { message?: string } } };
      if (apiError.response?.data?.message) {
        showToast("error", apiError.response.data.message);
      } else {
        showToast("error", "An error occurred while creating the transaction.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Add Transaction"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit}>
        <div className="modal-body space-y-4">
          {/* Type Switcher */}
          <div className="flex items-center overflow-x-auto hide-scrollbar border-b border-border w-full">
            {["EXPENSE", "INCOME", "TRANSFER", "REFUND"].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setTransactionType(type)}
                className={`flex-1 min-w-17.5 px-2 py-2 text-center text-body-sm font-semibold border-b-2 -mb-px transition-colors cursor-pointer capitalize ${
                  transactionType === type
                    ? "border-primary text-text-primary"
                    : "border-transparent text-text-muted hover:text-text-primary"
                }`}
              >
                {type.charAt(0) + type.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          {/* Amount & Date row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-body-sm font-semibold text-text-secondary mb-1">
                Amount *
              </label>
              <CurrencyInput
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={errors.amount ? "input-error" : ""}
              />
              {errors.amount && (
                <p className="text-destructive text-body-sm mt-1">
                  {errors.amount}
                </p>
              )}
            </div>

            <div>
              <label className="block text-body-sm font-semibold text-text-secondary mb-1">
                Date *
              </label>
              <input
                type="date"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                className={`input ${errors.transactionDate ? "input-error" : ""}`}
              />
              {errors.transactionDate && (
                <p className="text-destructive text-body-sm mt-1">
                  {errors.transactionDate}
                </p>
              )}
            </div>
          </div>

          {/* Account selection */}
          <div>
            <label className="block text-body-sm font-semibold text-text-secondary mb-1">
              Bank Account *
            </label>
            {accounts.length === 0 && !loading ? (
              <p className="text-body-sm text-text-muted">
                No active accounts found. Please create one first.
              </p>
            ) : (
              <Select
                value={accountId}
                onChange={setAccountId}
                options={accounts.map((acc) => ({
                  value: acc.id,
                  label: `${acc.name} (${acc.bankName} - ${acc.accountNumber})`,
                }))}
                error={!!errors.accountId}
                disabled={loading}
                placeholder={
                  loading ? "Fetching accounts..." : "Select Account"
                }
              />
            )}
            {errors.accountId && (
              <p className="text-destructive text-body-sm mt-1">
                {errors.accountId}
              </p>
            )}
          </div>

          {/* Category selection */}
          <div>
            <label className="block text-body-sm font-semibold text-text-secondary mb-1">
              Category *
            </label>
            <Select
              value={categoryId}
              onChange={setCategoryId}
              options={categories.map((cat) => ({
                value: cat.id,
                label: `${cat.name} (${cat.type})`,
              }))}
              error={!!errors.categoryId}
              disabled={loading}
              placeholder={
                loading ? "Fetching categories..." : "Select Category"
              }
            />
            {errors.categoryId && (
              <p className="text-destructive text-body-sm mt-1">
                {errors.categoryId}
              </p>
            )}
          </div>

          <div>
            <label className="block text-body-sm font-semibold text-text-secondary mb-1">
              Payee *
            </label>
            <input
              type="text"
              placeholder="e.g. Swiggy, HDFC Bill Pay, Salary"
              value={payee}
              onChange={(e) => setPayee(e.target.value)}
              className={`input ${errors.payee ? "input-error" : ""}`}
            />
            {errors.payee && (
              <p className="text-destructive text-body-sm mt-1">
                {errors.payee}
              </p>
            )}
          </div>

          {/* Payment Mode */}
          <div>
            <label className="block text-body-sm font-semibold text-text-secondary mb-1">
              Payment Mode
            </label>
            <Select
              value={paymentMode}
              onChange={setPaymentMode}
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
              rows={2}
              placeholder="Add any extra transaction context..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input resize-none"
            />
          </div>

          {/* Reference Number */}
          <div>
            <label className="block text-body-sm font-semibold text-text-secondary mb-1">
              Reference Number
            </label>
            <input
              type="text"
              placeholder="e.g. UPI Ref, Cheque No, Transaction ID"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              className="input"
            />
          </div>
        </div>

        <ModalFooter
          onCancel={onClose}
          submitText="Save Transaction"
          isLoading={submitting}
          loadingText="Saving..."
          disabled={accounts.length === 0}
        />
      </form>
    </Dialog>
  );
};
