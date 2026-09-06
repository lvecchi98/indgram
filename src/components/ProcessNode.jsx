import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { NODE_TYPES } from '../model/schema.js';

const SIDE_TO_POSITION = {
  left: Position.Left,
  right: Position.Right,
  top: Position.Top,
  bottom: Position.Bottom,
};

/**
 * Nodo generico multi-tipo. La geometria dei "handle" (punti di connessione)
 * rispetta la semantica ICOM di IDEF0 per i processi:
 *   Input a sinistra, Control in alto, Output a destra, Mechanism in basso.
 */
export default function ProcessNode({ data, selected }) {
  const def = NODE_TYPES[data.typeKey] || NODE_TYPES.process;
  const handles = Object.entries(def.handles || {});

  return (
    <div
      className={`node node--${def.key} ${selected ? 'node--selected' : ''}`}
      style={{ '--node-color': def.color }}
    >
      <div className="node__header">
        <span className="node__icon">{def.icon}</span>
        <span className="node__type">{def.short}</span>
      </div>
      <div className="node__title">{data.name || 'Senza nome'}</div>
      {data.subtitle && <div className="node__subtitle">{data.subtitle}</div>}

      {handles.map(([id, h]) => {
        const pos = SIDE_TO_POSITION[h.side];
        // I lati sinistro/alto sono target di default, destro/basso source;
        // ma li rendiamo tutti bidirezionali per la massima flessibilità.
        return (
          <React.Fragment key={id}>
            <Handle
              id={`${id}__t`}
              type="target"
              position={pos}
              className="node__handle"
              title={h.label}
            />
            <Handle
              id={`${id}__s`}
              type="source"
              position={pos}
              className="node__handle"
              title={h.label}
            />
          </React.Fragment>
        );
      })}
    </div>
  );
}
