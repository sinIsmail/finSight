import { format, parseISO, isValid } from 'date-fns';
import { CHART_COLORS } from './Theme';
import type { 
  Transaction, ProcessedTransaction, DashboardStats, 
  DailySpend, PayeeShare, CategoryBreakdown 
} from '../types';

// ─── 1. Clean and Prepare Transactions ───────────────────────────────────────
export function processTransactions(raw: Transaction[]): ProcessedTransaction[] {
  return raw.map(tx => ({
    ...tx,
    // Safely parse amounts and ensure absolute values for debit/credit math
    amount: Math.abs(Number(tx.amount) || 0),
    // Fallbacks for missing data
    payee: tx.description || 'Unknown Payee',
    category: tx.category || 'Other',
    // Flag internal transfers
    isTrue: !tx.description?.toLowerCase().includes('self')
  })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

// ─── 2. Calculate Dashboard KPIs ─────────────────────────────────────────────
export function computeStats(transactions: ProcessedTransaction[]): DashboardStats {
  let totalSpend = 0;
  let totalCredit = 0;
  let largestExpense = 0;
  const payeeCounts: Record<string, number> = {};
  const activeDays = new Set<string>();

  transactions.forEach(tx => {
    activeDays.add(tx.date.split('T')[0]); // Track unique days
    
    if (tx.type === 'Debit') {
      totalSpend += tx.amount;
      if (tx.amount > largestExpense) largestExpense = tx.amount;
      
      // Count frequency for favorite payee
      payeeCounts[tx.payee] = (payeeCounts[tx.payee] || 0) + 1;
    } else {
      totalCredit += tx.amount;
    }
  });

  const debitCount = transactions.filter(t => t.type === 'Debit').length;
  const netFlow = totalCredit - totalSpend;
  const dailyAverage = activeDays.size > 0 ? totalSpend / activeDays.size : 0;
  const averageExpense = debitCount > 0 ? totalSpend / debitCount : 0;

  // Find the most frequent payee
  let mostFrequentPayee = 'N/A';
  let maxCount = 0;
  Object.entries(payeeCounts).forEach(([payee, count]) => {
    if (count > maxCount) {
      maxCount = count;
      mostFrequentPayee = payee;
    }
  });

  return {
    totalSpend,
    totalCredit,
    netFlow,
    largestExpense,
    dailyAverage,
    averageExpense,
    transactionCount: transactions.length,
    mostFrequentPayee
  };
}

// ─── 3. Build Daily Spend for Area Chart ─────────────────────────────────────
export function buildDailySpend(transactions: ProcessedTransaction[]): DailySpend[] {
  const daily: Record<string, { amount: number; count: number }> = {};

  transactions.forEach(tx => {
    if (tx.type !== 'Debit') return;
    
    // Normalize date string for grouping
    let dayKey = tx.date;
    try {
      const parsed = parseISO(tx.date);
      if (isValid(parsed)) dayKey = format(parsed, 'yyyy-MM-dd');
    } catch {
      dayKey = tx.date.split('T')[0];
    }

    if (!daily[dayKey]) {
      daily[dayKey] = { amount: 0, count: 0 };
    }
    daily[dayKey].amount += tx.amount;
    daily[dayKey].count += 1;
  });

  // Convert to array and sort chronologically (oldest to newest for charts)
  return Object.entries(daily)
    .map(([date, data]) => ({ date, amount: data.amount, count: data.count }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

// ─── 4. Build Payee Shares for Donut Chart ───────────────────────────────────
export function buildPayeeShares(transactions: ProcessedTransaction[]): PayeeShare[] {
  const totals: Record<string, number> = {};
  let overallDebit = 0;

  transactions.forEach(tx => {
    if (tx.type === 'Debit') {
      totals[tx.payee] = (totals[tx.payee] || 0) + tx.amount;
      overallDebit += tx.amount;
    }
  });

  if (overallDebit === 0) return [];

  // Sort by highest value and take the top 5 (bundle the rest into "Other")
  const sorted = Object.entries(totals)
    .map(([name, value]) => ({ name, value, percentage: (value / overallDebit) * 100 }))
    .sort((a, b) => b.value - a.value);

  const top = sorted.slice(0, 5);
  const others = sorted.slice(5);

  if (others.length > 0) {
    const otherVal = others.reduce((sum, item) => sum + item.value, 0);
    top.push({
      name: 'Other',
      value: otherVal,
      percentage: (otherVal / overallDebit) * 100
    });
  }

  return top;
}

// ─── 5. Build Category Breakdown for Liquid Tracks ───────────────────────────
export function buildCategoryBreakdown(transactions: ProcessedTransaction[]): CategoryBreakdown[] {
  const categories: Record<string, { amount: number; count: number }> = {};

  transactions.forEach(tx => {
    if (tx.type === 'Debit') {
      const cat = tx.category || 'Other';
      if (!categories[cat]) categories[cat] = { amount: 0, count: 0 };
      
      categories[cat].amount += tx.amount;
      categories[cat].count += 1;
    }
  });

  return Object.entries(categories)
    .map(([category, data], index) => ({
      category,
      amount: data.amount,
      count: data.count,
      // Safely assign a theme color using the modulus operator so we don't run out of colors
      color: CHART_COLORS[index % CHART_COLORS.length] || '#A78BFA' 
    }))
    .sort((a, b) => b.amount - a.amount); // Sort heaviest drain to lightest
}