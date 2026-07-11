import React from 'react';
import { CardSkeleton } from './shared/CardSkeleton';
import { TableSkeleton } from './shared/TableSkeleton';

export const BudgetPlansSkeleton: React.FC = () => {
  return (
    <div className="w-full space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <CardSkeleton title="Total Budget" />
        <CardSkeleton title="Total Spent" />
        <CardSkeleton title="Remaining" />
        <CardSkeleton title="Plans Active" />
      </div>
      <TableSkeleton headers={["Category", "Limit", "Spent", "Remaining", "Status"]} rows={4} />
    </div>
  );
};
