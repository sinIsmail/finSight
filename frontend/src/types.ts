// ─── Core Domain Types ───────────────────────────────────────────────────────

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'Debit' | 'Credit';
  category?: string;
  payee?: string;
}

export interface ProcessedTransaction extends Transaction {
  payee: string;
  isTrue: boolean; // not a self-transfer or top-up
}

// ─── AI Platform Types ───────────────────────────────────────────────────────

export type Platform = 'gemini' | 'openrouter' | 'ollama';

export interface PlatformInfo {
  models: string[];
  default: string;
  label: string;
  icon: string;
}

export interface ModelsResponse {
  default_platform: Platform;
  gemini: PlatformInfo;
  openrouter: PlatformInfo;
  ollama: PlatformInfo;
}

export interface AttemptLog {
  model: string;
  status: 'ok' | 'failed';
  error?: string;
}

// ─── Chart Data Types ─────────────────────────────────────────────────────────

export interface DailySpend {
  date: string;
  amount: number;
  count: number;
}

export interface PayeeShare {
  name: string;
  value: number;
  percentage: number;
}

export interface CategoryBreakdown {
  category: string;
  amount: number;
  count: number;
  color: string;
}

// ─── Dashboard State Types ────────────────────────────────────────────────────

export interface DashboardStats {
  totalSpend: number;
  totalCredit: number;
  netFlow: number;
  transactionCount: number;
  largestExpense: number;
  averageExpense: number;
  mostFrequentPayee: string;
  dailyAverage: number;
}

export type ViewMode = 'dashboard' | 'transactions' | 'analytics';
export type ThemeMode = 'dark' | 'light';
export type DateRange = '7d' | '30d' | '90d' | 'all';