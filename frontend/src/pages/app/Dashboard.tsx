import React, { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";

import api from "../../api/axiosInstance";
import { useToast } from "../../context/ToastContext";
import { formatCurrency } from "../../utils/currency";
import { getBudgetProgressBgClass } from "../../utils/budgetColor";
import {
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Wallet,
  Calendar,
  Trophy,
} from "lucide-react";
import {
  DashboardSummarySkeleton,
  DashboardChartsSkeleton,
  DashboardActiveBudgetsSkeleton,
  DashboardTransactionsSkeleton,
} from "../../components/skeletons/DashboardSkeleton";
interface RecurringExpenseData {
  id: string;
  name: string;
  amount: number;
  status: string;
  nextDueDate: string;
  frequency?: string;
  categoryName?: string;
  categoryIcon?: string;
}

interface GoalData {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  completed: boolean;
  priority?: string;
  description?: string | null;
  percentageComplete?: number;
  daysRemaining?: number;
}

import { StateDisplay } from "../../components/shared/StateDisplay";
import { PageHeader } from "../../components/shared/PageHeader";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../../components/shared/Table";
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
      <div className="bg-background card p-3 shadow-elevation-2 border border-border text-body-sm">
        <p className="font-semibold text-text-primary mb-1">{slice.name}</p>
        <p className="num text-text-secondary">
          {formatCurrency(slice.amount)} ({slice.percentage}%)
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
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [budgetPlans, setBudgetPlans] = useState<any[]>([]); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [recurringExpenses, setRecurringExpenses] = useState<any[]>([]); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [goals, setGoals] = useState<any[]>([]); // eslint-disable-line @typescript-eslint/no-explicit-any
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
      const [dashRes, plansRes, recurringRes, goalsRes] = await Promise.all([
        api.get<DashboardSummary>(`/dashboard/summary`),
        api.get<any[]>("/budget-plans"), // eslint-disable-line @typescript-eslint/no-explicit-any
        api.get<any[]>("/recurring-expenses"), // eslint-disable-line @typescript-eslint/no-explicit-any
        api.get<any[]>("/goals"), // eslint-disable-line @typescript-eslint/no-explicit-any
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
      const periodPriority: Record<string, number> = {
        WEEKLY: 1,
        MONTHLY: 2,
        QUARTERLY: 3,
        YEARLY: 4,
      };
      const goalPriority: Record<string, number> = {
        HIGH: 1,
        MEDIUM: 2,
        LOW: 3,
      };
      const sortedPlans = [...filteredPlans].sort((a, b) => {
        const pA = periodPriority[a.periodType?.toUpperCase()] || 99;
        const pB = periodPriority[b.periodType?.toUpperCase()] || 99;
        if (pA !== pB) return pA - pB;
        return (
          new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
        );
      });
      setBudgetPlans(sortedPlans);

      const activeRecurring = (recurringRes.data || []).filter(
        (r: RecurringExpenseData) => r.status === "ACTIVE",
      );
      const sortedRecurring = [...activeRecurring].sort(
        (a: RecurringExpenseData, b: RecurringExpenseData) => {
          if (!a.nextDueDate) return 1;
          if (!b.nextDueDate) return -1;
          return (
            new Date(a.nextDueDate).getTime() -
            new Date(b.nextDueDate).getTime()
          );
        },
      );
      setRecurringExpenses(sortedRecurring);

      const activeGoals = (goalsRes.data || []).filter(
        (g: GoalData) => !g.completed,
      );
      // Sort goals by progress percentage (highest first)
      const sortedGoals = [...activeGoals].sort((a: GoalData, b: GoalData) => {
        const aPriority = (a.priority?.toUpperCase() ??
          "MEDIUM") as keyof typeof goalPriority;
        const bPriority = (b.priority?.toUpperCase() ??
          "MEDIUM") as keyof typeof goalPriority;
        const pA = goalPriority[aPriority] ?? 99;
        const pB = goalPriority[bPriority] ?? 99;
        if (pA !== pB) return pA - pB;
        return (b.percentageComplete || 0) - (a.percentageComplete || 0);
      });
      setGoals(sortedGoals);
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
    recentTransactions = [],
  } = data || {};

  return (
    <div className="space-y-6 pb-16">
      <PageHeader
        title="Dashboard"
        subtitle="Overview of your financial health, recent activity, and goals for the current month."
        onRefreshClick={fetchDashboardData}
        isRefreshing={loading}
      />
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
            <h3 className="font-semibold text-text-primary text-heading-sm mb-4"></h3>
            <div className="flex-1 relative flex items-center justify-center min-h-65 w-full">
              {categoryBreakdown.length === 0 ? (
                <p className="text-text-muted text-body-md py-20">
                  No spending data available
                </p>
              ) : isMounted ? (
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                  minWidth={1}
                  minHeight={1}
                >
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
            <div className="flex-1 min-h-65 w-full">
              {monthlyTrend.length === 0 ? (
                <StateDisplay
                  type="empty"
                  title="No trend data found"
                  className="py-12"
                  action={{ label: "Upload Statement", href: "/import" }}
                />
              ) : isMounted ? (
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                  minWidth={1}
                  minHeight={1}
                >
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

      {/* Financial Planning Sections */}
      {isLoading ? (
        <DashboardActiveBudgetsSkeleton />
      ) : (
        <>
          {budgetPlans.length > 0 ||
          recurringExpenses.length > 0 ||
          goals.length > 0 ? (
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
              {/* Column 1: Active Budget Plans */}
              <div className="space-y-3">
                <h3 className="font-semibold text-text-primary text-heading-sm">
                  Budget Plans
                </h3>
                {budgetPlans.length > 0 ? (
                  <div className="space-y-3">
                    {budgetPlans.map(
                      (
                        plan: {
                          id: string;
                          name: string;
                          startDate: string;
                          endDate: string;
                          periodType: string;
                          totalAmount: number;
                          totalSpent?: number;
                          allocations: { spent?: number }[];
                        },
                        idx: number,
                      ) => {
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
                            onClick={() => navigate("/budgets")}
                            className={`card p-5 sm:p-6 min-h-56 flex flex-col justify-between space-y-4 relative group hover:border-primary/50 transition-all duration-200 shadow-xs hover:shadow-md bg-bg-surface/95 cursor-pointer ${idx > 0 ? "lg:hidden" : ""}`}
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <div className="flex items-center gap-2 overflow-hidden">
                                  <h3 className="font-semibold text-text-primary text-body-lg leading-tight truncate">
                                    {plan.name || "N/A"}
                                  </h3>
                                  <span className="text-xs font-semibold tracking-wider uppercase px-1.5 py-0.5 bg-primary/10 text-primary rounded border border-primary/20 shrink-0">
                                    {plan.periodType || "N/A"}
                                  </span>
                                </div>
                                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                                  <div className="flex items-center gap-1.5 text-body-sm text-text-secondary whitespace-nowrap">
                                    <Calendar className="h-3.5 w-3.5 shrink-0" />
                                    <span>
                                      {plan.startDate
                                        ? `${plan.startDate} to ${plan.endDate || "N/A"}`
                                        : "Dates: N/A"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="mt-auto pt-4 border-t border-border space-y-2">
                              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-body-sm">
                                <span className="text-text-secondary whitespace-nowrap">
                                  Spent:{" "}
                                  <b className="num text-text-primary font-medium">
                                    {totalSpent !== null &&
                                    totalSpent !== undefined
                                      ? formatCurrency(totalSpent)
                                      : "N/A"}
                                  </b>
                                </span>
                                <span className="text-text-secondary whitespace-nowrap">
                                  Budget:{" "}
                                  <b className="num text-text-primary font-medium">
                                    {plan.totalAmount !== null &&
                                    plan.totalAmount !== undefined
                                      ? formatCurrency(plan.totalAmount)
                                      : "N/A"}
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
                ) : (
                  <div
                    onClick={() => navigate("/budgets")}
                    className="card p-5 text-center text-text-muted text-body-sm hover:border-primary/50 transition-colors cursor-pointer border-dashed flex items-center justify-center min-h-32"
                  >
                    + Add budget plan
                  </div>
                )}
              </div>

              {/* Column 2: Active Recurring Payments */}
              <div className="space-y-3">
                <h3 className="font-semibold text-text-primary text-heading-sm">
                  Recurring Payments
                </h3>
                {recurringExpenses.length > 0 ? (
                  <div className="space-y-3">
                    {recurringExpenses.map(
                      (exp: RecurringExpenseData, idx: number) => (
                        <div
                          key={exp.id}
                          onClick={() => navigate("/budgets/recurring")}
                          className={`card p-5 sm:p-6 min-h-56 flex flex-col justify-between space-y-4 hover:border-primary/50 transition-all duration-200 shadow-xs hover:shadow-md bg-bg-surface/95 cursor-pointer ${idx > 0 ? "lg:hidden" : ""}`}
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
                              </div>
                              <p className="text-body-sm text-text-secondary truncate">
                                {exp.categoryName
                                  ? `Category: ${exp.categoryName}`
                                  : "Category: N/A"}
                              </p>
                            </div>
                            <span
                              className={`px-1.5 py-0.5 text-[0.65rem] font-semibold tracking-wider uppercase rounded shrink-0 ${exp.status === "ACTIVE" ? "badge-income" : "badge-warning"}`}
                            >
                              {exp.status || "N/A"}
                            </span>
                          </div>
                          <div className="mt-auto pt-4 border-t border-border space-y-2">
                            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-body-sm">
                              <span className="text-text-secondary whitespace-nowrap">
                                Next Due:{" "}
                                <b className="text-text-primary font-medium">
                                  {exp.nextDueDate || "N/A"}
                                </b>
                              </span>
                              <span className="text-text-secondary whitespace-nowrap">
                                Amount:{" "}
                                <b className="num text-text-primary font-bold">
                                  {exp.amount !== null &&
                                  exp.amount !== undefined
                                    ? formatCurrency(exp.amount)
                                    : "N/A"}
                                </b>
                              </span>
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
                              <span className="text-text-muted">
                                Auto-recurring
                              </span>
                            </div>
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                ) : (
                  <div
                    onClick={() => navigate("/budgets/recurring")}
                    className="card p-5 text-center text-text-muted text-body-sm hover:border-primary/50 transition-colors cursor-pointer border-dashed flex items-center justify-center min-h-32"
                  >
                    + Add recurring payment
                  </div>
                )}
              </div>

              {/* Column 3: Active Savings Goals */}
              <div className="space-y-3">
                <h3 className="font-semibold text-text-primary text-heading-sm">
                  Savings Goals
                </h3>
                {goals.length > 0 ? (
                  <div className="space-y-3">
                    {goals.map((g: GoalData, idx: number) => {
                      const isCompleted = g.completed;
                      return (
                        <div
                          key={g.id}
                          onClick={() => navigate("/budgets/goals")}
                          className={`card p-5 sm:p-6 min-h-56 flex flex-col justify-between space-y-4 hover:border-primary/50 transition-all duration-200 shadow-xs hover:shadow-md bg-bg-surface/95 cursor-pointer ${idx > 0 ? "lg:hidden" : ""}`}
                        >
                          <div className="flex justify-between items-start gap-3">
                            <div className="space-y-1 flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <h4 className="font-semibold text-text-primary text-body-lg leading-tight flex items-center gap-1.5 truncate max-w-full">
                                  <span className="truncate">
                                    {g.name || "N/A"}
                                  </span>
                                  {isCompleted && (
                                    <Trophy className="h-4 w-4 text-income shrink-0" />
                                  )}
                                </h4>
                                <span
                                  className={`px-1.5 py-0.5 text-[0.65rem] font-semibold tracking-wider uppercase rounded shrink-0 ${g.priority === "HIGH" ? "badge-expense" : g.priority === "LOW" ? "badge-income" : "badge-warning"}`}
                                >
                                  {g.priority || "MEDIUM"}
                                </span>
                              </div>
                              <p className="text-body-sm text-text-secondary truncate">
                                {g.description || "Description: N/A"}
                              </p>
                            </div>
                          </div>
                          <div className="space-y-2 mt-auto pt-2 border-t border-border">
                            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-body-sm">
                              <span className="text-text-secondary whitespace-nowrap">
                                Saved:{" "}
                                <b className="num text-text-primary font-medium">
                                  {g.currentAmount !== null &&
                                  g.currentAmount !== undefined
                                    ? formatCurrency(g.currentAmount)
                                    : "N/A"}
                                </b>
                              </span>
                              <span className="text-text-secondary whitespace-nowrap">
                                Target:{" "}
                                <b className="num text-text-primary font-medium">
                                  {g.targetAmount !== null &&
                                  g.targetAmount !== undefined
                                    ? formatCurrency(g.targetAmount)
                                    : "N/A"}
                                </b>
                              </span>
                            </div>
                            <div className="h-2 w-full bg-bg-subtle rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-deliberate ease-standard ${isCompleted ? "bg-income" : "bg-brand"}`}
                                style={{
                                  width: `${Math.min(g.percentageComplete || 0, 100)}%`,
                                }}
                              />
                            </div>
                            <div className="flex justify-between items-center pt-1 text-[0.6875rem]">
                              <span
                                className={`font-semibold ${isCompleted ? "text-income" : "text-brand"}`}
                              >
                                {(g.percentageComplete || 0).toFixed(0)}%
                                Achieved
                              </span>
                              {g.daysRemaining !== null &&
                                g.daysRemaining !== undefined &&
                                g.daysRemaining > 0 &&
                                !isCompleted && (
                                  <span className="text-text-muted">
                                    {g.daysRemaining} days left
                                  </span>
                                )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div
                    onClick={() => navigate("/budgets/goals")}
                    className="card p-5 text-center text-text-muted text-body-sm hover:border-primary/50 transition-colors cursor-pointer border-dashed flex items-center justify-center min-h-32"
                  >
                    + Add savings goal
                  </div>
                )}
              </div>
            </section>
          ) : (
            <section className="space-y-3">
              <h3 className="font-semibold text-text-primary text-heading-sm">
                Financial Planning
              </h3>
              <div className="card py-4">
                <StateDisplay
                  type="empty"
                  title="No active financial plans"
                  description="Set up budget plans, recurring payments, and savings goals to track your finances."
                  action={{
                    label: "Go to Budgets & Planning",
                    href: "/budgets",
                  }}
                  className="py-6"
                />
              </div>
            </section>
          )}
        </>
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
            <Link
              to="/transactions"
              className="text-body-sm font-medium text-primary hover:underline"
            >
              View All
            </Link>
          </div>

          {recentTransactions.length === 0 ? (
            <p className="text-text-muted text-body-md py-6 text-center">
              No recent transactions recorded.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Payee</TableHead>
                  <TableHead>Payment Mode</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTransactions.map((tx) => {
                  const isNegative = ["EXPENSE", "TRANSFER"].includes(
                    tx.transactionType,
                  );
                  const isExpanded = expandedRows.has(tx.id);
                  const catObj =
                    tx.category ||
                    categoryBreakdown.find(
                      (cb: {
                        categoryId?: string;
                        categoryName?: string;
                        color?: string;
                      }) =>
                        cb.categoryId ===
                        (tx as unknown as { categoryId?: string }).categoryId,
                    ) ||
                    null;
                  return (
                    <TableRow
                      key={tx.id}
                      onClick={() => toggleRow(tx.id)}
                      className="cursor-pointer md:cursor-default text-body-md"
                    >
                      <TableCell className="text-text-secondary whitespace-nowrap">
                        {new Date(tx.transactionDate).toLocaleDateString(
                          "en-IN",
                          {
                            day: "numeric",
                            month: "short",
                          },
                        )}
                      </TableCell>
                      <TableCell className="font-medium text-text-primary">
                        <div
                          className={`max-w-20 sm:max-w-48 transition-all duration-200 ${isExpanded ? "whitespace-normal wrap-break-word" : "truncate"}`}
                          title={tx.payee}
                        >
                          {tx.payee}
                        </div>
                      </TableCell>
                      <TableCell className="text-text-secondary">
                        {tx.paymentMode && tx.paymentMode !== "OTHER" ? (
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium bg-bg-muted text-text-muted max-w-16 sm:max-w-none transition-all duration-200 align-bottom ${isExpanded ? "whitespace-normal break-all" : "truncate"}`}
                            title={tx.paymentMode}
                          >
                            {tx.paymentMode}
                          </span>
                        ) : (
                          <span className="text-text-muted italic">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {catObj ? (
                          <span
                            className={`badge badge-neutral max-w-15 sm:max-w-none transition-all duration-200 align-bottom ${isExpanded ? "whitespace-normal break-all" : "truncate"}`}
                            style={{
                              backgroundColor: `${catObj.color}15`,
                              color: catObj.color,
                            }}
                          >
                            {catObj.name ||
                              (catObj as { categoryName?: string })
                                .categoryName ||
                              "Category"}
                          </span>
                        ) : (
                          <span
                            className={`badge badge-neutral max-w-15 sm:max-w-none align-bottom ${isExpanded ? "whitespace-normal wrap-break-word" : "truncate"}`}
                          >
                            Uncategorized
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
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
                        </div>
                      </TableCell>
                      <TableCell
                        className={`text-right num font-semibold whitespace-nowrap ${
                          isNegative ? "num-negative" : "num-positive"
                        }`}
                      >
                        {isNegative ? "-" : "+"}
                        {formatCurrency(tx.amount)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </section>
      )}
    </div>
  );
};
