import { MaskedDateInput } from "../../components/shared/MaskedDateInput";
import React, { useEffect, useState, useCallback } from "react";
import {
  AnalyticsSummarySkeleton,
  AnalyticsChartsSkeleton,
  AnalyticsTopExpensesSkeleton,
} from "../../components/skeletons/AnalyticsSkeleton";
import { StateDisplay } from "../../components/shared/StateDisplay";
import { formatCurrency } from "../../utils/currency";
import { formatMerchantName } from "../../utils/merchant";
import api from "../../api/axiosInstance";
import { useToast } from "../../context/ToastContext";
import { PageHeader } from "../../components/shared/PageHeader";
import { FilterSection } from "../../components/shared/FilterSection";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as ChartTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import type { TooltipContentProps } from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Receipt,
} from "lucide-react";
import { Select } from "../../components/shared/Select";

interface AnalyticsData {
  summaryCards: {
    income: number;
    expense: number;
    net: number;
    savingsRate: number;
  };
  previousPeriodSummary?: {
    income: number;
    expense: number;
    net: number;
    savingsRate: number;
  };
  trend: {
    period: string;
    income: number;
    expense: number;
  }[];
  categoryBreakdown: {
    categoryId: string;
    name: string;
    color: string;
    amount: number;
    percent: number;
  }[];
  incomeCategoryBreakdown?: {
    categoryId: string;
    name: string;
    color: string;
    amount: number;
    percent: number;
  }[];
  topExpenses?: {
    transactionId: string;
    description: string;
    payee?: string;
    date: string;
    amount: number;
    categoryName: string;
    categoryColor: string;
  }[];
  topIncomes?: {
    transactionId: string;
    description: string;
    payee?: string;
    date: string;
    amount: number;
    categoryName: string;
    categoryColor: string;
  }[];
}

const presetRanges = [
  { label: "This Month", type: "thisMonth" },
  { label: "Last Month", type: "lastMonth" },
  { label: "This Quarter", type: "thisQuarter" },
  { label: "This Year", type: "thisYear" },
  { label: "Last 6 Months", type: "last6Months" },
];

/**
 * Analytics Page Component
 *
 * Provides in-depth visual insights into user finances.
 * Includes interactive charts for income/expense trends, categorical breakdowns,
 * and tracks top expenses over customizable date ranges.
 */
