import React, { useEffect, useState } from "react";
import {
  Users,
  CreditCard,
  Receipt,
  UserCheck,
  Cpu,
  Activity,
  ShieldAlert,
  ArrowRight,
  Server,
  Database,
  Box,
} from "lucide-react";
import { AdminOverviewSkeleton } from "../../components/skeletons/AdminOverviewSkeleton";
import api from "../../api/axiosInstance";
import { Link } from "react-router-dom";
import { PageHeader } from "../../components/shared/PageHeader";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../../components/shared/Table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

interface AdminMetrics {
  totalUsers: number;
  activeUsers: number;
  totalTransactions: number;
  totalAccounts: number;
  monthlySignups: { month: string; count: number }[];
  monthlyTransactions: { month: string; count: number }[];
  historicalInfraMetrics: {
    date: string;
    avgCpu: number;
    avgMem: number;
    avgPgConns: number;
    avgRedisClients: number;
    avgMongoConns: number;
  }[];
  systemHealth: {
    cpuUsagePercent: number;
    usedMemoryBytes: number;
    totalMemoryBytes: number;
    freeMemoryBytes: number;
    maxMemoryBytes: number;
  };
  databaseHealth: {
    activeConnections: number;
    totalCommits: number;
    cacheHitRatio: number;
  };
  redisHealth: {
    usedMemory: string;
    connectedClients: number;
    opsPerSec: number;
  };
  mongoHealth: {
    activeConnections: number;
    queriesPerSec: number;
    dbName: string;
  };
  recentUsers: {
    id: string;
    email: string;
    fullName: string;
    role: string;
    isActive: boolean;
    createdAt: string;
  }[];
}

