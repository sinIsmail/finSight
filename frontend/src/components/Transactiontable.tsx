import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight, ArrowDownLeft, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, EmptyState } from './primitives';
import { formatCurrency, formatFullDate, truncate } from '../utils/Formatters';
import type { ProcessedTransaction } from '../types';

// ─── Row ──────────────────────────────────────────────────────────────────────

function TxRow({ tx, index }: { tx: ProcessedTransaction; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const isDebit = tx.type === 'Debit';

  return (
    <>
      <motion.tr
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 10 }}
        transition={{ delay: index * 0.03, duration: 0.25 }}
        onClick={() => setExpanded(e => !e)}
        style={{
          cursor:          'pointer',
          borderBottom:    '1px solid var(--border)',
          transition:      'background 150ms',
        }}
        whileHover={{ backgroundColor: 'rgba(255,255,255,0.025)' }}
      >
        {/* Date */}
        <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)' }}>
            {formatFullDate(tx.date)}
          </span>
        </td>

        {/* Icon + Description */}
        <td style={{ padding: '12px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width:         32, height: 32, borderRadius: 'var(--radius-sm)',
              display:       'flex', alignItems: 'center', justifyContent: 'center',
              background:    isDebit ? 'rgba(255,69,96,0.12)' : 'rgba(0,230,118,0.12)',
              color:         isDebit ? 'var(--red)' : 'var(--green)',
              flexShrink:    0,
            }}>
              {isDebit
                ? <ArrowUpRight size={14} />
                : <ArrowDownLeft size={14} />
              }
            </div>
            <div>
              <p style={{ fontSize: 13, color: 'var(--text-primary)', marginBottom: 2 }}>
                {truncate(tx.payee, 32)}
              </p>
              {!tx.isTrue && (
                <span className="badge badge-cyan" style={{ fontSize: 9 }}>
                  {tx.description.toLowerCase().includes('selftransfer') ? 'Self' : 'Top-up'}
                </span>
              )}
            </div>
          </div>
        </td>

        {/* Type */}
        <td style={{ padding: '12px 16px', display: 'none' }} className="hide-mobile">
          <span className={`badge ${isDebit ? 'badge-red' : 'badge-green'}`}>
            {tx.type}
          </span>
        </td>

        {/* Amount */}
        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize:   15,
            fontWeight: 700,
            color:      isDebit ? 'var(--red)' : 'var(--green)',
          }}>
            {isDebit ? '–' : '+'}{formatCurrency(tx.amount)}
          </span>
        </td>

        {/* Expand icon */}
        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
          <motion.span
            animate={{ rotate: expanded ? 180 : 0 }}
            style={{ display: 'inline-block', color: 'var(--text-muted)' }}
          >
            <ChevronDown size={14} />
          </motion.span>
        </td>
      </motion.tr>

      {/* Expanded row */}
      <AnimatePresence>
        {expanded && (
          <motion.tr
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <td colSpan={5} style={{ padding: '0 16px 16px 16px' }}>
              <div style={{
                background:    'var(--bg3)',
                borderRadius:  'var(--radius-sm)',
                padding:       '12px 14px',
                fontFamily:    'var(--font-mono)',
                fontSize:      11,
                color:         'var(--text-secondary)',
                borderLeft:    `2px solid ${isDebit ? 'var(--red)' : 'var(--green)'}`,
              }}>
                {tx.description}
              </div>
            </td>
          </motion.tr>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Table ────────────────────────────────────────────────────────────────────

interface TransactionTableProps {
  transactions: ProcessedTransaction[];
  searchQuery:  string;
  setSearchQuery: (q: string) => void;
  pageSize?: number;
}

type SortKey = 'date' | 'amount';

export function TransactionTable({
  transactions, searchQuery, setSearchQuery, pageSize = 20,
}: TransactionTableProps) {
  const [page,    setPage]    = useState(0);
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortAsc, setSortAsc] = useState(false);
  const [filter,  setFilter]  = useState<'all' | 'debit' | 'credit'>('all');

  const sorted = [...transactions]
    .filter(t => filter === 'all' || t.type.toLowerCase() === filter)
    .sort((a, b) => {
      const mult = sortAsc ? 1 : -1;
      if (sortKey === 'amount') return (a.amount - b.amount) * mult;
      return a.date.localeCompare(b.date) * mult;
    });

  const total = sorted.length;
  const pages = Math.ceil(total / pageSize);
  const slice = sorted.slice(page * pageSize, (page + 1) * pageSize);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(a => !a);
    else { setSortKey(key); setSortAsc(false); }
    setPage(0);
  }

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey === k
      ? (sortAsc ? <ChevronUp size={12} /> : <ChevronDown size={12} />)
      : null;

  return (
    <Card hover={false} style={{ padding: 0, overflow: 'hidden' }}>
      {/* Toolbar */}
      <div style={{
        display:       'flex',
        alignItems:    'center',
        gap:           12,
        padding:       '16px 20px',
        borderBottom:  '1px solid var(--border)',
        flexWrap:      'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 200 }}>
          <Search size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
          <input
            className="input"
            placeholder="Search transactions…"
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setPage(0); }}
            style={{ background: 'transparent', border: 'none', boxShadow: 'none', padding: 0 }}
          />
        </div>

        {/* Filter pills */}
        <div style={{ display: 'flex', gap: 6 }}>
          {(['all', 'debit', 'credit'] as const).map(f => (
            <button
              key={f}
              className={`btn ${filter === f ? 'btn-active' : 'btn-ghost'}`}
              onClick={() => { setFilter(f); setPage(0); }}
              style={{ fontSize: 11, padding: '4px 10px', textTransform: 'capitalize' }}
            >
              {f}
            </button>
          ))}
        </div>

        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
          {total} rows
        </span>
      </div>

      {/* Table */}
      {slice.length === 0 ? (
        <EmptyState icon="🔍" title="No transactions match" description="Try adjusting your search or filter." />
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {[
                  { label: 'Date',   key: 'date'   as SortKey },
                  { label: 'Payee',  key: null                },
                  { label: 'Type',   key: null                },
                  { label: 'Amount', key: 'amount' as SortKey },
                  { label: '',       key: null                },
                ].map(({ label, key }) => (
                  <th
                    key={label}
                    onClick={() => key && toggleSort(key)}
                    style={{
                      padding:    '10px 16px',
                      textAlign:  label === 'Amount' ? 'right' : 'left',
                      fontSize:   11,
                      fontFamily: 'var(--font-mono)',
                      color:      'var(--text-muted)',
                      fontWeight: 500,
                      cursor:     key ? 'pointer' : 'default',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      userSelect: 'none',
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      {label}
                      {key && <SortIcon k={key} />}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {slice.map((tx, i) => (
                  <TxRow key={tx.id} tx={tx} index={i} />
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div style={{
          display:       'flex',
          justifyContent:'center',
          alignItems:    'center',
          gap:           8,
          padding:       '14px 20px',
          borderTop:     '1px solid var(--border)',
        }}>
          <button
            className="btn btn-ghost"
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            style={{ opacity: page === 0 ? 0.4 : 1, fontSize: 12 }}
          >
            Prev
          </button>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)' }}>
            {page + 1} / {pages}
          </span>
          <button
            className="btn btn-ghost"
            onClick={() => setPage(p => Math.min(pages - 1, p + 1))}
            disabled={page === pages - 1}
            style={{ opacity: page === pages - 1 ? 0.4 : 1, fontSize: 12 }}
          >
            Next
          </button>
        </div>
      )}
    </Card>
  );
}