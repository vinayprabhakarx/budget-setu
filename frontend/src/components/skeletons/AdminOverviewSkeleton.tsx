import React from 'react';

export const AdminOverviewSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="mb-8">
        <div className="h-8 bg-bg-muted rounded w-48 mb-2"></div>
        <div className="h-4 bg-bg-muted rounded w-64"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card p-5 border border-border h-32">
            <div className="flex flex-col h-full justify-center">
              <div className="h-4 bg-bg-muted rounded w-24 mb-3"></div>
              <div className="h-8 bg-bg-muted rounded w-16"></div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-2 h-96 flex flex-col p-5">
          <div className="h-6 bg-bg-muted rounded w-32 mb-6"></div>
          <div className="flex-1 bg-bg-muted rounded"></div>
        </div>
        <div className="card lg:col-span-1 h-96 flex flex-col p-5">
          <div className="h-6 bg-bg-muted rounded w-32 mb-6"></div>
          <div className="flex-1 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex justify-between items-center">
                <div className="h-4 bg-bg-muted rounded w-24"></div>
                <div className="h-4 bg-bg-muted rounded w-12"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
