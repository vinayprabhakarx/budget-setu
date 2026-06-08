import React from 'react';

/* ─── Summary Cards: 4 stat cards with icon + label + value + trend ─── */
export const AnalyticsSummarySkeleton: React.FC = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="card p-5 flex flex-col gap-1">
        {/* Icon + Label */}
        <div className="flex items-center gap-2 text-text-secondary mb-2">
          <div className="p-2 bg-bg-muted rounded-lg w-8 h-8 shrink-0"></div>
          <div className="h-3.5 bg-bg-muted rounded w-24"></div>
        </div>
        {/* Value */}
        <div className="h-7 bg-bg-muted rounded w-28 mb-1"></div>
        {/* Trend indicator */}
        <div className="h-4 bg-bg-muted rounded w-32"></div>
      </div>
    ))}
  </div>
);

/* ─── Charts: Trend (2-col) + Category Breakdown (1-col) in 3-col grid ─── */
export const AnalyticsChartsSkeleton: React.FC = () => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 animate-pulse">
    {/* Trend Chart */}
    <div className="lg:col-span-2 card p-6 flex flex-col gap-6 min-w-0">
      <div className="h-6 bg-bg-muted rounded w-48"></div>
      <div className="h-96 bg-bg-muted rounded-xl w-full"></div>
    </div>

    {/* Category Breakdown */}
    <div className="card p-6 flex flex-col gap-6 min-w-0">
      {/* Header + toggle */}
      <div className="flex items-center justify-between">
        <div className="h-6 bg-bg-muted rounded w-36"></div>
        <div className="h-8 bg-bg-muted rounded-lg w-36"></div>
      </div>
      {/* Donut placeholder */}
      <div className="flex items-center justify-center py-4">
        <div className="w-48 h-48 rounded-full border-[20px] border-bg-muted"></div>
      </div>
      {/* Legend rows */}
      <div className="space-y-3 mt-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 bg-bg-muted rounded-full shrink-0"></div>
              <div className="h-3.5 bg-bg-muted rounded w-20"></div>
            </div>
            <div className="h-3.5 bg-bg-muted rounded w-16"></div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

/* ─── Top Expenses: 5-col grid of expense cards ─── */
export const AnalyticsTopExpensesSkeleton: React.FC = () => (
  <div className="lg:col-span-3 card p-6 flex flex-col gap-4 animate-pulse">
    {/* Header with icon */}
    <div className="flex items-center gap-2 mb-2">
      <div className="p-2 bg-bg-muted rounded-lg w-9 h-9"></div>
      <div className="h-6 bg-bg-muted rounded w-28"></div>
    </div>
    {/* 5 expense cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="bg-bg-elevated border border-border rounded-xl p-4 flex flex-col gap-3">
          {/* Rank + Date */}
          <div className="flex items-center justify-between">
            <div className="h-3 bg-bg-muted rounded w-6"></div>
            <div className="h-3 bg-bg-muted rounded w-16"></div>
          </div>
          {/* Name + Category */}
          <div className="space-y-1.5 flex-1">
            <div className="h-4 bg-bg-muted rounded w-full"></div>
            <div className="h-3 bg-bg-muted rounded w-16"></div>
          </div>
          {/* Amount */}
          <div className="pt-3 border-t border-border">
            <div className="h-5 bg-bg-muted rounded w-20"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);
