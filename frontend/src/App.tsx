import { useState } from 'react';
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
    searchQuery,
    setSearchQuery,
    loadFile,
  } = useTransactionData();

  const [view, setView] = useState<ViewMode>('dashboard');

  if (!hasData) {
    return (
      <UploadZone 
        onFile={loadFile} 
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
         <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '24px' }}>
            
            {/* ✨ The KPI Cards are now sitting at the top of the dashboard */}
            <KPICards stats={stats} /> 

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))', gap: '24px' }}>
              <PayeeBreakdown data={payees} />
              <SpendingTrend data={dailySpend} />
            </div>
          </div>
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