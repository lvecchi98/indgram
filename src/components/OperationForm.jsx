import React, { useState } from 'react';
import { ENTITY_DEFS, PROCESS_TYPES, OPERATION_FIELDS, listEntities, entityLabel } from '../model/model.js';

const blankOp = () => ({
  name: '', processType: '',
  inputs: [{ componentId: '', qty: 1, uom: 'pz' }],
  outputs: [{ componentId: '', qty: 1, uom: 'pz' }],
  equipmentId: '', tooling: [], operatorIds: [], areaId: '', meta: {},
});

/** Selettore di un'entità con opzione "crea nuovo" inline. */
function EntitySelect({ kind, value, onChange, model, onCreateEntity, allowEmpty = true }) {
  const items = listEntities(model, kind);
  const handle = (v) => {
    if (v === '__new__') {
      const name = window.prompt(`Nome ${ENTITY_DEFS[kind].short.toLowerCase()}:`);
      if (name && name.trim()) onChange(onCreateEntity(kind, name.trim()));
      return;
    }
    onChange(v || '');
  };
  return (
    <select value={value || ''} onChange={(e) => handle(e.target.value)}>
      {allowEmpty && <option value="">—</option>}
      {items.map((it) => <option key={it.id} value={it.id}>{entityLabel(it)}</option>)}
      <option value="__new__">➕ Crea nuovo…</option>
    </select>
  );
}

