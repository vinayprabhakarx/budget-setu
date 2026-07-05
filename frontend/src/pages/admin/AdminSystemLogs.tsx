import React, { useCallback, useEffect, useState } from "react";
import api from "../../api/axiosInstance";
import {
  Clock,
  User,
  Target,
  Activity,
  FileText,
  Database,
  AlertCircle,
  Shield,
} from "lucide-react";
import { AdminSystemLogsSkeleton } from "../../components/skeletons/AdminSystemLogsSkeleton";
import { PageHeader } from "../../components/shared/PageHeader";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../../components/shared/Table";

interface AuditLog {
  id: string;
  adminEmail: string;
  targetUserEmail: string;
  action: string;
  details: string;
  timestamp: string;
}

interface DbLog {
  pid: number | string;
  usename: string;
  application_name: string;
  state: string;
  query: string;
}

export const AdminSystemLogs: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"audit" | "app" | "error" | "db">(
    "audit",
  );

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [appLogs, setAppLogs] = useState<string[]>([]);
  const [errorLogs, setErrorLogs] = useState<string[]>([]);
  const [dbLogs, setDbLogs] = useState<DbLog[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      if (activeTab === "audit") {
        const res = await api.get("/admin/logs?size=100");
        setAuditLogs(res.data.content || []);
      } else if (activeTab === "app") {
        const res = await api.get("/admin/logs/application?lines=500");
        setAppLogs(res.data || []);
      } else if (activeTab === "error") {
        const res = await api.get("/admin/logs/error?lines=500");
        setErrorLogs(res.data || []);
      } else if (activeTab === "db") {
        const res = await api.get("/admin/logs/database");
        setDbLogs(res.data || []);
      }
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
  }, [activeTab]);

  useEffect(() => {
    // Defer calling loadData to avoid synchronous setState inside effect
    const t = setTimeout(() => {
      loadData();
    }, 0);
    return () => clearTimeout(t);
  }, [loadData]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="System Logs"
        subtitle="Monitor audit trails, application logs, and database activity."
        onRefreshClick={loadData}
        isRefreshing={loading}
      />

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-border pb-px overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab("audit")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
            activeTab === "audit"
              ? "border-brand text-brand"
              : "border-transparent text-text-secondary hover:text-text-primary hover:border-border"
          }`}
        >
          <Shield className="h-4 w-4 shrink-0" /> Audit (MongoDB)
        </button>
        <button
          onClick={() => setActiveTab("app")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
            activeTab === "app"
              ? "border-brand text-brand"
              : "border-transparent text-text-secondary hover:text-text-primary hover:border-border"
          }`}
        >
          <FileText className="h-4 w-4 shrink-0" /> Application Logs
        </button>
        <button
          onClick={() => setActiveTab("error")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
            activeTab === "error"
              ? "border-brand text-brand"
              : "border-transparent text-text-secondary hover:text-text-primary hover:border-border"
          }`}
        >
          <AlertCircle className="h-4 w-4 shrink-0" /> Error Logs
        </button>
        <button
          onClick={() => setActiveTab("db")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
            activeTab === "db"
              ? "border-brand text-brand"
              : "border-transparent text-text-secondary hover:text-text-primary hover:border-border"
          }`}
        >
          <Database className="h-4 w-4 shrink-0" /> Active DB Queries
        </button>
      </div>

      {error && (
        <div className="p-4 bg-destructive-bg text-destructive rounded-lg border border-destructive/20">
          {error}
        </div>
      )}

      {loading ? (
        <AdminSystemLogsSkeleton />
      ) : (
        <section className="card p-0 overflow-hidden min-h-[60vh] lg:min-h-[70vh] flex flex-col">
          {/* AUDIT LOGS */}
          {activeTab === "audit" && (
            <div className="overflow-auto flex-1">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Admin</TableHead>
                    <TableHead>Target User</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-8 text-center text-text-secondary">
                        No audit logs found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    auditLogs.map((log) => (
                      <TableRow key={log.id} className="text-body-md">
                        <TableCell className="whitespace-nowrap text-text-secondary">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            {new Date(log.timestamp).toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <span className="badge badge-neutral">
                            <Activity className="h-3 w-3 inline mr-1" />
                            {log.action}
                          </span>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-text-primary">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-text-tertiary" />
                            {log.adminEmail}
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-text-primary">
                          <div className="flex items-center gap-2">
                            <Target className="h-4 w-4 text-text-tertiary" />
                            {log.targetUserEmail}
                          </div>
                        </TableCell>
                        <TableCell className="text-text-secondary">
                          {log.details}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {/* APPLICATION / ERROR LOGS */}
          {(activeTab === "app" || activeTab === "error") && (
            <div className="p-4 flex-1 overflow-auto bg-bg-subtle text-text-secondary font-mono text-sm leading-relaxed">
              {(activeTab === "app" ? appLogs : errorLogs).length === 0 ? (
                <div className="text-text-muted italic">
                  No logs found in this file.
                </div>
              ) : (
                <pre className="whitespace-pre-wrap break-all">
                  {(activeTab === "app" ? appLogs : errorLogs).join("\n")}
                </pre>
              )}
            </div>
          )}

          {/* DATABASE LOGS */}
          {activeTab === "db" && (
            <div className="overflow-auto flex-1">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PID</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>App</TableHead>
                    <TableHead>State</TableHead>
                    <TableHead>Query</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dbLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-8 text-center text-text-secondary">
                        No active queries found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    dbLogs.map((log, idx) => (
                      <TableRow key={idx} className="text-body-md">
                        <TableCell className="whitespace-nowrap font-medium text-text-primary">
                          {log.pid}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-text-secondary">
                          {log.usename}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-text-secondary">
                          {log.application_name}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <span
                            className={`badge ${
                              log.state === "active"
                                ? "badge-income"
                                : "badge-neutral"
                            }`}
                          >
                            {log.state}
                          </span>
                        </TableCell>
                        <TableCell
                          className="text-text-secondary font-mono max-w-md truncate"
                          title={log.query}
                        >
                          {log.query}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </section>
      )}
    </div>
  );
};
