import React from 'react';

/* ─── Summary Cards ─── */
export const DashboardSummarySkeleton: React.FC = () => (
  <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="card flex items-start justify-between">
        <div className="space-y-2 w-full">
          <div className="h-3 bg-bg-muted rounded w-24"></div>
          <div className="h-7 bg-bg-muted rounded w-28"></div>
        </div>
        <div className="h-9 w-9 bg-bg-muted rounded-lg shrink-0"></div>
      </div>
    ))}
  </section>
);

/* ─── Charts Row: Donut (5-col) + Line Trend (7-col) ─── */
export const DashboardChartsSkeleton: React.FC = () => (
  <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-pulse">
    {/* Spending by Category (Donut) */}
    <div className="card lg:col-span-5 flex flex-col min-h-[22.5rem]">
      <div className="h-5 bg-bg-muted rounded w-40 mb-4"></div>
      <div className="flex-1 flex items-center justify-center">
        <div className="w-44 h-44 rounded-full border-[16px] border-bg-muted"></div>
      </div>
    </div>

    {/* Monthly Trend (Line) */}
    <div className="card lg:col-span-7 flex flex-col min-h-[22.5rem]">
      <div className="h-5 bg-bg-muted rounded w-32 mb-4"></div>
      <div className="flex-1 bg-bg-muted rounded-xl"></div>
    </div>
  </section>
);

/* ─── Active Budget Plans ─── */
export const DashboardActiveBudgetsSkeleton: React.FC = () => (
  <section className="space-y-3 animate-pulse">
    <div className="h-5 bg-bg-muted rounded w-40"></div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="card p-5 border border-border flex flex-col h-full min-h-[140px]">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="h-5 bg-bg-muted rounded w-32"></div>
                <div className="h-4 bg-bg-muted rounded w-16"></div>
              </div>
              <div className="flex items-center gap-1.5 mt-1.5">
                <div className="h-3 w-3 bg-bg-muted rounded"></div>
                <div className="h-3 bg-bg-muted rounded w-24"></div>
              </div>
            </div>
          </div>

          <div className="mt-auto space-y-3 pt-4 border-t border-border">
            <div className="flex justify-between">
              <div className="h-3 bg-bg-muted rounded w-20"></div>
              <div className="h-3 bg-bg-muted rounded w-20"></div>
            </div>
            <div className="h-2 w-full bg-bg-muted rounded-full"></div>
            <div className="flex justify-between">
              <div className="h-2 bg-bg-muted rounded w-16"></div>
              <div className="h-2 bg-bg-muted rounded w-16"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </section>
);

/* ─── Monthly Budgets: 3-col grid of progress cards ─── */
export const DashboardBudgetsSkeleton: React.FC = () => (
  <section className="space-y-3 animate-pulse">
    <div className="h-5 bg-bg-muted rounded w-36"></div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="card p-5 space-y-3">
          {/* Category name + percentage */}
          <div className="flex justify-between items-center">
            <div className="h-4 bg-bg-muted rounded w-24"></div>
            <div className="h-3 bg-bg-muted rounded w-16"></div>
          </div>
          {/* Progress bar */}
          <div className="h-2 w-full bg-bg-muted rounded-full"></div>
          {/* Spent / Limit */}
          <div className="flex justify-between">
            <div className="h-3 bg-bg-muted rounded w-20"></div>
            <div className="h-3 bg-bg-muted rounded w-20"></div>
          </div>
        </div>
      ))}
    </div>
  </section>
);

/* ─── Recent Transactions: table with 4 columns ─── */
export const DashboardTransactionsSkeleton: React.FC = () => (
  <section className="card p-6 space-y-4 animate-pulse">
    {/* Header */}
    <div className="flex items-center justify-between">
      <div className="h-5 bg-bg-muted rounded w-40"></div>
    </div>
    {/* Table skeleton */}
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-border">
            <th className="py-3 px-2"><div className="h-3 bg-bg-muted rounded w-10"></div></th>
            <th className="py-3 px-2"><div className="h-3 bg-bg-muted rounded w-28"></div></th>
            <th className="py-3 px-2"><div className="h-3 bg-bg-muted rounded w-20"></div></th>
            <th className="py-3 px-2 text-right"><div className="h-3 bg-bg-muted rounded w-16 ml-auto"></div></th>
          </tr>
        </thead>
        <tbody>
          {[...Array(5)].map((_, i) => (
            <tr key={i} className="border-b border-border-muted last:border-0">
              <td className="py-3.5 px-2">
                <div className="h-4 bg-bg-muted rounded w-14"></div>
              </td>
              <td className="py-3.5 px-2">
                <div className="h-4 bg-bg-muted rounded w-32 mb-1"></div>
                <div className="h-3 bg-bg-muted rounded w-20"></div>
              </td>
              <td className="py-3.5 px-2">
                <div className="h-5 bg-bg-muted rounded-full w-20"></div>
              </td>
              <td className="py-3.5 px-2 text-right">
                <div className="h-4 bg-bg-muted rounded w-16 ml-auto"></div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </section>
);
