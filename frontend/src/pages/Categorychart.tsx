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
        padding: '24px', 
        background: 'rgba(167, 139, 250, 0.05)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(167, 139, 250, 0.2)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Subtle background glow */}
        <div style={{ position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%', background: 'radial-gradient(circle, rgba(167, 139, 250, 0.1) 0%, transparent 70%)', zIndex: 0 }} />
        
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{ 
            width: 56, height: 56, borderRadius: '16px', 
            background: 'rgba(167, 139, 250, 0.15)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 16px rgba(167, 139, 250, 0.2)',
            border: '1px solid rgba(167, 139, 250, 0.3)'
          }}>
            <Sparkles size={28} color="#A78BFA" />
          </div>
          <div>
            <h4 style={{ fontSize: 16, fontWeight: 700, color: '#A78BFA', marginBottom: 6, fontFamily: 'var(--font-display)', letterSpacing: '-0.01em' }}>
              Intelligent Financial Pulse
            </h4>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: '600px' }}>
              Our AI analysis indicates that your spending is most concentrated in <strong style={{ color: topCategory.color }}>{topCategory.category}</strong>. 
              This sector accounts for <strong>{((topCategory.amount / totalSpend) * 100).toFixed(1)}%</strong> of your total categorized velocity. 
              Consider reviewing the recurring items in this category for optimization.
            </p>
          </div>
        </div>
      </Card>

      {/* 📊 The Velocity List */}
      <Card delay={0.2} hover={false} style={{ padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
              <PieIcon size={16} color="var(--cyan)" />
            </div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700 }}>
              Expenditure Velocity
            </h3>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Total Categorized: {formatCurrency(totalSpend)}</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
          {data.map((item, index) => {
            const Icon = CATEGORY_ICONS[item.category] || HelpCircle;
            const percentage = (item.amount / totalSpend) * 100;

            return (
              <motion.div 
                key={item.category}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + (index * 0.05) }}
                whileHover={{ y: -4 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '16px',
                  borderRadius: '16px',
                  background: 'var(--bg2)',
                  border: '1px solid var(--border)',
                  cursor: 'default',
                  transition: 'background 200ms ease'
                }}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: '12px',
                  background: `${item.color}15`,
                  border: `1px solid ${item.color}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: item.color, flexShrink: 0,
                  boxShadow: `0 4px 12px ${item.color}10`
                }}>
                  <Icon size={20} />
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{item.category}</p>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>{item.count} items</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                        {formatCurrencyShort(item.amount)}
                      </p>
                      <p style={{ fontSize: 11, color: item.color, fontWeight: 600, letterSpacing: '0.05em' }}>
                        {percentage.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  <div style={{ width: '100%', height: 4, background: 'var(--bg3)', borderRadius: 2, overflow: 'hidden' }}>
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ delay: 0.4 + (index * 0.1), duration: 1, ease: "circOut" }}
                      style={{ height: '100%', background: item.color, boxShadow: `0 0 10px ${item.color}60` }}
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