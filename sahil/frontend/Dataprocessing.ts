import { format } from 'date-fns';
import type {
  Transaction, ProcessedTransaction,
  DashboardStats, DailySpend, PayeeShare, CategoryBreakdown,
} from './src/types';
import { SKIP_KEYWORDS, CHART_COLORS } from './src/utils/Theme';
import { cleanPayeeName, parseFlexDate } from './src/utils/Formatters';

// ─── Filter "true" expenses ───────────────────────────────────────────────────

export function processTransactions(raw: Transaction[]): ProcessedTransaction[] {
  return raw.map((t) => {
    const isSkip = SKIP_KEYWORDS.some(kw =>
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

// ─── Category breakdown (heuristic) ──────────────────────────────────────────

const CATEGORY_RULES: [string, RegExp][] = [
  ['Food & Dining',  /swiggy|zomato|restaurant|cafe|food|eat|pizza|burger/i],
  ['Transport',      /uber|ola|rapido|metro|cab|auto|petrol|fuel/i],
  ['Shopping',       /amazon|flipkart|myntra|shop|store|market/i],
  ['Entertainment',  /netflix|spotify|prime|hotstar|youtube|movie|cinema/i],
  ['Utilities',      /electricity|water|gas|internet|broadband|wifi|recharge/i],
  ['Health',         /pharmacy|hospital|doctor|clinic|medicine|health/i],
  ['Finance',        /emi|loan|insurance|bank|invest/i],
];

function categorise(description: string): string {
  for (const [cat, re] of CATEGORY_RULES) {
    if (re.test(description)) return cat;
  }
  return 'Other';
}

export function buildCategoryBreakdown(
  transactions: ProcessedTransaction[],
): CategoryBreakdown[] {
  const expenses = trueExpenses(transactions);
  const map: Record<string, { amount: number; count: number }> = {};

  expenses.forEach(t => {
    const cat = categorise(t.description);
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