export const Analytics: React.FC = () => {
  const { showToast } = useToast();

  // State
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  // Filter State
  const [showFilters, setShowFilters] = useState(false);
  const [groupBy, setGroupBy] = useState<"day" | "week" | "month">("month");
  const [fromDate, setFromDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split("T")[0];
  });
  const [toDate, setToDate] = useState<string>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    d.setDate(0);
    return d.toISOString().split("T")[0];
  });
  const [activePreset, setActivePreset] = useState<string>("thisMonth");

  // UI State
  const [breakdownType, setBreakdownType] = useState<"EXPENSE" | "INCOME">(
    "EXPENSE",
  );
  const [topTransactionsType, setTopTransactionsType] = useState<
    "EXPENSE" | "INCOME"
  >("EXPENSE");

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<AnalyticsData>("/analytics/summary", {
        params: {
          from: fromDate,
          to: toDate,
          groupBy: groupBy,
        },
      });
      setData(response.data);
    } catch (err: unknown) {
      const errMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to load analytics data";
      setError(errMsg);
      showToast("error", errMsg);
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, groupBy, showToast]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  useEffect(() => {
    const handleTxnUpdate = () => {
      fetchAnalytics();
    };
    window.addEventListener("transaction-added", handleTxnUpdate);
    window.addEventListener("transactions-updated", handleTxnUpdate);
    return () => {
      window.removeEventListener("transaction-added", handleTxnUpdate);
      window.removeEventListener("transactions-updated", handleTxnUpdate);
    };
  }, [fetchAnalytics]);

  const handlePresetChange = (type: string) => {
    setActivePreset(type);
    const d = new Date();
    switch (type) {
      case "thisMonth": {
        d.setDate(1);
        setFromDate(d.toISOString().split("T")[0]);
        const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
        setToDate(end.toISOString().split("T")[0]);
        setGroupBy("week");
        break;
      }
      case "lastMonth": {
        d.setMonth(d.getMonth() - 1);
        d.setDate(1);
        setFromDate(d.toISOString().split("T")[0]);
        const lastEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);
        setToDate(lastEnd.toISOString().split("T")[0]);
        setGroupBy("week");
        break;
      }
      case "thisQuarter": {
        const q = Math.floor(d.getMonth() / 3);
        const startQ = new Date(d.getFullYear(), q * 3, 1);
        const endQ = new Date(d.getFullYear(), q * 3 + 3, 0);
        setFromDate(startQ.toISOString().split("T")[0]);
        setToDate(endQ.toISOString().split("T")[0]);
        setGroupBy("month");
        break;
      }
      case "thisYear": {
        setFromDate(
          new Date(d.getFullYear(), 0, 1).toISOString().split("T")[0],
        );
        setToDate(
          new Date(d.getFullYear(), 11, 31).toISOString().split("T")[0],
        );
        setGroupBy("month");
        break;
      }
      case "last6Months": {
        const end6 = new Date(d.getFullYear(), d.getMonth() + 1, 0);
        d.setMonth(d.getMonth() - 5);
        d.setDate(1);
        setFromDate(d.toISOString().split("T")[0]);
        setToDate(end6.toISOString().split("T")[0]);
        setGroupBy("month");
        break;
      }
    }
  };

  const handleCustomDateChange = (val: string, field: "from" | "to") => {
    setActivePreset("custom");
    if (field === "from") setFromDate(val);
    else setToDate(val);
  };

  const renderTooltip = ({ active, payload, label }: TooltipContentProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-bg-elevated border border-border p-3 rounded-lg shadow-lg">
          <p className="text-body-md font-semibold text-text-primary mb-2">
            {label}
          </p>
          {payload.map((entry, index: number) => (
            <p
              key={index}
              className="num text-mono-md font-medium"
              style={{ color: entry.color }}
            >
              {entry.name}: {formatCurrency(Number(entry.value) || 0)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderPieTooltip = ({ active, payload }: TooltipContentProps) => {
    if (active && payload && payload.length) {
      const slice = payload[0].payload as
        | { name?: string; amount?: number; percent?: number }
        | undefined;
      if (!slice) return null;
      return (
        <div className="bg-bg-elevated border border-border p-3 rounded-lg shadow-lg">
          <p className="text-body-md font-semibold text-text-primary mb-1">
            {slice.name}
          </p>
          <p className="num text-mono-md font-medium text-text-secondary">
            {formatCurrency(slice.amount || 0)} (
            {(slice.percent || 0).toFixed(1)}%)
          </p>
        </div>
      );
    }
    return null;
  };

  const renderTrendIndicator = (
    current: number,
    previous?: number,
    inverse: boolean = false,
  ) => {
    if (previous === undefined || previous === 0) return null;
    const diff = current - previous;
    const percentChange = (diff / previous) * 100;

    // Inverse means higher is worse (e.g., expenses)
    const isPositive = inverse ? diff <= 0 : diff >= 0;
    const isNeutral = diff === 0;

    const Icon = isNeutral ? Minus : diff > 0 ? ArrowUpRight : ArrowDownRight;
    const textColor = isNeutral
      ? "text-text-tertiary"
      : isPositive
        ? "text-income"
        : "text-expense";

    return (
      <div
        className={`flex items-center gap-1 text-body-xs font-medium ${textColor}`}
      >
        <Icon className="w-3 h-3 shrink-0" />
        <span className="num">{Math.abs(percentChange).toFixed(1)}% vs prev period</span>
      </div>
    );
  };

  if (error && !data) {
    return (
      <StateDisplay
        type="error"
        title="Failed to load analytics"
        description={error}
      />
    );
  }

  const isLoading = loading && !data;

  const safeData =
    data ||
    ({
      summaryCards: {
        income: 0,
        expense: 0,
        netSavings: 0,
        savingsRate: 0,
        net: 0,
      },
      trend: [],
      categoryBreakdown: [],
      incomeCategoryBreakdown: [],
    } as AnalyticsData);
  const currentBreakdown =
    breakdownType === "EXPENSE"
      ? safeData.categoryBreakdown
      : safeData.incomeCategoryBreakdown || [];

  const currentTopTransactions =
    topTransactionsType === "EXPENSE"
      ? safeData.topExpenses || []
      : safeData.topIncomes || [];

  return (
    <div className="flex flex-col h-full gap-6 max-w-7xl mx-auto w-full pb-24">
      <PageHeader
        title="Analytics"
        subtitle="Insights and financial breakdowns across your accounts."
        onFilterClick={() => setShowFilters(!showFilters)}
        showFilters={showFilters}
        onRefreshClick={fetchAnalytics}
        isRefreshing={loading}
      />

      {/* Controls Bar */}
      <FilterSection
        isOpen={showFilters}
        hasActiveFilters={activePreset !== "thisMonth" || groupBy !== "week"}
        onReset={() => handlePresetChange("thisMonth")}
        className="sticky top-0 z-10"
      >
        <div className="flex flex-wrap gap-2 items-center">
          {presetRanges.map((preset) => (
            <button
              key={preset.type}
              onClick={() => handlePresetChange(preset.type)}
              className={`h-control-sm px-3.5 flex items-center justify-center rounded-lg text-body-sm font-medium transition-all ${
                activePreset === preset.type
                  ? "bg-primary text-text-inverse shadow-sm"
                  : "bg-bg-elevated text-text-secondary hover:text-text-primary hover:bg-border"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 ml-auto flex-wrap">
          <div className="flex items-center gap-2">
            <MaskedDateInput
              value={fromDate}
              onChange={(val) => handleCustomDateChange(val, "from")}
              size="sm"
              className="w-32! bg-bg-elevated text-text-primary border border-border rounded-lg px-3 h-control-sm text-body-sm focus:ring-2 focus:ring-primary/50 outline-none"
            />
            <span className="text-text-tertiary">to</span>
            <MaskedDateInput
              value={toDate}
              onChange={(val) => handleCustomDateChange(val, "to")}
              size="sm"
              className="w-32! bg-bg-elevated text-text-primary border border-border rounded-lg px-3 h-control-sm text-body-sm focus:ring-2 focus:ring-primary/50 outline-none"
            />
          </div>
          <Select
            value={groupBy}
            onChange={(val) => setGroupBy(val as "day" | "week" | "month")}
            options={[
              { value: "day", label: "By Day" },
              { value: "week", label: "By Week" },
              { value: "month", label: "By Month" },
            ]}
            size="sm"
          />
        </div>
      </FilterSection>

      {/* Summary Cards */}
      {isLoading ? (
        <AnalyticsSummarySkeleton />
      ) : (
        <div className="animate-fade-in grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-bg-surface border border-border rounded-xl p-5 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <TrendingUp className="h-16 w-16 text-income" />
            </div>
            <div className="relative z-10 space-y-2">
              <span className="text-text-secondary text-body-sm font-semibold tracking-wider uppercase">
                Total Income
              </span>
              <p className="num text-mono-xl text-income font-medium">
                {formatCurrency(safeData.summaryCards.income)}
              </p>
              {renderTrendIndicator(
                safeData.summaryCards.income,
                safeData.previousPeriodSummary?.income,
              )}
            </div>
          </div>

          <div className="bg-bg-surface border border-border rounded-xl p-5 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <TrendingDown className="h-16 w-16 text-expense" />
            </div>
            <div className="relative z-10 space-y-2">
              <span className="text-text-secondary text-body-sm font-semibold tracking-wider uppercase">
                Total Expense
              </span>
              <p className="num text-mono-xl text-expense font-medium">
                {formatCurrency(safeData.summaryCards.expense)}
              </p>
              {renderTrendIndicator(
                safeData.summaryCards.expense,
                safeData.previousPeriodSummary?.expense,
                true,
              )}
            </div>
          </div>

          <div className="bg-bg-surface border border-border rounded-xl p-5 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <PiggyBank className="h-16 w-16 text-text-secondary" />
            </div>
            <div className="relative z-10 space-y-2">
              <span className="text-text-secondary text-body-sm font-semibold tracking-wider uppercase">
                Net Savings
              </span>
              <p className={`num text-mono-xl font-medium ${safeData.summaryCards.net >= 0 ? "text-income" : "text-expense"}`}>
                {formatCurrency(safeData.summaryCards.net)}
              </p>
              {renderTrendIndicator(
                safeData.summaryCards.net,
                safeData.previousPeriodSummary?.net,
              )}
            </div>
          </div>

          <div className="bg-bg-surface border border-border rounded-xl p-5 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Wallet className="h-16 w-16 text-brand" />
            </div>
            <div className="relative z-10 space-y-2">
              <span className="text-text-secondary text-body-sm font-semibold tracking-wider uppercase">
                Savings Rate
              </span>
              <p className="num text-mono-xl text-brand font-medium">
                {safeData.summaryCards.savingsRate.toFixed(1)}%
              </p>
              {renderTrendIndicator(
                safeData.summaryCards.savingsRate,
                safeData.previousPeriodSummary?.savingsRate,
              )}
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <AnalyticsChartsSkeleton />
      ) : (
        <div className="animate-fade-in grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Trend Chart */}
          <div className="lg:col-span-2 card p-6 flex flex-col gap-6 min-w-0 overflow-hidden">
            <h2 className="text-heading-3 font-display text-text-primary truncate">
              Income vs Expense Trend
            </h2>
            <div className="h-96 w-full min-w-0">
              {isMounted && safeData.trend.length > 0 ? (
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                  minWidth={1}
                  minHeight={1}
                >
                  <BarChart
                    data={safeData.trend}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--color-border)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="period"
                      tick={{
                        fill: "var(--color-text-secondary)",
                        fontSize: 12,
                      }}
                      tickLine={false}
                      axisLine={false}
                      dy={10}
                    />
                    <YAxis
                      tick={{
                        fill: "var(--color-text-secondary)",
                        fontSize: 12,
                      }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) =>
                        `${value >= 1000 ? (value / 1000).toFixed(0) + "k" : value}`
                      }
                    />
                    <ChartTooltip
                      content={(props) => renderTooltip(props)}
                      cursor={{ fill: "var(--color-border)", opacity: 0.4 }}
                    />
                    <Legend
                      iconType="circle"
                      wrapperStyle={{ paddingTop: "1.25rem" }}
                    />
                    <Bar
                      dataKey="income"
                      name="Income"
                      fill="var(--color-income)"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={50}
                    />
                    <Bar
                      dataKey="expense"
                      name="Expense"
                      fill="var(--color-expense)"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={50}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <StateDisplay
                  type="empty"
                  title="No Data"
                  description="No transactions found in this period."
                />
              )}
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="card p-6 flex flex-col gap-6 min-w-0 overflow-hidden">
            <div className="flex items-center justify-between min-w-0 gap-2">
              <h2 className="text-heading-3 font-display text-text-primary truncate">
                Breakdown
              </h2>
              <div className="flex bg-bg-elevated rounded-lg p-1 border border-border shrink-0">
                <button
                  onClick={() => setBreakdownType("EXPENSE")}
                  className={`px-3 py-1 rounded-md text-body-xs font-medium transition-colors ${
                    breakdownType === "EXPENSE"
                      ? "bg-bg-secondary text-text-primary shadow-sm"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  Expenses
                </button>
                <button
                  onClick={() => setBreakdownType("INCOME")}
                  className={`px-3 py-1 rounded-md text-body-xs font-medium transition-colors ${
                    breakdownType === "INCOME"
                      ? "bg-bg-secondary text-text-primary shadow-sm"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  Income
                </button>
              </div>
            </div>

            <div className="h-80 w-full min-w-0">
              {isMounted && currentBreakdown.length > 0 ? (
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                  minWidth={1}
                  minHeight={1}
                >
                  <PieChart>
                    <Pie
                      data={currentBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="amount"
                    >
                      {currentBreakdown.map(
                        (entry: { color?: string }, index: number) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.color || "var(--color-primary)"}
                          />
                        ),
                      )}
                    </Pie>
                    <ChartTooltip
                      content={(props) => renderPieTooltip(props)}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <StateDisplay
                  type="empty"
                  title={`No ${breakdownType.toLowerCase()}s`}
                  description={`No ${breakdownType.toLowerCase()} transactions found.`}
                />
              )}
            </div>

            {currentBreakdown.length > 0 && (
              <div className="flex flex-col gap-3 overflow-y-auto max-h-72 pr-2 custom-scrollbar min-w-0 border-t border-border/60 pt-3">
                {currentBreakdown.map(
                  (category: {
                    categoryId: string;
                    name: string;
                    color?: string;
                    amount: number;
                    percent: number;
                  }) => (
                    <div
                      key={category.categoryId}
                      className="flex items-center justify-between group min-w-0 gap-2"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                        <div
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{
                            backgroundColor:
                              category.color || "var(--color-primary)",
                          }}
                        />
                        <span className="text-body-sm text-text-secondary group-hover:text-text-primary transition-colors truncate block min-w-0">
                          {category.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="num text-mono-sm font-medium text-text-primary">
                          {formatCurrency(category.amount)}
                        </span>
                        <span className="num text-body-xs text-text-tertiary w-10 text-right">
                          {category.percent.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ),
                )}
              </div>
            )}
          </div>

          {/* Top Transactions */}
          {isLoading ? (
            <AnalyticsTopExpensesSkeleton />
          ) : (
            <div className="animate-fade-in lg:col-span-3 card p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between flex-wrap gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`p-2 rounded-lg ${
                      topTransactionsType === "EXPENSE"
                        ? "bg-error/10 text-error"
                        : "bg-success/10 text-success"
                    }`}
                  >
                    <Receipt className="w-5 h-5" />
                  </div>
                  <h2 className="text-heading-3 font-display text-text-primary">
                    Top{" "}
                    {topTransactionsType === "EXPENSE" ? "Expenses" : "Incomes"}
                  </h2>
                </div>
                <div className="flex bg-bg-elevated rounded-lg p-1 border border-border">
                  <button
                    onClick={() => setTopTransactionsType("EXPENSE")}
                    className={`px-3 py-1 rounded-md text-body-xs font-medium transition-colors ${
                      topTransactionsType === "EXPENSE"
                        ? "bg-bg-secondary text-text-primary shadow-sm"
                        : "text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    Expenses
                  </button>
                  <button
                    onClick={() => setTopTransactionsType("INCOME")}
                    className={`px-3 py-1 rounded-md text-body-xs font-medium transition-colors ${
                      topTransactionsType === "INCOME"
                        ? "bg-bg-secondary text-text-primary shadow-sm"
                        : "text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    Income
                  </button>
                </div>
              </div>

              <div className="h-80 w-full mt-4">
                {currentTopTransactions.length > 0 ? (
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                    minWidth={1}
                    minHeight={1}
                  >
                    <BarChart
                      layout="vertical"
                      data={currentTopTransactions}
                      margin={{ top: 10, right: 30, left: 20, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        horizontal={true}
                        vertical={false}
                        stroke="var(--color-border-muted)"
                      />
                      <XAxis
                        type="number"
                        tickFormatter={(value) => formatCurrency(value)}
                        tick={{ fill: "var(--color-text-muted)", fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        type="category"
                        dataKey={(item: {
                          payee?: string;
                          description?: string;
                        }) =>
                          formatMerchantName(
                            item.payee || item.description || "",
                            20,
                          )
                        }
                        tick={{
                          fill: "var(--color-text-secondary)",
                          fontSize: 12,
                        }}
                        axisLine={false}
                        tickLine={false}
                        width={130}
                      />
                      <ChartTooltip
                        cursor={{ fill: "var(--color-border)", opacity: 0.2 }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            const cleanPayee = formatMerchantName(
                              data.payee || data.description,
                              100,
                            );
                            return (
                              <div className="bg-bg-elevated border border-border p-3 rounded-lg shadow-lg max-w-sm">
                                <p
                                  className="text-body-md font-semibold text-text-primary mb-1.5 wrap-break-word"
                                  title={data.payee || data.description}
                                >
                                  {cleanPayee}
                                </p>
                                <div className="flex flex-col gap-1.5 text-body-xs text-text-secondary">
                                  {data.description && (
                                    <p className="text-text-muted wrap-break-word">
                                      <span className="font-medium text-text-secondary">
                                        Details:{" "}
                                      </span>
                                      {data.description}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-1.5">
                                    <div
                                      className="w-2 h-2 rounded-full shrink-0"
                                      style={{
                                        backgroundColor:
                                          data.categoryColor ||
                                          "var(--color-primary)",
                                      }}
                                    />
                                    <span className="font-medium text-text-primary">
                                      {data.categoryName}
                                    </span>
                                  </div>
                                  <p>Date: {data.date}</p>
                                  <p
                                    className={`num text-mono-md font-medium mt-0.5 ${
                                      topTransactionsType === "EXPENSE"
                                        ? "text-expense"
                                        : "text-income"
                                    }`}
                                  >
                                    {formatCurrency(data.amount)}
                                  </p>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                        {currentTopTransactions.map(
                          (
                            entry: { categoryColor?: string },
                            index: number,
                          ) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={
                                entry.categoryColor ||
                                (topTransactionsType === "EXPENSE"
                                  ? "var(--color-expense)"
                                  : "var(--color-income)")
                              }
                            />
                          ),
                        )}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <StateDisplay
                    type="empty"
                    title={`No Top ${
                      topTransactionsType === "EXPENSE" ? "Expenses" : "Incomes"
                    }`}
                    description={`No ${topTransactionsType.toLowerCase()} transactions recorded in this period.`}
                  />
                )}
              </div>
            </div>
          )}
          {/* End of top transactions check */}
          {isLoading ? null : ""}
        </div>
      )}
    </div>
  );
};
