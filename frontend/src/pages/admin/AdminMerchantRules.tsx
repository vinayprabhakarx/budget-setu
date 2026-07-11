import React, { useCallback, useEffect, useState } from "react";
import { Dialog, Button, Pagination, ModalFooter, Dropdown } from "../../components/ui";
import api from "../../api/axiosInstance";
import { useToast } from "../../context/ToastContext";
import {
  Tag,
  Plus,
  Pencil,
  Trash2,
  MoreHorizontal,
} from "lucide-react";
import { Select } from "../../components/shared/Select";
import { StateDisplay } from "../../components/shared/StateDisplay";
import { AdminMerchantRulesSkeleton } from "../../components/skeletons/AdminMerchantRulesSkeleton";
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

interface MerchantRule {
  id: string;
  merchantPattern: string;
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  source: string;
  createdAt: string;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: string;
}

const PAGE_SIZE = 15;

export const AdminMerchantRules: React.FC = () => {
  const { showToast } = useToast();

  const [rules, setRules] = useState<MerchantRule[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(0);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editRule, setEditRule] = useState<MerchantRule | null>(null);
  const [formKeyword, setFormKeyword] = useState("");
  const [formCategoryId, setFormCategoryId] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);

  const loadRules = useCallback(async () => {
    await Promise.resolve(); // Prevent synchronous setState in effect
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/admin/merchant-rules");
      setRules(res.data || []);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(e.response?.data?.message || e.message || "Failed to load merchant rules.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCategories = useCallback(async () => {
    await Promise.resolve(); // Prevent synchronous setState in effect
    try {
      const res = await api.get("/categories");
      setCategories(res.data || []);
    } catch {
      // Non-critical; don't block the page
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadRules();
      loadCategories();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadRules, loadCategories]);

  // Filtered + paginated rules
  const filtered = rules.filter((r) => {
    const matchesSearch =
      !searchQuery ||
      r.merchantPattern.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.categoryName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !categoryFilter || r.categoryId === categoryFilter;
    return matchesSearch && matchesCategory;
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

  const openAddModal = () => {
    setEditRule(null);
    setFormKeyword("");
    setFormCategoryId(categories[0]?.id || "");
    setIsModalOpen(true);
  };

  const openEditModal = (rule: MerchantRule) => {
    setEditRule(rule);
    setFormKeyword(rule.merchantPattern);
    setFormCategoryId(rule.categoryId);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditRule(null);
    setFormKeyword("");
    setFormCategoryId("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formKeyword.trim() || !formCategoryId) {
      showToast("error", "Please fill in all fields.");
      return;
    }
    setFormSubmitting(true);
    try {
      if (editRule) {
        await api.put(`/admin/merchant-rules/${editRule.id}`, {
          merchantPattern: formKeyword.trim(),
          categoryId: formCategoryId,
        });
        showToast("success", "Merchant rule updated.");
      } else {
        await api.post("/admin/merchant-rules", {
          merchantPattern: formKeyword.trim(),
          categoryId: formCategoryId,
        });
        showToast("success", "Merchant rule created.");
      }
      closeModal();
      loadRules();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      showToast("error", e.response?.data?.message || e.message || "Action failed.");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async (rule: MerchantRule) => {
    if (!window.confirm(`Delete rule for "${rule.merchantPattern}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/merchant-rules/${rule.id}`);
      showToast("success", "Merchant rule deleted.");
      loadRules();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      showToast("error", e.response?.data?.message || e.message || "Delete failed.");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Page Header */}
      <PageHeader
        title="Merchant Rules"
        subtitle="Manage system-wide keyword-to-category mapping rules."
        onFilterClick={() => setShowFilters(!showFilters)}
        showFilters={showFilters}
        onRefreshClick={loadRules}
        isRefreshing={loading}
      >
        <Button
          variant="primary"
          size="sm"
          onClick={openAddModal}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          Add Rule
        </Button>
      </PageHeader>

      {/* Filter & Search Controls */}
      <FilterSection
        isOpen={showFilters}
        searchQuery={searchQuery}
        onSearchChange={(val) => {
          setSearchQuery(val);
          setCurrentPage(0);
        }}
        searchPlaceholder="Search keyword or category…"
        hasActiveFilters={Boolean(searchQuery || categoryFilter)}
        onReset={() => {
          setSearchQuery("");
          setCategoryFilter("");
          setCurrentPage(0);
        }}
      >
        <Select
          value={categoryFilter}
          onChange={(val) => {
            setCategoryFilter(val);
            setCurrentPage(0);
          }}
          options={[
            { value: "", label: "All Categories" },
            ...categories.map((c) => ({
              value: c.id,
              label: c.name,
            })),
          ]}
          size="sm"
        />
      </FilterSection>

      {/* Table Card */}
      <section className={rules.length === 0 && !loading ? "" : "card p-0 overflow-hidden"}>
        {loading ? (
          <AdminMerchantRulesSkeleton />
        ) : error ? (
          <StateDisplay
            type="error"
            title="Failed to load rules"
            description={error}
            action={{ label: "Retry", onClick: loadRules }}
          />
        ) : filtered.length === 0 ? (
          <StateDisplay
            type="empty"
            title="No merchant rules found"
            description={
              searchQuery
                ? "No rules match your search. Try a different keyword."
                : "No rules yet. Click 'Add Rule' to create one."
            }
            action={!searchQuery ? { label: "Add Rule", onClick: openAddModal } : undefined}
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Keyword</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((rule) => (
                  <TableRow key={rule.id} className="text-body-md">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-text-tertiary shrink-0" />
                        <span className="text-sm font-medium text-text-primary font-mono">
                          {rule.merchantPattern}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <span
                        className="badge"
                        style={{
                          backgroundColor: rule.categoryColor ? `${rule.categoryColor}20` : undefined,
                          color: rule.categoryColor || undefined,
                        }}
                      >
                        <span>{rule.categoryIcon}</span>
                        {rule.categoryName}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <span
                        className={`badge ${
                          rule.source === "ADMIN" || rule.source === "SYSTEM"
                            ? "badge-warning"
                            : "badge-info"
                        }`}
                      >
                        {rule.source || "ADMIN"}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-text-secondary">
                      {new Date(rule.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right font-medium">
                      <div onClick={(e) => e.stopPropagation()}>
                        <Dropdown
                          align="right"
                          menuClassName="w-44"
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
                              id: "edit",
                              label: "Edit Rule",
                              icon: <Pencil className="h-4 w-4" />,
                              onClick: () => openEditModal(rule),
                            },
                            {
                              id: "delete",
                              label: "Delete Rule",
                              icon: <Trash2 className="h-4 w-4" />,
                              variant: "danger",
                              onClick: () => handleDelete(rule),
                            },
                          ]}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}
      </section>

      {!loading && !error && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Add / Edit Modal */}
      <Dialog
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editRule ? "Edit Merchant Rule" : "Add Merchant Rule"}
        maxWidth="md"
      >
            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Keyword / Pattern
                </label>
                <input
                  type="text"
                  value={formKeyword}
                  onChange={(e) => setFormKeyword(e.target.value)}
                  placeholder="e.g. SWIGGY, amazon, uber"
                  className="w-full px-3 py-2 text-sm bg-bg-base border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors"
                  required
                  autoFocus
                />
                <p className="mt-1 text-xs text-text-tertiary">
                  Case-insensitive substring match on merchant name.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Category
                </label>
                <select
                  value={formCategoryId}
                  onChange={(e) => setFormCategoryId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-bg-base border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors"
                  required
                >
                  <option value="">— Select a category —</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <ModalFooter
                onCancel={closeModal}
                submitText={editRule ? "Save Changes" : "Create Rule"}
                isLoading={formSubmitting}
              />
            </form>
      </Dialog>
    </div>
  );
};
