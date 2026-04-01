import { format } from 'date-fns';
import type {
  Transaction, ProcessedTransaction,
  DashboardStats, DailySpend, PayeeShare, CategoryBreakdown,
} from '../types';
import { SKIP_KEYWORDS, CHART_COLORS } from './Theme';
import { cleanPayeeName, parseFlexDate } from './Formatters';

// ─── Filter "true" expenses ───────────────────────────────────────────────────

export function processTransactions(raw: Transaction[]): ProcessedTransaction[] {
  return raw.map((t) => {
    const isSkip = SKIP_KEYWORDS.some((kw: string) =>
      t.description.toLowerCase().includes(kw.toLowerCase()),
    );
    return {
      ...t,
      payee: cleanPayeeName(t.description),
      isTrue: t.type === 'Debit' && !isSkip,
    };
  });
}

export function trueExpenses(transactions: ProcessedTransaction[]): ProcessedTransaction[] {
  return transactions.filter(t => t.isTrue);
}

// ─── Aggregate stats ─────────────────────────────────────────────────────────

export function computeStats(transactions: ProcessedTransaction[]): DashboardStats {
  const expenses = trueExpenses(transactions);
  const credits   = transactions.filter(t => t.type === 'Credit');

  const totalSpend  = expenses.reduce((s, t) => s + t.amount, 0);
  const totalCredit = credits.reduce((s, t) => s + t.amount, 0);
  const amounts     = expenses.map(t => t.amount);

  // Most frequent payee
  const payeeCount: Record<string, number> = {};
  expenses.forEach(t => { payeeCount[t.payee] = (payeeCount[t.payee] ?? 0) + 1; });
  const mostFrequentPayee = Object.entries(payeeCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';

  // Unique days
  const uniqueDays = new Set(expenses.map(t => t.date)).size || 1;

  return {
    totalSpend,
    totalCredit,
    netFlow:           totalCredit - totalSpend,
    transactionCount:  expenses.length,
    largestExpense:    amounts.length ? Math.max(...amounts) : 0,
    averageExpense:    amounts.length ? totalSpend / amounts.length : 0,
    mostFrequentPayee,
    dailyAverage:      totalSpend / uniqueDays,
  };
}

// ─── Daily spend timeline ─────────────────────────────────────────────────────

export function buildDailySpend(transactions: ProcessedTransaction[]): DailySpend[] {
  const expenses = trueExpenses(transactions);
  const map: Record<string, { amount: number; count: number }> = {};

  expenses.forEach(t => {
    const d = parseFlexDate(t.date);
    const key = d ? format(d, 'yyyy-MM-dd') : t.date;
    if (!map[key]) map[key] = { amount: 0, count: 0 };
    map[key].amount += t.amount;
    map[key].count  += 1;
  });

  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date, ...v }));
}

// ─── Top payees ───────────────────────────────────────────────────────────────

export function buildPayeeShares(
  transactions: ProcessedTransaction[],
  topN = 6,
): PayeeShare[] {
  const expenses = trueExpenses(transactions);
  const total    = expenses.reduce((s, t) => s + t.amount, 0);
  const map: Record<string, number> = {};

  expenses.forEach(t => { map[t.payee] = (map[t.payee] ?? 0) + t.amount; });

  const sorted = Object.entries(map)
    .sort(([, a], [, b]) => b - a)
    .slice(0, topN);

  return sorted.map(([name, value]) => ({
    name,
    value,
    percentage: total > 0 ? (value / total) * 100 : 0,
  }));
}

// ─── Category breakdown (AI Powered) ─────────────────────────────────────────

export function buildCategoryBreakdown(
  transactions: ProcessedTransaction[],
): CategoryBreakdown[] {
  const expenses = trueExpenses(transactions);
  const map: Record<string, { amount: number; count: number }> = {};

  expenses.forEach(t => {
    // ✨ NEW: Read the category directly from Gemini's backend response
    const cat = t.category && t.category !== 'Uncategorized' ? t.category : 'Other';
    
    if (!map[cat]) map[cat] = { amount: 0, count: 0 };
    map[cat].amount += t.amount;
    map[cat].count  += 1;
  });

  return Object.entries(map)
    .sort(([, a], [, b]) => b.amount - a.amount)
    .map(([category, v], i) => ({
      category,
      ...v,
      color: CHART_COLORS[i % CHART_COLORS.length],
    }));
}