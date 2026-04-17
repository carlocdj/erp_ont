import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Search, Network, Table, Code, Filter, Maximize2, RotateCcw, ChevronDown, Eye, EyeOff, Plus, X, Crosshair } from 'lucide-react';
import { GRAPH_DATA as RAW } from '../data/graph.js';

// ============================================================================
// ONTOLOGY GRAPH DATA
// Extracted from iqt_ekb_erp_ontology_v3_final.ttl (2017 triples -> 510 nodes, 505 edges)
// Filter applied: data:hasField edges suppressed (83 edges of Employee fields,
// noise for navigation). All other object properties preserved.
// ============================================================================

// Ontology data imported from the generated module

const NODES = RAW.nodes;
const EDGES = RAW.edges;

// ---- Colour palette: one hue per namespace, high-contrast on dark --------
const NS_COLOR = {
  ekb:  '#E8C77A',  // core - amber
  org:  '#5DA8FF',  // organization - azure
  ctrl: '#FF8C42',  // control - orange
  erp:  '#E0E0E0',  // systems - white/grey
  proc: '#7AD9A6',  // processes - green
  data: '#C58AFF',  // records - violet
  prj:  '#FF6B9D',  // project - pink
  ux:   '#FFD86B',  // ux/roles - yellow
  tax:  '#A8A0FF',  // tax - lavender
  int:  '#6FE8E0',  // integration - cyan
  iqt:  '#FF5A5A',  // IQT instances - red
  res:  '#E8C77A',  // resources
  owl:  '#888888',  // classes - grey
  rdfs: '#666666',
};

const colorOf = (n) => NS_COLOR[n?.group] || '#999';

// ---- Index structures for fast lookup -------------------------------------
const NODE_BY_ID = new Map(NODES.map(n => [n.id, n]));
const OUT_EDGES = new Map();
const IN_EDGES = new Map();
for (const e of EDGES) {
  if (!OUT_EDGES.has(e.s)) OUT_EDGES.set(e.s, []);
  if (!IN_EDGES.has(e.o)) IN_EDGES.set(e.o, []);
  OUT_EDGES.get(e.s).push(e);
  IN_EDGES.get(e.o).push(e);
}

const neighborsOf = (id) => {
  const outs = OUT_EDGES.get(id) || [];
  const ins = IN_EDGES.get(id) || [];
  const set = new Set();
  outs.forEach(e => set.add(e.o));
  ins.forEach(e => set.add(e.s));
  return set;
};

// ---- Force-directed layout (minimal, in-house) -----------------------------
// Barnes-Hut-free, good enough for < 200 visible nodes which is the
// typical explorer working set (we constrain to the current subgraph).

