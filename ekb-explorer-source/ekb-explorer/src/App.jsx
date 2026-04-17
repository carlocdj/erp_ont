import React from 'react';
import { Routes, Route, useLocation, Link } from 'react-router-dom';
import Landing from './pages/Landing.jsx';
import NarrativeExplorer from './pages/NarrativeExplorer.jsx';
import GraphExplorer from './pages/GraphExplorer.jsx';
import ModeSwitcher from './components/ModeSwitcher.jsx';

export default function App() {
  const { pathname } = useLocation();
  const showSwitcher = pathname === '/narrative' || pathname === '/graph';

  return (
    <>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/narrative" element={<NarrativeExplorer />} />
        <Route path="/graph" element={<GraphExplorer />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      {showSwitcher && <ModeSwitcher current={pathname} />}
    </>
  );
}

function NotFound() {
  return (
    <div style={{
      minHeight: '100vh', display: 'grid', placeItems: 'center',
      background: '#F5F1EA', fontFamily: 'Georgia, serif',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '48px', fontWeight: 700, marginBottom: '16px' }}>404</div>
        <Link to="/" style={{ color: '#8B2635' }}>Torna alla home</Link>
      </div>
    </div>
  );
}
