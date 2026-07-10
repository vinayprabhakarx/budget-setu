import React from 'react';
import { Skeleton } from '../ui/Skeleton';
import { TableSkeleton } from './shared/TableSkeleton';

export const AdminSystemLogsSkeleton: React.FC = () => {
  return (
    <div className="w-full space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-text-primary">System Logs</h2>
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>
      <TableSkeleton headers={["Timestamp", "Level", "Service", "Message", "Action"]} rows={6} />
    </div>
  );
};
