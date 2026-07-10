import React from 'react';
import { Skeleton } from '../ui/Skeleton';
import { CardSkeleton } from './shared/CardSkeleton';

/* ─── Summary Cards: 4 stat cards with icon + label + value + trend ─── */
export const AnalyticsSummarySkeleton: React.FC = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
    {[...Array(4)].map((_, i) => (
      <CardSkeleton key={i} />
    ))}
  </div>
);

/* ─── Charts: Trend (2-col) + Category Breakdown (1-col) in 3-col grid ─── */
export const AnalyticsChartsSkeleton: React.FC = () => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
    {/* Trend Chart */}
    <div className="lg:col-span-2 card p-6 flex flex-col gap-6 min-w-0">
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-96 rounded-xl w-full" />
    </div>

    {/* Category Breakdown */}
    <div className="card p-6 flex flex-col gap-6 min-w-0">
      {/* Header + toggle */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-36" />
        <Skeleton className="h-8 rounded-lg w-36" />
      </div>
      {/* Donut placeholder */}
      <div className="flex items-center justify-center py-4">
        <Skeleton className="w-48 h-48 rounded-full" />
      </div>
      {/* Legend rows */}
      <div className="space-y-3 mt-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Skeleton className="h-3 w-3 rounded-full shrink-0" />
              <Skeleton className="h-3.5 w-20" />
            </div>
            <Skeleton className="h-3.5 w-16" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

/* ─── Top Expenses: 5-col grid of expense cards ─── */
export const AnalyticsTopExpensesSkeleton: React.FC = () => (
  <div className="lg:col-span-3 card p-6 flex flex-col gap-4">
    {/* Header with icon */}
    <div className="flex items-center gap-2 mb-2">
      <Skeleton className="rounded-lg w-9 h-9" />
      <Skeleton className="h-6 w-28" />
    </div>
    {/* 5 expense cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="bg-bg-elevated border border-border rounded-xl p-4 flex flex-col gap-3">
          {/* Rank + Date */}
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-6" />
            <Skeleton className="h-3 w-16" />
          </div>
          {/* Name + Category */}
          <div className="space-y-1.5 flex-1">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-16" />
          </div>
          {/* Amount */}
          <div className="pt-3 border-t border-border">
            <Skeleton className="h-5 w-20" />
          </div>
        </div>
      ))}
    </div>
  </div>
);
