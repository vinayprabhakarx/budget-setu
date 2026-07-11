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
    <div className="w-full overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead className="border-b border-border text-text-secondary text-body-sm font-semibold">
          <tr>
            {headers ? (
              headers.map((header, i) => (
                <th key={i} className="py-3.5 px-3 sm:px-4 text-left font-semibold align-middle text-text-secondary whitespace-nowrap">
                  {header}
                </th>
              ))
            ) : (
              [...Array(colCount)].map((_, i) => (
                <th key={i} className="py-3.5 px-3 sm:px-4 text-left align-middle">
                  <Skeleton className="h-4 w-20 rounded" />
                </th>
              ))
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-border-muted">
          {[...Array(rows)].map((_, rowIndex) => (
            <tr key={rowIndex} className="border-b border-border-muted">
              {[...Array(colCount)].map((_, colIndex) => (
                <td key={colIndex} className="py-3.5 px-3 sm:px-4 align-middle">
                  <Skeleton className="h-4 w-full max-w-[8.75rem] rounded" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