export default function OperationForm({ initial, model, onCreateEntity, onSave, onCancel }) {
  const [op, setOp] = useState(() => initial ? JSON.parse(JSON.stringify(initial)) : blankOp());

  const set = (patch) => setOp((o) => ({ ...o, ...patch }));
  const setMeta = (k, v) => setOp((o) => ({ ...o, meta: { ...o.meta, [k]: v } }));

  const setPort = (side, i, patch) => setOp((o) => {
    const arr = o[side].map((row, j) => (j === i ? { ...row, ...patch } : row));
    return { ...o, [side]: arr };
  });
  const addPort = (side) => setOp((o) => ({ ...o, [side]: [...o[side], { componentId: '', qty: 1, uom: 'pz' }] }));
  const rmPort = (side, i) => setOp((o) => ({ ...o, [side]: o[side].filter((_, j) => j !== i) }));

  const addTool = () => setOp((o) => ({ ...o, tooling: [...o.tooling, { toolingId: '', serials: [] }] }));
  const rmTool = (i) => setOp((o) => ({ ...o, tooling: o.tooling.filter((_, j) => j !== i) }));
  const setTool = (i, patch) => setOp((o) => ({ ...o, tooling: o.tooling.map((t, j) => (j === i ? { ...t, ...patch } : t)) }));

  const toggleOperator = (id) => setOp((o) => ({
    ...o, operatorIds: o.operatorIds.includes(id) ? o.operatorIds.filter((x) => x !== id) : [...o.operatorIds, id],
  }));

  const groups = OPERATION_FIELDS.reduce((m, f) => { (m[f.group] ??= []).push(f); return m; }, {});

  const save = () => {
    const clean = {
      ...op,
      inputs: op.inputs.filter((r) => r.componentId),
      outputs: op.outputs.filter((r) => r.componentId),
      tooling: op.tooling.filter((t) => t.toolingId),
    };
    if (!clean.name.trim()) { alert('Dai un nome all’operazione.'); return; }
    onSave(clean);
  };

  return (
    <div className="modal" onMouseDown={onCancel}>
      <div className="modal__panel" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal__head">
          <strong>{initial ? 'Modifica operazione' : 'Nuova operazione'}</strong>
          <button className="modal__x" onClick={onCancel}>✕</button>
        </div>

        <div className="modal__body">
          <div className="frow">
            <label className="field"><span>Nome operazione *</span>
              <input value={op.name} onChange={(e) => set({ name: e.target.value })} autoFocus /></label>
            <label className="field"><span>Tipo trasformazione</span>
              <select value={op.processType} onChange={(e) => set({ processType: e.target.value })}>
                <option value="">—</option>
                {PROCESS_TYPES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select></label>
          </div>

          {/* INPUT / OUTPUT (IDEF0 I/O) */}
          <div className="ports">
            <Port title="Input (componenti in ingresso)" side="inputs" rows={op.inputs}
              {...{ model, onCreateEntity, setPort, addPort, rmPort }} />
            <Port title="Output (componenti prodotti)" side="outputs" rows={op.outputs}
              {...{ model, onCreateEntity, setPort, addPort, rmPort }} />
          </div>

          {/* RISORSE (IDEF0 Mechanism) */}
          <div className="section">Risorse</div>
          <div className="frow">
            <label className="field"><span>🏭 Impianto</span>
              <EntitySelect kind="equipment" value={op.equipmentId} model={model}
                onCreateEntity={onCreateEntity} onChange={(v) => set({ equipmentId: v })} /></label>
            <label className="field"><span>📍 Area / Reparto</span>
              <EntitySelect kind="area" value={op.areaId} model={model}
                onCreateEntity={onCreateEntity} onChange={(v) => set({ areaId: v })} /></label>
          </div>

          {/* Attrezzature con seriali */}
          <div className="subsection">🔧 Attrezzature
            <button className="mini" onClick={addTool}>+ aggiungi</button></div>
          {op.tooling.map((t, i) => (
            <div className="frow frow--tool" key={i}>
              <EntitySelect kind="tooling" value={t.toolingId} model={model}
                onCreateEntity={onCreateEntity} onChange={(v) => setTool(i, { toolingId: v })} />
              <input placeholder="seriali (separati da virgola)" value={(t.serials || []).join(', ')}
                onChange={(e) => setTool(i, { serials: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} />
              <button className="mini mini--x" onClick={() => rmTool(i)}>✕</button>
            </div>
          ))}

          {/* Operatori */}
          <div className="subsection">👤 Operatori</div>
          <div className="chips">
            {listEntities(model, 'operator').map((o) => (
              <label key={o.id} className={`selchip ${op.operatorIds.includes(o.id) ? 'is-on' : ''}`}>
                <input type="checkbox" checked={op.operatorIds.includes(o.id)}
                  onChange={() => toggleOperator(o.id)} hidden />
                {entityLabel(o)}
              </label>
            ))}
            <button className="mini" onClick={() => {
              const name = window.prompt('Nome operatore:');
              if (name && name.trim()) toggleOperator(onCreateEntity('operator', name.trim()));
            }}>➕ nuovo</button>
          </div>

          {/* Parametri */}
          <div className="section">Parametri</div>
          {Object.entries(groups).map(([g, fields]) => (
            <React.Fragment key={g}>
              <div className="subsection">{g}</div>
              <div className="fgrid">
                {fields.map((f) => (
                  <label className="field" key={f.key}><span>{f.label}</span>
                    {f.type === 'textarea'
                      ? <textarea rows={2} value={op.meta[f.key] ?? ''} onChange={(e) => setMeta(f.key, e.target.value)} />
                      : <input type={f.type === 'number' ? 'number' : 'text'} value={op.meta[f.key] ?? ''}
                          onChange={(e) => setMeta(f.key, f.type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value)} />}
                  </label>
                ))}
              </div>
            </React.Fragment>
          ))}
        </div>

        <div className="modal__foot">
          <button className="btn" onClick={onCancel}>Annulla</button>
          <button className="btn btn--primary" onClick={save}>{initial ? 'Salva modifiche' : 'Crea operazione'}</button>
        </div>
      </div>
    </div>
  );
}

function Port({ title, side, rows, model, onCreateEntity, setPort, addPort, rmPort }) {
  return (
    <div className="port">
      <div className="subsection">{title}
        <button className="mini" onClick={() => addPort(side)}>+ aggiungi</button></div>
      {rows.map((r, i) => (
        <div className="frow frow--port" key={i}>
          <EntitySelect kind="component" value={r.componentId} model={model}
            onCreateEntity={onCreateEntity} onChange={(v) => setPort(side, i, { componentId: v })} />
          <input className="qty" type="number" value={r.qty ?? ''} title="quantità"
            onChange={(e) => setPort(side, i, { qty: e.target.value === '' ? '' : Number(e.target.value) })} />
          <input className="uom" value={r.uom ?? ''} title="unità"
            onChange={(e) => setPort(side, i, { uom: e.target.value })} />
          <button className="mini mini--x" onClick={() => rmPort(side, i)}>✕</button>
        </div>
      ))}
    </div>
  );
}
