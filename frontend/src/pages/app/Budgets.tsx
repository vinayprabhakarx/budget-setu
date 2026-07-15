import React, { useEffect, useCallback, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDateFilter } from '../../context/DateFilterContext';
import api from '../../api/axiosInstance';
import { useToast } from '../../context/ToastContext';
import { Plus } from 'lucide-react';
import { Select } from '../../components/shared/Select';
import { PageHeader } from '../../components/shared/PageHeader';
import { FilterSection } from '../../components/shared/FilterSection';
import { BudgetPlans } from './budgets/BudgetPlans';
import { RecurringExpenses } from './budgets/RecurringExpenses';
import { SavingsGoals } from './budgets/SavingsGoals';
import type { BudgetPlan, RecurringExpense, Goal, Category } from './budgets/types';

const months = [
  { val: 1, label: "Jan" }, { val: 2, label: "Feb" }, { val: 3, label: "Mar" },
  { val: 4, label: "Apr" }, { val: 5, label: "May" }, { val: 6, label: "Jun" },
  { val: 7, label: "Jul" }, { val: 8, label: "Aug" }, { val: 9, label: "Sep" },
  { val: 10, label: "Oct" }, { val: 11, label: "Nov" }, { val: 12, label: "Dec" },
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 26 }, (_, i) => currentYear - 20 + i);

/**
 * Budgets Page Component
 * 
 * Central hub for budgeting and financial planning.
 * Includes sub-views for managing Active Budget Plans, Recurring Expenses, and Savings Goals.
 */
