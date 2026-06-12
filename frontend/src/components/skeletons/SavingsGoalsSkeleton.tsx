import React from 'react';

export const SavingsGoalsSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="card p-6 flex flex-col justify-between space-y-4">
          {/* Header: name + priority badge | edit/delete */}
          <div className="flex justify-between items-start">
            <div className="space-y-1 w-full">
              {/* Name + priority badge */}
              <div className="flex items-center gap-2">
                <div className="h-5 bg-bg-muted rounded w-28"></div>
                <div className="h-4 bg-bg-muted rounded w-16 shrink-0"></div>
              </div>
              {/* Description */}
              <div className="h-3.5 bg-bg-muted rounded w-3/4 mt-1"></div>
              {/* Target date with calendar icon */}
              <div className="flex items-center gap-1 mt-1">
                <div className="h-3.5 w-3.5 bg-bg-muted rounded shrink-0"></div>
                <div className="h-3.5 bg-bg-muted rounded w-36"></div>
              </div>
            </div>
            {/* Action buttons */}
            <div className="flex items-center gap-1 shrink-0">
              <div className="h-7 w-7 bg-bg-muted rounded-md"></div>
              <div className="h-7 w-7 bg-bg-muted rounded-md"></div>
            </div>
          </div>

          {/* Progress section */}
          <div className="space-y-2">
            {/* Saved / Target row */}
            <div className="flex justify-between">
              <div className="h-3.5 bg-bg-muted rounded w-24"></div>
              <div className="h-3.5 bg-bg-muted rounded w-24"></div>
            </div>
            {/* Progress bar */}
            <div className="h-2 w-full bg-bg-muted rounded-full"></div>
            {/* Percentage + days left */}
            <div className="flex justify-between items-center pt-1">
              <div className="h-3 bg-bg-muted rounded w-20"></div>
              <div className="h-3 bg-bg-muted rounded w-16"></div>
            </div>
          </div>

          {/* Allocate Savings button */}
          <div className="h-9 bg-bg-muted rounded-lg w-full"></div>
        </div>
      ))}
    </div>
  );
};
