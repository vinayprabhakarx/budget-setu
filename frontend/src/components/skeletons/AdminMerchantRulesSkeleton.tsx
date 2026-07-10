import React from 'react';
import { Skeleton } from '../ui/Skeleton';
import { TableSkeleton } from './shared/TableSkeleton';

export const AdminMerchantRulesSkeleton: React.FC = () => {
  return (
    <div className="w-full space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-text-primary">Merchant Rules</h2>
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>
      <TableSkeleton headers={["Keyword", "Category", "Source", "Created At", "Actions"]} rows={5} />
    </div>
  );
};
