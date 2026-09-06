import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { OPERATION_DEF, ENTITY_DEFS } from '../model/model.js';

/** Nodo Operazione (processo di trasformazione) con badge delle risorse. */
export function OperationNode({ data, selected }) {
  return (
    <div className={`opnode ${selected ? 'opnode--selected' : ''}`}>
      <Handle type="target" position={Position.Left} className="h" />
      <div className="opnode__head">
        <span>{OPERATION_DEF.icon}</span>
        <span className="opnode__ptype">{data.processType || 'Operazione'}</span>
      </div>
      <div className="opnode__title">{data.label}</div>
      {data.badges?.length > 0 && (
        <div className="opnode__badges">
          {data.badges.map((b, i) => (
            <span key={i} className="opbadge" style={{ '--c': b.color }} title={b.title}>
              {b.icon} {b.text}
            </span>
          ))}
        </div>
      )}
      <Handle type="source" position={Position.Right} className="h" />
    </div>
  );
}

/** Nodo Materiale: componente in ingresso (raw) o prodotto (finished). */
export function MaterialNode({ data, selected }) {
  const def = ENTITY_DEFS.component;
  const role = data.role === 'finished' ? 'finished' : 'raw';
  return (
    <div className={`matnode matnode--${role} ${selected ? 'matnode--selected' : ''}`}>
      <Handle type="target" position={Position.Left} className="h" />
      <div className="matnode__role">{role === 'finished' ? 'Prodotto' : 'Materia'}</div>
      <div className="matnode__title">{def.icon} {data.label}</div>
      {data.sublabel && <div className="matnode__code">{data.sublabel}</div>}
      <Handle type="source" position={Position.Right} className="h" />
    </div>
  );
}

export const nodeTypes = { operation: OperationNode, material: MaterialNode };
