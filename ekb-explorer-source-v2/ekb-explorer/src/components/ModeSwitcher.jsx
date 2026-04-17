import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Network, Home } from 'lucide-react';

export default function ModeSwitcher({ current }) {
  const base = {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    zIndex: 9999,
    display: 'flex',
    gap: '4px',
    padding: '4px',
    background: 'rgba(20, 20, 22, 0.92)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '2px',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    fontFamily: '"JetBrains Mono", ui-monospace, Menlo, monospace',
    fontSize: '10px',
    letterSpacing: '0.1em',
    boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
  };

  const link = (active) => ({
    padding: '8px 12px',
    textDecoration: 'none',
    color: active ? '#0A0A0B' : '#E8E8EA',
    background: active ? '#E8C77A' : 'transparent',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontWeight: 600,
  });

  return (
    <div style={base}>
      <Link to="/" style={link(false)} title="Torna alla home">
        <Home size={12} />
      </Link>
      <Link to="/narrative" style={link(current === '/narrative')}>
        <BookOpen size={12} />
        <span>NARRATIVE</span>
      </Link>
      <Link to="/graph" style={link(current === '/graph')}>
        <Network size={12} />
        <span>GRAPH</span>
      </Link>
    </div>
  );
}
