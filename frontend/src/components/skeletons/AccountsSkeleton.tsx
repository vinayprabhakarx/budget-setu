import React from 'react';

export const AccountsSkeleton: React.FC = () => {
  return (
    <div className="w-full animate-pulse">
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="card p-6 flex flex-col justify-between space-y-4 min-h-[11.25rem]">
            {/* Header */}
            <div className="flex justify-between items-start">
              <div className="space-y-2 w-full">
                <div className="h-5 w-16 bg-bg-muted rounded-full"></div>
                <div className="h-6 w-3/4 bg-bg-muted rounded"></div>
                <div className="h-4 w-1/2 bg-bg-muted rounded"></div>
              </div>
              <div className="h-8 w-8 bg-bg-muted rounded-md shrink-0 ml-2"></div>
            </div>

            {/* Balance */}
            <div className="flex justify-between items-end mt-4 pt-4 border-t border-border">
              <div className="space-y-1.5 w-full">
                <div className="h-3 w-16 bg-bg-muted rounded"></div>
                <div className="h-7 w-32 bg-bg-muted rounded"></div>
              </div>
              <div className="h-3 w-24 bg-bg-muted rounded shrink-0"></div>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
};
