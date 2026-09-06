import React, { useState } from 'react';
import { NODE_TYPES, EDGE_TYPES, COMMON_ENTITY_FIELDS } from '../model/schema.js';

/**
 * Pannello laterale che edita i metadati dell'entità selezionata (nodo o arco).
 * Mostra i "campi noti" derivati dallo standard + campi liberi arbitrari,
 * così ogni entità è totalmente personalizzabile.
 */
export default function Inspector({ selection, onChange, onDelete, onEnter }) {
  const [newKey, setNewKey] = useState('');

  if (!selection) {
    return (
      <aside className="inspector inspector--empty">
        <p>Seleziona un nodo o un collegamento per vederne e modificarne i metadati.</p>
        <p className="hint">Doppio click sul canvas non è necessario: usa la palette a
          sinistra per aggiungere entità, poi trascina dai bordi per collegarle.</p>
      </aside>
    );
  }

  const isEdge = selection.kind === 'edge';
  const entity = selection.data;
  const typeKey = entity.data.typeKey;
  const def = isEdge ? EDGE_TYPES[typeKey] : NODE_TYPES[typeKey];
  const fields = def?.fields || [];
  const meta = entity.data.meta || {};

  const setMeta = (key, value) => {
    onChange({ ...entity, data: { ...entity.data, meta: { ...meta, [key]: value } } });
  };
  const setName = (value) => {
    onChange({ ...entity, data: { ...entity.data, name: value } });
  };
  const setTypeKey = (value) => {
    onChange({ ...entity, data: { ...entity.data, typeKey: value } });
  };

  const knownKeys = new Set([...fields, ...COMMON_ENTITY_FIELDS].map((f) => f.key));
  const extraKeys = Object.keys(meta).filter((k) => !knownKeys.has(k));

  const addField = () => {
    const k = newKey.trim();
    if (!k) return;
    setMeta(k, '');
    setNewKey('');
  };

  return (
    <aside className="inspector">
      <div className="inspector__head" style={{ '--node-color': def?.color }}>
        <span className="inspector__badge">{isEdge ? 'Collegamento' : 'Nodo'}</span>
        <strong>{def?.label}</strong>
        <small className="inspector__std">📚 {def?.standard}</small>
      </div>

      {!isEdge && (
        <label className="field">
          <span>Nome</span>
          <input value={entity.data.name || ''} onChange={(e) => setName(e.target.value)} />
        </label>
      )}

      <label className="field">
        <span>Tipo</span>
        <select value={typeKey} onChange={(e) => setTypeKey(e.target.value)}>
          {Object.values(isEdge ? EDGE_TYPES : NODE_TYPES).map((t) => (
            <option key={t.key} value={t.key}>{t.label}</option>
          ))}
        </select>
      </label>

      <div className="inspector__section">Campi standard</div>
      {fields.map((f) => (
        <FieldEditor key={f.key} field={f} value={meta[f.key]} onChange={(v) => setMeta(f.key, v)} />
      ))}

      <div className="inspector__section">Campi comuni</div>
      {COMMON_ENTITY_FIELDS.map((f) => (
        <FieldEditor key={f.key} field={f} value={meta[f.key]} onChange={(v) => setMeta(f.key, v)} />
      ))}

      {extraKeys.length > 0 && <div className="inspector__section">Campi personalizzati</div>}
      {extraKeys.map((k) => (
        <FieldEditor key={k} field={{ key: k, label: k, type: 'text' }}
          value={meta[k]} onChange={(v) => setMeta(k, v)} />
      ))}

      {!isEdge && typeKey === 'process' && onEnter && (
        <button className="btn btn--enter" onClick={onEnter}>
          ⤵ {entity.data.frameId ? 'Apri decomposizione' : 'Crea sotto-diagramma'}
        </button>
      )}

      <div className="inspector__addfield">
        <input placeholder="nuovo_campo" value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addField()} />
        <button onClick={addField}>+ Aggiungi campo</button>
      </div>

      <button className="btn btn--danger" onClick={() => onDelete(selection)}>
        Elimina {isEdge ? 'collegamento' : 'nodo'}
      </button>
    </aside>
  );
}

function FieldEditor({ field, value, onChange }) {
  const v = value ?? '';
  if (field.type === 'textarea') {
    return (
      <label className="field">
        <span>{field.label}</span>
        <textarea value={v} onChange={(e) => onChange(e.target.value)} rows={2} />
      </label>
    );
  }
  if (field.type === 'select') {
    return (
      <label className="field">
        <span>{field.label}</span>
        <select value={v} onChange={(e) => onChange(e.target.value)}>
          <option value="">—</option>
          {field.options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </label>
    );
  }
  if (field.type === 'boolean') {
    return (
      <label className="field field--inline">
        <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} />
        <span>{field.label}</span>
      </label>
    );
  }
  return (
    <label className="field">
      <span>{field.label}</span>
      <input type={field.type === 'number' ? 'number' : 'text'} value={v}
        onChange={(e) => onChange(field.type === 'number'
          ? (e.target.value === '' ? '' : Number(e.target.value))
          : e.target.value)} />
    </label>
  );
}
