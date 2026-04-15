import { useState } from 'react';
import { motion } from 'framer-motion';
import { TopNav } from './components/topnav';
import { UploadZone } from './components/uploadzone';
import { TransactionTable } from './components/Transactiontable';
import { KPICards } from './components/kpicard'; // ✨ Imported the KPI Cards
import { PayeeBreakdown } from './pages/payeebreakdown';
import { SpendingTrend } from './pages/spendingtrend';
import { CategoryChart } from './pages/Categorychart';
import { useTransactionData } from './hooks/useTransactionData';
import type { ViewMode } from './types';

export default function App() {
  const {
    transactions,
    stats, // ✨ Grabbed the stats object from your hook
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
    searchQuery,
    setSearchQuery,
    loadFile,
    loadDummyData,
  } = useTransactionData();

  const [view, setView] = useState<ViewMode>('dashboard');

  if (!hasData) {
    return (
      <UploadZone 
        onFile={loadFile} 
        onDummyData={loadDummyData}
        isLoading={isLoading} 
        loadingMsg={loadingMsg} 
        loadingPct={loadingPct} 
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg0)' }}>
      
      {/* The New Top Navigation */}
      <TopNav
        view={view}
        setView={setView}
        fileName={fileName || ''}
        txCount={transactions.length}
        activePlatform={activePlatform}
        activeModel={activeModel}
        onReset={() => window.location.reload()}
      />

      {/* Main Content Area */}
      <main style={{ 
        flex: 1, 
        overflow: 'auto', 
        padding: '32px 24px',
        maxWidth: '1400px', 
        margin: '0 auto',
        width: '100%' 
      }}>
        
        {/* DASHBOARD VIEW */}
        {view === 'dashboard' && hasData && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(12, 1fr)', 
              gridAutoRows: 'min-content',
              gap: '24px' 
            }}
          >
            {/* Top Row: KPIs across full width */}
            <div style={{ gridColumn: 'span 12' }}>
              <KPICards stats={stats} />
            </div>

            {/* Middle Row: Trend chart takes more space, Payees take less */}
            <div style={{ gridColumn: 'span 8' }}>
              <SpendingTrend data={dailySpend} />
            </div>
            <div style={{ gridColumn: 'span 4' }}>
              <PayeeBreakdown data={payees} />
            </div>

            {/* Bottom Row or Extra detail could go here */}
          </motion.div>
        )}

        {/* TRANSACTIONS VIEW */}
        {view === 'transactions' && (
          <TransactionTable
            transactions={transactions}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        )}

        {/* ANALYTICS VIEW */}
        {view === 'analytics' && (
          <CategoryChart data={categories} />
        )}
      </main>
    </div>
  );
}