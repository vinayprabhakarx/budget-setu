import React from 'react';
import { TableSkeleton } from './shared/TableSkeleton';

export const TransactionsSkeleton: React.FC = () => {
  return (
    <div className="w-full">
      <TableSkeleton columns={7} rows={6} />
    </div>
  );
};
