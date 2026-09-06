import React, { useMemo, useState } from 'react';
import { NODE_TYPES } from '../model/schema.js';

/**
 * Indice/ricerca globale: scandaglia TUTTI i frame del documento e trova
 * nodi per nome, tipo o valore di metadato. Cliccando un risultato si
 * naviga al frame che lo contiene e lo si seleziona.
 */
export default function SearchPanel({ doc, onGoto }) {
  const [q, setQ] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const index = useMemo(() => {
    const rows = [];
    for (const [frameId, frame] of Object.entries(doc.frames)) {
      for (const n of frame.nodes) {
        rows.push({
          frameId, nodeId: n.id,
          typeKey: n.data.typeKey,
          name: n.data.name || '',
          hay: JSON.stringify(n.data).toLowerCase(),
        });
      }
    }
    return rows;
  }, [doc]);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    return index.filter((r) =>
      (!typeFilter || r.typeKey === typeFilter) &&
      (!term || r.hay.includes(term))
    ).slice(0, 100);
  }, [index, q, typeFilter]);

  const counts = useMemo(() => {
    const c = {};
    for (const r of index) c[r.typeKey] = (c[r.typeKey] || 0) + 1;
    return c;
  }, [index]);

  return (
    <div className="search">
      <input className="search__input" placeholder="🔍 Cerca per nome o metadato…"
        value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="search__filters">
        <button className={`tag ${!typeFilter ? 'is-on' : ''}`} onClick={() => setTypeFilter('')}>
          Tutti ({index.length})
        </button>
        {Object.values(NODE_TYPES).map((t) => (
          <button key={t.key} className={`tag ${typeFilter === t.key ? 'is-on' : ''}`}
            style={{ '--node-color': t.color }} onClick={() => setTypeFilter(t.key)}>
            {t.icon} {counts[t.key] || 0}
          </button>
        ))}
      </div>
      <ul className="search__results">
        {results.map((r) => {
          const def = NODE_TYPES[r.typeKey];
          return (
            <li key={`${r.frameId}:${r.nodeId}`}>
              <button onClick={() => onGoto(r.frameId, r.nodeId)} style={{ '--node-color': def?.color }}>
                <span className="search__dot" />
                <span className="search__name">{r.name || '(senza nome)'}</span>
                <span className="search__meta">{def?.short}</span>
              </button>
            </li>
          );
        })}
        {results.length === 0 && <li className="search__empty">Nessun risultato</li>}
      </ul>
    </div>
  );
}
