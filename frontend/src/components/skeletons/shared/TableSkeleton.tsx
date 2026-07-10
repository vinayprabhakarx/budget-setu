import React from "react";
import { Skeleton } from "../../ui/Skeleton";

interface TableSkeletonProps {
  columns?: number;
  rows?: number;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({ columns = 4, rows = 5 }) => {
  return (
    <div className="w-full">
      <div className="overflow-x-auto rounded-xl border border-border bg-bg-surface shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border bg-bg-subtle/40">
              {[...Array(columns)].map((_, i) => (
                <th key={i} className="py-4 px-4">
                  <Skeleton className="h-4 w-20" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {[...Array(rows)].map((_, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-bg-subtle/20 transition-colors">
                {[...Array(columns)].map((_, colIndex) => (
                  <td key={colIndex} className="py-4 px-4">
                    <Skeleton className="h-4 w-full max-w-[120px]" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
