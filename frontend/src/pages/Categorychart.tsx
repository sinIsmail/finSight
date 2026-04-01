import React from 'react';
import { motion } from 'framer-motion';
import { 
  PieChart as PieIcon, Coffee, Bus, ShoppingBag, 
  Film, Zap, Heart, Shield, HelpCircle, Sparkles 
} from 'lucide-react';
import { Card } from '../components/primitives';
import { formatCurrencyShort, formatCurrency } from '../utils/Formatters';
import type { CategoryBreakdown } from '../types';

// ─── Map AI Categories to Beautiful Icons ─────────────────────────────────────
const CATEGORY_ICONS: Record<string, React.ElementType> = {
  'Food & Dining': Coffee,
  'Transport': Bus,
  'Shopping': ShoppingBag,
  'Entertainment': Film,
  'Utilities': Zap,
  'Health': Heart,
  'Finance': Shield,
};

interface CategoryChartProps {
  data: CategoryBreakdown[];
}

export function CategoryChart({ data }: CategoryChartProps) {
  if (!data || !data.length) return null;

  // Calculate the total spend so we can figure out percentages
  const totalSpend = data.reduce((sum, item) => sum + item.amount, 0);
  const topCategory = data[0]; // Since it's sorted, the first one is the biggest drain

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* ✨ The Smart Insight Card */}
      <Card delay={0.1} hover={false} style={{ 
        padding: '20px 24px', 
        background: 'linear-gradient(145deg, var(--bg2) 0%, rgba(167, 139, 250, 0.05) 100%)',
        borderLeft: '4px solid var(--purple)' 
      }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ 
            width: 40, height: 40, borderRadius: '50%', 
            background: 'rgba(167, 139, 250, 0.15)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center' 
          }}>
            <Sparkles size={20} color="var(--purple)" />
          </div>
          <div>
            <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4, fontFamily: 'var(--font-display)' }}>
              AI Spending Insight
            </h4>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Your heaviest cash outflow is currently <strong style={{ color: topCategory.color }}>{topCategory.category}</strong>. 
              It accounts for <strong>{((topCategory.amount / totalSpend) * 100).toFixed(1)}%</strong> of your total categorized spending.
            </p>
          </div>
        </div>
      </Card>

      {/* 📊 The Velocity List */}
      <Card delay={0.2} hover={false} style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
          <PieIcon size={18} color="var(--cyan)" />
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600 }}>
            Cash Flow by Category
          </h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {data.map((item, index) => {
            const Icon = CATEGORY_ICONS[item.category] || HelpCircle;
            const percentage = (item.amount / totalSpend) * 100;

            return (
              <motion.div 
                key={item.category}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + (index * 0.05), duration: 0.4, ease: "easeOut" }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '12px',
                  borderRadius: '12px',
                  background: 'var(--bg1)',
                  border: '1px solid transparent',
                  transition: 'all 0.2s ease',
                  cursor: 'default'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--bg2)';
                  e.currentTarget.style.borderColor = 'var(--border)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--bg1)';
                  e.currentTarget.style.borderColor = 'transparent';
                }}
              >
                {/* 1. Glowing Category Icon */}
                <div style={{
                  width: 48, height: 48, borderRadius: '12px',
                  background: `${item.color}15`, // 15 is hex for ~8% opacity
                  border: `1px solid ${item.color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: item.color, flexShrink: 0
                }}>
                  <Icon size={20} />
                </div>

                {/* 2. Text Details & Mini Progress Bar */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 }}>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{item.category}</p>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.count} transactions</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                        {formatCurrency(item.amount)}
                      </p>
                      <p style={{ fontSize: 12, color: item.color, fontWeight: 500 }}>
                        {percentage.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  {/* The Liquid Track */}
                  <div style={{ width: '100%', height: 6, background: 'var(--bg3)', borderRadius: 4, overflow: 'hidden' }}>
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ delay: 0.5 + (index * 0.1), duration: 0.8, ease: "easeOut" }}
                      style={{ 
                        height: '100%', 
                        background: item.color,
                        borderRadius: 4,
                        boxShadow: `0 0 8px ${item.color}80`
                      }}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}