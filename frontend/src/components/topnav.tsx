import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, List, PieChart, Sparkles, LogOut, FileText } from 'lucide-react';
import type { ViewMode } from '../types';

interface TopNavProps {
  view: ViewMode;
  setView: (v: ViewMode) => void;
  fileName: string;
  txCount: number;
  onReset: () => void;
}

export function TopNav({ view, setView, fileName, txCount, onReset }: TopNavProps) {
  // A simple hook to detect if we are on a mobile screen
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transactions', icon: List },
    { id: 'analytics', label: 'Analytics', icon: PieChart },
  ] as const;

  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap', // ✨ Allows the bar to stack on phones
      gap: '16px',
      padding: isMobile ? '16px' : '16px 32px', // Less padding on phones
      background: 'rgba(10, 10, 12, 0.6)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      
      {/* LEFT: Brand Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: '150px' }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: 'var(--cyan-glow)',
          border: '1px solid var(--cyan-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Sparkles size={16} color="var(--cyan)" />
        </div>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>
          Fin<span style={{ color: 'var(--cyan)' }}>Sight</span>
        </span>
      </div>

      {/* CENTER: Floating Animated Tabs */}
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        background: 'var(--bg2)',
        padding: '6px',
        borderRadius: '20px',
        border: '1px solid var(--border)',
        width: isMobile ? '100%' : 'auto', // Takes full width on mobile
        order: isMobile ? 3 : 2, // Moves to the bottom row on mobile
      }}>
        {navItems.map((item) => {
          const isActive = view === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              style={{
                position: 'relative',
                display: 'flex', alignItems: 'center', gap: 6,
                padding: isMobile ? '8px 12px' : '8px 20px',
                background: 'transparent', border: 'none', borderRadius: '14px',
                color: isActive ? 'var(--cyan)' : 'var(--text-secondary)',
                cursor: 'pointer', transition: 'color 0.2s ease', outline: 'none',
                flex: isMobile ? 1 : 'none', // Spreads tabs evenly on mobile
                justifyContent: 'center',
              }}
            >
              {isActive && (
                <motion.div
                  layoutId="active-top-tab"
                  transition={{ type: "spring", stiffness: 400, damping: 35 }}
                  style={{
                    position: 'absolute', inset: 0,
                    background: 'var(--cyan-glow)',
                    border: '1px solid rgba(0, 245, 255, 0.2)',
                    borderRadius: '14px', zIndex: 0,
                  }}
                />
              )}
              
              <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon size={16} />
                {!isMobile && ( // Hides the text on mobile, showing only icons!
                  <span style={{ fontSize: 13, fontWeight: isActive ? 600 : 500, fontFamily: 'var(--font-display)' }}>
                    {item.label}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </nav>

      {/* RIGHT: File Info & Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 16, flex: 1 }}>
        {!isMobile && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end', color: 'var(--text-primary)' }}>
              <FileText size={13} color="var(--purple)" />
              <span style={{ fontSize: 13, fontWeight: 500, maxWidth: '100px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {fileName}
              </span>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>{txCount} records</p>
          </div>
        )}

        {!isMobile && <div style={{ width: '1px', height: '24px', background: 'var(--border)' }} />}

        <button
          onClick={onReset}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 12px', background: 'rgba(255, 69, 96, 0.1)',
            border: '1px solid rgba(255, 69, 96, 0.2)',
            color: 'var(--red)', cursor: 'pointer', borderRadius: '12px',
          }}
        >
          <LogOut size={14} />
          {!isMobile && <span style={{ fontSize: 12, fontWeight: 600 }}>Upload New</span>}
        </button>
      </div>
    </header>
  );
}