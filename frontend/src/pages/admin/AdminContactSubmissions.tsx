import React, { useCallback, useEffect, useState } from "react";
import { Dialog, Button, Dropdown } from "../../components/ui";
import api from "../../api/axiosInstance";
import { useToast } from "../../context/ToastContext";
import {
  Clock,
  Mail,
  CheckCircle,
  Trash2,
  Eye,
  Copy,
  Check,
  MoreHorizontal,
} from "lucide-react";
import { StateDisplay } from "../../components/shared/StateDisplay";
import { AdminContactSubmissionsSkeleton } from "../../components/skeletons/AdminContactSubmissionsSkeleton";
import { PageHeader } from "../../components/shared/PageHeader";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../../components/shared/Table";

interface ContactSubmission {
  id: string;
  fullName: string;
  email: string;
  topic: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export const AdminContactSubmissions: React.FC = () => {
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [selectedSubmission, setSelectedSubmission] =
    useState<ContactSubmission | null>(null);
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();

  const loadSubmissions = useCallback(async () => {
    // Avoid synchronous state update within effect by yielding to microtask queue
    await Promise.resolve();
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/admin/contact-submissions");
      setSubmissions(res.data || []);
    } catch (err: unknown) {
      console.error("Failed to load contact submissions:", err);
      setError("Could not load contact form submissions.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => loadSubmissions(), 0);
    return () => clearTimeout(timer);
  }, [loadSubmissions]);

  const handleToggleRead = async (
    id: string,
    currentRead: boolean,
    e?: React.MouseEvent,
  ) => {
    if (e) e.stopPropagation();
    try {
      await api.patch(`/admin/contact-submissions/${id}/read`, {
        read: !currentRead,
      });
      setSubmissions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, read: !currentRead } : s)),
      );
      if (selectedSubmission?.id === id) {
        setSelectedSubmission((prev) =>
          prev ? { ...prev, read: !currentRead } : null,
        );
      }
      showToast("success", `Marked as ${!currentRead ? "read" : "unread"}.`);
    } catch {
      showToast("error", "Failed to update read status.");
    }
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (
      !window.confirm(
        "Are you sure you want to permanently delete this submission?",
      )
    )
      return;
    try {
      await api.delete(`/admin/contact-submissions/${id}`);
      setSubmissions((prev) => prev.filter((s) => s.id !== id));
      if (selectedSubmission?.id === id) {
        setSelectedSubmission(null);
      }
      showToast("success", "Submission deleted successfully.");
    } catch {
      showToast("error", "Failed to delete submission.");
    }
  };

  const handleCopyMessage = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showToast("success", "Message copied to clipboard.");
  };

  const filteredSubmissions = submissions.filter((s) => {
    if (filter === "unread") return !s.read;
    if (filter === "read") return s.read;
    return true;
  });

  const unreadCount = submissions.filter((s) => !s.read).length;
  const readCount = submissions.filter((s) => s.read).length;

  const tabs = [
    { key: "all" as const, label: `All (${submissions.length})` },
    {
      key: "unread" as const,
      label: unreadCount > 0 ? `Unread (${unreadCount})` : "Unread",
    },
    { key: "read" as const, label: `Read (${readCount})` },
  ];

  return (
    <div className="space-y-6 pb-16">
      {/* Page Header */}
      <PageHeader
        title="Contact Submissions"
        subtitle="Review user feedback, inquiries, and support requests."
        onRefreshClick={loadSubmissions}
        isRefreshing={loading}
      />

      {/* Tab Navigation matching Budgets & Goals */}
      <section className="flex border-b border-border-muted pb-4">
        <div className="flex gap-4 overflow-x-auto hide-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`text-body-lg font-semibold px-2 py-1 border-b-2 transition-colors whitespace-nowrap ${
                filter === tab.key
                  ? "border-primary text-text-primary"
                  : "border-transparent text-text-muted hover:text-text-primary"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {/* Error state */}
      {error && (
        <StateDisplay
          type="error"
          title="Failed to load submissions"
          description={error}
          action={{ label: "Retry", onClick: loadSubmissions }}
        />
      )}

      {/* Main Table Content matching AdminUserManagement exactly */}
      {!error && (
        <section
          className={
            filteredSubmissions.length === 0 && !loading
              ? ""
              : "card p-0 overflow-hidden"
          }
        >
          {loading ? (
            <AdminContactSubmissionsSkeleton />
          ) : filteredSubmissions.length === 0 ? (
            <StateDisplay
              type="empty"
              title="No contact submissions yet"
              className="py-12"
              action={
                filter !== "all"
                  ? {
                      label: "Show All Submissions",
                      onClick: () => setFilter("all"),
                    }
                  : undefined
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sender</TableHead>
                  <TableHead>Topic</TableHead>
                  <TableHead>Message Preview</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Received</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubmissions.map((sub) => (
                  <TableRow
                    key={sub.id}
                    onClick={() => setSelectedSubmission(sub)}
                    className="cursor-pointer text-body-md"
                  >
                    {/* Sender */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 shrink-0 rounded-full bg-brand/10 text-brand font-semibold flex items-center justify-center border border-brand/20">
                          {sub.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-semibold text-text-primary block truncate">
                            {sub.fullName}
                          </span>
                          <span className="text-xs text-text-tertiary block truncate mt-0.5">
                            {sub.email}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Topic */}
                    <TableCell className="whitespace-nowrap">
                      <span className="badge badge-info">{sub.topic}</span>
                    </TableCell>

                    {/* Message Preview */}
                    <TableCell className="max-w-xs">
                      <div className="text-sm text-text-secondary truncate pr-4">
                        {sub.message}
                      </div>
                    </TableCell>

                    {/* Status */}
                    <TableCell className="whitespace-nowrap">
                      <span
                        className={`badge ${
                          !sub.read ? "badge-warning" : "badge-income"
                        }`}
                      >
                        {!sub.read ? "Unread" : "Read"}
                      </span>
                    </TableCell>

                    {/* Received Date */}
                    <TableCell className="whitespace-nowrap text-sm text-text-secondary">
                      {new Date(sub.createdAt).toLocaleDateString()}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="whitespace-nowrap text-right text-sm font-medium">
                      <div onClick={(e) => e.stopPropagation()}>
                        <Dropdown
                          align="right"
                          menuClassName="w-48"
                          trigger={
                            <button
                              className="p-1.5 rounded-md hover:bg-bg-subtle text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                              title="Actions"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                          }
                          items={[
                            {
                              id: "view",
                              label: "View Details",
                              icon: <Eye className="h-4 w-4" />,
                              onClick: () => {
                                setSelectedSubmission(sub);
                                if (!sub.read) handleToggleRead(sub.id, false);
                              },
                            },
                            {
                              id: "toggle-read",
                              label: sub.read ? "Mark as Unread" : "Mark as Read",
                              icon: <CheckCircle className="h-4 w-4" />,
                              onClick: () => handleToggleRead(sub.id, sub.read),
                              dividerAfter: true,
                            },
                            {
                              id: "delete",
                              label: "Delete",
                              icon: <Trash2 className="h-4 w-4" />,
                              variant: "danger",
                              onClick: () => handleDelete(sub.id),
                            },
                          ]}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </section>
      )}

      {/* Modal for Viewing Full Message Details */}
      <Dialog
        isOpen={!!selectedSubmission}
        onClose={() => setSelectedSubmission(null)}
        title={selectedSubmission ? `${selectedSubmission.fullName} (${selectedSubmission.email})` : "Message Details"}
        maxWidth="xl"
      >
            {selectedSubmission && (<>
            <div className="p-4 sm:p-6 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 text-body-sm">
                <div className="flex items-center gap-2">
                  <span className="text-text-tertiary">Topic:</span>
                  <span className="badge badge-neutral font-medium">
                    {selectedSubmission.topic}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-text-tertiary text-caption">
                  <Clock className="h-3.5 w-3.5" />
                  {new Date(selectedSubmission.createdAt).toLocaleString()}
                </div>
              </div>

              {/* Message Content Box */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-caption font-semibold text-text-secondary uppercase tracking-wider">
                    Message Content
                  </label>
                  <button
                    onClick={() =>
                      handleCopyMessage(selectedSubmission.message)
                    }
                    className="btn btn-ghost btn-sm text-text-tertiary hover:text-text-primary flex items-center gap-1"
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5 text-success" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    <span>{copied ? "Copied!" : "Copy text"}</span>
                  </button>
                </div>
                <div className="p-4 rounded-xl bg-bg-subtle border border-border text-body-sm text-text-primary whitespace-pre-wrap leading-relaxed max-h-[50vh] overflow-y-auto font-sans">
                  {selectedSubmission.message}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 px-4 sm:px-6 py-4 border-t border-border bg-bg-subtle/30">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    handleToggleRead(
                      selectedSubmission.id,
                      selectedSubmission.read,
                    )
                  }
                  leftIcon={
                    <CheckCircle
                      className={`h-4 w-4 shrink-0 ${selectedSubmission.read ? "text-text-tertiary" : "text-brand"}`}
                    />
                  }
                >
                  {selectedSubmission.read
                    ? "Mark as Unread"
                    : "Mark as Read"}
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDelete(selectedSubmission.id)}
                  leftIcon={<Trash2 className="h-4 w-4 shrink-0" />}
                >
                  Delete
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`mailto:${selectedSubmission.email}?subject=Re: ${encodeURIComponent(selectedSubmission.topic)}`}
                  className="btn btn-primary btn-sm w-full sm:w-auto flex items-center justify-center gap-1.5 whitespace-nowrap"
                >
                  <Mail className="h-4 w-4 shrink-0" />
                  <span>Reply via Email</span>
                </a>
              </div>
            </div>
            </>)}
      </Dialog>
    </div>
  );
};
