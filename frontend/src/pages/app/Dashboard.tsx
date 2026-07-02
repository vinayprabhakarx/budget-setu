import React, { useEffect, useState, useCallback } from "react";

import api from "../../api/axiosInstance";
import { useToast } from "../../context/ToastContext";
import { formatCurrency } from "../../utils/currency";
import {
  getBudgetProgressColor,
  getBudgetProgressBgClass,
} from "../../utils/budgetColor";
import {
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Wallet,
  Calendar,
} from "lucide-react";
import {
  DashboardSummarySkeleton,
  DashboardChartsSkeleton,
  DashboardActiveBudgetsSkeleton,
  DashboardBudgetsSkeleton,
  DashboardTransactionsSkeleton,
} from "../../components/skeletons/DashboardSkeleton";
import { StateDisplay } from "../../components/shared/StateDisplay";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  BarChart,
  Bar,
} from "recharts";

interface DashboardSummary {
  summary: {
    totalIncome: number;
    totalExpense: number;
    netSavings: number;
    netWorth: number;
  };
  categoryBreakdown: {
    categoryId: string;
    name: string;
    color: string;
    amount: number;
    percentage: number;
  }[];
  monthlyTrend: {
    month: string;
    income: number;
    expense: number;
  }[];
  budgetStatus: {
    categoryName: string;
    budgetAmount: number;
    spentAmount: number;
    percentage: number;
  }[];
  recentTransactions: {
    id: string;
    payee: string;
    amount: number;
    transactionType: string;
    transactionDate: string;
    category: {
      id: string;
      name: string;
      color: string;
    } | null;
    description: string | null;
    paymentMode: string | null;
  }[];
}

interface TooltipPayload {
  name: string;
  value: number;
  color?: string;
  payload: {
    name: string;
    amount: number;
    percentage: number;
  };
}

const CustomPieTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
}) => {
  if (active && payload && payload.length) {
    const slice = payload[0].payload;
    return (
      <div className="bg-bg-elevated border border-border p-3 rounded-lg shadow-lg">
        <p className="text-body-md font-semibold text-text-primary mb-1">
          {slice.name}
        </p>
        <p className="text-mono-md font-medium text-text-secondary">
          {formatCurrency(slice.amount)} ({slice.percentage.toFixed(1)}%)
        </p>
      </div>
    );
  }
  return null;
};

interface BarTooltipPayload {
  name: string;
  value: number;
  color?: string;
  payload: {
    month: string;
    income: number;
    expense: number;
  };
}

const CustomBarTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: BarTooltipPayload[];
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-bg-elevated border border-border p-3 rounded-lg shadow-lg space-y-1">
        <p className="text-body-sm font-semibold text-text-secondary mb-1">
          {payload[0].payload.month}
        </p>
        {payload.map((item) => (
          <p
            key={item.name}
            className="text-mono-md font-medium"
            style={{ color: item.color }}
          >
            {item.name}: {formatCurrency(item.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

/**
 * Dashboard Page Component
 * 
 * The main landing page for the app, providing a high-level summary of the user's financial health.
 * Displays key metrics (net worth, income, expenses), recent transactions, active budgets, and quick insights.
 */
export const Dashboard: React.FC = () => {
  const { showToast } = useToast();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [budgetPlans, setBudgetPlans] = useState<any[]>([]); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [loading, setLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true); // eslint-disable-line react-hooks/set-state-in-effect
  }, []);

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const fetchDashboardData = useCallback(async () => {
    try {
      const [dashRes, plansRes] = await Promise.all([
        api.get<DashboardSummary>(`/dashboard/summary`),
        api.get<any[]>("/budget-plans"), // eslint-disable-line @typescript-eslint/no-explicit-any
      ]);
      setData(dashRes.data);

      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1; // 1-indexed
      const filterMonthStart = new Date(currentYear, currentMonth - 1, 1);
      const filterMonthEnd = new Date(currentYear, currentMonth, 0);
      const filteredPlans = plansRes.data.filter((p) => {
        const planStart = new Date(p.startDate);
        const planEnd = new Date(p.endDate);
        return planStart <= filterMonthEnd && planEnd >= filterMonthStart;
      });
      setBudgetPlans(filteredPlans);
    } catch (error) {
      console.error("Error fetching dashboard summary", error);
      showToast("error", "Failed to retrieve dashboard summary details.");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) {
        setLoading(true);
        fetchDashboardData();
      }
    });
    return () => {
      active = false;
    };
  }, [fetchDashboardData]);

  // Sync refresh on transaction changes
  useEffect(() => {
    const handleRefresh = () => {
      fetchDashboardData();
    };
    window.addEventListener("transaction-added", handleRefresh);
    return () => {
      window.removeEventListener("transaction-added", handleRefresh);
    };
  }, [fetchDashboardData]);

  if (!loading && !data) {
    return (
      <StateDisplay
        type="error"
        title="Failed to load dashboard data"
        description="Please try again."
      />
    );
  }

  const isLoading = loading && !data;
  const {
    summary = { totalIncome: 0, totalExpense: 0, netSavings: 0, netWorth: 0 },
    categoryBreakdown = [],
    monthlyTrend = [],
    budgetStatus = [],
    recentTransactions = [],
  } = data || {};

  return (
    <div className="space-y-6 pb-16">
      <h2 className="text-xl lg:text-3xl font-semibold text-text-primary">
        Dashboard
      </h2>
      {/* 1. Summary Cards Grid */}
      {isLoading ? (
        <DashboardSummarySkeleton />
      ) : (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Income */}
          <div className="bg-bg-surface border border-border rounded-xl p-5 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <TrendingUp className="h-16 w-16 text-income" />
            </div>
            <div className="relative z-10 space-y-2">
              <span className="text-text-secondary text-body-sm font-semibold tracking-wider uppercase">
                Total Income
              </span>
              <p className="num text-mono-xl text-income font-medium">
                {formatCurrency(summary.totalIncome)}
              </p>
            </div>
          </div>

          {/* Total Expense */}
          <div className="bg-bg-surface border border-border rounded-xl p-5 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <TrendingDown className="h-16 w-16 text-expense" />
            </div>
            <div className="relative z-10 space-y-2">
              <span className="text-text-secondary text-body-sm font-semibold tracking-wider uppercase">
                Total Expense
              </span>
              <p className="num text-mono-xl text-expense font-medium">
                {formatCurrency(summary.totalExpense)}
              </p>
            </div>
          </div>

          {/* Net Savings */}
          <div className="bg-bg-surface border border-border rounded-xl p-5 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <PiggyBank className="h-16 w-16 text-text-secondary" />
            </div>
            <div className="relative z-10 space-y-2">
              <span className="text-text-secondary text-body-sm font-semibold tracking-wider uppercase">
                Net Savings
              </span>
              <p className="num text-mono-xl text-text-primary font-medium">
                {formatCurrency(summary.netSavings)}
              </p>
            </div>
          </div>

          {/* Net Worth */}
          <div className="bg-bg-surface border border-border rounded-xl p-5 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Wallet className="h-16 w-16 text-brand" />
            </div>
            <div className="relative z-10 space-y-2">
              <span className="text-text-secondary text-body-sm font-semibold tracking-wider uppercase">
                Net Worth
              </span>
              <p className="num text-mono-xl text-brand font-medium">
                {formatCurrency(summary.netWorth)}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* 2. Charts Row */}
      {isLoading ? (
        <DashboardChartsSkeleton />
      ) : (
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Spending by Category (Donut) */}
          <div className="card lg:col-span-5 flex flex-col min-h-96">
            <h3 className="font-semibold text-text-primary text-heading-sm mb-4">
              Spending by Category
            </h3>
            <div className="flex-1 relative flex items-center justify-center">
              {categoryBreakdown.length === 0 ? (
                <p className="text-text-muted text-body-md py-20">
                  No data available for this month
                </p>
              ) : isMounted ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                  <PieChart>
                    <Pie
                      data={categoryBreakdown}
                      nameKey="name"
                      dataKey="amount"
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={90}
                      paddingAngle={3}
                    >
                      {categoryBreakdown.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color || "var(--color-bg-muted)"}
                        />
                      ))}
                    </Pie>
                    <ChartTooltip content={<CustomPieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              ) : null}
            </div>
          </div>

          {/* Monthly Trend (Bar) */}
          <div className="card lg:col-span-7 flex flex-col min-h-96">
            <h3 className="font-semibold text-text-primary text-heading-sm mb-4">
              Monthly Trend
            </h3>
            <div className="flex-1">
              {monthlyTrend.length === 0 ? (
                <StateDisplay
                  type="empty"
                  title="No trend data found"
                  className="py-12"
                  action={{ label: "Upload Statement", href: "/import" }}
                />
              ) : isMounted ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                  <BarChart
                    data={monthlyTrend}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--color-border-muted)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="month"
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
                      content={<CustomBarTooltip />}
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
              ) : null}
            </div>
          </div>
        </section>
      )}

      {/* 2.5 Active Budget Plans */}
      {isLoading ? (
        <DashboardActiveBudgetsSkeleton />
      ) : (
        budgetPlans.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-text-primary text-heading-sm">
                Active Budget Plans
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
              {budgetPlans.map(
                (plan: {
                  id: string;
                  name: string;
                  startDate: string;
                  endDate: string;
                  periodType: string;
                  totalAmount: number;
                  totalSpent?: number;
                  allocations: { spent?: number }[];
                }) => {
                  const totalSpent =
                    plan.totalSpent ??
                    plan.allocations.reduce(
                      (sum: number, a) => sum + (a.spent || 0),
                      0,
                    );
                  const progressPercent =
                    plan.totalAmount > 0
                      ? (totalSpent / plan.totalAmount) * 100
                      : 0;

                  return (
                    <div
                      key={plan.id}
                      className="card p-5 flex flex-col relative group h-full hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2 overflow-hidden">
                            <h3 className="text-body-md font-semibold text-text-primary leading-tight truncate">
                              {plan.name}
                            </h3>
                            <span className="text-xs font-semibold tracking-wider uppercase px-1.5 py-0.5 bg-primary/10 text-primary rounded border border-primary/20 shrink-0">
                              {plan.periodType}
                            </span>
                          </div>
                          <div className="mt-1.5 flex flex-wrap items-center gap-2">
                            <div className="flex items-center gap-1.5 text-body-sm text-text-secondary whitespace-nowrap">
                              <Calendar className="h-3.5 w-3.5 shrink-0" />
                              <span>
                                {plan.startDate} to {plan.endDate}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-auto pt-4 border-t border-border space-y-2">
                        <div className="flex justify-between text-body-sm">
                          <span className="text-text-secondary">
                            Spent:{" "}
                            <b className="num text-text-primary font-medium">
                              {formatCurrency(totalSpent)}
                            </b>
                          </span>
                          <span className="text-text-secondary">
                            Budget:{" "}
                            <b className="num text-text-primary font-medium">
                              {formatCurrency(plan.totalAmount)}
                            </b>
                          </span>
                        </div>
                        <div className="h-2 w-full bg-bg-subtle rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-deliberate ease-standard ${getBudgetProgressBgClass(progressPercent)}`}
                            style={{
                              width: `${Math.min(progressPercent, 100)}%`,
                            }}
                          />
                        </div>
                        <div className="flex justify-between items-center pt-1 text-[0.6875rem]">
                          <span
                            className={`font-semibold ${progressPercent >= 100 ? "text-expense" : progressPercent >= 75 ? "text-warning" : "text-income"}`}
                          >
                            {progressPercent.toFixed(0)}% Exhausted
                          </span>
                          {progressPercent >= 100 && (
                            <span className="text-expense font-semibold">
                              Budget Exceeded ⚠️
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          </section>
        )
      )}

      {/* 3. Budget Overview Progress cards */}
      {isLoading ? (
        <DashboardBudgetsSkeleton />
      ) : (
        <section className="space-y-3">
          <h3 className="font-semibold text-text-primary text-heading-sm">
            Monthly Budgets
          </h3>
          {budgetStatus.length === 0 ? (
            <div className="card py-4">
              <StateDisplay
                type="empty"
                title="No budgets configured"
                description="Set up a budget for this month."
                action={{ label: "Setup a Budget", href: "/budgets" }}
                className="py-6"
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {budgetStatus.map((b) => {
                const progressColor = getBudgetProgressColor(b.percentage);
                return (
                  <div key={b.categoryName} className="card p-5 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-text-primary text-body-md">
                        {b.categoryName}
                      </span>
                      <span className="num text-mono-sm text-text-secondary">
                        {b.percentage.toFixed(0)}% used
                      </span>
                    </div>

                    {/* Progress Bar Container */}
                    <div className="h-2 w-full mt-1">
                      <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                        <BarChart
                          layout="vertical"
                          data={[
                            {
                              name: "progress",
                              spent: Math.min(b.percentage, 100),
                              remaining: Math.max(100 - b.percentage, 0),
                            },
                          ]}
                        >
                          <XAxis type="number" domain={[0, 100]} hide />
                          <YAxis type="category" dataKey="name" hide />
                          <Bar
                            dataKey="spent"
                            stackId="a"
                            fill={progressColor}
                            radius={[
                              4,
                              b.percentage >= 100 ? 4 : 0,
                              b.percentage >= 100 ? 4 : 0,
                              4,
                            ]}
                            isAnimationActive={false}
                          />
                          <Bar
                            dataKey="remaining"
                            stackId="a"
                            fill="var(--color-bg-subtle)"
                            radius={[0, 4, 4, 0]}
                            isAnimationActive={false}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="flex justify-between text-body-sm">
                      <span className="text-text-muted">
                        Spent:{" "}
                        <b className="num font-medium text-text-primary">
                          {formatNumberOnly(b.spentAmount)}
                        </b>
                      </span>
                      <span className="text-text-muted">
                        Limit:{" "}
                        <b className="num font-medium text-text-primary">
                          {formatNumberOnly(b.budgetAmount)}
                        </b>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* 4. Recent Transactions */}
      {isLoading ? (
        <DashboardTransactionsSkeleton />
      ) : (
        <section className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-text-primary text-heading-sm">
              Recent Transactions
            </h3>
          </div>

          {recentTransactions.length === 0 ? (
            <p className="text-text-muted text-body-md py-6 text-center">
              No recent transactions recorded.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border text-text-secondary text-body-sm font-semibold">
                    <th className="py-3 px-2">Date</th>
                    <th className="py-3 px-2">Payee / Description</th>
                    <th className="py-3 px-2">Category</th>
                    <th className="py-3 px-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.map((tx) => {
                    const isNegative = ["EXPENSE", "TRANSFER"].includes(
                      tx.transactionType,
                    );
                    const isExpanded = expandedRows.has(tx.id);
                    return (
                      <tr
                        key={tx.id}
                        onClick={() => toggleRow(tx.id)}
                        className="border-b border-border-muted hover:bg-bg-subtle/40 transition-colors text-body-md cursor-pointer md:cursor-default"
                      >
                        <td className="py-3.5 px-2 text-text-secondary whitespace-nowrap">
                          {new Date(tx.transactionDate).toLocaleDateString(
                            "en-IN",
                            {
                              day: "numeric",
                              month: "short",
                            },
                          )}
                        </td>
                        <td className="py-3.5 px-2 font-medium">
                          <div>
                            <p
                              className={`text-text-primary max-w-20 sm:max-w-none transition-all duration-200 ${isExpanded ? "whitespace-normal wrap-break-word" : "truncate"}`}
                            >
                              {tx.payee}
                              {tx.paymentMode && tx.paymentMode !== "OTHER" && (
                                <span
                                  className={`ml-2 inline-block px-1.5 py-0.5 rounded text-xs sm:text-[0.625rem] font-medium bg-bg-muted text-text-muted max-w-10 sm:max-w-none transition-all duration-200 align-bottom ${isExpanded ? "whitespace-normal break-all" : "truncate"}`}
                                >
                                  {tx.paymentMode}
                                </span>
                              )}
                            </p>
                            {tx.description && (
                              <p
                                className={`text-body-sm text-text-secondary font-normal max-w-20 sm:max-w-50 transition-all duration-200 ${isExpanded ? "whitespace-normal wrap-break-word" : "truncate"}`}
                                title={tx.description}
                              >
                                {tx.description}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-2">
                          {tx.category ? (
                            <span
                              className={`badge badge-neutral max-w-15 sm:max-w-none transition-all duration-200 align-bottom ${isExpanded ? "whitespace-normal break-all" : "truncate"}`}
                              style={{
                                backgroundColor: `${tx.category.color}15`,
                                color: tx.category.color,
                              }}
                            >
                              {tx.category.name}
                            </span>
                          ) : (
                            <span
                              className={`badge badge-neutral max-w-15 sm:max-w-none align-bottom ${isExpanded ? "whitespace-normal wrap-break-word" : "truncate"}`}
                            >
                              Uncategorized
                            </span>
                          )}
                        </td>
                        <td
                          className={`py-3.5 px-2 text-right num font-semibold whitespace-nowrap ${
                            isNegative ? "num-negative" : "num-positive"
                          }`}
                        >
                          {isNegative ? "−" : "+"}
                          {formatCurrency(tx.amount)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
};

// Simple utility to format currency amount strings
const formatNumberOnly = (amount: number) => {
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};
