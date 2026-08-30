import React, { useEffect } from 'react';

export default function Toast({ toast, onClose }) {
  if (!toast) return null;

  const bgMap = {
    success: 'rgba(34,197,94,0.15)',
    error: 'rgba(239,68,68,0.15)',
    warning: 'rgba(245,158,11,0.15)',
    info: 'rgba(99,102,241,0.15)'
  };
  const borderMap = {
    success: 'rgba(34,197,94,0.35)',
    error: 'rgba(239,68,68,0.35)',
    warning: 'rgba(245,158,11,0.35)',
    info: 'rgba(99,102,241,0.35)'
  };
  const colorMap = {
    success: '#86efac',
    error: '#f87171',
    warning: '#fcd34d',
    info: '#c7d2fe'
  };
  const iconMap = {
    success: '✓',
    error: '✗',
    warning: '⚠️',
    info: 'ℹ'
  };

  const type = toast.type || 'info';

  return (
    <div style={{
      position: 'fixed',
      bottom: '1.5rem',
      right: '1.5rem',
      zIndex: 9999,
      background: '#111827',
      border: `1px solid ${borderMap[type]}`,
      boxShadow: '0 12px 36px rgba(0,0,0,0.6)',
      borderRadius: '14px',
      padding: '0.85rem 1.25rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      maxWidth: '400px',
      animation: 'slideIn 0.25s ease-out'
    }}>
      <div style={{
        width: '28px',
        height: '28px',
        borderRadius: '50%',
        background: bgMap[type],
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: colorMap[type],
        fontWeight: 800,
        fontSize: '0.85rem',
        flexShrink: 0
      }}>
        {iconMap[type]}
      </div>
      <div style={{ color: '#f1f5f9', fontSize: '0.85rem', fontWeight: 500, flex: 1, lineHeight: 1.4 }}>
        {toast.message}
      </div>
      <button
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          color: '#64748b',
          cursor: 'pointer',
          fontSize: '1rem',
          padding: '0.2rem',
          marginLeft: '0.5rem',
          lineHeight: 1
        }}
      >
        ×
      </button>
    </div>
  );
}
