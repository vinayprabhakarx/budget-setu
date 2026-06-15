import React, { useEffect, useCallback, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDateFilter } from '../../context/DateFilterContext';
import api from '../../api/axiosInstance';
import { useToast } from '../../context/ToastContext';
import { Select } from '../../components/shared/Select';
import { BudgetPlans } from './budgets/BudgetPlans';
import { RecurringExpenses } from './budgets/RecurringExpenses';
import { SavingsGoals } from './budgets/SavingsGoals';
import type { BudgetPlan, RecurringExpense, Goal, Category } from './budgets/types';

const months = [
  { val: 1, label: "January" }, { val: 2, label: "February" }, { val: 3, label: "March" },
  { val: 4, label: "April" }, { val: 5, label: "May" }, { val: 6, label: "June" },
  { val: 7, label: "July" }, { val: 8, label: "August" }, { val: 9, label: "September" },
  { val: 10, label: "October" }, { val: 11, label: "November" }, { val: 12, label: "December" },
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

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

  const tabs = [
    { key: 'plans' as const, label: 'Budget Plans' },
    { key: 'recurring' as const, label: 'Recurring Expenses' },
    { key: 'goals' as const, label: 'Savings Goals' },
  ];

  // Filter budget plans based on the selected month and year
  const filteredBudgetPlans = budgetPlans.filter(p => {
    const planStart = new Date(p.startDate);
    const planEnd = new Date(p.endDate);
    const filterMonthStart = new Date(year, month - 1, 1);
    const filterMonthEnd = new Date(year, month, 0); // Last day of month
    
    // They overlap if planStart <= filterMonthEnd && planEnd >= filterMonthStart
    return planStart <= filterMonthEnd && planEnd >= filterMonthStart;
  });

  return (
    <div className="space-y-6 pb-16">
      <div className="flex items-center justify-between">
        <h2 className="text-xl lg:text-3xl font-semibold text-text-primary">Budgets & Goals</h2>
        <div className="flex items-center gap-2">
          <Select
            value={String(month)}
            onChange={(val) => setMonth(Number(val))}
            options={months.map((m) => ({ value: String(m.val), label: m.label }))}
            size="sm"
          />
          <Select
            value={String(year)}
            onChange={(val) => setYear(Number(val))}
            options={years.map((y) => ({ value: String(y), label: String(y) }))}
            size="sm"
          />
        </div>
      </div>
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
          <RecurringExpenses expenses={recurringExpenses} categories={categories} loading={loading} onRefresh={fetchData} />
        )}
        {activeTab === 'goals' && (
          <SavingsGoals goals={goals} loading={loading} onRefresh={fetchData} />
        )}
      </div>
    </div>
  );
};
