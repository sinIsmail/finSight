import { useState } from 'react';
import { TopNav } from './components/topnav';
import { UploadZone } from './components/uploadzone';
import { TransactionTable } from './components/Transactiontable';
import { PayeeBreakdown } from './pages/payeebreakdown';
import { SpendingTrend } from './pages/spendingtrend';
import { CategoryChart } from './pages/Categorychart';
import { useTransactionData } from './hooks/useTransactionData';
import type { ViewMode } from './types';

export default function App() {
  const {
    transactions,
    dailySpend,
    payees,
    categories,
    isLoading,
    loadingMsg,
    loadingPct,
    hasData,
    fileName,
    searchQuery,
    setSearchQuery,
    loadFile,
  } = useTransactionData();

  const [view, setView] = useState<ViewMode>('dashboard');

  if (!hasData) {
    return <UploadZone onFile={loadFile} isLoading={isLoading} loadingMsg={loadingMsg} loadingPct={loadingPct} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg0)' }}>
      
      {/* The New Top Navigation */}
      <TopNav
        view={view}
        setView={setView}
        fileName={fileName || ''} // ✨ FIX 1: Fallback to an empty string if null
        txCount={transactions.length}
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
        {view === 'dashboard' && hasData && (
         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))', gap: '24px', marginBottom: '24px' }}>
            <PayeeBreakdown data={payees} />
            <SpendingTrend data={dailySpend} />
          </div>
        )}
        {view === 'transactions' && (
          <TransactionTable
            transactions={transactions}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        )}
        {view === 'analytics' && <CategoryChart data={categories} />}
      </main>
    </div>
  ); // ✨ FIX 2: This closing bracket and brace are correctly restored!
}