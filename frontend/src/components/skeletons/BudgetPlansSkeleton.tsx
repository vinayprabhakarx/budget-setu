import React from 'react';

export const BudgetPlansSkeleton: React.FC = () => {
  return (
    <div className="animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="w-full">
            <div className="card p-5 border border-border flex flex-col h-full min-h-[8.75rem]">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="h-5 bg-bg-muted rounded w-32 mb-2"></div>
                  <div className="h-3 bg-bg-muted rounded w-24"></div>
                </div>
                <div className="flex gap-2">
                  <div className="h-8 w-8 bg-bg-muted rounded-md"></div>
                  <div className="h-8 w-8 bg-bg-muted rounded-md"></div>
                </div>
              </div>

              <div className="mt-auto space-y-3">
                <div className="flex justify-between">
                  <div className="h-3 bg-bg-muted rounded w-16"></div>
                  <div className="h-3 bg-bg-muted rounded w-16"></div>
                </div>
                <div className="h-2.5 bg-bg-muted rounded-full w-full"></div>
                <div className="flex justify-between items-center pt-1">
                  <div className="h-2.5 bg-bg-muted rounded w-20"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
