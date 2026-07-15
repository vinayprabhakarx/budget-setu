import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Dialog } from '../../../components/ui/Dialog';
import { Dropdown } from '../../../components/ui/Dropdown';
import { Trash2, ChevronDown, ChevronRight, Calendar, Edit2, MoreHorizontal } from 'lucide-react';
import { Select } from '../../../components/shared/Select';
import { BudgetPlansSkeleton } from "../../../components/skeletons/BudgetPlansSkeleton";
import { StateDisplay } from '../../../components/shared/StateDisplay';
import { CurrencyInput } from '../../../components/shared/CurrencyInput';
import { formatCurrency } from '../../../utils/currency';
import { getBudgetProgressBgClass } from '../../../utils/budgetColor';
import type { BudgetPlan, ProcessedPlan, Category, BudgetAllocation } from './types';
import { calculateEndDate } from './types';
import api from '../../../api/axiosInstance';
import { useToast } from '../../../context/ToastContext';

interface Props {
  plans: BudgetPlan[];
  categories: Category[];
  loading: boolean;
  onRefresh: () => void;
}

/**
 * Budget Plans Sub-Component
 * 
 * Displays and manages all active budget plans.
 * Shows progress against spending limits for each plan and allows creating/editing/deleting plans.
 */
export const BudgetPlans: React.FC<Props> = ({ plans, categories, loading, onRefresh }) => {
  const { showToast } = useToast();
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [expandedPlans, setExpandedPlans] = useState<Set<string>>(new Set());
  const [planForm, setPlanForm] = useState<Partial<BudgetPlan>>({
    name: '', periodType: 'MONTH', startDate: '', endDate: '', totalAmount: 0,
  });
  const [planAllocations, setPlanAllocations] = useState<{ categoryId: string; amount: number }[]>([]);

  const openCreate = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    setPlanForm({ name: '', periodType: 'MONTHLY', startDate: today, endDate: calculateEndDate(today, 'MONTHLY'), totalAmount: 0 });
    setPlanAllocations([]);
    setIsPlanModalOpen(true);
  }, []);

  useEffect(() => {
    const handleOpen = () => openCreate();
    window.addEventListener('open-new-plan', handleOpen);
    return () => window.removeEventListener('open-new-plan', handleOpen);
  }, [openCreate]);

  const processedPlans = useMemo(() => {
    const sorted = [...plans].sort((a, b) => {
      const durA = new Date(a.endDate).getTime() - new Date(a.startDate).getTime();
      const durB = new Date(b.endDate).getTime() - new Date(b.startDate).getTime();
      return durB - durA;
    });
    const roots: ProcessedPlan[] = [];
    const tryAddAsChild = (node: ProcessedPlan, plan: ProcessedPlan): boolean => {
      if (plan.startDate >= node.startDate && plan.endDate <= node.endDate) {
        for (const child of node.children) {
          if (tryAddAsChild(child, plan)) return true;
        }
        node.children.push(plan);
        return true;
      }
      return false;
    };
    for (const plan of sorted) {
      const pPlan = { ...plan, children: [] };
      let added = false;
      for (const root of roots) {
        if (tryAddAsChild(root, pPlan)) { added = true; break; }
      }
      if (!added) roots.push(pPlan);
    }
    const sortByDate = (nodes: ProcessedPlan[]) => {
      nodes.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
      nodes.forEach(n => sortByDate(n.children));
    };
    sortByDate(roots);
    return roots;
  }, [plans]);

  const toggleExpand = (id: string) => {
    const findPath = (nodes: ProcessedPlan[], targetId: string, path: string[] = []): string[] | null => {
      for (const node of nodes) {
        if (node.id === targetId) return [...path, node.id];
        if (node.children?.length) {
          const res = findPath(node.children, targetId, [...path, node.id]);
          if (res) return res;
        }
      }
      return null;
    };
    setExpandedPlans(prev => {
      if (prev.has(id)) { const s = new Set(prev); s.delete(id); return s; }
      return new Set(findPath(processedPlans, id) || [id]);
    });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this budget plan?')) return;
    try {
      await api.delete(`/budget-plans/${id}`);
      showToast('success', 'Budget plan deleted.');
      onRefresh();
      window.dispatchEvent(new CustomEvent('transaction-added'));
    } catch { showToast('error', 'Failed to delete budget plan.'); }
  };



  const openEdit = (plan: BudgetPlan) => {
    setPlanForm({ id: plan.id, name: plan.name, periodType: plan.periodType, startDate: plan.startDate, endDate: plan.endDate, totalAmount: plan.totalAmount });
    setPlanAllocations(plan.allocations.map(a => ({ categoryId: a.categoryId, amount: a.amount })));
    setIsPlanModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...planForm, allocations: planAllocations.filter(a => a.categoryId && a.amount > 0) };
      if (planForm.id) {
        await api.put(`/budget-plans/${planForm.id}`, payload);
        showToast('success', 'Budget plan updated.');
      } else {
        await api.post('/budget-plans', payload);
        showToast('success', 'Budget plan created.');
      }
      setIsPlanModalOpen(false);
      onRefresh();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      showToast('error', e.response?.data?.message || 'Failed to save budget plan.');
    } finally { setSubmitting(false); }
  };

  const renderTree = (plan: ProcessedPlan, level = 0): React.ReactNode => {
    const isExpanded = expandedPlans.has(plan.id);
    const totalSpent = plan.totalSpent ?? plan.allocations.reduce((sum, a) => sum + (a.spent || 0), 0);
    const progressPercent = plan.totalAmount > 0 ? (totalSpent / plan.totalAmount) * 100 : 0;
    const hasExpandableContent = (plan.children?.length > 0 || plan.allocations?.length > 0);
    
    return (
      <div key={plan.id} className={level === 0 ? '' : 'mt-4'}>
        <div className={`card p-5 sm:p-6 min-h-56 transition-all duration-200 shadow-xs hover:shadow-md hover:border-border-muted/80 bg-bg-surface/95 flex flex-col justify-between space-y-4 relative group ${level > 0 ? 'ml-6 border-l-4 border-l-primary/30 mt-4' : 'h-full'}`}>
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex-1 min-w-0">
              <div className={`flex items-center gap-2 ${hasExpandableContent ? 'cursor-pointer' : ''}`} onClick={() => hasExpandableContent && toggleExpand(plan.id)}>
                {hasExpandableContent && (
                  <button className="text-text-muted hover:text-text-primary transition-colors shrink-0">
                    {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                  </button>
                )}
                <div className="flex flex-wrap items-center gap-1.5 overflow-hidden">
                  <h3 className="font-semibold text-text-primary text-body-lg leading-tight truncate max-w-full">{plan.name || "N/A"}</h3>
                  <span className="text-badge font-semibold tracking-wider uppercase px-1.5 py-0.5 bg-primary/10 text-primary rounded border border-primary/20 shrink-0">{plan.periodType || "N/A"}</span>
                </div>
              </div>
              <div className={`mt-1.5 flex flex-wrap items-center gap-2 ${hasExpandableContent ? 'ml-7' : ''}`}>
                <div className="flex items-center gap-1.5 text-body-sm text-text-secondary whitespace-nowrap">
                  <Calendar className="h-3.5 w-3.5 shrink-0" />
                  <span>{plan.startDate ? `${plan.startDate} to ${plan.endDate || 'N/A'}` : "Dates: N/A"}</span>
                </div>
              </div>
            </div>
            <div className="shrink-0 ml-1" onClick={(e) => e.stopPropagation()}>
              <Dropdown
                align="right"
                menuClassName="w-44"
                trigger={
                  <button
                    className="p-1.5 rounded-md hover:bg-bg-subtle text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                    title="Budget Actions"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                }
                items={[
                  {
                    id: "edit",
                    label: "Edit Budget",
                    icon: <Edit2 className="h-4 w-4" />,
                    onClick: () => openEdit(plan),
                  },
                  {
                    id: "delete",
                    label: "Delete Budget",
                    icon: <Trash2 className="h-4 w-4" />,
                    variant: "danger",
                    onClick: () => handleDelete(plan.id),
                  },
                ]}
              />
            </div>
          </div>
          <div className="mt-auto pt-4 border-t border-border space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-body-sm">
              <span className="text-text-secondary whitespace-nowrap">Spent: <b className="num text-text-primary font-medium">{totalSpent !== null && totalSpent !== undefined ? formatCurrency(totalSpent) : "N/A"}</b></span>
              <span className="text-text-secondary whitespace-nowrap">Budget: <b className="num text-text-primary font-medium">{plan.totalAmount !== null && plan.totalAmount !== undefined ? formatCurrency(plan.totalAmount) : "N/A"}</b></span>
            </div>
            <div className="h-2 w-full bg-bg-subtle rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-deliberate ease-standard ${getBudgetProgressBgClass(progressPercent)}`} style={{ width: `${Math.min(progressPercent, 100)}%` }} />
            </div>
            <div className="flex justify-between items-center pt-1 text-caption">
              <span className={`font-semibold ${progressPercent >= 100 ? 'text-expense' : progressPercent >= 75 ? 'text-warning' : 'text-income'}`}>{progressPercent.toFixed(0)}% Exhausted</span>
              {progressPercent >= 100 && <span className="text-expense font-semibold">Budget Exceeded ⚠️</span>}
            </div>
          </div>
          {isExpanded && (
            <div className="mt-4 space-y-2">
              {plan.allocations.length > 0 && (
                <div className="bg-background-alt/30 rounded-lg p-4 border border-border/50 mt-4">
                  <h4 className="text-body-sm font-semibold text-text-secondary mb-3 uppercase tracking-wider">Category Allocations</h4>
                  <div className="space-y-4">
                    {plan.allocations.map((alloc: BudgetAllocation) => {
                      const pct = alloc.amount > 0 ? (alloc.spent / alloc.amount) * 100 : 0;
                      return (
                        <div key={alloc.id} className="text-body-sm">
                          <div className="flex items-center gap-2 truncate pr-2 mb-1.5">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: alloc.categoryColor || 'var(--color-border)' }} />
                            <span className="text-text-primary font-medium truncate">{alloc.categoryName}</span>
                          </div>
                          <div className="flex justify-between text-caption mb-1">
                            <span className="text-text-secondary">Spent: <b className="num text-text-primary font-medium">{formatCurrency(alloc.spent)}</b></span>
                            <span className="text-text-secondary">Budget: <b className="num text-text-primary font-medium">{formatCurrency(alloc.amount)}</b></span>
                          </div>
                          <div className="w-full h-1.5 bg-background-alt rounded-full overflow-hidden">
                            <div className={`h-full ${getBudgetProgressBgClass(pct)} transition-all duration-deliberate ease-standard`} style={{ width: `${Math.min(pct, 100)}%` }} />
                          </div>
                          <div className="flex justify-between items-center pt-1 text-xs">
                            <span className={`font-semibold ${pct >= 100 ? 'text-expense' : pct >= 75 ? 'text-warning' : 'text-income'}`}>{pct.toFixed(0)}% Exhausted</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              <div className="mt-4">{plan.children?.map(sub => renderTree(sub, level + 1))}</div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>


      {loading ? (
        <BudgetPlansSkeleton />
      ) : processedPlans.length === 0 ? (
        <StateDisplay type="empty" title="No budget plans created yet" className="py-12" action={{ label: "New Plan", onClick: openCreate }} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 items-start">
          {processedPlans.map(plan => <div key={plan.id} className="w-full">{renderTree(plan)}</div>)}
        </div>
      )}

      <Dialog
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        title="Configure Budget Plan"
        maxWidth="lg"
      >
            <div className="p-4 overflow-y-auto flex-1">
              <form id="planForm" onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-body-sm text-text-secondary mb-1">Plan Name</label>
                    <input required type="text" className="input" value={planForm.name || ''} onChange={e => setPlanForm({ ...planForm, name: e.target.value })} placeholder="e.g. Q1 Budget" />
                  </div>
                  <div>
                    <label className="block text-body-sm text-text-secondary mb-1">Period Type</label>
                    <Select value={planForm.periodType || 'MONTHLY'} onChange={newPeriod => { const newEnd = newPeriod !== 'CUSTOM' ? calculateEndDate(planForm.startDate || '', newPeriod) : planForm.endDate; setPlanForm({ ...planForm, periodType: newPeriod, endDate: newEnd }); }} options={[{ value: 'WEEKLY', label: 'Weekly' }, { value: 'MONTHLY', label: 'Monthly' }, { value: 'QUARTERLY', label: 'Quarterly' }, { value: 'YEARLY', label: 'Yearly' }, { value: 'CUSTOM', label: 'Custom' }]} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-body-sm text-text-secondary mb-1">Start Date</label>
                    <input required type="date" className="input" value={planForm.startDate || ''} onChange={e => { const newStart = e.target.value; const newEnd = planForm.periodType !== 'CUSTOM' ? calculateEndDate(newStart, planForm.periodType || 'MONTHLY') : planForm.endDate; setPlanForm({ ...planForm, startDate: newStart, endDate: newEnd }); }} />
                  </div>
                  <div>
                    <label className="block text-body-sm text-text-secondary mb-1">End Date</label>
                    <input required type="date" className="input disabled:opacity-50 disabled:bg-background-alt/50" value={planForm.endDate || ''} disabled={planForm.periodType !== 'CUSTOM'} onChange={e => setPlanForm({ ...planForm, endDate: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="block text-body-sm text-text-secondary mb-1">Total Amount</label>
                  <CurrencyInput required value={planForm.totalAmount || ''} onChange={e => setPlanForm({ ...planForm, totalAmount: Number(e.target.value) })} />
                </div>
                <div className="pt-4 border-t border-border mt-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-body-sm font-semibold text-text-primary">Category Allocations</h3>
                    <button type="button" onClick={() => setPlanAllocations([...planAllocations, { categoryId: categories[0]?.id || '', amount: 0 }])} className="text-primary text-body-sm hover:underline">+ Add Category</button>
                  </div>
                  {planAllocations.map((alloc, idx) => (
                    <div key={idx} className="flex gap-2 mb-2">
                      <Select className="flex-1" value={alloc.categoryId} onChange={val => { const a = [...planAllocations]; a[idx].categoryId = val; setPlanAllocations(a); }} options={categories.map(c => ({ value: c.id, label: c.name }))} />
                      <div className="w-36! sm:w-44! shrink-0">
                        <CurrencyInput placeholder="Amount" value={alloc.amount || ''} onChange={e => { const a = [...planAllocations]; a[idx].amount = Number(e.target.value); setPlanAllocations(a); }} />
                      </div>
                      <button type="button" onClick={() => setPlanAllocations(planAllocations.filter((_, i) => i !== idx))} className="text-expense p-2 shrink-0 hover:text-expense"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  ))}
                </div>
              </form>
            </div>
            <div className="p-4 border-t border-border flex justify-end gap-3 bg-background-alt/30">
              <button type="button" onClick={() => setIsPlanModalOpen(false)} className="btn btn-secondary">Cancel</button>
              <button type="submit" form="planForm" disabled={submitting} className="btn btn-primary">{submitting ? 'Saving...' : 'Save Plan'}</button>
            </div>
      </Dialog>
    </>
  );
};
