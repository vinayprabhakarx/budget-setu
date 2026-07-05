import React, { useEffect, useState, useCallback } from 'react';
import { AnalyticsSummarySkeleton, AnalyticsChartsSkeleton, AnalyticsTopExpensesSkeleton } from "../../components/skeletons/AnalyticsSkeleton";
import { StateDisplay } from '../../components/shared/StateDisplay';
import { formatCurrency } from '../../utils/currency';
import api from '../../api/axiosInstance';
import { useToast } from '../../context/ToastContext';
import { PageHeader } from '../../components/shared/PageHeader';
import { FilterSection } from '../../components/shared/FilterSection';
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
  Legend
} from 'recharts';
import { TrendingUp, TrendingDown, Wallet, PiggyBank, ArrowUpRight, ArrowDownRight, Minus, Receipt } from 'lucide-react';
import { Select } from '../../components/shared/Select';

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
    date: string;
    amount: number;
    categoryName: string;
    categoryColor: string;
  }[];
}

const presetRanges = [
  { label: 'This Month', type: 'thisMonth' },
  { label: 'Last Month', type: 'lastMonth' },
  { label: 'This Quarter', type: 'thisQuarter' },
  { label: 'This Year', type: 'thisYear' },
  { label: 'Last 6 Months', type: 'last6Months' }
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
    setIsMounted(true); // eslint-disable-line react-hooks/set-state-in-effect
  }, []);
  
  // Filter State
  const [showFilters, setShowFilters] = useState(false);
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('month');
  const [fromDate, setFromDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState<string>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    d.setDate(0);
    return d.toISOString().split('T')[0];
  });
  const [activePreset, setActivePreset] = useState<string>('thisMonth');
  
  // UI State
  const [breakdownType, setBreakdownType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<AnalyticsData>('/analytics/summary', {
        params: {
          from: fromDate,
          to: toDate,
          groupBy: groupBy
        }
      });
      setData(response.data);
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      setError(err.response?.data?.message || 'Failed to load analytics data');
      showToast(err.response?.data?.message || 'Failed to load analytics data', 'error');
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, groupBy, showToast]);

  useEffect(() => {
    fetchAnalytics(); // eslint-disable-line react-hooks/set-state-in-effect
  }, [fetchAnalytics]);

  useEffect(() => {
    const handleTxnUpdate = () => {
      fetchAnalytics();
    };
    window.addEventListener('transaction-added', handleTxnUpdate);
    window.addEventListener('transactions-updated', handleTxnUpdate);
    return () => {
      window.removeEventListener('transaction-added', handleTxnUpdate);
      window.removeEventListener('transactions-updated', handleTxnUpdate);
    };
  }, [fetchAnalytics]);

  const handlePresetChange = (type: string) => {
    setActivePreset(type);
    const d = new Date();
    switch (type) {
      case 'thisMonth': {
        d.setDate(1);
        setFromDate(d.toISOString().split('T')[0]);
        const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
        setToDate(end.toISOString().split('T')[0]);
        setGroupBy('week');
        break;
      }
      case 'lastMonth': {
        d.setMonth(d.getMonth() - 1);
        d.setDate(1);
        setFromDate(d.toISOString().split('T')[0]);
        const lastEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);
        setToDate(lastEnd.toISOString().split('T')[0]);
        setGroupBy('week');
        break;
      }
      case 'thisQuarter': {
        const q = Math.floor(d.getMonth() / 3);
        const startQ = new Date(d.getFullYear(), q * 3, 1);
        const endQ = new Date(d.getFullYear(), q * 3 + 3, 0);
        setFromDate(startQ.toISOString().split('T')[0]);
        setToDate(endQ.toISOString().split('T')[0]);
        setGroupBy('month');
        break;
      }
      case 'thisYear': {
        setFromDate(new Date(d.getFullYear(), 0, 1).toISOString().split('T')[0]);
        setToDate(new Date(d.getFullYear(), 11, 31).toISOString().split('T')[0]);
        setGroupBy('month');
        break;
      }
      case 'last6Months': {
        const end6 = new Date(d.getFullYear(), d.getMonth() + 1, 0);
        d.setMonth(d.getMonth() - 5);
        d.setDate(1);
        setFromDate(d.toISOString().split('T')[0]);
        setToDate(end6.toISOString().split('T')[0]);
        setGroupBy('month');
        break;
      }
    }
  };

  const handleCustomDateChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'from' | 'to') => {
    setActivePreset('custom');
    if (field === 'from') setFromDate(e.target.value);
    else setToDate(e.target.value);
  };

  const renderTooltip = ({ active, payload, label }: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    if (active && payload && payload.length) {
      return (
        <div className="bg-bg-elevated border border-border p-3 rounded-lg shadow-lg">
          <p className="text-body-md font-semibold text-text-primary mb-2">{label}</p>
          {payload.map((entry: any, index: number) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
            <p key={index} className="text-mono-md font-medium" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderPieTooltip = ({ active, payload }: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    if (active && payload && payload.length) {
      const slice = payload[0].payload;
      return (
        <div className="bg-bg-elevated border border-border p-3 rounded-lg shadow-lg">
          <p className="text-body-md font-semibold text-text-primary mb-1">{slice.name}</p>
          <p className="text-mono-md font-medium text-text-secondary">
            {formatCurrency(slice.amount)} ({slice.percent.toFixed(1)}%)
          </p>
        </div>
      );
    }
    return null;
  };

  const renderTrendIndicator = (current: number, previous?: number, inverse: boolean = false) => {
    if (previous === undefined || previous === 0) return null;
    const diff = current - previous;
    const percentChange = (diff / previous) * 100;
    
    // Inverse means higher is worse (e.g., expenses)
    const isPositive = inverse ? diff <= 0 : diff >= 0;
    const isNeutral = diff === 0;

    const Icon = isNeutral ? Minus : (diff > 0 ? ArrowUpRight : ArrowDownRight);
    const textColor = isNeutral ? 'text-text-tertiary' : (isPositive ? 'text-success' : 'text-error');

    return (
      <div className={`flex items-center gap-1 text-body-xs font-medium mt-1 ${textColor}`}>
        <Icon className="w-3 h-3" />
        <span>{Math.abs(percentChange).toFixed(1)}% vs prev period</span>
      </div>
    );
  };

  if (error && !data) {
    return <StateDisplay type="error" title="Failed to load analytics" description={error} />;
  }

  const isLoading = loading && !data;

  const safeData = data || {
    summaryCards: { income: 0, expense: 0, netSavings: 0, savingsRate: 0, net: 0 },
    trend: [],
    categoryBreakdown: [],
    incomeCategoryBreakdown: [],
    topExpenses: [],
    previousPeriodSummary: null
  } as any; // eslint-disable-line @typescript-eslint/no-explicit-any
  const currentBreakdown = breakdownType === 'EXPENSE' 
    ? safeData.categoryBreakdown 
    : (safeData.incomeCategoryBreakdown || []);

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
        hasActiveFilters={activePreset !== 'thisMonth' || groupBy !== 'week'}
        onReset={() => handlePresetChange('thisMonth')}
        className="sticky top-0 z-10"
      >
        <div className="flex flex-wrap gap-2 items-center">
          {presetRanges.map(preset => (
            <button
              key={preset.type}
              onClick={() => handlePresetChange(preset.type)}
              className={`px-4 py-2 rounded-lg text-body-sm font-medium transition-all ${
                activePreset === preset.type 
                  ? 'bg-primary text-text-inverse shadow-sm' 
                  : 'bg-bg-elevated text-text-secondary hover:text-text-primary hover:bg-border'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 ml-auto flex-wrap">
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => handleCustomDateChange(e, 'from')}
              className="bg-bg-elevated text-text-primary border border-border rounded-lg px-3 py-1.5 text-body-sm focus:ring-2 focus:ring-primary/50 outline-none"
            />
            <span className="text-text-tertiary">to</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => handleCustomDateChange(e, 'to')}
              className="bg-bg-elevated text-text-primary border border-border rounded-lg px-3 py-1.5 text-body-sm focus:ring-2 focus:ring-primary/50 outline-none"
            />
          </div>
          <Select
            value={groupBy}
            onChange={(val) => setGroupBy(val as any)} // eslint-disable-line @typescript-eslint/no-explicit-any
            options={[
              { value: 'day', label: 'By Day' },
              { value: 'week', label: 'By Week' },
              { value: 'month', label: 'By Month' }
            ]}
            size="sm"
          />
        </div>
      </FilterSection>

      {/* Summary Cards */}
      {isLoading ? <AnalyticsSummarySkeleton /> : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-bg-surface border border-border rounded-xl p-5 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp className="h-16 w-16 text-success" />
          </div>
          <div className="relative z-10 flex flex-col gap-1">
            <span className="text-text-secondary text-body-sm font-medium tracking-wider uppercase mb-1">Total Income</span>
            <span className="text-heading-3 font-display num-positive">
              {formatCurrency(safeData.summaryCards.income)}
            </span>
            {renderTrendIndicator(safeData.summaryCards.income, safeData.previousPeriodSummary?.income)}
          </div>
        </div>

        <div className="bg-bg-surface border border-border rounded-xl p-5 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingDown className="h-16 w-16 text-error" />
          </div>
          <div className="relative z-10 flex flex-col gap-1">
            <span className="text-text-secondary text-body-sm font-medium tracking-wider uppercase mb-1">Total Expense</span>
            <span className="text-heading-3 font-display num-negative">
              {formatCurrency(safeData.summaryCards.expense)}
            </span>
            {renderTrendIndicator(safeData.summaryCards.expense, safeData.previousPeriodSummary?.expense, true)}
          </div>
        </div>

        <div className="bg-bg-surface border border-border rounded-xl p-5 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Wallet className="h-16 w-16 text-primary" />
          </div>
          <div className="relative z-10 flex flex-col gap-1">
            <span className="text-text-secondary text-body-sm font-medium tracking-wider uppercase mb-1">Net Savings</span>
            <span className={`text-heading-3 font-display ${safeData.summaryCards.net >= 0 ? 'num-positive' : 'num-negative'}`}>
              {formatCurrency(safeData.summaryCards.net)}
            </span>
            {renderTrendIndicator(safeData.summaryCards.net, safeData.previousPeriodSummary?.net)}
          </div>
        </div>

        <div className="bg-bg-surface border border-border rounded-xl p-5 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <PiggyBank className="h-16 w-16 text-warning" />
          </div>
          <div className="relative z-10 flex flex-col gap-1">
            <span className="text-text-secondary text-body-sm font-medium tracking-wider uppercase mb-1">Savings Rate</span>
            <span className="text-heading-3 font-display num">
              {safeData.summaryCards.savingsRate.toFixed(1)}%
            </span>
            {renderTrendIndicator(safeData.summaryCards.savingsRate, safeData.previousPeriodSummary?.savingsRate)}
          </div>
        </div>
      </div>
      )}

      {isLoading ? <AnalyticsChartsSkeleton /> : (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* Trend Chart */}
        <div className="lg:col-span-2 card p-6 flex flex-col gap-6 min-w-0">
          <h2 className="text-heading-3 font-display text-text-primary">Income vs Expense Trend</h2>
          <div className="h-96 w-full">
            {isMounted && safeData.trend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                <BarChart data={safeData.trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis 
                    dataKey="period" 
                    tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }}
                    tickLine={false} 
                    axisLine={false}
                    dy={10}
                  />
                  <YAxis 
                    tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }}
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(value) => `${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`}
                  />
                  <ChartTooltip content={renderTooltip} cursor={{ fill: 'var(--color-border)', opacity: 0.4 }} />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '1.25rem' }} />
                  <Bar dataKey="income" name="Income" fill="var(--color-income)" radius={[4, 4, 0, 0]} maxBarSize={50} />
                  <Bar dataKey="expense" name="Expense" fill="var(--color-expense)" radius={[4, 4, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <StateDisplay type="empty" title="No Data" description="No transactions found in this period." />
            )}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="card p-6 flex flex-col gap-6 min-w-0">
          <div className="flex items-center justify-between">
            <h2 className="text-heading-3 font-display text-text-primary">Breakdown</h2>
            <div className="flex bg-bg-elevated rounded-lg p-1 border border-border">
              <button
                onClick={() => setBreakdownType('EXPENSE')}
                className={`px-3 py-1 rounded-md text-body-xs font-medium transition-colors ${
                  breakdownType === 'EXPENSE' ? 'bg-bg-secondary text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Expenses
              </button>
              <button
                onClick={() => setBreakdownType('INCOME')}
                className={`px-3 py-1 rounded-md text-body-xs font-medium transition-colors ${
                  breakdownType === 'INCOME' ? 'bg-bg-secondary text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Income
              </button>
            </div>
          </div>
          
          <div className="h-80 w-full">
            {isMounted && currentBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
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
                    {currentBreakdown.map((entry: any, index: number) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                      <Cell key={`cell-${index}`} fill={entry.color || 'var(--color-primary)'} />
                    ))}
                  </Pie>
                  <ChartTooltip content={renderPieTooltip} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <StateDisplay type="empty" title={`No ${breakdownType.toLowerCase()}s`} description={`No ${breakdownType.toLowerCase()} transactions found.`} />
            )}
          </div>

          <div className="flex flex-col gap-3 overflow-y-auto max-h-72 pr-2 custom-scrollbar">
            {currentBreakdown.map((category: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
              <div key={category.categoryId} className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: category.color || 'var(--color-primary)' }} 
                  />
                  <span className="text-body-sm text-text-secondary group-hover:text-text-primary transition-colors line-clamp-1">
                    {category.name}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-mono-sm font-medium text-text-primary">
                    {formatCurrency(category.amount)}
                  </span>
                  <span className="text-body-xs text-text-tertiary w-10 text-right">
                    {category.percent.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Expenses */}
        {isLoading ? <AnalyticsTopExpensesSkeleton /> : safeData.topExpenses && safeData.topExpenses.length > 0 && (
          <div className="lg:col-span-3 card p-6 flex flex-col gap-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-error/10 rounded-lg text-error">
                <Receipt className="w-5 h-5" />
              </div>
              <h2 className="text-heading-3 font-display text-text-primary">Top Expenses</h2>
            </div>
            
            <div className="h-80 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                <BarChart
                  layout="vertical"
                  data={safeData.topExpenses}
                  margin={{ top: 10, right: 30, left: 20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="var(--color-border-muted)" />
                  <XAxis type="number" tickFormatter={(value) => formatCurrency(value)} tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="description" tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }} axisLine={false} tickLine={false} width={120} />
                  <ChartTooltip
                    cursor={{ fill: 'var(--color-border)', opacity: 0.2 }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-bg-elevated border border-border p-3 rounded-lg shadow-lg">
                            <p className="text-body-sm font-semibold text-text-primary mb-1">{data.description}</p>
                            <div className="flex flex-col gap-1 text-body-xs text-text-secondary">
                              <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: data.categoryColor || 'var(--color-primary)' }} />
                                <span>{data.categoryName}</span>
                              </div>
                              <p>Date: {data.date}</p>
                              <p className="text-body-md font-display font-medium text-expense mt-1">
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
                    {safeData.topExpenses.map((entry: any, index: number) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                      <Cell key={`cell-${index}`} fill={entry.categoryColor || 'var(--color-primary)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
        {/* End of top expenses check */}
        {isLoading ? null : ''}
      </div>
      )}
    </div>
  );
};
