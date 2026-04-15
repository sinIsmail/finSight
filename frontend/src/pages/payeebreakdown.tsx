import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  PieChart, Pie, Cell,
  ResponsiveContainer, Sector,
} from 'recharts';
import { Users } from 'lucide-react';
import { Card } from '../components/primitives';
import { formatCurrencyShort, truncate } from '../utils/Formatters';
import { CHART_COLORS } from '../utils/Theme';
import type { PayeeShare } from '../types';

// ─── Active Shape ─────────────────────────────────────────────────────────────

function ActiveShape(props: any) {
  const {
    cx, cy, innerRadius, outerRadius,
    startAngle, endAngle, fill, payload,
  } = props;

  return (
    <g>
      {/* Center text */}
      <text x={cx} y={cy - 12} textAnchor="middle" fill="#f0f0f8"
        style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700 }}>
        {formatCurrencyShort(payload.value)}
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill="var(--text-secondary)"
        style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>
        {payload.percentage.toFixed(1)}%
      </text>
      <text x={cx} y={cy + 26} textAnchor="middle" fill="var(--text-muted)"
        style={{ fontFamily: 'var(--font-body)', fontSize: 10 }}>
        {truncate(payload.name, 16)}
      </text>

      {/* Active sector */}
      <Sector
        cx={cx} cy={cy}
        innerRadius={innerRadius - 2}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        stroke={fill}
        strokeWidth={1}
        opacity={1}
      />
      <Sector
        cx={cx} cy={cy}
        innerRadius={outerRadius + 10}
        outerRadius={outerRadius + 13}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        opacity={0.4}
      />
    </g>
  );
}

// ─── Payee Row ────────────────────────────────────────────────────────────────

function PayeeRow({ payee, color, rank, isActive, onHover }: {
  payee: PayeeShare;
  color: string;
  rank:  number;
  isActive: boolean;
  onHover: (i: number | null) => void;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.01, x: 4 }}
      onHoverStart={() => onHover(rank)}
      onHoverEnd={() => onHover(null)}
      style={{
        display:       'flex',
        alignItems:    'center',
        gap:           12,
        padding:       '10px 12px',
        margin:        '2px -12px',
        borderRadius:  '12px',
        background:    isActive ? 'rgba(255,255,255,0.03)' : 'transparent',
        border:        isActive ? '1px solid rgba(255,255,255,0.05)' : '1px solid transparent',
        cursor:        'pointer',
        transition:    'all 200ms ease',
      }}
    >
      {/* Rank Icon or Number */}
      <div style={{
        width: 22, height: 22, borderRadius: '50%', 
        background: isActive ? color : 'var(--bg3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-mono)',
        color: isActive ? 'var(--bg0)' : 'var(--text-muted)',
        flexShrink: 0
      }}>
        {rank + 1}
      </div>

      {/* Name */}
      <span style={{
        flex:       1,
        fontSize:   13,
        fontWeight: isActive ? 600 : 400,
        overflow:   'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        color:      isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
      }}>
        {payee.name}
      </span>

      {/* Amount & Percentage Bar */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, minWidth: 80 }}>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize:   13,
          fontWeight: 700,
          color:      isActive ? color : 'var(--text-primary)',
        }}>
          {formatCurrencyShort(payee.value)}
        </span>
        <div style={{ width: 60, height: 3, background: 'var(--bg4)', borderRadius: 4, overflow: 'hidden' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${payee.percentage}%` }}
            transition={{ duration: 0.8, ease: 'circOut' }}
            style={{ height: '100%', background: color, boxShadow: isActive ? `0 0 8px ${color}` : 'none' }}
          />
        </div>
      </div>
    </motion.div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface PayeeBreakdownProps {
  data: PayeeShare[];
}

export function PayeeBreakdown({ data }: PayeeBreakdownProps) {
  const [activeIndex, setActiveIndex] = useState<number>(0);

  if (!data.length) return null;

  return (
    <Card delay={0.15} hover={false} style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <Users size={16} color="var(--amber)" />
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600 }}>
          Top Payees
        </h3>
      </div>

      {/* Donut */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={85}
              paddingAngle={3}
              dataKey="value"
              activeIndex={activeIndex}
              activeShape={ActiveShape as any}
              onMouseEnter={(_, i) => setActiveIndex(i)}
            >
              {data.map((_, i) => (
                <Cell
                  key={i}
                  fill={CHART_COLORS[i % CHART_COLORS.length]}
                  opacity={activeIndex === i ? 1 : 0.6}
                  stroke="transparent"
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </motion.div>

      {/* List */}
      <div>
        {data.map((p, i) => (
          <PayeeRow
            key={p.name}
            payee={p}
            color={CHART_COLORS[i % CHART_COLORS.length]}
            rank={i}
            isActive={activeIndex === i}
            onHover={(idx) => idx !== null && setActiveIndex(idx)}
          />
        ))}
      </div>
    </Card>
  );
}