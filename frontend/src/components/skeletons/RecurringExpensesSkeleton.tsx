import React from 'react';
import { TableSkeleton } from './shared/TableSkeleton';
import { CardSkeleton } from './shared/CardSkeleton';

export const RecurringExpensesSkeleton: React.FC = () => {
  return (
    <div className="w-full space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <CardSkeleton title="Active Subscriptions" />
        <CardSkeleton title="Monthly Cost" />
        <CardSkeleton title="Annual Cost" />
        <CardSkeleton title="Next Payment" />
      </div>
      <TableSkeleton headers={["Name", "Amount", "Frequency", "Next Due", "Status"]} rows={4} />
    </div>
  );
};
