import React from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { FADE_UP, SPRING } from '../utils/Theme';

// ─── Card ─────────────────────────────────────────────────────────────────────

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  delay?: number;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export function Card({ children, className, hover = true, delay = 0, onClick, style }: CardProps) {
  return (
    <motion.div
      className={clsx('glass-card', className)}
      variants={FADE_UP}
      initial="hidden"
      animate="visible"
      transition={{ ...SPRING.gentle, delay }}
      whileHover={hover ? { y: -2, transition: { duration: 0.2 } } : undefined}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default', ...style }}
    >
      {children}
    </motion.div>
  );
}

// ─── Section Label ─────────────────────────────────────────────────────────────

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      fontSize: 10,
      fontFamily: 'var(--font-mono)',
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      color: 'var(--text-muted)',
    }}>
      {children}
    </span>
  );
}

// ─── Divider ──────────────────────────────────────────────────────────────────

export function Divider({ vertical = false }: { vertical?: boolean }) {
  return (
    <div
      style={{
        background: 'var(--border)',
        ...(vertical
          ? { width: 1, height: '100%' }
          : { height: 1, width: '100%' }),
        flexShrink: 0,
      }}
    />
  );
}

// ─── Animated Number ─────────────────────────────────────────────────────────

interface AnimatedNumberProps {
  value: number;
  format?: (v: number) => string;
  className?: string;
}

export function AnimatedNumber({ value, format = String, className }: AnimatedNumberProps) {
  return (
    <motion.span
      key={value}
      className={clsx('count-up', className)}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {format(value)}
    </motion.span>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

export function Skeleton({ width = '100%', height = 16, rounded = false }: {
  width?: string | number;
  height?: string | number;
  rounded?: boolean;
}) {
  return (
    <div
      className="skeleton"
      style={{
        width,
        height,
        borderRadius: rounded ? '50%' : 'var(--radius-sm)',
      }}
    />
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

export function EmptyState({ icon, title, description }: {
  icon: React.ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        padding: '48px 24px',
        textAlign: 'center',
        color: 'var(--text-muted)',
      }}
    >
      <div style={{ fontSize: 40, opacity: 0.5 }}>{icon}</div>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: 'var(--text-secondary)' }}>
        {title}
      </p>
      {description && <p style={{ fontSize: 13 }}>{description}</p>}
    </motion.div>
  );
}

// ─── Pill Tabs ────────────────────────────────────────────────────────────────

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  active: string;
  onChange: (id: string) => void;
}

export function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div style={{ display: 'flex', gap: 4, background: 'var(--bg3)', padding: 4, borderRadius: 'var(--radius-md)', width: 'fit-content' }}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={clsx('btn', active === tab.id ? 'btn-active' : 'btn-ghost')}
          style={{ position: 'relative', border: 'none' }}
        >
          {active === tab.id && (
            <motion.div
              layoutId="tab-indicator"
              style={{
                position: 'absolute',
                inset: 0,
                background: 'var(--cyan-glow)',
                border: '1px solid var(--cyan-border)',
                borderRadius: 'var(--radius-sm)',
              }}
              transition={SPRING.gentle}
            />
          )}
          <span style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 6 }}>
            {tab.icon}
            {tab.label}
          </span>
        </button>
      ))}
    </div>
  );
}

// ─── Chip ─────────────────────────────────────────────────────────────────────

export function Chip({ label, active, onClick }: {
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx('btn', active ? 'btn-active' : 'btn-ghost')}
      style={{ fontSize: 12, padding: '4px 10px' }}
    >
      {label}
    </button>
  );
}