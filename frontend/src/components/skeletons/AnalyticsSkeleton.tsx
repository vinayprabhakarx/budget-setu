import React from 'react';
import { Skeleton } from '../ui/Skeleton';
import { CardSkeleton } from './shared/CardSkeleton';
import { TrendingUp, TrendingDown, Target, Wallet } from "lucide-react";

export const AnalyticsSkeleton: React.FC = () => {
  return (
    <div className="w-full space-y-6">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-text-primary">Financial Analytics</h2>
        </div>
        <Skeleton className="h-10 w-full sm:w-48 rounded-lg" />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <CardSkeleton title="Total Income" icon={<TrendingUp />} />
        <CardSkeleton title="Total Expenses" icon={<TrendingDown />} />
        <CardSkeleton title="Net Savings" icon={<Wallet />} />
        <CardSkeleton title="Savings Rate" icon={<Target />} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6 min-h-[400px] flex flex-col">
          <h3 className="font-semibold text-text-primary text-heading-sm mb-4">Income vs Expenses</h3>
          <Skeleton className="flex-1 w-full rounded-xl" />
        </div>
        <div className="card p-6 min-h-[400px] flex flex-col">
          <h3 className="font-semibold text-text-primary text-heading-sm mb-4">Category Breakdown</h3>
          <Skeleton className="flex-1 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
};
