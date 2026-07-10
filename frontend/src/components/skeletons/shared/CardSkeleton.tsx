import React from "react";
import { Skeleton } from "../../ui/Skeleton";

interface CardSkeletonProps {
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
}

export const CardSkeleton: React.FC<CardSkeletonProps> = ({ title, subtitle, icon }) => {
  return (
    <div className="card p-5 flex flex-col gap-3">
      {/* Icon + Label */}
      <div className="flex justify-between items-start">
        <div className="space-y-1 w-full">
          {title ? (
            <h3 className="font-medium text-text-secondary text-body-sm">{title}</h3>
          ) : (
            <Skeleton className="h-4 w-24" />
          )}
          {subtitle ? (
            <p className="text-text-muted text-xs mt-1">{subtitle}</p>
          ) : (
            <Skeleton className="h-3 w-16 mt-1" />
          )}
        </div>
        {icon ? (
          <div className="text-text-muted shrink-0 ml-2">{icon}</div>
        ) : (
          <Skeleton className="h-8 w-8 rounded-lg shrink-0 ml-2" />
        )}
      </div>
      
      {/* Value */}
      <div className="mt-3 space-y-2">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
      </div>
    </div>
  );
};
