import React from 'react';

export const AdminUserManagementSkeleton: React.FC = () => {
  return (
    <div className="w-full animate-pulse">
      <div className="overflow-x-auto bg-bg-surface border border-border rounded-xl shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-bg-subtle border-b border-border">
              <th className="px-6 py-4"><div className="h-4 bg-bg-muted rounded w-24"></div></th>
              <th className="px-6 py-4"><div className="h-4 bg-bg-muted rounded w-16"></div></th>
              <th className="px-6 py-4"><div className="h-4 bg-bg-muted rounded w-20"></div></th>
              <th className="px-6 py-4"><div className="h-4 bg-bg-muted rounded w-24"></div></th>
              <th className="px-6 py-4 text-right"><div className="h-4 bg-bg-muted rounded w-16 ml-auto"></div></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {[...Array(6)].map((_, i) => (
              <tr key={i}>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="h-10 w-10 bg-bg-muted rounded-full"></div>
                    <div className="ml-4 space-y-2">
                      <div className="h-4 bg-bg-muted rounded w-32"></div>
                      <div className="h-3 bg-bg-muted rounded w-48"></div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4"><div className="h-5 bg-bg-muted rounded-full w-16"></div></td>
                <td className="px-6 py-4"><div className="h-5 bg-bg-muted rounded-full w-20"></div></td>
                <td className="px-6 py-4"><div className="h-4 bg-bg-muted rounded w-24"></div></td>
                <td className="px-6 py-4">
                  <div className="flex justify-end gap-2">
                    <div className="h-8 w-8 bg-bg-muted rounded-md"></div>
                    <div className="h-8 w-8 bg-bg-muted rounded-md"></div>
                    <div className="h-8 w-8 bg-bg-muted rounded-md"></div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