function useForceLayout(visibleIds, visibleEdges, width, height, pinned) {
  const [positions, setPositions] = useState(() => new Map());
  const rafRef = useRef(null);
  const velRef = useRef(new Map());

  useEffect(() => {
    // initialize positions for newcomers at centre with small jitter
    setPositions(prev => {
      const next = new Map(prev);
      const cx = width / 2, cy = height / 2;
      let i = 0;
      for (const id of visibleIds) {
        if (!next.has(id)) {
          const angle = (i * 137.5) * Math.PI / 180; // golden-angle scatter
          const r = 40 + Math.sqrt(i) * 18;
          next.set(id, { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r });
        }
        i++;
      }
      // cleanup positions of nodes no longer visible
      for (const id of [...next.keys()]) {
        if (!visibleIds.has(id)) next.delete(id);
      }
      return next;
    });
    velRef.current = new Map();
  }, [visibleIds, width, height]);

  useEffect(() => {
    let running = true;
    const step = () => {
      if (!running) return;
      setPositions(prev => {
        const next = new Map();
        const ids = [...prev.keys()];
        if (ids.length === 0) return prev;

        const forces = new Map(ids.map(id => [id, { x: 0, y: 0 }]));

        // Coulomb repulsion O(n^2) — acceptable for visible subgraph
        const k_rep = 1800;
        for (let i = 0; i < ids.length; i++) {
          for (let j = i + 1; j < ids.length; j++) {
            const a = prev.get(ids[i]), b = prev.get(ids[j]);
            const dx = a.x - b.x, dy = a.y - b.y;
            const d2 = dx*dx + dy*dy + 0.01;
            const d = Math.sqrt(d2);
            const f = k_rep / d2;
            const fx = (dx / d) * f, fy = (dy / d) * f;
            forces.get(ids[i]).x += fx; forces.get(ids[i]).y += fy;
            forces.get(ids[j]).x -= fx; forces.get(ids[j]).y -= fy;
          }
        }

        // Spring attraction along edges
        const k_spring = 0.03;
        const rest = 90;
        for (const e of visibleEdges) {
          const a = prev.get(e.s), b = prev.get(e.o);
          if (!a || !b) continue;
          const dx = b.x - a.x, dy = b.y - a.y;
          const d = Math.sqrt(dx*dx + dy*dy) + 0.01;
          const f = k_spring * (d - rest);
          const fx = (dx / d) * f, fy = (dy / d) * f;
          forces.get(e.s).x += fx; forces.get(e.s).y += fy;
          forces.get(e.o).x -= fx; forces.get(e.o).y -= fy;
        }

        // Gentle centering
        const cx = width / 2, cy = height / 2;
        for (const id of ids) {
          const p = prev.get(id);
          forces.get(id).x += (cx - p.x) * 0.002;
          forces.get(id).y += (cy - p.y) * 0.002;
        }

        // Integrate with damping
        const damp = 0.82;
        for (const id of ids) {
          if (pinned && pinned.has(id)) {
            next.set(id, prev.get(id));
            continue;
          }
          const v = velRef.current.get(id) || { x: 0, y: 0 };
          const f = forces.get(id);
          v.x = (v.x + f.x) * damp;
          v.y = (v.y + f.y) * damp;
          // cap velocity
          const vmax = 25;
          if (Math.abs(v.x) > vmax) v.x = Math.sign(v.x) * vmax;
          if (Math.abs(v.y) > vmax) v.y = Math.sign(v.y) * vmax;
          velRef.current.set(id, v);
          const p = prev.get(id);
          let nx = p.x + v.x;
          let ny = p.y + v.y;
          // keep inside bounds
          nx = Math.max(30, Math.min(width - 30, nx));
          ny = Math.max(30, Math.min(height - 30, ny));
          next.set(id, { x: nx, y: ny });
        }
        return next;
      });
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => { running = false; if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [visibleEdges, width, height, pinned]);

  const setPosition = useCallback((id, pos) => {
    setPositions(prev => {
      const next = new Map(prev);
      next.set(id, pos);
      return next;
    });
  }, []);

  return { positions, setPosition };
}


// ============================================================================
// DESIGN SYSTEM - dark technical cockpit
// ============================================================================

const STYLES = {
  bg: '#0A0A0B',
  panel: '#111114',
  panel2: '#17171C',
  border: '#2A2A32',
  border2: '#3A3A44',
  ink: '#E8E8EA',
  muted: '#7A7A85',
  dim: '#4A4A55',
  accent: '#E8C77A',
  accent2: '#FF6B6B',
  grid: '#18181E',
};

const MONO = 'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace';
const DISPLAY = 'ui-monospace, "SF Mono", Menlo, monospace';

// ============================================================================
// HEADER
// ============================================================================

function Header({ mode, setMode, visibleCount, totalCount }) {
  const tabs = [
    { id: 'graph', label: 'GRAPH', icon: Network },
    { id: 'query', label: 'QUERY', icon: Filter },
    { id: 'triples', label: 'TRIPLES', icon: Table },
    { id: 'schema', label: 'SCHEMA', icon: Code },
  ];
  return (
    <header style={{
      borderBottom: `1px solid ${STYLES.border}`,
      padding: '10px 16px',
      display: 'flex', alignItems: 'center', gap: '20px',
      background: STYLES.panel,
      fontFamily: MONO,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
        <div style={{
          width: '8px', height: '8px', background: STYLES.accent2,
          boxShadow: `0 0 8px ${STYLES.accent2}`, borderRadius: '50%',
        }} />
        <div style={{ fontSize: '11px', color: STYLES.muted, letterSpacing: '0.15em' }}>
          EKB://
        </div>
        <div style={{ fontSize: '13px', color: STYLES.ink, fontWeight: 600, letterSpacing: '0.05em' }}>
          iqt_ekb_erp_ontology_v3_final
        </div>
        <div style={{ fontSize: '10px', color: STYLES.dim, letterSpacing: '0.1em' }}>
          · 2017 TRIPLES · 79 CLASSES · 52 OBJ.PROP
        </div>
      </div>

      <div style={{ marginLeft: 'auto', display: 'flex', gap: '2px', background: STYLES.bg, padding: '2px', border: `1px solid ${STYLES.border}` }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setMode(t.id)} style={{
            padding: '6px 14px',
            background: mode === t.id ? STYLES.accent : 'transparent',
            color: mode === t.id ? STYLES.bg : STYLES.muted,
            border: 'none', cursor: 'pointer',
            fontFamily: MONO, fontSize: '10px', fontWeight: 600,
            letterSpacing: '0.12em', display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            <t.icon size={12} />{t.label}
          </button>
        ))}
      </div>

      <div style={{ fontSize: '10px', color: STYLES.muted, letterSpacing: '0.1em' }}>
        NODES {String(visibleCount).padStart(3,'0')}<span style={{ color: STYLES.dim }}>/{totalCount}</span>
      </div>
    </header>
  );
}

// ============================================================================
// NAMESPACE LEGEND
// ============================================================================

function NamespaceLegend({ hidden, toggle }) {
  const items = [
    { ns: 'ekb', label: 'core', desc: 'Purpose, Capability, Rule' },
    { ns: 'org', label: 'organization', desc: 'Group, BU, Team, Site' },
    { ns: 'proc', label: 'process', desc: 'Business processes' },
    { ns: 'data', label: 'data', desc: 'Record types, Fields' },
    { ns: 'ctrl', label: 'control', desc: 'Dimensions, KPI, margin' },
    { ns: 'erp', label: 'systems', desc: 'NetSuite, integrations' },
    { ns: 'ux', label: 'ux', desc: 'Roles, Dashboards, Reports' },
    { ns: 'tax', label: 'tax', desc: 'VAT, NExIL, e-invoicing' },
    { ns: 'prj', label: 'project', desc: 'Implementation, milestones' },
    { ns: 'int', label: 'integration', desc: 'Flows, payloads' },
    { ns: 'iqt', label: 'iqt::', desc: 'Concrete instances' },
    { ns: 'owl', label: 'owl:Class', desc: 'Schema classes' },
  ];
  return (
    <div style={{ padding: '12px', borderBottom: `1px solid ${STYLES.border}` }}>
      <div style={{ fontFamily: MONO, fontSize: '9px', color: STYLES.muted, letterSpacing: '0.15em', marginBottom: '8px' }}>
        NAMESPACES · TAP TO TOGGLE
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
        {items.map(it => {
          const isHidden = hidden.has(it.ns);
          return (
            <button key={it.ns} onClick={() => toggle(it.ns)} style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '4px 6px', background: 'transparent', border: 'none',
              cursor: 'pointer', opacity: isHidden ? 0.35 : 1,
              fontFamily: MONO, textAlign: 'left',
            }}>
              <div style={{
                width: '10px', height: '10px',
                background: NS_COLOR[it.ns],
                boxShadow: isHidden ? 'none' : `0 0 6px ${NS_COLOR[it.ns]}66`,
                flexShrink: 0,
              }} />
              <div style={{ fontSize: '10px', color: STYLES.ink, minWidth: '40px' }}>{it.ns}</div>
              <div style={{ fontSize: '9px', color: STYLES.muted, flex: 1 }}>{it.desc}</div>
              {isHidden ? <EyeOff size={10} color={STYLES.dim} /> : <Eye size={10} color={STYLES.muted} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}


// ============================================================================
// GRAPH CANVAS
// ============================================================================

function GraphCanvas({ seedIds, hiddenNs, onSelect, selectedId }) {
  const containerRef = useRef(null);
  const [dims, setDims] = useState({ w: 800, h: 600 });
  const [expanded, setExpanded] = useState(() => new Set(seedIds));
  const [pinned, setPinned] = useState(() => new Set());
  const [hoveredEdge, setHoveredEdge] = useState(null);
  const [draggedId, setDraggedId] = useState(null);

  // Track external seed changes (when user queries a new focal node)
  useEffect(() => {
    setExpanded(new Set(seedIds));
    setPinned(new Set());
  }, [seedIds]);

  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        const r = containerRef.current.getBoundingClientRect();
        setDims({ w: r.width, h: r.height });
      }
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Visible node set: for each expanded node, include the node and its neighbors
  const visibleIds = useMemo(() => {
    const set = new Set();
    for (const id of expanded) {
      const n = NODE_BY_ID.get(id);
      if (!n || hiddenNs.has(n.group)) continue;
      set.add(id);
      const nbs = neighborsOf(id);
      nbs.forEach(nid => {
        const nn = NODE_BY_ID.get(nid);
        if (nn && !hiddenNs.has(nn.group)) set.add(nid);
      });
    }
    return set;
  }, [expanded, hiddenNs]);

  const visibleEdges = useMemo(() => {
    return EDGES.filter(e => visibleIds.has(e.s) && visibleIds.has(e.o));
  }, [visibleIds]);

  const { positions, setPosition } = useForceLayout(visibleIds, visibleEdges, dims.w, dims.h, pinned);

  const expand = (id) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  const collapse = (id) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const togglePin = (id) => {
    setPinned(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // Drag handlers
  const onMouseDown = (id) => (e) => {
    e.stopPropagation();
    setDraggedId(id);
    setPinned(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };
  const onMouseMove = (e) => {
    if (!draggedId || !containerRef.current) return;
    const r = containerRef.current.getBoundingClientRect();
    setPosition(draggedId, { x: e.clientX - r.left, y: e.clientY - r.top });
  };
  const onMouseUp = () => setDraggedId(null);

  return (
    <div
      ref={containerRef}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      style={{
        position: 'relative', width: '100%', height: '100%',
        background: STYLES.bg,
        backgroundImage: `
          linear-gradient(${STYLES.grid} 1px, transparent 1px),
          linear-gradient(90deg, ${STYLES.grid} 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
        overflow: 'hidden',
        cursor: draggedId ? 'grabbing' : 'default',
      }}
    >
      {/* Crosshair at centre (subtle) */}
      <div style={{
        position: 'absolute', top: dims.h / 2, left: dims.w / 2,
        width: '1px', height: '24px', marginLeft: '-0.5px', marginTop: '-12px',
        background: STYLES.border2, pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', top: dims.h / 2, left: dims.w / 2,
        width: '24px', height: '1px', marginLeft: '-12px', marginTop: '-0.5px',
        background: STYLES.border2, pointerEvents: 'none',
      }} />

      {/* SVG edges */}
      <svg width={dims.w} height={dims.h} style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto" markerUnits="userSpaceOnUse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={STYLES.border2} />
          </marker>
          <marker id="arrow-hl" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto" markerUnits="userSpaceOnUse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={STYLES.accent} />
          </marker>
        </defs>
        {visibleEdges.map((e, i) => {
          const a = positions.get(e.s);
          const b = positions.get(e.o);
          if (!a || !b) return null;
          const isHl = (selectedId && (e.s === selectedId || e.o === selectedId)) || hoveredEdge === i;
          // Shorten line to not overlap with node circles (radius ~ 6-12)
          const dx = b.x - a.x, dy = b.y - a.y;
          const d = Math.sqrt(dx*dx + dy*dy) + 0.01;
          const ux = dx / d, uy = dy / d;
          const r1 = 8, r2 = 12;
          const x1 = a.x + ux * r1, y1 = a.y + uy * r1;
          const x2 = b.x - ux * r2, y2 = b.y - uy * r2;
          return (
            <g key={i}>
              <line
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={isHl ? STYLES.accent : STYLES.border2}
                strokeWidth={isHl ? 1.5 : 0.7}
                opacity={isHl ? 0.95 : 0.5}
                markerEnd={isHl ? 'url(#arrow-hl)' : 'url(#arrow)'}
                style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
                onMouseEnter={() => setHoveredEdge(i)}
                onMouseLeave={() => setHoveredEdge(null)}
              />
              {isHl && (
                <text
                  x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 4}
                  fill={STYLES.accent} fontSize="9" fontFamily={MONO}
                  textAnchor="middle" opacity="0.95"
                  style={{ pointerEvents: 'none' }}
                >{e.p}</text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Nodes */}
      {[...visibleIds].map(id => {
        const n = NODE_BY_ID.get(id);
        if (!n) return null;
        const p = positions.get(id);
        if (!p) return null;
        const c = colorOf(n);
        const isExpanded = expanded.has(id);
        const isSelected = id === selectedId;
        const isPinned = pinned.has(id);
        const nbCount = neighborsOf(id).size;
        const shownNbs = [...neighborsOf(id)].filter(nid => visibleIds.has(nid)).length;
        const hidden = nbCount - shownNbs;

        const isClass = n.isClass;
        const r = isSelected ? 10 : (isExpanded ? 8 : 6);

        return (
          <div key={id}
            style={{
              position: 'absolute',
              left: p.x, top: p.y, transform: 'translate(-50%, -50%)',
              cursor: draggedId ? 'grabbing' : 'grab',
              userSelect: 'none',
            }}
            onMouseDown={onMouseDown(id)}
            onClick={(e) => { e.stopPropagation(); onSelect(id); }}
          >
            {/* node dot */}
            <div style={{
              width: r * 2, height: r * 2,
              borderRadius: isClass ? '2px' : '50%',
              background: c,
              boxShadow: isSelected
                ? `0 0 20px ${c}, 0 0 6px ${c}`
                : (isExpanded ? `0 0 10px ${c}88` : 'none'),
              border: isPinned ? `1.5px solid ${STYLES.ink}` : 'none',
              transition: 'width 0.15s, height 0.15s, box-shadow 0.15s',
            }} />
            {/* label */}
            <div style={{
              position: 'absolute',
              top: r + 4, left: '50%', transform: 'translateX(-50%)',
              fontFamily: MONO,
              fontSize: isSelected ? '11px' : '9px',
              color: isSelected ? STYLES.ink : (isExpanded ? STYLES.ink : STYLES.muted),
              whiteSpace: 'nowrap',
              padding: '1px 4px',
              background: STYLES.bg + 'CC',
              letterSpacing: '0.03em',
              pointerEvents: 'none',
            }}>
              {n.label}
              {isExpanded && hidden > 0 && (
                <span style={{ color: STYLES.dim, marginLeft: '4px' }}>+{hidden}</span>
              )}
            </div>
            {/* expand badge: only if collapsed and has neighbors */}
            {!isExpanded && shownNbs < nbCount && nbCount > 0 && (
              <div
                onClick={(e) => { e.stopPropagation(); expand(id); }}
                style={{
                  position: 'absolute', top: -5, right: -5,
                  width: '12px', height: '12px',
                  background: STYLES.bg, border: `1px solid ${c}`,
                  color: c, fontSize: '9px', fontFamily: MONO,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: '50%', cursor: 'pointer', fontWeight: 700,
                  lineHeight: 1,
                }}
              >+</div>
            )}
          </div>
        );
      })}

      {/* HUD overlay top-left */}
      <div style={{
        position: 'absolute', top: 10, left: 10,
        fontFamily: MONO, fontSize: '10px', color: STYLES.muted,
        background: STYLES.panel + 'DD', padding: '6px 10px',
        border: `1px solid ${STYLES.border}`,
        letterSpacing: '0.08em',
      }}>
        <div>VISIBLE · {visibleIds.size} NODES · {visibleEdges.length} EDGES</div>
        <div style={{ color: STYLES.dim, marginTop: '2px' }}>DRAG TO PIN · CLICK + TO EXPAND · TAP NODE TO INSPECT</div>
      </div>
    </div>
  );
}


// ============================================================================
// LEFT SIDEBAR: SEARCH + SEED MANAGEMENT
// ============================================================================

function LeftSidebar({ hiddenNs, toggleNs, seedIds, setSeedIds, onSelect, selectedId }) {
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('ALL');

  const results = useMemo(() => {
    if (!q.trim() && filter === 'ALL') {
      // show top hubs by default
      return [...NODES].sort((a, b) => (b.degree || 0) - (a.degree || 0)).slice(0, 30);
    }
    const qq = q.toLowerCase();
    return NODES.filter(n => {
      if (filter !== 'ALL' && n.group !== filter) return false;
      if (!qq) return true;
      return n.id.toLowerCase().includes(qq) ||
             (n.label || '').toLowerCase().includes(qq) ||
             (n.type || '').toLowerCase().includes(qq);
    }).sort((a, b) => (b.degree || 0) - (a.degree || 0)).slice(0, 80);
  }, [q, filter]);

  const nsList = ['ALL', 'ekb','org','proc','data','ctrl','erp','ux','tax','prj','int','iqt','owl'];

  const addSeed = (id) => {
    setSeedIds(prev => prev.includes(id) ? prev : [...prev, id]);
  };
  const removeSeed = (id) => {
    setSeedIds(prev => prev.filter(x => x !== id));
  };

  return (
    <div style={{
      width: '280px', background: STYLES.panel, borderRight: `1px solid ${STYLES.border}`,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* search */}
      <div style={{ padding: '12px', borderBottom: `1px solid ${STYLES.border}` }}>
        <div style={{ position: 'relative' }}>
          <Search size={12} color={STYLES.muted} style={{ position: 'absolute', top: '10px', left: '10px' }} />
          <input
            placeholder="search nodes…"
            value={q}
            onChange={e => setQ(e.target.value)}
            style={{
              width: '100%', padding: '8px 10px 8px 28px',
              background: STYLES.bg, border: `1px solid ${STYLES.border}`,
              color: STYLES.ink, fontFamily: MONO, fontSize: '11px',
              letterSpacing: '0.03em', outline: 'none',
            }}
          />
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', marginTop: '8px' }}>
          {nsList.map(ns => (
            <button key={ns} onClick={() => setFilter(ns)} style={{
              padding: '2px 6px', fontSize: '9px', fontFamily: MONO,
              background: filter === ns ? STYLES.accent : 'transparent',
              color: filter === ns ? STYLES.bg : (NS_COLOR[ns] || STYLES.muted),
              border: `1px solid ${filter === ns ? STYLES.accent : STYLES.border}`,
              cursor: 'pointer', letterSpacing: '0.1em', fontWeight: 600,
            }}>{ns.toUpperCase()}</button>
          ))}
        </div>
      </div>

      {/* Active seeds */}
      <div style={{ padding: '10px 12px', borderBottom: `1px solid ${STYLES.border}` }}>
        <div style={{ fontFamily: MONO, fontSize: '9px', color: STYLES.muted, letterSpacing: '0.15em', marginBottom: '6px' }}>
          SEEDS · {seedIds.length}
        </div>
        {seedIds.length === 0 ? (
          <div style={{ fontFamily: MONO, fontSize: '10px', color: STYLES.dim, fontStyle: 'italic' }}>
            no seeds — click + on any result
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {seedIds.map(id => {
              const n = NODE_BY_ID.get(id);
              if (!n) return null;
              return (
                <div key={id} style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '4px 6px', background: STYLES.bg,
                  borderLeft: `3px solid ${colorOf(n)}`,
                }}>
                  <div style={{ fontFamily: MONO, fontSize: '10px', color: STYLES.ink, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {n.label}
                  </div>
                  <X size={10} color={STYLES.muted} style={{ cursor: 'pointer' }} onClick={() => removeSeed(id)} />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Results */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
        <div style={{ padding: '0 12px 6px', fontFamily: MONO, fontSize: '9px', color: STYLES.muted, letterSpacing: '0.15em' }}>
          {q || filter !== 'ALL' ? `MATCHES · ${results.length}` : 'HUB NODES · TOP BY DEGREE'}
        </div>
        {results.map(n => {
          const c = colorOf(n);
          const isSeed = seedIds.includes(n.id);
          const isSelected = selectedId === n.id;
          return (
            <div key={n.id} style={{
              padding: '5px 12px', display: 'flex', alignItems: 'center', gap: '8px',
              cursor: 'pointer',
              background: isSelected ? STYLES.panel2 : 'transparent',
              borderLeft: isSelected ? `2px solid ${STYLES.accent}` : '2px solid transparent',
            }}
              onClick={() => onSelect(n.id)}
            >
              <div style={{ width: '6px', height: '6px', background: c, borderRadius: n.isClass ? '1px' : '50%', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: MONO, fontSize: '10px', color: STYLES.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {n.label}
                </div>
                <div style={{ fontFamily: MONO, fontSize: '8px', color: STYLES.dim, whiteSpace: 'nowrap' }}>
                  {n.id} · deg {n.degree || 0}
                </div>
              </div>
              <Plus
                size={12}
                color={isSeed ? STYLES.accent : STYLES.muted}
                style={{ cursor: 'pointer', flexShrink: 0 }}
                onClick={(e) => { e.stopPropagation(); isSeed ? removeSeed(n.id) : addSeed(n.id); }}
              />
            </div>
          );
        })}
      </div>

      {/* Namespace legend at bottom */}
      <NamespaceLegend hidden={hiddenNs} toggle={toggleNs} />
    </div>
  );
}

// ============================================================================
// RIGHT INSPECTOR PANEL
// ============================================================================

function Inspector({ selectedId, onSelect, addSeed }) {
  if (!selectedId) {
    return (
      <div style={{
        width: '320px', background: STYLES.panel, borderLeft: `1px solid ${STYLES.border}`,
        padding: '20px', fontFamily: MONO, fontSize: '11px', color: STYLES.dim,
        display: 'flex', flexDirection: 'column', gap: '12px',
      }}>
        <div style={{ color: STYLES.muted, letterSpacing: '0.15em', fontSize: '9px' }}>NO SELECTION</div>
        <div style={{ color: STYLES.dim, fontSize: '10px', lineHeight: 1.6 }}>
          Tap a node in the graph or in the search results to inspect its properties, its incoming and outgoing relations, and its class lineage.
        </div>
        <div style={{ marginTop: '20px', padding: '12px', background: STYLES.bg, border: `1px solid ${STYLES.border}` }}>
          <div style={{ color: STYLES.accent, fontSize: '9px', letterSpacing: '0.15em', marginBottom: '6px' }}>SUGGESTED SEEDS</div>
          <div style={{ color: STYLES.muted, fontSize: '9px', lineHeight: 1.6 }}>
            • <span style={{ color: NS_COLOR.erp }}>erp:OracleNetSuite</span> — the ERP hub<br />
            • <span style={{ color: NS_COLOR.ctrl }}>ctrl:IQTDirectCostingEvoluto</span> — the control model<br />
            • <span style={{ color: NS_COLOR.ekb }}>res:DeliverEngineeringService</span> — the delivery purpose<br />
            • <span style={{ color: NS_COLOR.iqt }}>iqt:IQTGroup</span> — the organization root
          </div>
        </div>
      </div>
    );
  }

  const n = NODE_BY_ID.get(selectedId);
  if (!n) return null;

  const outs = OUT_EDGES.get(selectedId) || [];
  const ins = IN_EDGES.get(selectedId) || [];
  const c = colorOf(n);

  // Class lineage: follow rdfs:subClassOf upwards
  const lineage = [];
  const visited = new Set();
  let cursor = n.type;
  while (cursor && !visited.has(cursor) && cursor !== 'owl:Class' && cursor !== 'unknown') {
    visited.add(cursor);
    lineage.push(cursor);
    // find parent via subClassOf edge
    const parent = EDGES.find(e => e.s === cursor && e.p === 'rdfs:subClassOf');
    cursor = parent ? parent.o : null;
  }

  return (
    <div style={{
      width: '320px', background: STYLES.panel, borderLeft: `1px solid ${STYLES.border}`,
      overflowY: 'auto', display: 'flex', flexDirection: 'column',
    }}>
      {/* header */}
      <div style={{ padding: '14px', borderBottom: `1px solid ${STYLES.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <div style={{ width: '10px', height: '10px', background: c, borderRadius: n.isClass ? '2px' : '50%', boxShadow: `0 0 8px ${c}` }} />
          <div style={{ fontFamily: MONO, fontSize: '9px', color: STYLES.muted, letterSpacing: '0.15em' }}>
            {n.isClass ? 'CLASS' : 'INDIVIDUAL'} · {n.group.toUpperCase()}
          </div>
        </div>
        <div style={{ fontFamily: DISPLAY, fontSize: '18px', color: STYLES.ink, fontWeight: 600, wordBreak: 'break-word' }}>
          {n.label}
        </div>
        <div style={{ fontFamily: MONO, fontSize: '10px', color: STYLES.dim, marginTop: '4px', wordBreak: 'break-all' }}>
          {n.id}
        </div>
        <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
          <button onClick={() => addSeed(n.id)} style={{
            flex: 1, padding: '5px 8px', background: STYLES.accent, color: STYLES.bg,
            border: 'none', cursor: 'pointer', fontFamily: MONO, fontSize: '9px',
            letterSpacing: '0.12em', fontWeight: 600,
          }}>+ SEED</button>
        </div>
      </div>

      {/* type + lineage */}
      <div style={{ padding: '12px 14px', borderBottom: `1px solid ${STYLES.border}` }}>
        <div style={{ fontFamily: MONO, fontSize: '9px', color: STYLES.muted, letterSpacing: '0.15em', marginBottom: '6px' }}>
          rdf:type → {n.type}
        </div>
        {lineage.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
            {lineage.map((cls, i) => (
              <React.Fragment key={i}>
                <button onClick={() => onSelect(cls)} style={{
                  fontFamily: MONO, fontSize: '9px', color: STYLES.ink,
                  background: STYLES.bg, border: `1px solid ${STYLES.border}`,
                  padding: '2px 6px', cursor: 'pointer',
                }}>{cls}</button>
                {i < lineage.length - 1 && <ChevronDown size={8} color={STYLES.dim} style={{ transform: 'rotate(-90deg)' }} />}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      {/* outgoing */}
      <div style={{ padding: '12px 14px', borderBottom: `1px solid ${STYLES.border}` }}>
        <div style={{ fontFamily: MONO, fontSize: '9px', color: STYLES.accent, letterSpacing: '0.15em', marginBottom: '8px' }}>
          OUTGOING · {outs.length}
        </div>
        {outs.length === 0 && <div style={{ fontFamily: MONO, fontSize: '10px', color: STYLES.dim, fontStyle: 'italic' }}>—</div>}
        {outs.slice(0, 40).map((e, i) => {
          const target = NODE_BY_ID.get(e.o);
          if (!target) return null;
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '3px 0' }}>
              <div style={{ fontFamily: MONO, fontSize: '9px', color: STYLES.muted, minWidth: '110px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {e.p}
              </div>
              <div style={{ width: '4px', height: '4px', background: colorOf(target), flexShrink: 0 }} />
              <div
                onClick={() => onSelect(target.id)}
                style={{
                  fontFamily: MONO, fontSize: '10px', color: STYLES.ink,
                  cursor: 'pointer', flex: 1, whiteSpace: 'nowrap',
                  overflow: 'hidden', textOverflow: 'ellipsis',
                }}
              >
                {target.label}
              </div>
            </div>
          );
        })}
        {outs.length > 40 && <div style={{ fontFamily: MONO, fontSize: '9px', color: STYLES.dim, marginTop: '4px' }}>+ {outs.length - 40} more</div>}
      </div>

      {/* incoming */}
      <div style={{ padding: '12px 14px' }}>
        <div style={{ fontFamily: MONO, fontSize: '9px', color: STYLES.accent2, letterSpacing: '0.15em', marginBottom: '8px' }}>
          INCOMING · {ins.length}
        </div>
        {ins.length === 0 && <div style={{ fontFamily: MONO, fontSize: '10px', color: STYLES.dim, fontStyle: 'italic' }}>—</div>}
        {ins.slice(0, 40).map((e, i) => {
          const source = NODE_BY_ID.get(e.s);
          if (!source) return null;
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '3px 0' }}>
              <div style={{ width: '4px', height: '4px', background: colorOf(source), flexShrink: 0 }} />
              <div
                onClick={() => onSelect(source.id)}
                style={{
                  fontFamily: MONO, fontSize: '10px', color: STYLES.ink,
                  cursor: 'pointer', minWidth: '90px', whiteSpace: 'nowrap',
                  overflow: 'hidden', textOverflow: 'ellipsis',
                }}
              >
                {source.label}
              </div>
              <div style={{ fontFamily: MONO, fontSize: '9px', color: STYLES.muted, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                — {e.p} →
              </div>
            </div>
          );
        })}
        {ins.length > 40 && <div style={{ fontFamily: MONO, fontSize: '9px', color: STYLES.dim, marginTop: '4px' }}>+ {ins.length - 40} more</div>}
      </div>
    </div>
  );
}


// ============================================================================
// QUERY VIEW — triple pattern matching (SPO with wildcards)
// ============================================================================

function QueryView({ onSelect, setSeedIds, setMode }) {
  const ALL_PROPS = useMemo(() => [...new Set(EDGES.map(e => e.p))].sort(), []);
  const ALL_TYPES = useMemo(() => [...new Set(NODES.map(n => n.type).filter(Boolean))].sort(), []);

  const [sFilter, setSFilter] = useState({ type: '', ns: '', text: '' });
  const [pFilter, setPFilter] = useState('');
  const [oFilter, setOFilter] = useState({ type: '', ns: '', text: '' });

  const results = useMemo(() => {
    return EDGES.filter(e => {
      if (pFilter && e.p !== pFilter) return false;
      const s = NODE_BY_ID.get(e.s);
      const o = NODE_BY_ID.get(e.o);
      if (!s || !o) return false;
      if (sFilter.type && s.type !== sFilter.type) return false;
      if (sFilter.ns && s.group !== sFilter.ns) return false;
      if (sFilter.text && !(s.label + s.id).toLowerCase().includes(sFilter.text.toLowerCase())) return false;
      if (oFilter.type && o.type !== oFilter.type) return false;
      if (oFilter.ns && o.group !== oFilter.ns) return false;
      if (oFilter.text && !(o.label + o.id).toLowerCase().includes(oFilter.text.toLowerCase())) return false;
      return true;
    }).slice(0, 300);
  }, [sFilter, pFilter, oFilter]);

  const Examples = [
    { label: 'Chi supporta quali scopi?', apply: () => { setPFilter('ekb:supportsPurpose'); setSFilter({ type: '', ns: '', text: '' }); setOFilter({ type: 'ekb:Purpose', ns: '', text: '' }); } },
    { label: 'Processi eseguiti da BackOffice', apply: () => { setPFilter('proc:performedByRole'); setSFilter({ type: '', ns: 'proc', text: '' }); setOFilter({ type: '', ns: '', text: 'BackOffice' }); } },
    { label: 'Processi che usano Contract', apply: () => { setPFilter('proc:usesRecordType'); setSFilter({ type: '', ns: 'proc', text: '' }); setOFilter({ type: '', ns: '', text: 'Contract' }); } },
    { label: 'Integrazioni NetSuite → ?', apply: () => { setPFilter('int:hasTargetSystem'); setSFilter({ type: '', ns: '', text: '' }); setOFilter({ type: '', ns: '', text: '' }); } },
    { label: 'KPI su dashboard CFO', apply: () => { setPFilter('ux:hasKPI'); setSFilter({ type: '', ns: '', text: 'CFO' }); setOFilter({ type: '', ns: '', text: '' }); } },
    { label: 'Dimensioni del Control Model', apply: () => { setPFilter('ctrl:hasAnalyticalDimension'); setSFilter({ type: '', ns: '', text: '' }); setOFilter({ type: '', ns: '', text: '' }); } },
  ];

  const pushToGraph = () => {
    const seeds = [...new Set(results.flatMap(e => [e.s, e.o]))].slice(0, 15);
    setSeedIds(seeds);
    setMode('graph');
  };

  return (
    <div style={{ padding: '20px', height: '100%', overflowY: 'auto', fontFamily: MONO, color: STYLES.ink }}>
      <div style={{ fontSize: '10px', color: STYLES.muted, letterSpacing: '0.15em', marginBottom: '6px' }}>
        TRIPLE PATTERN QUERY · ?S ?P ?O
      </div>
      <div style={{ fontSize: '12px', color: STYLES.dim, marginBottom: '20px', lineHeight: 1.6 }}>
        Filter triples by subject, predicate and object constraints. An empty field means wildcard.
      </div>

      {/* Example queries */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '9px', color: STYLES.muted, letterSpacing: '0.15em', marginBottom: '6px' }}>EXAMPLES</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {Examples.map((ex, i) => (
            <button key={i} onClick={ex.apply} style={{
              padding: '5px 10px', background: STYLES.panel, border: `1px solid ${STYLES.border}`,
              color: STYLES.ink, fontFamily: MONO, fontSize: '10px', cursor: 'pointer',
            }}>{ex.label}</button>
          ))}
        </div>
      </div>

      {/* Three-column filter */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '20px' }}>
        {/* Subject */}
        <div style={{ background: STYLES.panel, border: `1px solid ${STYLES.border}`, borderTop: `3px solid ${STYLES.accent}`, padding: '12px' }}>
          <div style={{ fontSize: '9px', color: STYLES.accent, letterSpacing: '0.15em', marginBottom: '8px' }}>?SUBJECT</div>
          <input placeholder="text contains…" value={sFilter.text} onChange={e => setSFilter({...sFilter, text: e.target.value})} style={inputStyle} />
          <select value={sFilter.ns} onChange={e => setSFilter({...sFilter, ns: e.target.value})} style={selectStyle}>
            <option value="">(any namespace)</option>
            {['ekb','org','proc','data','ctrl','erp','ux','tax','prj','int','iqt','res','owl'].map(x => <option key={x} value={x}>{x}:</option>)}
          </select>
          <select value={sFilter.type} onChange={e => setSFilter({...sFilter, type: e.target.value})} style={selectStyle}>
            <option value="">(any type)</option>
            {ALL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {/* Predicate */}
        <div style={{ background: STYLES.panel, border: `1px solid ${STYLES.border}`, borderTop: `3px solid ${STYLES.ink}`, padding: '12px' }}>
          <div style={{ fontSize: '9px', color: STYLES.ink, letterSpacing: '0.15em', marginBottom: '8px' }}>?PREDICATE</div>
          <select value={pFilter} onChange={e => setPFilter(e.target.value)} style={selectStyle}>
            <option value="">(any predicate)</option>
            {ALL_PROPS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <div style={{ fontSize: '9px', color: STYLES.dim, marginTop: '8px', lineHeight: 1.5 }}>
            {ALL_PROPS.length} distinct predicates in the graph.
          </div>
        </div>

        {/* Object */}
        <div style={{ background: STYLES.panel, border: `1px solid ${STYLES.border}`, borderTop: `3px solid ${STYLES.accent2}`, padding: '12px' }}>
          <div style={{ fontSize: '9px', color: STYLES.accent2, letterSpacing: '0.15em', marginBottom: '8px' }}>?OBJECT</div>
          <input placeholder="text contains…" value={oFilter.text} onChange={e => setOFilter({...oFilter, text: e.target.value})} style={inputStyle} />
          <select value={oFilter.ns} onChange={e => setOFilter({...oFilter, ns: e.target.value})} style={selectStyle}>
            <option value="">(any namespace)</option>
            {['ekb','org','proc','data','ctrl','erp','ux','tax','prj','int','iqt','res','owl'].map(x => <option key={x} value={x}>{x}:</option>)}
          </select>
          <select value={oFilter.type} onChange={e => setOFilter({...oFilter, type: e.target.value})} style={selectStyle}>
            <option value="">(any type)</option>
            {ALL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {/* Results toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
        <div style={{ fontSize: '9px', color: STYLES.muted, letterSpacing: '0.15em' }}>
          RESULTS · {results.length}{results.length >= 300 ? '+' : ''}
        </div>
        {results.length > 0 && (
          <button onClick={pushToGraph} style={{
            padding: '4px 10px', background: STYLES.accent, color: STYLES.bg,
            border: 'none', cursor: 'pointer', fontFamily: MONO, fontSize: '9px',
            letterSpacing: '0.12em', fontWeight: 600,
          }}>
            <Crosshair size={10} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
            SEND TO GRAPH
          </button>
        )}
      </div>

      {/* Results table */}
      <div style={{ background: STYLES.panel, border: `1px solid ${STYLES.border}` }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px 1fr 40px', padding: '8px 12px', borderBottom: `1px solid ${STYLES.border}`, fontSize: '9px', color: STYLES.muted, letterSpacing: '0.15em', background: STYLES.bg }}>
          <div>SUBJECT</div><div>PREDICATE</div><div>OBJECT</div><div></div>
        </div>
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {results.map((e, i) => {
            const s = NODE_BY_ID.get(e.s);
            const o = NODE_BY_ID.get(e.o);
            if (!s || !o) return null;
            return (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '1fr 160px 1fr 40px',
                padding: '6px 12px', borderBottom: `1px solid ${STYLES.border}`,
                fontSize: '10px', alignItems: 'center',
              }}>
                <div onClick={() => onSelect(s.id)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  <div style={{ width: '6px', height: '6px', background: colorOf(s), flexShrink: 0 }} />
                  <span style={{ color: STYLES.ink }}>{s.label}</span>
                </div>
                <div style={{ color: STYLES.muted, fontSize: '9px' }}>{e.p}</div>
                <div onClick={() => onSelect(o.id)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  <div style={{ width: '6px', height: '6px', background: colorOf(o), flexShrink: 0 }} />
                  <span style={{ color: STYLES.ink }}>{o.label}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Crosshair
                    size={11} color={STYLES.muted}
                    style={{ cursor: 'pointer' }}
                    onClick={() => { setSeedIds([s.id, o.id]); setMode('graph'); }}
                  />
                </div>
              </div>
            );
          })}
          {results.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', color: STYLES.dim, fontSize: '11px', fontStyle: 'italic' }}>
              no triples match the pattern
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '6px 8px', background: STYLES.bg,
  border: `1px solid ${STYLES.border}`, color: STYLES.ink,
  fontFamily: MONO, fontSize: '11px', marginBottom: '6px', outline: 'none',
};
const selectStyle = {
  ...inputStyle, appearance: 'none',
};

// ============================================================================
// TRIPLES TABLE VIEW
// ============================================================================

function TriplesView({ onSelect }) {
  const [sort, setSort] = useState('p');
  const [filter, setFilter] = useState('');

  const rows = useMemo(() => {
    const qq = filter.toLowerCase();
    const filtered = filter
      ? EDGES.filter(e => {
          const s = NODE_BY_ID.get(e.s);
          const o = NODE_BY_ID.get(e.o);
          return e.p.toLowerCase().includes(qq) ||
                 (s?.label?.toLowerCase().includes(qq)) ||
                 (o?.label?.toLowerCase().includes(qq)) ||
                 e.s.toLowerCase().includes(qq) ||
                 e.o.toLowerCase().includes(qq);
        })
      : EDGES;
    const sorted = [...filtered].sort((a, b) => {
      if (sort === 's') return a.s.localeCompare(b.s);
      if (sort === 'o') return a.o.localeCompare(b.o);
      return a.p.localeCompare(b.p);
    });
    return sorted.slice(0, 1000);
  }, [sort, filter]);

  return (
    <div style={{ padding: '20px', height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', fontFamily: MONO, color: STYLES.ink }}>
      <div style={{ fontSize: '10px', color: STYLES.muted, letterSpacing: '0.15em', marginBottom: '6px' }}>
        RAW TRIPLE STORE · {EDGES.length} OBJECT-PROPERTY TRIPLES
      </div>
      <div style={{ fontSize: '12px', color: STYLES.dim, marginBottom: '14px', lineHeight: 1.6 }}>
        Flat view of all ?S ?P ?O assertions (data:hasField edges suppressed — 83 Employee-Field relations excluded from navigation).
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
        <input
          placeholder="filter triples…"
          value={filter} onChange={e => setFilter(e.target.value)}
          style={{ ...inputStyle, flex: 1, marginBottom: 0 }}
        />
        <div style={{ display: 'flex', gap: '2px' }}>
          {['s','p','o'].map(k => (
            <button key={k} onClick={() => setSort(k)} style={{
              padding: '6px 10px', background: sort === k ? STYLES.accent : STYLES.panel,
              color: sort === k ? STYLES.bg : STYLES.muted, fontFamily: MONO,
              border: `1px solid ${STYLES.border}`, cursor: 'pointer',
              fontSize: '10px', letterSpacing: '0.12em', fontWeight: 600,
            }}>SORT ?{k.toUpperCase()}</button>
          ))}
        </div>
        <div style={{ fontSize: '10px', color: STYLES.muted }}>{rows.length} / {EDGES.length}</div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', border: `1px solid ${STYLES.border}` }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 180px 1fr',
          padding: '8px 12px', background: STYLES.bg,
          borderBottom: `1px solid ${STYLES.border}`, fontSize: '9px',
          color: STYLES.muted, letterSpacing: '0.15em',
          position: 'sticky', top: 0, zIndex: 1,
        }}>
          <div>?SUBJECT</div><div>?PREDICATE</div><div>?OBJECT</div>
        </div>
        {rows.map((e, i) => {
          const s = NODE_BY_ID.get(e.s);
          const o = NODE_BY_ID.get(e.o);
          if (!s || !o) return null;
          return (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '1fr 180px 1fr',
              padding: '4px 12px', fontSize: '10px',
              borderBottom: `1px solid ${STYLES.border}`,
              background: i % 2 === 0 ? STYLES.panel : STYLES.bg,
            }}>
              <div onClick={() => onSelect(s.id)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                <div style={{ width: '5px', height: '5px', background: colorOf(s), flexShrink: 0 }} />
                <span>{s.id}</span>
              </div>
              <div style={{ color: STYLES.muted }}>{e.p}</div>
              <div onClick={() => onSelect(o.id)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                <div style={{ width: '5px', height: '5px', background: colorOf(o), flexShrink: 0 }} />
                <span>{o.id}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// SCHEMA VIEW — class hierarchy
// ============================================================================

function SchemaView({ onSelect }) {
  // Build class tree from rdfs:subClassOf edges
  const classes = useMemo(() => NODES.filter(n => n.isClass), []);
  const classIds = new Set(classes.map(c => c.id));
  const subClassEdges = EDGES.filter(e => e.p === 'rdfs:subClassOf' && classIds.has(e.s) && classIds.has(e.o));
  const parentOf = new Map(subClassEdges.map(e => [e.s, e.o]));
  const childrenOf = new Map();
  for (const e of subClassEdges) {
    if (!childrenOf.has(e.o)) childrenOf.set(e.o, []);
    childrenOf.get(e.o).push(e.s);
  }
  const roots = classes.filter(c => !parentOf.has(c.id));

  const [expanded, setExpanded] = useState(() => new Set(roots.map(r => r.id)));
  const toggle = (id) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const renderClass = (id, depth = 0) => {
    const cls = NODE_BY_ID.get(id);
    if (!cls) return null;
    const children = childrenOf.get(id) || [];
    const isExpanded = expanded.has(id);
    const c = colorOf(cls);
    // count individuals of this class
    const individuals = NODES.filter(n => n.type === id).length;
    return (
      <div key={id}>
        <div
          onClick={() => children.length > 0 && toggle(id)}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '4px 10px', paddingLeft: (depth * 16 + 10) + 'px',
            cursor: children.length > 0 ? 'pointer' : 'default',
            borderBottom: `1px solid ${STYLES.border}`,
            fontFamily: MONO, fontSize: '11px',
          }}
        >
          {children.length > 0 ? (
            <ChevronDown size={10} color={STYLES.muted} style={{ transform: isExpanded ? 'none' : 'rotate(-90deg)', flexShrink: 0 }} />
          ) : (
            <div style={{ width: '10px', flexShrink: 0 }} />
          )}
          <div style={{ width: '8px', height: '8px', background: c, borderRadius: '2px', flexShrink: 0 }} />
          <div
            onClick={(e) => { e.stopPropagation(); onSelect(id); }}
            style={{ color: STYLES.ink, flex: 1, cursor: 'pointer' }}
          >{cls.label}</div>
          <div style={{ fontSize: '9px', color: STYLES.dim, letterSpacing: '0.1em' }}>
            {cls.id}
            {individuals > 0 && <span style={{ color: STYLES.accent, marginLeft: '8px' }}>{individuals} inst.</span>}
            {children.length > 0 && <span style={{ color: STYLES.muted, marginLeft: '8px' }}>{children.length} sub.</span>}
          </div>
        </div>
        {isExpanded && children.map(cid => renderClass(cid, depth + 1))}
      </div>
    );
  };

  return (
    <div style={{ padding: '20px', height: '100%', overflowY: 'auto', fontFamily: MONO, color: STYLES.ink }}>
      <div style={{ fontSize: '10px', color: STYLES.muted, letterSpacing: '0.15em', marginBottom: '6px' }}>
        CLASS HIERARCHY · {classes.length} NAMED CLASSES · {subClassEdges.length} rdfs:subClassOf
      </div>
      <div style={{ fontSize: '12px', color: STYLES.dim, marginBottom: '20px', lineHeight: 1.6 }}>
        T-Box of the ontology. Everything else is A-Box (individuals typed by these classes).
      </div>

      <div style={{ background: STYLES.panel, border: `1px solid ${STYLES.border}` }}>
        {roots.sort((a, b) => a.id.localeCompare(b.id)).map(r => renderClass(r.id, 0))}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN APP
// ============================================================================

export default function GraphExplorer() {
  const [mode, setMode] = useState('graph');
  const [hiddenNs, setHiddenNs] = useState(() => new Set());
  const [seedIds, setSeedIds] = useState(() => ['erp:OracleNetSuite']);
  const [selectedId, setSelectedId] = useState(null);

  const toggleNs = (ns) => {
    setHiddenNs(prev => {
      const next = new Set(prev);
      if (next.has(ns)) next.delete(ns); else next.add(ns);
      return next;
    });
  };

  const onSelect = (id) => setSelectedId(id);
  const addSeed = (id) => {
    setSeedIds(prev => prev.includes(id) ? prev : [...prev, id]);
    setMode('graph');
  };

  // visible count for header
  const visibleCount = useMemo(() => {
    if (mode !== 'graph') return NODES.length;
    const set = new Set();
    for (const id of seedIds) {
      const n = NODE_BY_ID.get(id);
      if (!n || hiddenNs.has(n.group)) continue;
      set.add(id);
      neighborsOf(id).forEach(nid => {
        const nn = NODE_BY_ID.get(nid);
        if (nn && !hiddenNs.has(nn.group)) set.add(nid);
      });
    }
    return set.size;
  }, [mode, seedIds, hiddenNs]);

  return (
    <div style={{
      width: '100vw', height: '100vh', background: STYLES.bg, color: STYLES.ink,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: ${STYLES.bg}; }
        ::-webkit-scrollbar-thumb { background: ${STYLES.border2}; }
        ::-webkit-scrollbar-thumb:hover { background: ${STYLES.muted}; }
        input::placeholder { color: ${STYLES.dim}; }
        select option { background: ${STYLES.bg}; color: ${STYLES.ink}; }
      `}</style>

      <Header mode={mode} setMode={setMode} visibleCount={visibleCount} totalCount={NODES.length} />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <LeftSidebar
          hiddenNs={hiddenNs} toggleNs={toggleNs}
          seedIds={seedIds} setSeedIds={setSeedIds}
          onSelect={onSelect} selectedId={selectedId}
        />

        <div style={{ flex: 1, minWidth: 0, position: 'relative', overflow: 'hidden' }}>
          {mode === 'graph' && (
            <GraphCanvas
              seedIds={seedIds}
              hiddenNs={hiddenNs}
              onSelect={onSelect}
              selectedId={selectedId}
            />
          )}
          {mode === 'query' && <QueryView onSelect={onSelect} setSeedIds={setSeedIds} setMode={setMode} />}
          {mode === 'triples' && <TriplesView onSelect={onSelect} />}
          {mode === 'schema' && <SchemaView onSelect={onSelect} />}
        </div>

        {(mode === 'graph' || mode === 'query' || mode === 'triples' || mode === 'schema') && (
          <Inspector selectedId={selectedId} onSelect={onSelect} addSeed={addSeed} />
        )}
      </div>
    </div>
  );
}
