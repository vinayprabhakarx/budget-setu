import React from 'react';
import { Skeleton } from '../ui/Skeleton';
import { CardSkeleton } from './shared/CardSkeleton';
import { TableSkeleton } from './shared/TableSkeleton';
import { Users, Activity, ShieldAlert, Database } from "lucide-react";

export const AdminOverviewSkeleton: React.FC = () => {
  return (
    <div className="w-full space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-text-primary">Platform Overview</h2>
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <CardSkeleton title="Total Users" icon={<Users />} />
        <CardSkeleton title="Active Sessions" icon={<Activity />} />
        <CardSkeleton title="Security Alerts" icon={<ShieldAlert />} />
        <CardSkeleton title="Database Load" icon={<Database />} />
      </div>
      <TableSkeleton headers={["Date", "Admin", "Action", "Status", "Details"]} rows={4} />
    </div>
  );
};
