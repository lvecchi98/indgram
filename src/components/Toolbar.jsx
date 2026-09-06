import React, { useRef } from 'react';

export default function Toolbar({ title, onTitle, onNewOperation, onExport, onImport, onLoadSample, onClear }) {
  const fileRef = useRef();
  return (
    <header className="toolbar">
      <div className="toolbar__brand">
        <span className="toolbar__logo">⬡ Indgram</span>
        <input className="toolbar__title" value={title} onChange={(e) => onTitle(e.target.value)} />
      </div>
      <button className="btn btn--primary btn--new" onClick={onNewOperation}>➕ Nuova operazione</button>
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
