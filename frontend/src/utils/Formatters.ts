import { format, parse, isValid } from 'date-fns';

// ─── Currency ─────────────────────────────────────────────────────────────────

export function formatCurrency(
  amount: number,
  compact = false,
): string {
  if (compact && Math.abs(amount) >= 1_000) {
    const k = amount / 1_000;
    return `₹${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}k`;
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCurrencyShort(amount: number): string {
  if (Math.abs(amount) >= 1_00_000) return `₹${(amount / 1_00_000).toFixed(1)}L`;
  if (Math.abs(amount) >= 1_000)   return `₹${(amount / 1_000).toFixed(1)}k`;
  return `₹${amount.toFixed(0)}`;
}

// ─── Dates ───────────────────────────────────────────────────────────────────

// ─── Dates ───────────────────────────────────────────────────────────────────

const DATE_FORMATS = [
  'yyyy-MM-dd',
  'ddMMM,yyyy', // <-- NEW: Matches PhonePe "18Feb,2026"
  'dMMM,yyyy',  // <-- NEW: Matches PhonePe "8Feb,2026"
  'MMM d, yyyy',
  'dd/MM/yyyy',
  'MM/dd/yyyy',
  'd MMM yyyy',
];

export function parseFlexDate(raw: string): Date | null {
  for (const fmt of DATE_FORMATS) {
    const parsed = parse(raw.trim(), fmt, new Date());
    if (isValid(parsed)) return parsed;
  }
  const native = new Date(raw);
  return isValid(native) ? native : null;
}
export function formatDisplayDate(raw: string): string {
  const d = parseFlexDate(raw);
  return d ? format(d, 'MMM d') : raw;
}

export function formatFullDate(raw: string): string {
  const d = parseFlexDate(raw);
  return d ? format(d, 'MMM d, yyyy') : raw;
}

export function formatAxisDate(raw: string): string {
  const d = parseFlexDate(raw);
  return d ? format(d, 'dd MMM') : raw;
}

// ─── Text ────────────────────────────────────────────────────────────────────

export function cleanPayeeName(description: string): string {
  return description
    .replace(/^Paid to\s+/i, '')
    .replace(/^Payment to\s+/i, '')
    .replace(/^UPI-/i, '')
    .trim();
}

export function truncate(str: string, max = 24): string {
  return str.length > max ? `${str.slice(0, max)}…` : str;
}

export function initials(name: string): string {
  return name
    .split(/[\s-]+/)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('');
}

// ─── Numbers ─────────────────────────────────────────────────────────────────

export function pct(value: number, total: number): string {
  if (total === 0) return '0%';
  return `${((value / total) * 100).toFixed(1)}%`;
}

export function formatChange(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}