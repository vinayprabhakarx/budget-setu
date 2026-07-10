import React from 'react';
import { TableSkeleton } from './shared/TableSkeleton';

export const TransactionsSkeleton: React.FC = () => {
  return (
    <div className="space-y-4">
      {/* Search and filter bar skeleton */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="h-10 bg-bg-subtle/50 rounded-lg w-full sm:w-64 animate-pulse"></div>
          <div className="h-10 bg-bg-subtle/50 rounded-lg w-10 sm:w-24 animate-pulse"></div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="h-10 bg-bg-subtle/50 rounded-lg w-24 animate-pulse"></div>
          <div className="h-10 bg-brand/30 rounded-lg w-28 animate-pulse"></div>
        </div>
      </div>
      
      {/* Table skeleton */}
      <TableSkeleton headers={["Date", "Description", "Category", "Account", "Method", "Amount", "Actions"]} rows={6} />
    </div>
  );
};
