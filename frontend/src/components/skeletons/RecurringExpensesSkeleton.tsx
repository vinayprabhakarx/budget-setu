import React from 'react';

export const RecurringExpensesSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="card p-5 space-y-3">
          {/* Top row: name + badges | action buttons */}
          <div className="flex justify-between items-start">
            <div>
              {/* Name + frequency badge + status badge */}
              <div className="flex items-center gap-2">
                <div className="h-5 bg-bg-muted rounded w-28"></div>
                <div className="h-4 bg-bg-muted rounded w-16 shrink-0"></div>
                <div className="h-4 bg-bg-muted rounded w-14 shrink-0"></div>
              </div>
              {/* Category name */}
              <div className="h-3.5 bg-bg-muted rounded w-20 mt-2"></div>
            </div>
            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 bg-bg-muted rounded"></div>
              <div className="h-6 w-6 bg-bg-muted rounded"></div>
              <div className="h-6 w-6 bg-bg-muted rounded"></div>
            </div>
          </div>

          {/* Bottom: Next Due + Amount */}
          <div className="flex justify-between items-end border-t border-border pt-3">
            <div className="space-y-1">
              <div className="h-4 bg-bg-muted rounded w-36"></div>
            </div>
            <div className="h-7 bg-bg-muted rounded w-20"></div>
          </div>
        </div>
      ))}
    </div>
  );
};
