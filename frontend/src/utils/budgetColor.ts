/**
 * Returns the CSS color variable corresponding to the budget usage percentage.
 */
export function getBudgetProgressColor(percentage: number): string {
  if (percentage >= 100) return 'var(--color-expense)';
  if (percentage >= 75)  return 'var(--color-warning)';
  return 'var(--color-income)';
}

/**
 * Returns the tailwind-compatible class name mapping for progress bars.
 */
export function getBudgetProgressBgClass(percentage: number): string {
  if (percentage >= 100) return 'bg-expense';
  if (percentage >= 75)  return 'bg-warning';
  return 'bg-income';
}
