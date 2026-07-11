import React from 'react';
import { CardSkeleton } from './shared/CardSkeleton';
import { TableSkeleton } from './shared/TableSkeleton';

export const SavingsGoalsSkeleton: React.FC = () => {
  return (
    <div className="w-full space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <CardSkeleton title="Total Saved" />
        <CardSkeleton title="Goal Target" />
        <CardSkeleton title="Remaining" />
        <CardSkeleton title="Active Goals" />
      </div>
      <TableSkeleton headers={["Goal", "Target Amount", "Saved", "Deadline", "Status"]} rows={4} />
    </div>
  );
};