export const Budgets: React.FC = () => {
  const { showToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  // Tab is driven entirely by URL pathname
  const activeTab: 'plans' | 'recurring' | 'goals' =
    location.pathname === '/budgets/recurring' ? 'recurring' :
    location.pathname === '/budgets/goals' ? 'goals' : 'plans';

  const setActiveTab = (tab: 'plans' | 'recurring' | 'goals') => {
    const path = tab === 'recurring' ? '/budgets/recurring' : tab === 'goals' ? '/budgets/goals' : '/budgets';
    navigate(path, { replace: false });
  };

  const { month, year, setMonth, setYear } = useDateFilter();

  // Shared data — all tabs need categories, fetched once
  const [budgetPlans, setBudgetPlans] = useState<BudgetPlan[]>([]);
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filterPeriod, setFilterPeriod] = useState<'ALL' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY'>('ALL');
  const [quarter, setQuarter] = useState(Math.ceil((new Date().getMonth() + 1) / 3));

  const fetchData = useCallback(async () => {
    try {
      const [plansRes, expensesRes, categoriesRes, goalsRes] = await Promise.all([
        api.get<BudgetPlan[]>('/budget-plans'),
        api.get<RecurringExpense[]>('/recurring-expenses'),
        api.get<Category[]>('/categories'),
        api.get<Goal[]>('/goals'),
      ]);
      setBudgetPlans(plansRes.data);
      setRecurringExpenses(expensesRes.data);
      setGoals(goalsRes.data);
      setCategories(categoriesRes.data.filter(c => c.type === 'EXPENSE'));
    } catch (err) {
      console.error(err);
      showToast('error', 'Failed to retrieve data.');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => { if (active) fetchData(); });
    const handleRefresh = () => fetchData();
    window.addEventListener('transaction-added', handleRefresh);
    window.addEventListener('transactions-updated', handleRefresh);
    return () => {
      active = false;
      window.removeEventListener('transaction-added', handleRefresh);
      window.removeEventListener('transactions-updated', handleRefresh);
    };
  }, [fetchData]);



  // Filter date ranges
  const getFilterRange = () => {
    if (filterPeriod === 'ALL') return null;
    if (filterPeriod === 'MONTHLY') {
      return {
        start: new Date(year, month - 1, 1),
        end: new Date(year, month, 0, 23, 59, 59),
      };
    }
    if (filterPeriod === 'QUARTERLY') {
      const startMonth = (quarter - 1) * 3;
      return {
        start: new Date(year, startMonth, 1),
        end: new Date(year, startMonth + 3, 0, 23, 59, 59),
      };
    }
    if (filterPeriod === 'YEARLY') {
      return {
        start: new Date(year, 0, 1),
        end: new Date(year, 11, 31, 23, 59, 59),
      };
    }
    return null;
  };

  const range = getFilterRange();

  // Filter budget plans based on range (default ALL)
  const filteredBudgetPlans = range ? budgetPlans.filter(p => {
    const planStart = new Date(p.startDate);
    const planEnd = new Date(p.endDate);
    return planStart <= range.end && planEnd >= range.start;
  }) : budgetPlans;

  // Filter goals based on targetDate
  const filteredGoals = range ? goals.filter(g => {
    if (!g.targetDate) return true;
    const gDate = new Date(g.targetDate);
    return gDate >= range.start && gDate <= range.end;
  }) : goals;

  // Filter recurring expenses based on startDate
  const filteredRecurring = range ? recurringExpenses.filter(e => {
    if (!e.startDate) return true;
    const eDate = new Date(e.startDate);
    return eDate <= range.end;
  }) : recurringExpenses;

  const tabs = [
    { key: 'plans' as const, label: `Budget Plans (${filteredBudgetPlans.length})` },
    { key: 'recurring' as const, label: `Recurring Expenses (${filteredRecurring.length})` },
    { key: 'goals' as const, label: `Savings Goals (${filteredGoals.length})` },
  ];

  return (
    <div className="space-y-6 pb-16">
      <PageHeader
        title="Budgets & Goals"
        subtitle="Track financial budgets, recurring expenses, and savings targets."
        onFilterClick={() => setShowFilters(!showFilters)}
        showFilters={showFilters}
        onRefreshClick={fetchData}
        isRefreshing={loading}
      >
        {activeTab === 'plans' && (
          <button onClick={() => window.dispatchEvent(new CustomEvent('open-new-plan'))} className="btn btn-primary btn-sm flex items-center gap-2">
            <Plus className="h-4 w-4" /><span>New Plan</span>
          </button>
        )}
        {activeTab === 'recurring' && (
          <button onClick={() => window.dispatchEvent(new CustomEvent('open-add-recurring'))} className="btn btn-primary btn-sm flex items-center gap-2">
            <Plus className="h-4 w-4" /><span>Add Recurring</span>
          </button>
        )}
        {activeTab === 'goals' && (
          <button onClick={() => window.dispatchEvent(new CustomEvent('open-new-goal'))} className="btn btn-primary btn-sm flex items-center gap-2">
            <Plus className="h-4 w-4" /><span>New Target</span>
          </button>
        )}
      </PageHeader>

      {/* Filter Controls */}
      <FilterSection
        isOpen={showFilters}
        hasActiveFilters={filterPeriod !== 'ALL'}
        onReset={() => setFilterPeriod('ALL')}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-body-sm font-medium text-text-secondary mr-1">Period:</span>
          {(['ALL', 'MONTHLY', 'QUARTERLY', 'YEARLY'] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setFilterPeriod(type)}
              className={`h-control-sm px-3.5 flex items-center justify-center rounded-lg text-body-sm font-medium transition-all ${
                filterPeriod === type
                  ? 'bg-primary text-text-inverse shadow-sm'
                  : 'bg-bg-elevated text-text-secondary hover:text-text-primary hover:bg-border'
              }`}
            >
              {type === 'ALL' ? 'All (Default)' : type.charAt(0) + type.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {filterPeriod !== 'ALL' && (
          <div className="flex items-center gap-2 flex-wrap ml-2">
            {filterPeriod === 'MONTHLY' && (
              <Select
                value={String(month)}
                onChange={(val) => setMonth(Number(val))}
                options={months.map((m) => ({ value: String(m.val), label: m.label }))}
                size="sm"
              />
            )}
            {filterPeriod === 'QUARTERLY' && (
              <Select
                value={String(quarter)}
                onChange={(val) => setQuarter(Number(val))}
                options={[
                  { value: "1", label: "Q1 (Jan - Mar)" },
                  { value: "2", label: "Q2 (Apr - Jun)" },
                  { value: "3", label: "Q3 (Jul - Sep)" },
                  { value: "4", label: "Q4 (Oct - Dec)" },
                ]}
                size="sm"
              />
            )}
            <Select
              value={String(year)}
              onChange={(val) => setYear(Number(val))}
              options={years.map((y) => ({ value: String(y), label: String(y) }))}
              size="sm"
            />
          </div>
        )}
      </FilterSection>
      {/* Tab Navigation */}
      <section className="flex border-b border-border-muted pb-4">
        <div className="flex gap-4 overflow-x-auto hide-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`text-body-lg font-semibold px-2 py-1 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? 'border-primary text-text-primary'
                  : 'border-transparent text-text-muted hover:text-text-primary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'plans' && (
          <BudgetPlans plans={filteredBudgetPlans} categories={categories} loading={loading} onRefresh={fetchData} />
        )}
        {activeTab === 'recurring' && (
          <RecurringExpenses expenses={filteredRecurring} categories={categories} loading={loading} onRefresh={fetchData} />
        )}
        {activeTab === 'goals' && (
          <SavingsGoals goals={filteredGoals} loading={loading} onRefresh={fetchData} />
        )}
      </div>
    </div>
  );
};
