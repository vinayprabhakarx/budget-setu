import React from "react";
import { Skeleton } from "../../ui/Skeleton";

interface TableSkeletonProps {
  headers?: string[];
  columns?: number;
  rows?: number;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({ headers, columns = 4, rows = 5 }) => {
  const colCount = headers ? headers.length : columns;
  
  return (
    <div className="w-full">
      <div className="overflow-x-auto rounded-xl border border-border bg-bg-surface shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border bg-bg-subtle/40">
              {headers ? (
                headers.map((header, i) => (
                  <th key={i} className="py-4 px-4 font-medium text-text-secondary text-xs uppercase tracking-wider">
                    {header}
                  </th>
                ))
              ) : (
                [...Array(colCount)].map((_, i) => (
                  <th key={i} className="py-4 px-4">
                    <Skeleton className="h-4 w-20" />
                  </th>
                ))
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {[...Array(rows)].map((_, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-bg-subtle/20 transition-colors">
                {[...Array(colCount)].map((_, colIndex) => (
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
