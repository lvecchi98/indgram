import React, { useRef } from 'react';
import { NODE_TYPES } from '../model/schema.js';

export default function Toolbar({ title, onTitle, onAddNode, onExport, onImport, onLoadSample, onClear }) {
  const fileRef = useRef();

  return (
    <header className="toolbar">
      <div className="toolbar__brand">
        <span className="toolbar__logo">⬡ Indgram</span>
        <input className="toolbar__title" value={title}
          onChange={(e) => onTitle(e.target.value)} />
      </div>

      <div className="toolbar__palette">
        <span className="toolbar__label">Aggiungi:</span>
        {Object.values(NODE_TYPES).map((t) => (
          <button key={t.key} className="chip" style={{ '--node-color': t.color }}
            onClick={() => onAddNode(t.key)} title={t.standard}>
            <span>{t.icon}</span> {t.short}
          </button>
        ))}
      </div>

      <div className="toolbar__actions">
        <button className="btn" onClick={onLoadSample}>Esempio</button>
        <button className="btn" onClick={onExport}>Esporta JSON</button>
        <button className="btn" onClick={() => fileRef.current.click()}>Importa JSON</button>
        <input ref={fileRef} type="file" accept="application/json" hidden
          onChange={(e) => { if (e.target.files[0]) onImport(e.target.files[0]); e.target.value = ''; }} />
        <button className="btn btn--ghost" onClick={onClear}>Svuota</button>
      </div>
    </header>
  );
}
