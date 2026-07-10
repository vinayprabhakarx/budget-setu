import React from 'react';
import { Skeleton } from '../ui/Skeleton';
import { CardSkeleton } from './shared/CardSkeleton';
import { TableSkeleton } from './shared/TableSkeleton';

/* ─── Summary Cards ─── */
export const DashboardSummarySkeleton: React.FC = () => (
  <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
    {[...Array(4)].map((_, i) => (
      <CardSkeleton key={i} />
    ))}
  </section>
);

/* ─── Charts Row: Donut (5-col) + Line Trend (7-col) ─── */
export const DashboardChartsSkeleton: React.FC = () => (
  <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
    {/* Spending by Category (Donut) */}
    <div className="card lg:col-span-5 flex flex-col min-h-[22.5rem] p-6">
      <Skeleton className="h-5 w-40 mb-4" />
      <div className="flex-1 flex items-center justify-center">
        <Skeleton className="w-44 h-44 rounded-full" />
      </div>
    </div>

    {/* Monthly Trend (Line) */}
    <div className="card lg:col-span-7 flex flex-col min-h-[22.5rem] p-6">
      <Skeleton className="h-5 w-32 mb-4" />
      <Skeleton className="flex-1 rounded-xl" />
    </div>
  </section>
);

/* ─── Active Budget Plans ─── */
export const DashboardActiveBudgetsSkeleton: React.FC = () => (
  <section className="space-y-4">
    <Skeleton className="h-6 w-40" />
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="card p-5 border border-border flex flex-col h-full min-h-[8.75rem]">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="flex items-center gap-1.5 mt-1.5">
                <Skeleton className="h-3 w-3" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </div>

          <div className="mt-auto space-y-3 pt-4 border-t border-border">
            <div className="flex justify-between">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
            <div className="flex justify-between">
              <Skeleton className="h-2 w-16" />
              <Skeleton className="h-2 w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  </section>
);

/* ─── Monthly Budgets: 3-col grid of progress cards ─── */
export const DashboardBudgetsSkeleton: React.FC = () => (
  <section className="space-y-4">
    <Skeleton className="h-6 w-36" />
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="card p-5 space-y-3">
          {/* Category name + percentage */}
          <div className="flex justify-between items-center">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
          {/* Progress bar */}
          <Skeleton className="h-2 w-full rounded-full" />
          {/* Spent / Limit */}
          <div className="flex justify-between">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      ))}
    </div>
  </section>
);

/* ─── Recent Transactions: table with 4 columns ─── */
export const DashboardTransactionsSkeleton: React.FC = () => (
  <section className="card p-6 space-y-4">
    {/* Header */}
    <div className="flex items-center justify-between mb-2">
      <Skeleton className="h-6 w-40" />
    </div>
    {/* Table skeleton */}
    <TableSkeleton columns={4} rows={5} />
  </section>
);
