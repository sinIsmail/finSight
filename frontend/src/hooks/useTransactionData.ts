import { useState, useCallback, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import type { Transaction, ProcessedTransaction, DateRange, Platform } from '../types';
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

export function useTransactionData() {
  const [rawTransactions, setRawTransactions] = useState<ProcessedTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Track the *actual* platform and model used
  const [activePlatform, setActivePlatform] = useState<Platform | null>(null);
  const [activeModel, setActiveModel] = useState<string | null>(null);

  // Real-time progress states
  const [loadingMsg, setLoadingMsg] = useState('');
  const [loadingPct, setLoadingPct] = useState(0);

  const loadFile = useCallback(async (file: File, platform: Platform, modelName: string) => {
    setIsLoading(true);
    setFileName(file.name);
    setLoadingPct(0);
    setLoadingMsg(`📡 Connecting to ${platform.charAt(0).toUpperCase() + platform.slice(1)}...`);
    setRawTransactions([]);
    setActivePlatform(platform);
    setActiveModel(modelName);

    try {
      const response = await uploadFile(file, platform, modelName, (msg, pct, partialData, modelSwitched) => {
        setLoadingMsg(msg);
        if (pct > 0) setLoadingPct(pct);

        if (modelSwitched) {
          toast(`Switched model to ${modelSwitched.to} to bypass rate limits!`, { icon: '⚡' });
          setActiveModel(modelSwitched.to);
        }

        if (partialData && partialData.length > 0) {
          const normalisedChunk: Transaction[] = partialData
            .filter((r: any) => r.date || r.description)
            .map((r: any, i: number) => ({
              id: `chunk-${Date.now()}-${i}`,
              date: r.date,
              description: r.description,
              amount: Number(r.amount),
              type: r.type?.toUpperCase() === 'CREDIT' ? 'Credit' : 'Debit',
              category: r.category || 'Uncategorized',
              payee: r.description,
            }));

          const processedChunk = processTransactions(normalisedChunk);
          setRawTransactions(prev => [...prev, ...processedChunk]);
        }
      });

      if (response.status === 'success') {
        toast.success(`Extraction complete with ${response.model_used}!`);
        setActiveModel(response.model_used);
        setActivePlatform(response.platform || platform);
      } else {
        toast.error(response.message || 'Upload failed');
      }
    } catch (error: any) {
      toast.error(`Upload error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadDummyData = useCallback(() => {
    setActivePlatform('gemini');
    setActiveModel('dummy-fast-model');
    setFileName('dummy_statement.csv');
    setLoadingMsg('');
    setLoadingPct(0);
    
    // Generate some fake dates based on today
    const today = new Date();
    const d1 = today.toISOString().split('T')[0];
    const d2 = subDays(today, 2).toISOString().split('T')[0];
    const d3 = subDays(today, 5).toISOString().split('T')[0];
    const d4 = subDays(today, 8).toISOString().split('T')[0];

    const dummyTxs: Transaction[] = [
      { id: 'd1', date: d1, description: 'Netflix', amount: 15.99, type: 'Debit', category: 'Entertainment', payee: 'Netflix' },
      { id: 'd2', date: d2, description: 'Spotify', amount: 9.99, type: 'Debit', category: 'Entertainment', payee: 'Spotify' },
      { id: 'd3', date: d3, description: 'Salary', amount: 5000.00, type: 'Credit', category: 'Transfer', payee: 'Salary' },
      { id: 'd4', date: d1, description: 'Uber', amount: 24.50, type: 'Debit', category: 'Transport', payee: 'Uber' },
      { id: 'd5', date: d2, description: 'Whole Foods', amount: 120.40, type: 'Debit', category: 'Food', payee: 'Whole Foods' },
      { id: 'd6', date: d3, description: 'Amazon', amount: 59.99, type: 'Debit', category: 'Shopping', payee: 'Amazon' },
      { id: 'd7', date: d4, description: 'Electric Bill', amount: 85.00, type: 'Debit', category: 'Utilities', payee: 'Electric Co' },
      { id: 'd8', date: d4, description: 'Uber Eats', amount: 35.20, type: 'Debit', category: 'Food', payee: 'Uber Eats' },
    ];
    setRawTransactions(processTransactions(dummyTxs));
  }, []);

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
        t => t.description.toLowerCase().includes(q) || t.payee.toLowerCase().includes(q)
      );
    }

    return result;
  }, [rawTransactions, dateRange, searchQuery]);

  const stats = useMemo(() => computeStats(filtered), [filtered]);
  const dailySpend = useMemo(() => buildDailySpend(filtered), [filtered]);
  const payees = useMemo(() => buildPayeeShares(filtered), [filtered]);
  const categories = useMemo(() => buildCategoryBreakdown(filtered), [filtered]);

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
    activePlatform,
    activeModel,
    dateRange,
    setDateRange,
    searchQuery,
    setSearchQuery,
    loadFile,
    loadDummyData,
  };
}