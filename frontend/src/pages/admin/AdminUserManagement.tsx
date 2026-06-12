import React, { useEffect, useState } from "react";
import api from "../../api/axiosInstance";
import {
  ShieldAlert,
  ShieldCheck,
  Ban,
  CheckCircle,
  Trash2,
} from "lucide-react";
import { AdminUserManagementSkeleton } from "../../components/skeletons/AdminUserManagementSkeleton";

interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
}

export const AdminUserManagement: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination state could go here, for now using default page 0

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/users?size=50");
      setUsers(res.data.content || []);
    } catch (err) {
      const error = err as {
        message?: string;
        response?: { data?: { message?: string } };
      };
      setError(
        error.response?.data?.message || error.message || "Failed to load",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadInitialUsers = async () => {
      await loadUsers();
    };
    loadInitialUsers();
  }, []);

  const handleToggleSuspend = async (userId: string) => {
    if (
      !window.confirm(
        "Are you sure you want to toggle suspension for this user?",
      )
    )
      return;
    try {
      await api.post(`/admin/users/${userId}/toggle-suspend`);
      loadUsers();
    } catch (err) {
      const error = err as {
        message?: string;
        response?: { data?: { message?: string } };
      };
      alert(error.response?.data?.message || error.message || "Action failed");
    }
  };

  const handleRoleChange = async (userId: string, currentRole: string) => {
    const newRole = currentRole === "ADMIN" ? "USER" : "ADMIN";
    if (
      !window.confirm(
        `Are you sure you want to change this user's role to ${newRole}?`,
      )
    )
      return;
    try {
      await api.put(`/admin/users/${userId}/role`, { role: newRole });
      loadUsers();
    } catch (err) {
      const error = err as {
        message?: string;
        response?: { data?: { message?: string } };
      };
      alert(error.response?.data?.message || error.message || "Action failed");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (
      !window.confirm(
        "WARNING: This will permanently delete the user and all their data. Proceed?",
      )
    )
      return;
    try {
      await api.delete(`/admin/users/${userId}`);
      loadUsers();
    } catch (err) {
      const error = err as {
        message?: string;
        response?: { data?: { message?: string } };
      };
      alert(error.response?.data?.message || error.message || "Action failed");
    }
  };

  if (loading) {
    return <AdminUserManagementSkeleton />;
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-display font-semibold tracking-tight text-text-primary">
          User Management
        </h1>
        <p className="text-body-sm text-text-secondary mt-1">
          Manage platform users, roles, and access.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-destructive-bg text-destructive rounded-lg border border-destructive/20">
          {error}
        </div>
      )}

      <div className="bg-bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-bg-subtle border-b border-border">
                <th className="px-6 py-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-text-secondary uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-bg-subtle/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 shrink-0 rounded-full bg-brand/10 text-brand font-semibold flex items-center justify-center border border-brand/20">
                        {user.fullName.charAt(0)}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-text-primary">
                          {user.fullName}
                        </div>
                        <div className="text-sm text-text-tertiary flex items-center gap-1">
                          {user.email}
                          {user.emailVerified && (
                            <span title="Verified">
                              <CheckCircle className="h-3 w-3 text-success" />
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border border-border ${
                        user.role === "ADMIN" ? "badge-warning" : "badge-info"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border border-border ${
                        user.isActive ? "badge-income" : "badge-expense"
                      }`}
                    >
                      {user.isActive ? "Active" : "Suspended"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleRoleChange(user.id, user.role)}
                        className={`p-1.5 rounded-md transition-colors ${
                          user.role === "ADMIN"
                            ? "text-warning hover:bg-warning/10"
                            : "text-info hover:bg-info/10"
                        }`}
                        title={
                          user.role === "ADMIN"
                            ? "Revoke Admin"
                            : "Promote to Admin"
                        }
                      >
                        {user.role === "ADMIN" ? (
                          <ShieldAlert className="h-4 w-4" />
                        ) : (
                          <ShieldCheck className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleToggleSuspend(user.id)}
                        className={`p-1.5 rounded-md transition-colors ${
                          user.isActive
                            ? "text-warning hover:bg-warning/10"
                            : "text-income hover:bg-income/10"
                        }`}
                        title={user.isActive ? "Suspend User" : "Activate User"}
                      >
                        {user.isActive ? (
                          <Ban className="h-4 w-4" />
                        ) : (
                          <CheckCircle className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="p-1.5 rounded-md text-expense hover:bg-expense/10 transition-colors"
                        title="Delete User"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {users.length === 0 && (
          <div className="p-8 text-center text-text-secondary">
            No users found.
          </div>
        )}
      </div>
    </div>
  );
};
