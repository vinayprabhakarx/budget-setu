export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  completed: boolean;
  status: string;
  percentageComplete: number;
  daysRemaining: number | null;
  priority: string;
  description: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  type: string;
}

export interface BudgetAllocation {
  id: string;
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  amount: number;
  spent: number;
}

export interface BudgetPlan {
  id: string;
  name: string;
  periodType: string;
  startDate: string;
  endDate: string;
  totalAmount: number;
  totalSpent?: number;
  allocations: BudgetAllocation[];
}

export interface ProcessedPlan extends BudgetPlan {
  children: ProcessedPlan[];
}

export interface RecurringExpense {
  id: string;
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  name: string;
  amount: number;
  frequency: string;
  startDate: string;
  status: string;
  nextDueDate?: string;
  pausedUntil?: string;
}

export const calculateEndDate = (start: string, period: string): string => {
  if (!start) return '';
  const date = new Date(start);
  if (isNaN(date.getTime())) return '';
  if (period === 'WEEKLY' || period === 'WEEK') date.setDate(date.getDate() + 7);
  else if (period === 'MONTHLY' || period === 'MONTH') date.setMonth(date.getMonth() + 1);
  else if (period === 'QUARTERLY' || period === 'QUARTER') date.setMonth(date.getMonth() + 3);
  else if (period === 'YEARLY' || period === 'YEAR') date.setFullYear(date.getFullYear() + 1);
  return date.toISOString().split('T')[0];
};
