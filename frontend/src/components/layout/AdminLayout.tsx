import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { ThemeToggle } from "../shared/ThemeToggle";
import {
  LayoutDashboard,
  Users,
  Activity,
  LogOut,
  Pin,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isPinned, setIsPinned] = useState(() => {
    const saved = localStorage.getItem("budgetsetu_admin_sidebar_pinned");
    return saved !== null ? JSON.parse(saved) : true;
  });

  const isExpanded = isPinned;

  const menuItems = [
    { name: "Overview", path: "/dashboard", icon: LayoutDashboard },
    { name: "User Management", path: "/users", icon: Users },
    { name: "System Logs", path: "/logs", icon: Activity },
  ];

  const handleLogout = async () => {
    await logout();
    showToast("success", "Logged out successfully.");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-bg-base text-text-primary flex overflow-x-hidden relative w-full">
      {/* 1. Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col bg-bg-surface border-r border-border h-[calc(100vh-4rem)] fixed top-16 left-0 z-30 transition-all duration-200 ease-in-out ${
          isExpanded ? "w-60" : "w-16"
        }`}
      >
        {/* Nav Links */}
        <nav
          className={`flex-1 py-6 space-y-1 ${isExpanded ? "px-4" : "px-2"}`}
        >
          <div className={`text-[0.625rem] font-bold text-text-tertiary uppercase tracking-wider mb-2 ${isExpanded ? "px-3" : "text-center"}`}>
            {isExpanded ? "Admin Portal" : "Admin"}
          </div>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                title={!isExpanded ? item.name : undefined}
                className={`flex items-center rounded-md text-body-md font-medium transition-colors ${
                  isExpanded ? "gap-3 px-3 py-2.5" : "justify-center p-2.5"
                } ${
                  isActive
                    ? "bg-brand/10 text-brand"
                    : "text-text-secondary hover:bg-bg-subtle hover:text-text-primary"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {isExpanded && <span className="truncate">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        <div
          className={`border-t border-border space-y-4 bg-bg-surface transition-all duration-200 ${isExpanded ? "p-4" : "py-4 px-2"}`}
        >
          {/* User Profile Info */}
          <Link
            to="/profile"
            title={!isExpanded ? user?.fullName || "User Profile" : undefined}
            className={`flex items-center gap-3 hover:bg-bg-subtle rounded-md transition-colors cursor-pointer ${
              isExpanded ? "px-2 py-2 w-full" : "justify-center p-1.5"
            }`}
          >
            <div className="h-9 w-9 rounded-full bg-brand/10 text-brand font-semibold flex items-center justify-center shrink-0 border border-brand/30">
              {user?.fullName?.charAt(0) || "A"}
            </div>
            {isExpanded && (
              <div className="min-w-0">
                <p className="text-body-md font-semibold truncate leading-tight text-brand">
                  {user?.fullName || "Admin User"}
                </p>
                <p className="text-body-sm text-text-secondary truncate leading-tight">
                  {user?.email}
                </p>
              </div>
            )}
          </Link>

          {/* Action Row */}
          <div
            className={`flex ${isExpanded ? "items-center justify-between border-t border-border/50 pt-3 px-1" : "flex-col items-center gap-3 pt-3 border-t border-border/50"}`}
          >
            <ThemeToggle />
            <button
              onClick={handleLogout}
              className="p-2 rounded-md hover:bg-destructive-bg text-text-secondary hover:text-destructive transition-colors cursor-pointer"
              title="Log Out"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Floating Pin Button */}
        <button
          onClick={() => {
            const next = !isPinned;
            setIsPinned(next);
            localStorage.setItem(
              "budgetsetu_admin_sidebar_pinned",
              JSON.stringify(next),
            );
          }}
          className="absolute top-1/2 -translate-y-1/2 -right-3 z-50 w-6 h-6 rounded-full bg-bg-surface border border-border flex items-center justify-center shadow-md hover:bg-bg-subtle text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
          title={isPinned ? "Collapse Sidebar" : "Expand Sidebar"}
        >
          <Pin
            className={`h-3 w-3 transition-transform duration-200 ${isPinned ? "" : "-rotate-45"}`}
          />
        </button>
      </aside>

      {/* Mobile Header (Topbar for < lg screen sizes) */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-bg-surface border-b border-border z-50 flex items-center justify-between px-4 shadow-sm">
        <Link
          to="/dashboard"
          className="flex items-start gap-2 font-display text-text-primary text-2xl font-medium tracking-tight select-none"
        >
          <span>BudgetSetu</span>
          <span className="text-xl font-bold text-brand font-sans" title="Beta">β</span>
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1 rounded-md hover:bg-bg-subtle text-text-secondary"
          >
            {mobileMenuOpen ? <ChevronUp className="h-6 w-6" /> : <ChevronDown className="h-6 w-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex flex-col pt-16">
          <div
            className="fixed inset-0 bg-bg-overlay/80 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative bg-bg-surface border-b border-border p-4 shadow-lg flex flex-col gap-4 animate-in slide-in-from-top-2">
            <Link
              to="/profile"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 hover:bg-bg-subtle p-2 rounded-lg transition-colors cursor-pointer w-full"
            >
              <div className="h-9 w-9 rounded-full bg-brand/10 text-brand font-semibold flex items-center justify-center shrink-0 border border-brand/30">
                {user?.fullName?.charAt(0) || "A"}
              </div>
              <div className="min-w-0">
                <p className="text-body-md font-semibold truncate text-brand">
                  {user?.fullName}
                </p>
                <p className="text-body-sm text-text-secondary truncate">
                  {user?.email}
                </p>
              </div>
            </Link>

            <div className="flex items-center justify-between border-t border-border/50 pt-3 px-1">
              <button
                onClick={handleLogout}
                className="p-2 rounded-md hover:bg-destructive-bg text-text-secondary hover:text-destructive transition-colors cursor-pointer"
                title="Log Out"
              >
                <LogOut className="h-5 w-5" />
              </button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      )}

      {/* Desktop Topbar */}
      <header className="hidden lg:flex items-center justify-between h-16 w-full fixed top-0 left-0 bg-bg-surface border-b border-border px-8 z-40 shadow-sm">
        <Link
          to="/dashboard"
          className="flex items-start gap-2 font-display text-text-primary text-2xl lg:text-3xl tracking-tight select-none"
        >
          <span>BudgetSetu</span>
          <span className="text-xl font-bold text-brand font-sans" title="Beta">β</span>
        </Link>
      </header>
        
      {/* 2. Main Page Layout Wrapper */}
      <div
        className={`flex-1 flex flex-col min-w-0 pt-16 lg:pt-16 transition-all duration-200 ease-in-out ${
          isPinned ? "lg:ml-60" : "lg:ml-16"
        }`}
      >
        {/* 3. Primary Page Content Container */}
        <div className="flex-1 flex flex-col w-full items-center">
          <main className="flex-1 p-4 lg:p-8 max-w-(--layout-content-max-width) w-full">
            {children}
          </main>
        </div>

        {/* 4. Mobile Bottom Navigation Bar (< lg screens) */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-14 bg-bg-surface border-t border-border flex items-center justify-between z-30 px-1 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center flex-1 min-w-0 h-12 transition-colors ${
                  isActive
                    ? "text-brand"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="text-[0.625rem] mt-0.5 truncate w-full text-center font-medium px-0.5">
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
