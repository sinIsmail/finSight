import React from 'react';
import { motion } from 'framer-motion';
import {
  TrendingDown, TrendingUp, ArrowDownRight, ArrowUpRight,
  Activity, Zap, Award, Calendar,
} from 'lucide-react';
import { AnimatedNumber, SectionLabel } from './primitives';
import { STAGGER_CONTAINER, FADE_UP, SPRING } from '../utils/Theme';
import { formatCurrencyShort } from '../utils/Formatters';
import type { DashboardStats } from '../types';

// ─── Single KPI Card ──────────────────────────────────────────────────────────

interface KPICardProps {
  label:     string;
  value:     number;
  format?:   (v: number) => string;
  icon:      React.ReactNode;
  accent:    string;
  glowColor: string;
  subtitle?: string;
  trend?:    'up' | 'down' | 'neutral';
  delay?:    number;
}

function KPICard({
  label, value, format = formatCurrencyShort,
  icon, accent, glowColor, subtitle, trend, delay = 0,
}: KPICardProps) {
  const TrendIcon = trend === 'up' ? ArrowUpRight : trend === 'down' ? ArrowDownRight : null;

  return (
    <motion.div
      variants={FADE_UP}
      initial="hidden"
      animate="visible"
      transition={{ ...SPRING.gentle, delay }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      style={{
        background:    'var(--bg2)',
        border:        `1px solid var(--border)`,
        borderRadius:  'var(--radius-lg)',
        padding:       '24px',
        position:      'relative',
        overflow:      'hidden',
        cursor:        'default',
        flex:          '1 1 180px',
        minWidth:      0,
        transition:    'border-color 200ms, box-shadow 200ms',
      }}
      onHoverStart={(e: any) => {
        (e.target as HTMLElement).closest?.('div')?.style &&
          Object.assign((e.target as HTMLElement).closest('[data-kpi]') as HTMLElement ?? {}, {});
      }}
    >
      {/* Ambient glow */}
      <div style={{
        position:     'absolute',
        top:          -30,
        right:        -30,
        width:        100,
        height:       100,
        borderRadius: '50%',
        background:   glowColor,
        filter:       'blur(30px)',
        pointerEvents:'none',
      }} />

      {/* Top row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <SectionLabel>{label}</SectionLabel>
        <div style={{
          width:         32,
          height:        32,
          borderRadius:  'var(--radius-sm)',
          background:    glowColor,
          display:       'flex',
          alignItems:    'center',
          justifyContent:'center',
          color:         accent,
          flexShrink:    0,
        }}>
          {icon}
        </div>
      </div>

      {/* Value */}
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize:   28,
        fontWeight: 700,
        color:      accent,
        lineHeight: 1,
        marginBottom: 8,
        textShadow: `0 0 20px ${glowColor}`,
      }}>
        <AnimatedNumber value={value} format={format} />
      </div>

      {/* Subtitle / trend */}
      {(subtitle || trend) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {TrendIcon && (
            <span style={{ color: trend === 'up' ? 'var(--red)' : 'var(--green)' }}>
              <TrendIcon size={12} />
            </span>
          )}
          {subtitle && (
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{subtitle}</span>
          )}
        </div>
      )}
    </motion.div>
  );
}

// ─── KPI Grid ─────────────────────────────────────────────────────────────────

interface KPICardsProps {
  stats: DashboardStats;
}

export function KPICards({ stats }: KPICardsProps) {
  const cards: KPICardProps[] = [
    {
      label:     'Total Spend',
      value:     stats.totalSpend,
      icon:      <TrendingDown size={16} />,
      accent:    'var(--red)',
      glowColor: 'rgba(255, 69, 96, 0.15)',
      subtitle:  `${stats.transactionCount} transactions`,
      trend:     'up',
      delay:     0,
    },
    {
      label:     'Total Credit',
      value:     stats.totalCredit,
      icon:      <TrendingUp size={16} />,
      accent:    'var(--green)',
      glowColor: 'rgba(0, 230, 118, 0.15)',
      subtitle:  'Inflows',
      trend:     'down',
      delay:     0.08,
    },
    {
      label:     'Net Flow',
      value:     Math.abs(stats.netFlow),
      icon:      <Activity size={16} />,
      accent:    stats.netFlow >= 0 ? 'var(--green)' : 'var(--red)',
      glowColor: stats.netFlow >= 0 ? 'rgba(0, 230, 118, 0.15)' : 'rgba(255, 69, 96, 0.15)',
      subtitle:  stats.netFlow >= 0 ? 'Surplus' : 'Deficit',
      delay:     0.16,
    },
    {
      label:     'Largest Expense',
      value:     stats.largestExpense,
      icon:      <Zap size={16} />,
      accent:    'var(--amber)',
      glowColor: 'var(--amber-glow)',
      subtitle:  'Single transaction',
      delay:     0.24,
    },
    {
      label:     'Daily Average',
      value:     stats.dailyAverage,
      icon:      <Calendar size={16} />,
      accent:    'var(--cyan)',
      glowColor: 'var(--cyan-glow)',
      subtitle:  'Per active day',
      delay:     0.32,
    },
    {
      label:     'Avg per Txn',
      value:     stats.averageExpense,
      icon:      <Award size={16} />,
      accent:    'var(--purple)',
      glowColor: 'rgba(167, 139, 250, 0.15)',
      subtitle:  stats.mostFrequentPayee,
      delay:     0.40,
    },
  ];

  return (
    <motion.div
      variants={STAGGER_CONTAINER}
      initial="hidden"
      animate="visible"
      style={{
        display:  'flex',
        flexWrap: 'wrap',
        gap:      16,
      }}
    >
      {cards.map(c => <KPICard key={c.label} {...c} />)}
    </motion.div>
  );
}