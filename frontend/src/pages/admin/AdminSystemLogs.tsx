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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-semibold tracking-tight text-text-primary">
            System Logs
          </h1>
          <p className="text-body-sm text-text-secondary mt-1">
            Monitor audit trails, application logs, and database activity.
          </p>
        </div>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-bg-surface border border-border rounded-lg text-sm font-medium hover:bg-bg-subtle transition-colors"
        >
          Refresh
        </button>
      </div>

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
        <div className="bg-bg-surface border border-border rounded-xl shadow-sm overflow-hidden min-h-[60vh] lg:min-h-[70vh] flex flex-col">
          {/* AUDIT LOGS */}
          {activeTab === "audit" && (
            <div className="overflow-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-bg-subtle border-b border-border">
                    <th className="px-6 py-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                      Admin
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                      Target User
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {auditLogs.map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-bg-subtle/50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {new Date(log.timestamp).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-bg-subtle text-text-primary border border-border">
                          <Activity className="h-3 w-3" />
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-text-tertiary" />
                          {log.adminEmail}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-text-tertiary" />
                          {log.targetUserEmail}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-text-secondary">
                        {log.details}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {auditLogs.length === 0 && (
                <div className="p-8 text-center text-text-secondary">
                  No audit logs found.
                </div>
              )}
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
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-bg-subtle border-b border-border">
                    <th className="px-6 py-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                      PID
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                      App
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                      State
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                      Query
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {dbLogs.map((log, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-bg-subtle/50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary">
                        {log.pid}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                        {log.usename}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                        {log.application_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border border-border ${
                            log.state === "active"
                              ? "badge-income"
                              : "badge-neutral"
                          }`}
                        >
                          {log.state}
                        </span>
                      </td>
                      <td
                        className="px-6 py-4 text-sm text-text-secondary font-mono max-w-md truncate"
                        title={log.query}
                      >
                        {log.query}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {dbLogs.length === 0 && (
                <div className="p-8 text-center text-text-secondary">
                  No active queries found.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
