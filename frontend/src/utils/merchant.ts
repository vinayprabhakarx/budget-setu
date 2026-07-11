/**
 * Extracts and formats a clean merchant/payee name from noisy bank or UPI transaction descriptions.
 * Truncates and appends "..." if the resulting name exceeds maxLength.
 */
export function formatMerchantName(
  raw: string | undefined | null,
  maxLength = 24,
): string {
  if (!raw) return "Unknown";

  let cleaned = raw
    // 1. Remove date/time stamps like 18/04/2026, 2026-04-18, 11:50:48
    .replace(/\b\d{1,4}[/-]\d{1,2}[/-]\d{1,4}\b/g, " ")
    .replace(/\b\d{1,2}:\d{2}(?::\d{2})?\b/g, " ")
    // 2. Remove UPI / VPA handles like foo@oksbi, bar@ybl, etc.
    .replace(/\S+@\S+/g, " ")
    // 3. Remove amounts with decimals/commas like 28,000.00 or 6,700.00 or 0.00
    .replace(/\b\d{1,3}(?:,\d{3})+(?:\.\d{2,4})?\b/g, " ")
    .replace(/\b\d+\.\d{2,4}\b/g, " ")
    // 4. Remove long reference codes or mixed alphanumeric bank/transaction IDs (4+ digits)
    .replace(/\b[A-Za-z]*\d{4,}[A-Za-z0-9]*\b/g, " ")
    // 5. Remove payment boilerplate phrases
    .replace(/[-\s]*PAYMENT(\s+FROM\s+PHONE)?/gi, " ")
    .replace(/\bFROM\s+PHONE\b/gi, " ")
    // 6. Remove transaction method keywords anywhere (UPI, POS, IMPS, NEFT, RTGS, MMT, CMS, BIL)
    .replace(/\b(?:UPI|POS|IMPS|NEFT|RTGS|MMT|CMS|BIL|ACH)\b/gi, " ")
    // 7. Normalize slashes, hyphens, punctuation and extra spaces
    .replace(/[/|-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Fall back to stripped raw string if cleaning stripped everything
  if (!cleaned || cleaned.length < 2) {
    cleaned = raw
      .replace(/\b\d{1,3}(?:,\d{3})+(?:\.\d{2,4})?\b/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  if (cleaned.length > maxLength) {
    return cleaned.slice(0, maxLength).trimEnd() + "...";
  }

  return cleaned;
}
