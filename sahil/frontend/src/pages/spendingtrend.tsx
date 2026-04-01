
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import { Card } from '../components/primitives';
import { formatCurrencyShort, formatAxisDate } from '../utils/Formatters';
import type { DailySpend } from '../types';

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number; name: string }>;
  label?:   string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{
        background:    'var(--bg3)',
        border:        '1px solid var(--cyan-border)',
        borderRadius:  'var(--radius-md)',
        padding:       '12px 16px',
        boxShadow:     '0 8px 32px rgba(0,0,0,0.6)',
        fontFamily:    'var(--font-mono)',
        minWidth:      140,
      }}
    >
      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
        {label}
      </p>
      {payload.map(p => (
        <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Spend</span>
          <span style={{ fontSize: 14, color: 'var(--cyan)', fontWeight: 700 }}>
            {formatCurrencyShort(p.value)}
          </span>
        </div>
      ))}
    </motion.div>
  );
}

// ─── Chart ────────────────────────────────────────────────────────────────────

interface SpendingTrendProps {
  data: DailySpend[];
}

export function SpendingTrend({ data }: SpendingTrendProps) {
  const chartData = data.map(d => ({
    ...d,
    date: formatAxisDate(d.date),
  }));

  const avg = data.length
    ? data.reduce((s, d) => s + d.amount, 0) / data.length
    : 0;

  return (
    <Card delay={0.1} hover={false} style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={16} color="var(--cyan)" />
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600 }}>
              Spending Trend
            </h3>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            Daily expenditure over time
          </p>
        </div>

        {/* Avg badge */}
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>avg/day</p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 18, color: 'var(--amber)', fontWeight: 700 }}>
            {formatCurrencyShort(avg)}
          </p>
        </div>
      </div>

      {/* Chart */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#00f5ff" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#00f5ff" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />

            <XAxis
              dataKey="date"
              stroke="var(--text-muted)"
              tick={{ fontSize: 11, fontFamily: 'var(--font-mono)', fill: 'var(--text-muted)' }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />

            <YAxis
              stroke="var(--text-muted)"
              tick={{ fontSize: 11, fontFamily: 'var(--font-mono)', fill: 'var(--text-muted)' }}
              tickFormatter={formatCurrencyShort}
              axisLine={false}
              tickLine={false}
              width={55}
            />

            <Tooltip content={<CustomTooltip />} />

            <ReferenceLine
              y={avg}
              stroke="var(--amber)"
              strokeDasharray="6 3"
              strokeWidth={1}
              label={{
                value: 'avg',
                fill: 'var(--amber)',
                fontSize: 10,
                fontFamily: 'var(--font-mono)',
                position: 'right',
              }}
            />

            <Area
              type="monotone"
              dataKey="amount"
              stroke="var(--cyan)"
              strokeWidth={2}
              fill="url(#spendGrad)"
              dot={false}
              activeDot={{
                r: 5,
                fill: 'var(--cyan)',
                stroke: 'var(--bg0)',
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>
    </Card>
  );
}