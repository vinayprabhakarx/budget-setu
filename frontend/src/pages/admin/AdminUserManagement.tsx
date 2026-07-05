import React, { useEffect, useState } from "react";
import api from "../../api/axiosInstance";
import {
  ShieldAlert,
  ShieldCheck,
  Ban,
  CheckCircle,
  Trash2,
} from "lucide-react";
import { Select } from "../../components/shared/Select";
import { AdminUserManagementSkeleton } from "../../components/skeletons/AdminUserManagementSkeleton";
import { PageHeader } from "../../components/shared/PageHeader";
import { FilterSection } from "../../components/shared/FilterSection";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../../components/shared/Table";

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

  // Search, filter, and pagination states matching Transactions table
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(0);
  const pageSize = 10;

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/users?size=500");
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

  // Filter and paginate users matching Transactions functioning
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      !search.trim() ||
      u.fullName.toLowerCase().includes(search.trim().toLowerCase()) ||
      u.email.toLowerCase().includes(search.trim().toLowerCase());
    const matchesRole = !roleFilter || u.role === roleFilter;
    const matchesStatus =
      !statusFilter ||
      (statusFilter === "ACTIVE" ? u.isActive : !u.isActive);
    return matchesSearch && matchesRole && matchesStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const paginatedUsers = filteredUsers.slice(
    page * pageSize,
    (page + 1) * pageSize,
  );

  if (loading) {
    return <AdminUserManagementSkeleton />;
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="User Management"
        subtitle="Manage platform users, roles, and access."
        onFilterClick={() => setShowFilters(!showFilters)}
        showFilters={showFilters}
        onRefreshClick={loadUsers}
        isRefreshing={loading}
      />

      {error && (
        <div className="p-4 bg-destructive-bg text-destructive rounded-lg border border-destructive/20">
          {error}
        </div>
      )}

      {/* Filter & Search Controls */}
      <FilterSection
        isOpen={showFilters}
        searchQuery={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(0);
        }}
        searchPlaceholder="Search user by name or email..."
        hasActiveFilters={Boolean(search || roleFilter || statusFilter)}
        onReset={() => {
          setSearch("");
          setRoleFilter("");
          setStatusFilter("");
          setPage(0);
        }}
      >
        <Select
          value={roleFilter}
          onChange={(val) => {
            setRoleFilter(val);
            setPage(0);
          }}
          options={[
            { value: "", label: "All Roles" },
            { value: "ADMIN", label: "Admin" },
            { value: "USER", label: "User" },
          ]}
          size="sm"
        />
        <Select
          value={statusFilter}
          onChange={(val) => {
            setStatusFilter(val);
            setPage(0);
          }}
          options={[
            { value: "", label: "All Statuses" },
            { value: "ACTIVE", label: "Active" },
            { value: "SUSPENDED", label: "Suspended" },
          ]}
          size="sm"
        />
      </FilterSection>

      {/* Table Container matching Transactions table */}
      <section className="card p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-text-secondary">
                  No users found matching filters.
                </TableCell>
              </TableRow>
            ) : (
              paginatedUsers.map((user) => (
                <TableRow key={user.id} className="text-body-md">
                  <TableCell>
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
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <span
                      className={`badge ${
                        user.role === "ADMIN" ? "badge-warning" : "badge-info"
                      }`}
                    >
                      {user.role}
                    </span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <span
                      className={`badge ${
                        user.isActive ? "badge-income" : "badge-expense"
                      }`}
                    >
                      {user.isActive ? "Active" : "Suspended"}
                    </span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-text-secondary">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-right font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleRoleChange(user.id, user.role)}
                        className={`p-1.5 rounded-md transition-colors cursor-pointer ${
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
                        className={`p-1.5 rounded-md transition-colors cursor-pointer ${
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
                        className="p-1.5 rounded-md text-expense hover:bg-expense/10 transition-colors cursor-pointer"
                        title="Delete User"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </section>

      {/* Pagination Footer matching Transactions table */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="btn btn-secondary btn-sm"
          >
            Previous
          </button>
          <span className="text-body-sm text-text-secondary font-medium mx-2">
            Page {page + 1} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="btn btn-secondary btn-sm"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};
