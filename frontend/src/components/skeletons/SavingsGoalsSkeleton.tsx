import React from 'react';
import { Skeleton } from '../ui/Skeleton';
import { CardSkeleton } from './shared/CardSkeleton';
import { TableSkeleton } from './shared/TableSkeleton';

export const SavingsGoalsSkeleton: React.FC = () => {
  return (
    <div className="w-full space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-text-primary">Savings Goals</h2>
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>
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
