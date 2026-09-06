import React, { useMemo, useState } from 'react';
import { ENTITY_DEFS, ENTITY_KINDS, listEntities, entityLabel } from '../model/model.js';

/**
 * Anagrafica delle entità "viventi": elenca componenti, impianti, attrezzature,
 * operatori e aree. Cliccando un elemento lo si apre nell'Inspector per
 * editarne i metadati (che restano condivisi da tutte le operazioni).
 */
export default function RegistryPanel({ model, selection, onSelect, onCreate }) {
  const [q, setQ] = useState('');
  const term = q.trim().toLowerCase();

  const filtered = useMemo(() => {
    const out = {};
    for (const kind of ENTITY_KINDS) {
      out[kind] = listEntities(model, kind).filter((e) =>
        !term || entityLabel(e).toLowerCase().includes(term) || JSON.stringify(e.meta || {}).toLowerCase().includes(term));
    }
    return out;
  }, [model, term]);

  return (
    <aside className="registry">
      <div className="registry__title">Anagrafica entità</div>
      <input className="registry__search" placeholder="🔍 Cerca…" value={q} onChange={(e) => setQ(e.target.value)} />
      {ENTITY_KINDS.map((kind) => {
        const def = ENTITY_DEFS[kind];
        const items = filtered[kind];
        return (
          <div className="regsec" key={kind} style={{ '--c': def.color }}>
            <div className="regsec__head">
              <span>{def.icon} {def.label} <em>({items.length})</em></span>
              <button className="mini" onClick={() => {
                const name = window.prompt(`Nome ${def.short.toLowerCase()}:`);
                if (name && name.trim()) onSelect('entity', kind, onCreate(kind, name.trim()));
              }}>＋</button>
            </div>
            {items.map((it) => (
              <button key={it.id}
                className={`regitem ${selection?.type === 'entity' && selection.id === it.id ? 'is-on' : ''}`}
                onClick={() => onSelect('entity', kind, it.id)}>
                <span className="regdot" />{entityLabel(it)}
              </button>
            ))}
          </div>
        );
      })}
    </aside>
  );
}
