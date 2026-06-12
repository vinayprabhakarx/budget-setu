import React from 'react';

export const TransactionsSkeleton: React.FC = () => {
  return (
    <div className="w-full animate-pulse">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border bg-bg-subtle/40 text-text-secondary text-body-sm font-semibold">
              <th className="py-3 px-2 sm:px-4">
                <div className="h-4 bg-bg-muted rounded w-20"></div>
              </th>
              <th className="py-3 px-2 sm:px-4">
                <div className="h-4 bg-bg-muted rounded w-24"></div>
              </th>
              <th className="py-3 px-2 sm:px-4">
                <div className="h-4 bg-bg-muted rounded w-32"></div>
              </th>
              <th className="py-3 px-2 sm:px-4">
                <div className="h-4 bg-bg-muted rounded w-24"></div>
              </th>
              <th className="py-3 px-2 sm:px-4">
                <div className="h-4 bg-bg-muted rounded w-48"></div>
              </th>
              <th className="py-3 px-2 sm:px-4 text-right">
                <div className="h-4 bg-bg-muted rounded w-16 ml-auto"></div>
              </th>
              <th className="py-3 px-2 sm:px-4 text-center">
                <div className="h-4 bg-bg-muted rounded w-12 mx-auto"></div>
              </th>
            </tr>
          </thead>
          <tbody>
            {[...Array(6)].map((_, i) => (
              <tr key={i} className="border-b border-border hover:bg-bg-subtle/30 transition-colors group">
                <td className="py-3 px-2 sm:px-4">
                  <div className="h-4 bg-bg-muted rounded w-16 mb-1.5"></div>
                  <div className="h-3 bg-bg-muted rounded w-12"></div>
                </td>
                <td className="py-3 px-2 sm:px-4">
                  <div className="h-5 bg-bg-muted rounded w-24"></div>
                </td>
                <td className="py-3 px-2 sm:px-4">
                  <div className="h-5 bg-bg-muted rounded w-20"></div>
                </td>
                <td className="py-3 px-2 sm:px-4">
                  <div className="h-6 bg-bg-muted rounded-full w-24"></div>
                </td>
                <td className="py-3 px-2 sm:px-4">
                  <div className="h-4 bg-bg-muted rounded w-32 mb-1.5"></div>
                  <div className="h-3 bg-bg-muted rounded w-16"></div>
                </td>
                <td className="py-3 px-2 sm:px-4 flex justify-end">
                  <div className="h-5 bg-bg-muted rounded w-20"></div>
                </td>
                <td className="py-3 px-2 sm:px-4">
                  <div className="h-8 w-8 bg-bg-muted rounded-md mx-auto"></div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
