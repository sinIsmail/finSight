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
    setLoadingPct(0);
    setLoadingMsg('📡 Preparing upload...');
    setRawTransactions([]); // Clear old data

    try {
      const response = await uploadFile(file, (msg, pct, partialData) => {
        setLoadingMsg(msg);
        setLoadingPct(pct);
        
        // ✨ NEW: If we receive a chunk of data, process it and append to the table instantly!
        if (partialData && partialData.length > 0) {
          const normalisedChunk: Transaction[] = partialData
            .filter((r: any) => r.date || r.description)
            .map((r: any, i: number) => ({
              id: `chunk-${Date.now()}-${i}`, // Ensure unique IDs
              date: r.date,
              description: r.description,
              amount: Number(r.amount), 
              
              // ✨ FIX APPLIED HERE: Forces standard Title Case so Dataprocessing.ts can read it
              type: r.type?.toUpperCase() === 'CREDIT' ? 'Credit' : 'Debit',
              
              category: r.category || 'Uncategorized', 
              payee: r.description 
            }));

          const processedChunk = processTransactions(normalisedChunk);
          
          // Append the new rows to whatever is already in the table
          setRawTransactions(prev => [...prev, ...processedChunk]);
        }
      });
      
      // We still handle the final success event just to ensure we didn't miss anything
      // and to trigger the toast notification.
      if (response.status === 'success') {
        toast.success('AI Data Extraction Complete!');
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
    loadingMsg,
    loadingPct,
    hasData,
    fileName,
    dateRange,
    setDateRange,
    searchQuery,
    setSearchQuery,
    loadFile,
  };
}