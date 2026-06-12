import React from 'react';

export const ImportDetailsSkeleton: React.FC = () => {
  return (
    <div className="animate-pulse space-y-6">
      {/* Tab bar skeleton */}
      <section className="flex border-b border-border-muted pb-4">
        <div className="flex gap-4">
          <div className="h-6 bg-bg-muted rounded w-16"></div>
          <div className="h-6 bg-bg-muted rounded w-24"></div>
          <div className="h-6 bg-bg-muted rounded w-20"></div>
        </div>
      </section>

      {/* Table skeleton */}
      <section className="card p-0 overflow-hidden mt-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-bg-subtle/40">
                <th className="py-3 px-2 sm:px-4"><div className="h-3.5 bg-bg-muted rounded w-10"></div></th>
                <th className="py-3 px-2 sm:px-4"><div className="h-3.5 bg-bg-muted rounded w-14"></div></th>
                <th className="py-3 px-2 sm:px-4 text-right"><div className="h-3.5 bg-bg-muted rounded w-16 ml-auto"></div></th>
                <th className="py-3 px-2 sm:px-4"><div className="h-3.5 bg-bg-muted rounded w-14"></div></th>
              </tr>
            </thead>
            <tbody>
              {[...Array(8)].map((_, i) => (
                <tr key={i} className="border-b border-border-muted last:border-0">
                  <td className="py-3 px-2 sm:px-4">
                    <div className="h-4 bg-bg-muted rounded w-20"></div>
                  </td>
                  <td className="py-3 px-2 sm:px-4">
                    <div className="h-4 bg-bg-muted rounded w-36"></div>
                  </td>
                  <td className="py-3 px-2 sm:px-4 text-right">
                    <div className="h-4 bg-bg-muted rounded w-16 ml-auto"></div>
                  </td>
                  <td className="py-3 px-2 sm:px-4">
                    <div className="h-5 bg-bg-muted rounded w-20"></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
