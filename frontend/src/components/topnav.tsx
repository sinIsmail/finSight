import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, List, PieChart, LogOut, FileText } from 'lucide-react';
import logo from '../assets/logo.png';
import type { ViewMode, Platform } from '../types';

interface TopNavProps {
  view: ViewMode;
  setView: (v: ViewMode) => void;
  fileName: string;
  txCount: number;
  activePlatform?: Platform | null;
  activeModel?: string | null;
  onReset: () => void;
}

export function TopNav({ view, setView, fileName, txCount, activePlatform, activeModel, onReset }: TopNavProps) {
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
          width: 36, height: 36, borderRadius: 8,
          background: 'var(--bg2)',
          border: '1px solid var(--cyan-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden'
        }}>
          <img src={logo} alt="FinSight Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>
          Fin<span style={{ color: 'var(--cyan)' }}>Sight</span>
        </span>
      </div>
      {/* CENTER: Analyzing Badge & Floating Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, order: isMobile ? 3 : 2, width: isMobile ? '100%' : 'auto' }}>
        {!isMobile && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            style={{ 
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '6px 14px', background: 'var(--bg2)', borderRadius: '24px',
              border: '1px solid var(--border)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}
          >
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--cyan)', boxShadow: '0 0 10px var(--cyan)' }} />
            <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>Analysis Active</span>
            <span style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 600, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {fileName || 'Document'}
            </span>
          </motion.div>
        )}

        <nav style={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          background: 'var(--bg2)',
          padding: '4px',
          borderRadius: '16px',
          border: '1px solid var(--border)',
          flex: isMobile ? 1 : 'none',
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
                  background: 'transparent', border: 'none', borderRadius: '12px',
                  color: isActive ? 'var(--cyan)' : 'var(--text-secondary)',
                  cursor: 'pointer', transition: 'all 0.2s ease', outline: 'none',
                  flex: isMobile ? 1 : 'none',
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
                      borderRadius: '12px', zIndex: 0,
                    }}
                  />
                )}
                
                <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Icon size={16} />
                  {!isMobile && (
                    <span style={{ fontSize: 13, fontWeight: isActive ? 600 : 500, fontFamily: 'var(--font-display)' }}>
                      {item.label}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

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
            {activeModel && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end', marginTop: 4 }}>
                <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: activePlatform === 'gemini' ? 'var(--cyan-glow)' : activePlatform === 'openrouter' ? 'rgba(167, 139, 250, 0.15)' : 'rgba(16, 185, 129, 0.15)', color: activePlatform === 'gemini' ? 'var(--cyan)' : activePlatform === 'openrouter' ? '#A78BFA' : '#10B981', border: activePlatform === 'gemini' ? '1px solid var(--cyan-border)' : activePlatform === 'openrouter' ? '1px solid rgba(167, 139, 250, 0.4)' : '1px solid rgba(16, 185, 129, 0.4)' }}>
                  {activePlatform === 'gemini' ? '✨' : activePlatform === 'openrouter' ? '🔀' : '🦙'} {activeModel}
                </span>
              </div>
            )}
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>{txCount} records</p>
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