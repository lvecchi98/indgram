import React, { useRef } from 'react';

export default function Toolbar({
  title, onTitle, projects, currentId,
  onSelectProject, onNewProject, onDuplicateProject, onDeleteProject,
  onNewOperation, onExport, onImport, onLoadSample, onClear,
}) {
  const fileRef = useRef();
  return (
    <header className="toolbar">
      <div className="toolbar__brand">
        <span className="toolbar__logo">⬡ Indgram</span>
      </div>

      <div className="toolbar__project" title="Progetti salvati in questo browser">
        <span className="toolbar__pico">🗂</span>
        <select className="toolbar__select" value={currentId || ''}
          onChange={(e) => onSelectProject(e.target.value)}>
          {(projects || []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <button className="mini" onClick={onNewProject} title="Nuovo progetto">＋</button>
        <button className="mini" onClick={onDuplicateProject} title="Duplica progetto">⧉</button>
        <button className="mini mini--x" onClick={onDeleteProject} title="Elimina progetto">🗑</button>
      </div>

      <input className="toolbar__title" value={title} onChange={(e) => onTitle(e.target.value)}
        title="Nome del progetto corrente" />

      <button className="btn btn--primary btn--new" onClick={onNewOperation}>➕ Nuova operazione</button>

      <div className="toolbar__actions">
        <span className="toolbar__saved" title="Le modifiche sono salvate automaticamente in questo browser">✓ salvataggio automatico</span>
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
