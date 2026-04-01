import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PieChart, Pie, Cell, Tooltip,
  ResponsiveContainer, Sector,
} from 'recharts';
import { Users } from 'lucide-react';
import { Card } from './src/components/primitives';
import { formatCurrencyShort, pct, truncate } from './src/utils/Formatters';
import { CHART_COLORS } from './src/utils/Theme';
import type { PayeeShare } from './src/types';

// ─── Active Shape ─────────────────────────────────────────────────────────────

function ActiveShape(props: {
  cx: number; cy: number;
  innerRadius: number; outerRadius: number;
  startAngle: number; endAngle: number;
  fill: string; payload: PayeeShare; percent: number;
}) {
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
      {/* @ts-expect-error – recharts type */}
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
      {/* @ts-expect-error – recharts type */}
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
      whileHover={{ x: 4 }}
      onHoverStart={() => onHover(rank)}
      onHoverEnd={() => onHover(null)}
      style={{
        display:       'flex',
        alignItems:    'center',
        gap:           10,
        padding:       '8px 0',
        borderBottom:  '1px solid var(--border)',
        cursor:        'pointer',
        opacity:       isActive ? 1 : 0.7,
        transition:    'opacity 150ms',
      }}
    >
      {/* Rank */}
      <span style={{
        fontFamily: 'var(--font-mono)',
        fontSize:   10,
        color:      'var(--text-muted)',
        width:      16,
        textAlign:  'right',
        flexShrink: 0,
      }}>
        {rank + 1}
      </span>

      {/* Color dot */}
      <div style={{
        width:        8, height: 8,
        borderRadius: '50%',
        background:   color,
        flexShrink:   0,
        boxShadow:    `0 0 6px ${color}`,
      }} />

      {/* Name */}
      <span style={{
        flex:       1,
        fontSize:   13,
        overflow:   'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        color:      isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
      }}>
        {payee.name}
      </span>

      {/* Amount */}
      <span style={{
        fontFamily: 'var(--font-mono)',
        fontSize:   13,
        fontWeight: 600,
        color:      color,
        flexShrink: 0,
      }}>
        {formatCurrencyShort(payee.value)}
      </span>

      {/* Bar */}
      <div style={{ width: 48, flexShrink: 0 }}>
        <div style={{ height: 3, background: 'var(--bg4)', borderRadius: 9999 }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${payee.percentage}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            style={{
              height:       3,
              background:   color,
              borderRadius: 9999,
              boxShadow:    `0 0 4px ${color}`,
            }}
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
        {/* @ts-expect-error – recharts strict TS quirk */}
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
              activeShape={ActiveShape}
              onMouseEnter={(_, i) => setActiveIndex(i)}
            >
              {data.map((_, i) => (
                /* @ts-expect-error */
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