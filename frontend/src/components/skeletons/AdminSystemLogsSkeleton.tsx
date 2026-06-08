import React from 'react';

export const AdminSystemLogsSkeleton: React.FC = () => {
  return (
    <div className="w-full animate-pulse">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border bg-bg-subtle/40 text-text-secondary text-body-sm font-semibold">
              <th className="py-3 px-6"><div className="h-4 bg-bg-muted rounded w-24"></div></th>
              <th className="py-3 px-6"><div className="h-4 bg-bg-muted rounded w-20"></div></th>
              <th className="py-3 px-6"><div className="h-4 bg-bg-muted rounded w-32"></div></th>
              <th className="py-3 px-6"><div className="h-4 bg-bg-muted rounded w-32"></div></th>
              <th className="py-3 px-6"><div className="h-4 bg-bg-muted rounded w-48"></div></th>
            </tr>
          </thead>
          <tbody>
            {[...Array(8)].map((_, i) => (
              <tr key={i} className="border-b border-border">
                <td className="py-4 px-6"><div className="h-4 bg-bg-muted rounded w-32"></div></td>
                <td className="py-4 px-6"><div className="h-6 bg-bg-muted rounded-md w-20"></div></td>
                <td className="py-4 px-6"><div className="h-4 bg-bg-muted rounded w-36"></div></td>
                <td className="py-4 px-6"><div className="h-4 bg-bg-muted rounded w-36"></div></td>
                <td className="py-4 px-6"><div className="h-4 bg-bg-muted rounded w-64"></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
