import React from 'react';

export const ImportHistorySkeleton: React.FC = () => {
  return (
    <div className="animate-pulse">
      <section className="bg-bg-surface border border-border shadow-sm rounded-xl overflow-hidden">
        {/* Header bar */}
        <div className="px-5 sm:px-8 py-5 border-b border-border flex items-center justify-between bg-bg-subtle/30">
          <div className="h-6 bg-bg-muted rounded w-32"></div>
          <div className="h-8 bg-bg-muted rounded-md w-24"></div>
        </div>

        {/* List rows */}
        <ul className="divide-y divide-border">
          {[...Array(4)].map((_, i) => (
            <li
              key={i}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 px-5 sm:px-8 py-4"
            >
              {/* Left: icon + file info */}
              <div className="flex items-start gap-3">
                <div className="h-5 w-5 bg-bg-muted rounded-full mt-0.5 shrink-0"></div>
                <div className="min-w-0 space-y-1.5">
                  <div className="h-4 bg-bg-muted rounded w-48"></div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 bg-bg-muted rounded w-20"></div>
                    <div className="h-3 bg-bg-muted rounded w-32"></div>
                  </div>
                </div>
              </div>

              {/* Right: stats */}
              <div className="flex items-center gap-5 pl-8 sm:pl-0">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="text-center space-y-1">
                    <div className="h-2.5 bg-bg-muted rounded w-10 mx-auto"></div>
                    <div className="h-4 bg-bg-muted rounded w-6 mx-auto"></div>
                  </div>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};
