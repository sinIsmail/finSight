import { parse, isValid, parseISO } from 'date-fns';

// ─── Currency Formatters ──────────────────────────────────────────────────────

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatCurrencyShort(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 1,
  }).format(amount);
}

// ─── Text Utilities ───────────────────────────────────────────────────────────

export function truncate(str: string, length: number): string {
  if (!str) return '';
  return str.length > length ? `${str.substring(0, length)}…` : str;
}

// ─── Date Parsing & Formatting ────────────────────────────────────────────────

/**
 * AI/OCR dates can be messy. This safely attempts to parse various formats
 * into a valid JavaScript Date object so your filters don't crash.
 */
export function parseFlexDate(dateStr: string): Date | null {
  if (!dateStr) return null;

  // 1. Try standard ISO parse first (if the AI formatted it perfectly as YYYY-MM-DD)
  let d = parseISO(dateStr);
  if (isValid(d)) return d;

  // 2. Try native JS Date parsing (handles "Apr 10, 2026")
  d = new Date(dateStr);
  if (isValid(d)) return d;

  // 3. Fallback for strict Indian formats (DD/MM/YYYY)
  d = parse(dateStr, 'dd/MM/yyyy', new Date());
  if (isValid(d)) return d;

  return null; // Return null if it's completely unreadable
}

export function formatFullDate(dateStr: string): string {
  const d = parseFlexDate(dateStr);
  if (!d) return dateStr; // Fallback to raw text if parsing fails
  
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

export function formatAxisDate(dateStr: string): string {
  const d = parseFlexDate(dateStr);
  if (!d) return dateStr;
  
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
  }).format(d);
}

// ─── Payee & Percentage Utilities ──────────────────────────────────────────────

export function cleanPayeeName(description: string): string {
  if (!description) return 'Unknown';
  // Split by common separators and take the first meaningful part
  const cleaned = description
    .split(/[\s-–—_/|,]/)[0]
    .trim()
    .toUpperCase();
  return cleaned || 'Unknown';
}

export function pct(value: number): string {
  return `${value.toFixed(1)}%`;
}