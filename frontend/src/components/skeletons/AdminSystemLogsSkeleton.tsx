import React from 'react';
import { Skeleton } from '../ui/Skeleton';
import { CardSkeleton } from './shared/CardSkeleton';
import { TableSkeleton } from './shared/TableSkeleton';

export const AdminSystemLogsSkeleton: React.FC = () => {
  return (
    <div className="w-full space-y-6">
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
      <TableSkeleton columns={5} rows={4} />
    </div>
  );
};
