import React from "react";
import { Skeleton } from "../../ui/Skeleton";

export const CardSkeleton: React.FC = () => {
  return (
    <div className="card p-5 flex flex-col gap-3">
      {/* Icon + Label */}
      <div className="flex justify-between items-start">
        <div className="space-y-2 w-full">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-6 w-3/4" />
        </div>
        <Skeleton className="h-8 w-8 rounded-lg shrink-0 ml-2" />
      </div>
      
      {/* Value */}
      <div className="mt-2 space-y-1">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
      </div>
    </div>
  );
};
