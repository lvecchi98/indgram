import React from 'react';

/** Barra di navigazione tra i livelli di decomposizione (frame). */
export default function Breadcrumb({ path, onNavigate }) {
  return (
    <nav className="breadcrumb">
      {path.map((p, i) => (
        <React.Fragment key={p.frameId}>
          {i > 0 && <span className="breadcrumb__sep">›</span>}
          <button
            className={`breadcrumb__item ${i === path.length - 1 ? 'is-current' : ''}`}
            onClick={() => onNavigate(p.frameId)}
          >
            {i === 0 ? '🏠 ' : ''}{p.label}
          </button>
        </React.Fragment>
      ))}
    </nav>
  );
}