export const AdminOverview: React.FC = () => {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/metrics");
      setMetrics(res.data);
    } catch (err) {
      const error = err as
        | Error
        | { response?: { data?: { message?: string } } };
      // @ts-expect-error - response type is not fully defined
      setError(
        error.response?.data?.message ||
          error.message ||
          "Failed to load metrics",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadMetrics();
  }, []);

  if (loading) {
    return <AdminOverviewSkeleton />;
  }

  if (error) {
    return (
      <div className="p-4 bg-destructive-bg text-destructive rounded-lg border border-destructive/20">
        Error loading metrics: {error}
      </div>
    );
  }

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const memPercentage = metrics?.systemHealth
    ? (metrics.systemHealth.usedMemoryBytes /
        metrics.systemHealth.maxMemoryBytes) *
      100
    : 0;

  const cpuPercentage = metrics?.systemHealth?.cpuUsagePercent || 0;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <PageHeader
        title="Platform Overview"
        subtitle="High-level metrics and performance analytics"
        onRefreshClick={loadMetrics}
        isRefreshing={loading}
      />

      {/* TOP ROW: KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-bg-surface border border-border rounded-xl p-5 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Users className="h-16 w-16 text-brand" />
          </div>
          <div className="relative z-10">
            <p className="text-sm font-medium text-text-secondary">
              Total Users
            </p>
            <p className="text-3xl font-display font-bold text-text-primary mt-2">
              {metrics?.totalUsers?.toLocaleString() || 0}
            </p>
          </div>
        </div>

        <div className="bg-bg-surface border border-border rounded-xl p-5 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <UserCheck className="h-16 w-16 text-income" />
          </div>
          <div className="relative z-10">
            <p className="text-sm font-medium text-text-secondary">
              Active Users
            </p>
            <p className="text-3xl font-display font-bold text-text-primary mt-2">
              {metrics?.activeUsers?.toLocaleString() || 0}
            </p>
          </div>
        </div>

        <div className="bg-bg-surface border border-border rounded-xl p-5 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <CreditCard className="h-16 w-16 text-info" />
          </div>
          <div className="relative z-10">
            <p className="text-sm font-medium text-text-secondary">
              Total Accounts
            </p>
            <p className="text-3xl font-display font-bold text-text-primary mt-2">
              {metrics?.totalAccounts?.toLocaleString() || 0}
            </p>
          </div>
        </div>

        <div className="bg-bg-surface border border-border rounded-xl p-5 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Receipt className="h-16 w-16 text-warning" />
          </div>
          <div className="relative z-10">
            <p className="text-sm font-medium text-text-secondary">
              Total Transactions
            </p>
            <p className="text-3xl font-display font-bold text-text-primary mt-2">
              {metrics?.totalTransactions?.toLocaleString() || 0}
            </p>
          </div>
        </div>
      </div>

      {/* NEW ROW: INFRASTRUCTURE HEALTH */}
      <div>
        <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
          <Server className="h-5 w-5 text-text-secondary" /> Infrastructure
          Health
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* App Server */}
          <div className="bg-bg-surface border border-border rounded-xl p-5 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-text-secondary flex items-center gap-1.5">
                <Cpu className="h-4 w-4" /> App Server
              </h3>
              <span
                className={`h-2.5 w-2.5 rounded-full ${cpuPercentage < 80 ? "bg-income" : "bg-destructive"}`}
              ></span>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-text-secondary">JVM Memory</span>
                  <span className="font-medium text-text-primary">
                    {memPercentage.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-border rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full ${memPercentage > 85 ? "bg-destructive" : "bg-brand"}`}
                    style={{ width: `${Math.min(memPercentage, 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-text-tertiary mt-1 text-right">
                  {formatBytes(metrics?.systemHealth?.usedMemoryBytes || 0)} /{" "}
                  {formatBytes(metrics?.systemHealth?.maxMemoryBytes || 0)}
                </p>
              </div>
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-text-secondary">CPU Load</span>
                  <span className="font-medium text-text-primary">
                    {cpuPercentage.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-border rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full ${cpuPercentage > 80 ? "bg-destructive" : "bg-info"}`}
                    style={{ width: `${Math.min(cpuPercentage, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* PostgreSQL */}
          <div className="bg-bg-surface border border-border rounded-xl p-5 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-text-secondary flex items-center gap-1.5">
                <Database className="h-4 w-4" /> PostgreSQL
              </h3>
              <span className="h-2.5 w-2.5 rounded-full bg-income"></span>
            </div>
            <div className="grid grid-cols-2 gap-y-4 gap-x-2">
              <div>
                <p className="text-xs text-text-tertiary uppercase tracking-wider">
                  Connections
                </p>
                <p className="text-lg font-semibold text-text-primary mt-0.5">
                  {metrics?.databaseHealth?.activeConnections || 0}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-tertiary uppercase tracking-wider">
                  Hit Ratio
                </p>
                <p className="text-lg font-semibold text-text-primary mt-0.5">
                  {metrics?.databaseHealth?.cacheHitRatio
                    ? `${metrics.databaseHealth.cacheHitRatio.toFixed(2)}%`
                    : "N/A"}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-text-tertiary uppercase tracking-wider">
                  Total Commits (Lifetime)
                </p>
                <p className="text-sm font-medium text-text-primary mt-0.5">
                  {metrics?.databaseHealth?.totalCommits?.toLocaleString() || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Redis */}
          <div className="bg-bg-surface border border-border rounded-xl p-5 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-text-secondary flex items-center gap-1.5">
                <Box className="h-4 w-4" /> Redis Cache
              </h3>
              <span className="h-2.5 w-2.5 rounded-full bg-income"></span>
            </div>
            <div className="grid grid-cols-2 gap-y-4 gap-x-2">
              <div>
                <p className="text-xs text-text-tertiary uppercase tracking-wider">
                  Clients
                </p>
                <p className="text-lg font-semibold text-text-primary mt-0.5">
                  {metrics?.redisHealth?.connectedClients || 0}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-tertiary uppercase tracking-wider">
                  Ops / Sec
                </p>
                <p className="text-lg font-semibold text-text-primary mt-0.5">
                  {metrics?.redisHealth?.opsPerSec || 0}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-text-tertiary uppercase tracking-wider">
                  Used Memory
                </p>
                <p className="text-sm font-medium text-text-primary mt-0.5">
                  {metrics?.redisHealth?.usedMemory || "0B"}
                </p>
              </div>
            </div>
          </div>

          {/* MongoDB */}
          <div className="bg-bg-surface border border-border rounded-xl p-5 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-text-secondary flex items-center gap-1.5">
                <Database className="h-4 w-4" /> MongoDB
              </h3>
              <span className="h-2.5 w-2.5 rounded-full bg-income"></span>
            </div>
            <div className="grid grid-cols-2 gap-y-4 gap-x-2">
              <div>
                <p className="text-xs text-text-tertiary uppercase tracking-wider">
                  Connections
                </p>
                <p className="text-lg font-semibold text-text-primary mt-0.5">
                  {metrics?.mongoHealth?.activeConnections || 0}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-tertiary uppercase tracking-wider">
                  Operations
                </p>
                <p className="text-lg font-semibold text-text-primary mt-0.5">
                  {metrics?.mongoHealth?.queriesPerSec?.toLocaleString() || 0}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-text-tertiary uppercase tracking-wider">
                  Database Name
                </p>
                <p className="text-sm font-medium text-text-primary mt-0.5">
                  {metrics?.mongoHealth?.dbName || "budgetsetu"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MIDDLE ROW: CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth */}
        <div className="bg-bg-surface border border-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-semibold text-text-primary flex items-center gap-2">
                <Users className="h-4 w-4 text-brand" /> User Signups
              </h3>
              <p className="text-xs text-text-secondary">Past 6 months</p>
            </div>
          </div>
          <div className="h-64">
            {metrics?.monthlySignups && metrics.monthlySignups.length > 0 ? (
              <ResponsiveContainer
                width="100%"
                height="100%"
                minWidth={1}
                minHeight={1}
              >
                <BarChart
                  data={metrics.monthlySignups}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="var(--color-border)"
                  />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12, fill: "var(--color-text-secondary)" }}
                    dy={10}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12, fill: "var(--color-text-secondary)" }}
                  />
                  <Tooltip
                    cursor={{ fill: "var(--color-bg-subtle)" }}
                    contentStyle={{
                      backgroundColor: "var(--color-bg-surface)",
                      borderColor: "var(--color-border)",
                      borderRadius: "0.5rem",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    }}
                  />
                  <Bar
                    dataKey="count"
                    fill="var(--color-brand)"
                    radius={[4, 4, 0, 0]}
                    barSize={32}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-text-secondary text-sm">
                No data available
              </div>
            )}
          </div>
        </div>

        {/* Platform Activity (Transactions) */}
        <div className="bg-bg-surface border border-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-semibold text-text-primary flex items-center gap-2">
                <Activity className="h-4 w-4 text-orange-500" /> Platform
                Activity
              </h3>
              <p className="text-xs text-text-secondary">
                Transactions processed (Past 6 months)
              </p>
            </div>
          </div>
          <div className="h-64">
            {metrics?.monthlyTransactions &&
            metrics.monthlyTransactions.length > 0 ? (
              <ResponsiveContainer
                width="100%"
                height="100%"
                minWidth={1}
                minHeight={1}
              >
                <AreaChart
                  data={metrics.monthlyTransactions}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="var(--color-warning)"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor="var(--color-warning)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="var(--color-border)"
                  />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12, fill: "var(--color-text-secondary)" }}
                    dy={10}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12, fill: "var(--color-text-secondary)" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--color-bg-surface)",
                      borderColor: "var(--color-border)",
                      borderRadius: "0.5rem",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="var(--color-warning)"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorCount)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-text-secondary text-sm">
                No data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* HISTORICAL INFRASTRUCTURE CHART */}
      <div className="bg-bg-surface border border-border rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-semibold text-text-primary flex items-center gap-2">
              <Server className="h-4 w-4 text-purple-500" /> Historical
              Infrastructure Performance
            </h3>
            <p className="text-xs text-text-secondary">
              Average CPU & Memory Usage (Past 30 Days)
            </p>
          </div>
        </div>
        <div className="h-72">
          {metrics?.historicalInfraMetrics &&
          metrics.historicalInfraMetrics.length > 0 ? (
            <ResponsiveContainer
              width="100%"
              height="100%"
              minWidth={1}
              minHeight={1}
            >
              <AreaChart
                data={metrics.historicalInfraMetrics}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-info)"
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-info)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                  <linearGradient id="colorMem" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-brand)"
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-brand)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="var(--color-border)"
                />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: "var(--color-text-secondary)" }}
                  dy={10}
                  tickFormatter={(val) => {
                    const d = new Date(val);
                    return `${d.getMonth() + 1}/${d.getDate()}`;
                  }}
                />
                {/* Two Y-Axes for different scales */}
                <YAxis
                  yAxisId="left"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: "var(--color-text-secondary)" }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: "var(--color-text-secondary)" }}
                />

                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-bg-surface)",
                    borderColor: "var(--color-border)",
                    borderRadius: "0.5rem",
                  }}
                  labelFormatter={(val) => new Date(val).toLocaleDateString()}
                  formatter={(
                    value:
                      | string
                      | number
                      | readonly (string | number)[]
                      | undefined,
                  ) => {
                    if (typeof value === "number") return value.toFixed(2);
                    if (Array.isArray(value)) return value.join(", ");
                    return value ?? "";
                  }}
                />

                <Area
                  yAxisId="left"
                  type="monotone"
                  name="CPU Usage (%)"
                  dataKey="avgCpu"
                  stroke="var(--color-info)"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorCpu)"
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  name="Memory (MB)"
                  dataKey="avgMem"
                  stroke="var(--color-brand)"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorMem)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-text-secondary text-sm">
              No historical data available yet. Check back tomorrow!
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM ROW: FEEDS AND ACTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Registrations Table */}
        <section className="lg:col-span-2 card p-0 overflow-hidden flex flex-col">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <h3 className="text-base font-semibold text-text-primary">
              Recent Registrations
            </h3>
            <Link
              to="/users"
              className="text-sm font-medium text-brand hover:text-brand-dark flex items-center gap-1 transition-colors"
            >
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="overflow-x-auto flex-1">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metrics?.recentUsers?.map((user) => (
                  <TableRow key={user.id} className="text-body-md">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-brand/10 text-brand flex items-center justify-center font-bold text-xs shrink-0">
                          {user.fullName?.charAt(0) || "U"}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-text-primary">
                            {user.fullName}
                          </p>
                          <p className="text-xs text-text-secondary">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-text-secondary">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`badge ${
                          user.isActive ? "badge-income" : "badge-expense"
                        }`}
                      >
                        {user.isActive ? "Active" : "Suspended"}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>

        {/* Quick Links / Actions */}
        <div className="bg-bg-surface border border-border rounded-xl shadow-sm p-5 flex flex-col">
          <h3 className="text-base font-semibold text-text-primary mb-4">
            Quick Actions
          </h3>
          <div className="space-y-3 flex-1">
            <Link
              to="/users"
              className="flex items-start gap-4 p-3 rounded-lg border border-border hover:border-brand/30 hover:bg-brand/5 transition-all group"
            >
              <div className="p-2 rounded-md bg-brand/10 text-brand group-hover:bg-brand group-hover:text-white transition-colors">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-text-primary group-hover:text-brand transition-colors">
                  Manage Users
                </h4>
                <p className="text-xs text-text-secondary mt-0.5">
                  Suspend or promote accounts
                </p>
              </div>
            </Link>

            <Link
              to="/logs"
              className="flex items-start gap-4 p-3 rounded-lg border border-border hover:border-brand/30 hover:bg-brand/5 transition-all group"
            >
              <div className="p-2 rounded-md bg-brand/10 text-brand group-hover:bg-brand group-hover:text-white transition-colors">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-text-primary group-hover:text-purple-500 transition-colors">
                  System Logs
                </h4>
                <p className="text-xs text-text-secondary mt-0.5">
                  Monitor audits and app health
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
