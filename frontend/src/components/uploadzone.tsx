import React, { useCallback, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Sparkles, CheckCircle2, Cpu } from 'lucide-react';
import { SPRING } from '../utils/Theme';
import { fetchModels } from '../services/api';
import logo from '../assets/logo.png';
import type { ModelsResponse, Platform } from '../types';

interface UploadZoneProps {
  onFile: (file: File, platform: Platform, modelName: string) => void;
  onDummyData?: () => void;
  isLoading?: boolean;
  loadingMsg?: string;
  loadingPct?: number;
}

export function UploadZone({ onFile, onDummyData, isLoading = false, loadingMsg = '', loadingPct = 0 }: UploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const [registry, setRegistry] = useState<ModelsResponse | null>(null);
  const [platform, setPlatform] = useState<Platform>('gemini');
  const [model, setModel] = useState<string>('');

  useEffect(() => {
    fetchModels()
      .then((data: ModelsResponse) => {
        setRegistry(data);
        setPlatform(data.default_platform);
        setModel(data[data.default_platform].default);
      })
      .catch((err) => console.error("Failed to fetch models:", err));
  }, []);

  const handlePlatformSwitch = (p: Platform) => {
    if (!registry || isLoading) return;
    setPlatform(p);
    setModel(registry[p].default);
  };

  const handleFile = useCallback((file: File) => {
    const isPDF = file.name.toLowerCase().endsWith('.pdf');
    const isCSV = file.name.toLowerCase().endsWith('.csv');

    if (!isPDF && !isCSV) {
      alert('Please upload a PDF or CSV file.');
      return;
    }
    onFile(file, platform, model);
  }, [onFile, platform, model]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  }, [handleFile]);

  const currentPlatformModels = registry ? registry[platform].models : [];

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', padding: '40px 24px', background: 'var(--bg0)', position: 'relative', overflow: 'hidden',
    }}>
      {/* Target File / Initial Message Logo Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ ...SPRING.gentle }}
        style={{ marginBottom: 32, textAlign: 'center' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
          <div style={{
            width: 44, height: 44, borderRadius: 'var(--radius-sm)', background: 'var(--bg2)',
            border: '1px solid var(--cyan-border)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden'
          }}>
            <img src={logo} alt="FinSight Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <span style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
            Fin<span style={{ color: 'var(--cyan)' }}>Sight</span>
          </span>
        </div>
      </motion.div>

      {/* Platform Toggle */}
      <motion.div
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        style={{
          display: 'flex', background: 'var(--bg2)', borderRadius: 'var(--radius-md)',
          padding: 4, marginBottom: 16, border: '1px solid var(--border)',
        }}
      >
        <button
          onClick={() => handlePlatformSwitch('gemini')}
          disabled={isLoading}
          style={{
            flex: 1, padding: '8px 24px', borderRadius: 'var(--radius-sm)',
            background: platform === 'gemini' ? 'var(--cyan-glow)' : 'transparent',
            border: platform === 'gemini' ? '1px solid var(--cyan-border)' : '1px solid transparent',
            color: platform === 'gemini' ? 'var(--cyan)' : 'var(--text-muted)',
            fontWeight: platform === 'gemini' ? 600 : 400,
            cursor: isLoading ? 'default' : 'pointer', transition: 'all 0.2s', display: 'flex', gap: 8, alignItems: 'center'
          }}
        >
          ✨ Gemini
        </button>
        <button
          onClick={() => handlePlatformSwitch('openrouter')}
          disabled={isLoading}
          style={{
            flex: 1, padding: '8px 24px', borderRadius: 'var(--radius-sm)',
            background: platform === 'openrouter' ? 'rgba(167, 139, 250, 0.15)' : 'transparent',
            border: platform === 'openrouter' ? '1px solid rgba(167, 139, 250, 0.4)' : '1px solid transparent',
            color: platform === 'openrouter' ? '#A78BFA' : 'var(--text-muted)',
            fontWeight: platform === 'openrouter' ? 600 : 400,
            cursor: isLoading ? 'default' : 'pointer', transition: 'all 0.2s', display: 'flex', gap: 8, alignItems: 'center'
          }}
        >
          🔀 OpenRouter
        </button>
        <button
          onClick={() => handlePlatformSwitch('ollama')}
          disabled={isLoading}
          style={{
            flex: 1, padding: '8px 24px', borderRadius: 'var(--radius-sm)',
            background: platform === 'ollama' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
            border: platform === 'ollama' ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid transparent',
            color: platform === 'ollama' ? '#10B981' : 'var(--text-muted)',
            fontWeight: platform === 'ollama' ? 600 : 400,
            cursor: isLoading ? 'default' : 'pointer', transition: 'all 0.2s', display: 'flex', gap: 8, alignItems: 'center'
          }}
        >
          🦙 Ollama
        </button>
      </motion.div>

      {/* Model Dropdown */}
      <motion.div
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        style={{ marginBottom: 32, display: 'flex', alignItems: 'center', gap: 12 }}
      >
        <Cpu size={18} color="var(--text-muted)" />
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          disabled={isLoading || !registry}
          style={{
            background: 'var(--bg2)', color: 'var(--text-primary)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)', padding: '8px 16px', fontFamily: 'var(--font-mono)', fontSize: 13,
            outline: 'none', cursor: isLoading ? 'default' : 'pointer', width: 280,
          }}
        >
          {currentPlatformModels.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </motion.div>

      {/* Drop zone */}
      <motion.label
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ ...SPRING.gentle, delay: 0.2 }}
        onDragOver={(e: any) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={onDrop}
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16,
          width: '100%', maxWidth: 480, padding: '48px 32px', borderRadius: 'var(--radius-xl)',
          border: `1.5px dashed ${isDragOver ? (platform === 'gemini' ? 'var(--cyan)' : platform === 'openrouter' ? '#A78BFA' : '#10B981') : 'rgba(255,255,255,0.12)'}`,
          background: isDragOver ? (platform === 'gemini' ? 'var(--cyan-glow)' : platform === 'openrouter' ? 'rgba(167, 139, 250, 0.05)' : 'rgba(16, 185, 129, 0.05)') : 'var(--bg2)',
          cursor: isLoading ? 'default' : 'pointer', transition: 'all 200ms',
          boxShadow: isDragOver ? `0 0 40px ${platform === 'gemini' ? 'var(--cyan-glow)' : platform === 'openrouter' ? 'rgba(167, 139, 250, 0.15)' : 'rgba(16, 185, 129, 0.15)'}` : 'none',
          position: 'relative', overflow: 'hidden',
        }}
      >
        <input type="file" accept=".csv, .pdf, application/pdf" onChange={onInputChange} disabled={isLoading} style={{ display: 'none' }} />

        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div 
              key="loading" 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }} 
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, width: '100%' }}
            >
              {/* Animated Document Scanner */}
              <div style={{ position: 'relative', width: 72, height: 96, background: 'var(--bg3)', borderRadius: 12, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', boxShadow: `0 0 30px ${platform === 'gemini' ? 'var(--cyan-glow)' : platform === 'openrouter' ? 'rgba(167, 139, 250, 0.15)' : 'rgba(16, 185, 129, 0.15)'}` }}>
                {/* Platform Icon Center */}
                <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
                  <Sparkles size={32} color={platform === 'gemini' ? 'var(--cyan)' : platform === 'openrouter' ? '#A78BFA' : '#10B981'} />
                </motion.div>
                
                {/* Scanning Laser */}
                <motion.div 
                  animate={{ top: ['0%', '100%', '0%'] }} 
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
                  style={{ 
                    position: 'absolute', left: 0, right: 0, height: 3, 
                    background: `linear-gradient(90deg, transparent, ${platform === 'gemini' ? 'var(--cyan)' : platform === 'openrouter' ? '#A78BFA' : '#10B981'}, transparent)`, 
                    boxShadow: `0 0 12px ${platform === 'gemini' ? 'var(--cyan)' : platform === 'openrouter' ? '#A78BFA' : '#10B981'}` 
                  }}
                />
              </div>

              {/* Status Message */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, height: 40, justifyContent: 'center' }}>
                <motion.p 
                  key={loadingMsg}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: platform === 'gemini' ? 'var(--cyan)' : platform === 'openrouter' ? '#A78BFA' : '#10B981', textAlign: 'center', fontWeight: 500 }}
                >
                  {loadingMsg || 'Initializing AI Engine...'}
                </motion.p>
              </div>

              {/* Cyber Progress Bar */}
              <div style={{ width: '85%', display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
                <div style={{ width: '100%', height: 4, background: 'var(--bg4)', borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
                  <motion.div 
                    animate={{ width: `${loadingPct}%` }} 
                    transition={{ ease: "easeOut", duration: 0.8 }} 
                    style={{ 
                      position: 'absolute', top: 0, bottom: 0, left: 0,
                      background: `linear-gradient(90deg, transparent, ${platform === 'gemini' ? 'var(--cyan)' : platform === 'openrouter' ? '#A78BFA' : '#10B981'})`, 
                      boxShadow: `0 0 10px ${platform === 'gemini' ? 'var(--cyan)' : platform === 'openrouter' ? '#A78BFA' : '#10B981'}`,
                      borderRadius: 4
                    }} 
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>
                  <span>{platform.toUpperCase()}</span>
                  <motion.span>{loadingPct}%</motion.span>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.9 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' }}>
              <motion.div animate={isDragOver ? { scale: 1.15, rotate: 5 } : { scale: 1, rotate: 0 }} style={{ width: 60, height: 60, borderRadius: 'var(--radius-md)', background: isDragOver ? (platform === 'gemini' ? 'var(--cyan-glow)' : platform === 'openrouter' ? 'rgba(167, 139, 250, 0.1)' : 'rgba(16, 185, 129, 0.1)') : 'var(--bg3)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isDragOver ? (platform === 'gemini' ? 'var(--cyan)' : platform === 'openrouter' ? '#A78BFA' : '#10B981') : 'var(--text-muted)' }}>
                {isDragOver ? <CheckCircle2 size={28} /> : <Upload size={28} />}
              </motion.div>
              <div>
                <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 4, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>Drop your PDF or CSV</p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>or <span style={{ color: platform === 'gemini' ? 'var(--cyan)' : platform === 'openrouter' ? '#A78BFA' : '#10B981', textDecoration: 'underline' }}>click to browse</span></p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.label>

      {/* Dummy Button per user request */}
      {!isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{ marginTop: 24 }}
        >
          <button
            onClick={() => {
              if (onDummyData) {
                onDummyData();
              } else {
                const dummyCSV = "Date,Description,Type,Amount\n2025-04-10,Netflix,Debit,15.99\n2025-04-11,Spotify,Debit,9.99\n2025-04-12,Salary,Credit,5000.00";
                const fakeFile = new File([dummyCSV], "dummy_statement.csv", { type: "text/csv" });
                onFile(fakeFile, platform, model);
              }
            }}
            style={{
              background: 'transparent',
              border: `1px solid ${platform === 'gemini' ? 'var(--cyan)' : platform === 'openrouter' ? '#A78BFA' : '#10B981'}`,
              color: platform === 'gemini' ? 'var(--cyan)' : platform === 'openrouter' ? '#A78BFA' : '#10B981',
              padding: '8px 16px',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              fontFamily: 'var(--font-mono)',
              fontSize: 13,
              fontWeight: 600,
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = platform === 'gemini' ? 'var(--cyan-glow)' : platform === 'openrouter' ? 'rgba(167, 139, 250, 0.1)' : 'rgba(16, 185, 129, 0.1)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            🧪 Generate Dummy Data
          </button>
        </motion.div>
      )}
    </div>
  );
}