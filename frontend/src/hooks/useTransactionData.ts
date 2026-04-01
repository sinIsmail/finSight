import { useState, useCallback, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import type { Transaction, ProcessedTransaction, DateRange } from '../types';
import {
  processTransactions,
  computeStats,
  buildDailySpend,
  buildPayeeShares,
  buildCategoryBreakdown,
} from '../utils/Dataprocessing';
import { parseFlexDate } from '../utils/Formatters';
import { isAfter, subDays } from 'date-fns';
import { uploadFile } from '../services/api';

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useTransactionData() {
  const [rawTransactions, setRawTransactions]   = useState<ProcessedTransaction[]>([]);
  const [isLoading,       setIsLoading]         = useState(false);
  const [fileName,        setFileName]          = useState<string | null>(null);
  const [dateRange,       setDateRange]         = useState<DateRange>('all');
  const [searchQuery,     setSearchQuery]       = useState('');
  
  // ✨ NEW: Real-time progress states!
  const [loadingMsg,      setLoadingMsg]        = useState('');
  const [loadingPct,      setLoadingPct]        = useState(0);

  // ── Upload to API ─────────────────────────────────────────────────────────
  const loadFile = useCallback(async (file: File) => {
    setIsLoading(true);
    setFileName(file.name);
    // Reset progress before starting
    setLoadingPct(0);
    setLoadingMsg('📡 Preparing upload...');

    try {
      // Pass the callback to catch the streaming yields from Python
      const response = await uploadFile(file, (msg, pct) => {
        setLoadingMsg(msg);
        setLoadingPct(pct);
      });
      
      if (response.status === 'success' && response.data?.preview_data) {
        const apiData = response.data.preview_data;
        
        const normalised: Transaction[] = apiData
          .filter((r: any) => r.date || r.description)
          .map((r: any, i: number) => ({
            id: String(i),
            date: r.date,
            description: r.description,
            amount: Number(r.amount), 
            type: r.type as 'Debit' | 'Credit',
            category: r.category || 'Uncategorized', 
            payee: r.description 
          }));

        const processed = processTransactions(normalised);
        setRawTransactions(processed);
        toast.success(`Loaded ${processed.length} AI-categorised transactions`);
      } else {
        toast.error(response.message || 'Upload failed');
      }
    } catch (error: any) {
      toast.error(`Upload error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Date filtering ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let result = rawTransactions;

    if (dateRange !== 'all') {
      const days = { '7d': 7, '30d': 30, '90d': 90 }[dateRange];
      const cutoff = subDays(new Date(), days);
      result = result.filter(t => {
        const d = parseFlexDate(t.date);
        return d ? isAfter(d, cutoff) : true;
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        t => t.description.toLowerCase().includes(q) ||
             t.payee.toLowerCase().includes(q),
      );
    }

    return result;
  }, [rawTransactions, dateRange, searchQuery]);

  // ── Derived data ───────────────────────────────────────────────────────────
  const stats      = useMemo(() => computeStats(filtered),          [filtered]);
  const dailySpend = useMemo(() => buildDailySpend(filtered),       [filtered]);
  const payees     = useMemo(() => buildPayeeShares(filtered),      [filtered]);
  const categories = useMemo(() => buildCategoryBreakdown(filtered),[filtered]);

  const hasData = rawTransactions.length > 0;

  return {
    transactions: filtered,
    rawCount: rawTransactions.length,
    stats,
    dailySpend,
    payees,
    categories,
    isLoading,
    loadingMsg,  // <-- Exported for the UI
    loadingPct,  // <-- Exported for the UI
    hasData,
    fileName,
    dateRange,
    setDateRange,
    searchQuery,
    setSearchQuery,
    loadFile,
  };
}