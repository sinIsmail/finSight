import React, { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Sparkles, CheckCircle2 } from 'lucide-react';
import { SPRING } from '../utils/Theme';

// 👇 THIS IS THE PART TYPESCRIPT IS COMPLAINING ABOUT
interface UploadZoneProps {
  onFile: (file: File) => void;
  isLoading?: boolean;
  loadingMsg?: string;   // <-- Make sure this is here!
  loadingPct?: number;   // <-- Make sure this is here!
}

// Make sure your component function also accepts them:

export function UploadZone({ onFile, isLoading = false, loadingMsg = '', loadingPct = 0 }: UploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFile = useCallback((file: File) => {
    const isPDF = file.name.toLowerCase().endsWith('.pdf');
    const isCSV = file.name.toLowerCase().endsWith('.csv');
    
    if (!isPDF && !isCSV) {
      alert('Please upload a PDF or CSV file.');
      return;
    }
    onFile(file);
  }, [onFile]);

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

  return (
    <div style={{
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      minHeight:      '100vh',
      padding:        '40px 24px',
      background:     'var(--bg0)',
      position:       'relative',
      overflow:       'hidden',
    }}>
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...SPRING.gentle }}
        style={{ marginBottom: 48, textAlign: 'center' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
          <div style={{
            width: 36, height: 36, borderRadius: 'var(--radius-sm)',
            background: 'var(--cyan-glow)',
            border: '1px solid var(--cyan-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Sparkles size={18} color="var(--cyan)" />
          </div>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: 24, fontWeight: 800,
            letterSpacing: '-0.03em',
            color: 'var(--text-primary)',
          }}>
            Fin<span style={{ color: 'var(--cyan)' }}>Sight</span>
          </span>
        </div>
      </motion.div>

      {/* Drop zone */}
      <motion.label
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ ...SPRING.gentle, delay: 0.1 }}
        onDragOver={(e: any) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={onDrop}
        style={{
          display:       'flex',
          flexDirection: 'column',
          alignItems:    'center',
          justifyContent:'center',
          gap:           16,
          width:         '100%',
          maxWidth:      480,
          padding:       '48px 32px',
          borderRadius:  'var(--radius-xl)',
          border:        `1.5px dashed ${isDragOver ? 'var(--cyan)' : 'rgba(255,255,255,0.12)'}`,
          background:    isDragOver ? 'var(--cyan-glow)' : 'var(--bg2)',
          cursor:        isLoading ? 'default' : 'pointer',
          transition:    'all 200ms',
          boxShadow:     isDragOver ? '0 0 40px var(--cyan-glow)' : 'none',
          position:      'relative',
          overflow:      'hidden',
        }}
      >
        <input
          type="file"
          accept=".csv, .pdf, application/pdf"
          onChange={onInputChange}
          disabled={isLoading}
          style={{ display: 'none' }}
        />

        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, width: '100%' }}
            >
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} style={{ color: 'var(--cyan)' }}>
                <Sparkles size={32} />
              </motion.div>
              
              {/* ✨ Here is your TRUE backend message! */}
              <motion.p style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--cyan)', textAlign: 'center', height: 20 }}>
                {loadingMsg || 'Uploading...'}
              </motion.p>
              
              <div style={{ width: '80%', height: 6, background: 'var(--bg4)', borderRadius: 4, overflow: 'hidden', marginTop: 8 }}>
                {/* ✨ Here is your TRUE backend progress! */}
                <motion.div 
                  animate={{ width: `${loadingPct}%` }}
                  transition={{ ease: "easeOut", duration: 0.5 }}
                  style={{ height: '100%', background: 'linear-gradient(90deg, var(--purple), var(--cyan))', borderRadius: 4 }}
                />
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {loadingPct}%
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' }}
            >
              <motion.div
                animate={isDragOver ? { scale: 1.15, rotate: 5 } : { scale: 1, rotate: 0 }}
                style={{
                  width: 60, height: 60, borderRadius: 'var(--radius-md)',
                  background: isDragOver ? 'var(--cyan-glow)' : 'var(--bg3)',
                  border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: isDragOver ? 'var(--cyan)' : 'var(--text-muted)',
                }}
              >
                {isDragOver ? <CheckCircle2 size={28} /> : <Upload size={28} />}
              </motion.div>

              <div>
                <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 4, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
                  Drop your PDF or CSV here
                </p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  or <span style={{ color: 'var(--cyan)', textDecoration: 'underline' }}>click to browse</span>
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.label>
    </div>
  );
}