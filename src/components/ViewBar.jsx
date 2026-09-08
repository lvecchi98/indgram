import React from 'react';
import { ENTITY_DEFS, listEntities, entityLabel } from '../model/model.js';

export const VIEWS = [
  { key: 'flow', label: 'Flusso completo', icon: '🔀', targetKind: null },
  { key: 'component', label: 'Per componente', icon: '🧩', targetKind: 'component' },
  { key: 'equipment', label: 'Per impianto', icon: '🏭', targetKind: 'equipment' },
  { key: 'tooling', label: 'Per attrezzatura', icon: '🔧', targetKind: 'tooling' },
  { key: 'operator', label: 'Per operatore', icon: '👤', targetKind: 'operator' },
  { key: 'area', label: 'Per area', icon: '📍', targetKind: 'area' },
];

/** Selettore della vista (proiezione) e del suo bersaglio. */
export default function ViewBar({ view, target, onView, onTarget, model }) {
  const current = VIEWS.find((v) => v.key === view) || VIEWS[0];
  const items = current.targetKind ? listEntities(model, current.targetKind) : [];

  return (
    <div className="viewbar">
      <div className="viewbar__tabs">
        {VIEWS.map((v) => (
          <button key={v.key} className={`vtab ${v.key === view ? 'is-on' : ''}`}
            onClick={() => onView(v.key)}>{v.icon} {v.label}</button>
        ))}
      </div>
      {current.targetKind && (
        <div className="viewbar__target">
          <span>{ENTITY_DEFS[current.targetKind].icon} {ENTITY_DEFS[current.targetKind].short}:</span>
          <select value={target || ''} onChange={(e) => onTarget(e.target.value)}>
            <option value="">— seleziona —</option>
            {items.map((it) => <option key={it.id} value={it.id}>{entityLabel(it)}</option>)}
          </select>
        </div>
      )}
    </div>
  );
}
