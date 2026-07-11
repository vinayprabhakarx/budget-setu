import React from "react";
import { Skeleton } from "../ui/Skeleton";

export const AccountsSkeleton: React.FC = () => {
  return (
    <div className="w-full">
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="card p-6 flex flex-col justify-between space-y-4 min-h-45"
          >
            {/* Header */}
            <div className="flex justify-between items-start">
              <div className="space-y-2 w-full">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              <Skeleton className="h-8 w-8 rounded-md shrink-0 ml-2" />
            </div>

            {/* Balance */}
            <div className="flex justify-between items-end mt-4 pt-4 border-t border-border">
              <div className="space-y-1.5 w-full">
                <p className="text-text-muted text-xs">Balance</p>
                <Skeleton className="h-7 w-32" />
              </div>
              <Skeleton className="h-3 w-24 shrink-0" />
            </div>
          </div>
        ))}
      </section>
    </div>
  );
};
