import React, { useState } from 'react';
import { ENTITY_DEFS, OPERATION_DEF, OPERATION_FIELDS, getEntity, entityLabel } from '../model/model.js';

/**
 * Pannello dei dettagli. Mostra i metadati "viventi" dell'entità selezionata
 * (componente, impianto, attrezzatura, operatore, area) oppure il riepilogo
 * di un'operazione, con azioni di modifica/eliminazione.
 */
export default function Inspector({ selection, model, onEditOperation, onDeleteOperation,
  onChangeEntity, onDeleteEntity, onFocusEntity }) {
  if (!selection) {
    return <aside className="inspector inspector--empty">
      <p>Seleziona un nodo per vederne i metadati.</p>
      <p className="hint">Usa <b>➕ Nuova operazione</b> per aggiungere un passo di processo:
        scegli input, output, impianto, attrezzature e operatori da menù. Il diagramma si
        genera da solo. Cambia <b>vista</b> in alto per filtrare per componente, impianto o attrezzatura.</p>
    </aside>;
  }

  if (selection.type === 'operation') {
    return <OperationInspector op={model.operations.find((o) => o.id === selection.id)}
      model={model} onEdit={onEditOperation} onDelete={onDeleteOperation} onFocusEntity={onFocusEntity} />;
  }
  return <EntityInspector kind={selection.kind} id={selection.id} model={model}
    onChange={onChangeEntity} onDelete={onDeleteEntity} />;
}

function OperationInspector({ op, model, onEdit, onDelete, onFocusEntity }) {
  if (!op) return <aside className="inspector inspector--empty"><p>Operazione non trovata.</p></aside>;
  const compLabel = (id) => entityLabel(getEntity(model, 'component', id));
  const line = (label, val) => val ? <div className="kv"><span>{label}</span><b>{val}</b></div> : null;
  const chip = (kind, id) => id
    ? <button className="reflink" style={{ '--c': ENTITY_DEFS[kind].color }}
        onClick={() => onFocusEntity(kind, id)}>{ENTITY_DEFS[kind].icon} {entityLabel(getEntity(model, kind, id))}</button>
    : null;

  return (
    <aside className="inspector">
      <div className="inspector__head" style={{ '--node-color': OPERATION_DEF.color }}>
        <span className="inspector__badge">Operazione</span>
        <strong>{op.name}</strong>
        <small className="inspector__std">{op.processType} · 📚 {OPERATION_DEF.standard}</small>
      </div>

      <div className="inspector__section">Input → Output (IDEF0)</div>
      <div className="io">
        <div><div className="io__h">Input</div>
          {op.inputs?.length ? op.inputs.map((r, i) => <div key={i} className="io__row">🧩 {compLabel(r.componentId)} <em>{r.qty} {r.uom}</em></div>) : <em>—</em>}</div>
        <div><div className="io__h">Output</div>
          {op.outputs?.length ? op.outputs.map((r, i) => <div key={i} className="io__row">🧩 {compLabel(r.componentId)} <em>{r.qty} {r.uom}</em></div>) : <em>—</em>}</div>
      </div>

      <div className="inspector__section">Risorse (IDEF0 Mechanism)</div>
      <div className="reflinks">
        {chip('equipment', op.equipmentId)}
        {chip('area', op.areaId)}
        {(op.operatorIds || []).map((id) => <React.Fragment key={id}>{chip('operator', id)}</React.Fragment>)}
      </div>
      {(op.tooling || []).length > 0 && <>
        <div className="inspector__subsection">Attrezzature</div>
        {op.tooling.map((t, i) => (
          <div key={i} className="tool">
            {chip('tooling', t.toolingId)}
            {(t.serials || []).length > 0 && <div className="serials">Seriali: {t.serials.join(', ')}</div>}
          </div>
        ))}
      </>}

      <div className="inspector__section">Parametri</div>
      {OPERATION_FIELDS.filter((f) => op.meta?.[f.key] !== undefined && op.meta[f.key] !== '').map((f) => (
        <div className="kv" key={f.key}><span>{f.label}</span><b>{String(op.meta[f.key])}</b></div>
      ))}

      <button className="btn btn--primary" style={{ width: '100%', marginTop: 14 }} onClick={() => onEdit(op.id)}>✎ Modifica operazione</button>
      <button className="btn btn--danger" onClick={() => onDelete(op.id)}>Elimina operazione</button>
    </aside>
  );
}

function EntityInspector({ kind, id, model, onChange, onDelete }) {
  const def = ENTITY_DEFS[kind];
  const entity = getEntity(model, kind, id);
  if (!entity) return <aside className="inspector inspector--empty"><p>Entità non trovata.</p></aside>;
  const meta = entity.meta || {};
  const setMeta = (k, v) => onChange(kind, id, { meta: { ...meta, [k]: v } });
  const groups = def.fields.reduce((m, f) => { (m[f.group] ??= []).push(f); return m; }, {});

  return (
    <aside className="inspector">
      <div className="inspector__head" style={{ '--node-color': def.color }}>
        <span className="inspector__badge">{def.short}</span>
        <strong>{entityLabel(entity)}</strong>
        <small className="inspector__std">📚 {def.standard}</small>
      </div>
      <label className="field"><span>Nome</span>
        <input value={entity.name || ''} onChange={(e) => onChange(kind, id, { name: e.target.value })} /></label>
      {Object.entries(groups).map(([g, fields]) => (
        <React.Fragment key={g}>
          <div className="inspector__section">{g}</div>
          {fields.map((f) => <FieldEditor key={f.key} field={f} value={meta[f.key]} onChange={(v) => setMeta(f.key, v)} />)}
        </React.Fragment>
      ))}
      <button className="btn btn--danger" onClick={() => onDelete(kind, id)}>Elimina {def.short.toLowerCase()}</button>
    </aside>
  );
}

function FieldEditor({ field, value, onChange }) {
  const v = value ?? '';
  if (field.type === 'textarea')
    return <label className="field"><span>{field.label}</span><textarea rows={2} value={v} onChange={(e) => onChange(e.target.value)} /></label>;
  if (field.type === 'list')
    return <label className="field"><span>{field.label}</span>
      <textarea rows={2} value={Array.isArray(value) ? value.join('\n') : v}
        onChange={(e) => onChange(e.target.value.split('\n').map((s) => s.trim()).filter(Boolean))} /></label>;
  if (field.type === 'select')
    return <label className="field"><span>{field.label}</span>
      <select value={v} onChange={(e) => onChange(e.target.value)}>
        <option value="">—</option>{field.options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select></label>;
  if (field.type === 'boolean')
    return <label className="field field--inline"><input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} /><span>{field.label}</span></label>;
  return <label className="field"><span>{field.label}</span>
    <input type={field.type === 'number' ? 'number' : 'text'} value={v}
      onChange={(e) => onChange(field.type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value)} /></label>;
}
