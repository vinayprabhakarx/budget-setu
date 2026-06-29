/**
 * Formats a number to Indian Rupee (INR) format with the currency symbol.
 * Example: 120000 -> ₹1,20,000.00
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Formats a number to Indian Rupee (INR) format without the currency symbol.
 * Example: 120000 -> 1,20,000.00
 */
export function formatNumberOnly(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}
