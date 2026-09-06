import React, { useCallback, useMemo, useState } from 'react';
import {
  ReactFlow, Background, Controls, MiniMap,
  addEdge, applyNodeChanges, applyEdgeChanges,
  useReactFlow, MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import ProcessNode from './components/ProcessNode.jsx';
import Inspector from './components/Inspector.jsx';
import Toolbar from './components/Toolbar.jsx';
import { NODE_TYPES, EDGE_TYPES, SCHEMA_VERSION } from './model/schema.js';
import { sampleDiagram } from './data/sample.js';

const nodeTypes = { entity: ProcessNode };
let idSeq = 1;
const nextId = (prefix) => `${prefix}-${Date.now().toString(36)}-${idSeq++}`;

// Tipo di arco predefinito quando si crea un collegamento nuovo trascinando.
const DEFAULT_EDGE_TYPE = 'material';

function styleEdge(edge) {
  const def = EDGE_TYPES[edge.data?.typeKey] || EDGE_TYPES[DEFAULT_EDGE_TYPE];
  return {
    ...edge,
    type: 'smoothstep',
    animated: def.animated,
    label: def.label,
    style: { stroke: def.color, strokeWidth: 2 },
    labelStyle: { fill: def.color, fontSize: 10, fontWeight: 600 },
    labelBgStyle: { fill: '#ffffff', fillOpacity: 0.85 },
    markerEnd: { type: MarkerType.ArrowClosed, color: def.color },
  };
}

export default function App() {
  const [title, setTitle] = useState(sampleDiagram.title);
  const [nodes, setNodes] = useState(sampleDiagram.nodes);
  const [edges, setEdges] = useState(sampleDiagram.edges.map(styleEdge));
  const [selection, setSelection] = useState(null);
  const { screenToFlowPosition, fitView } = useReactFlow();

  const onNodesChange = useCallback((c) => setNodes((n) => applyNodeChanges(c, n)), []);
  const onEdgesChange = useCallback((c) => setEdges((e) => applyEdgeChanges(c, e)), []);

  const onConnect = useCallback((params) => {
    const edge = styleEdge({
      ...params,
      id: nextId('e'),
      data: { typeKey: DEFAULT_EDGE_TYPE, meta: {} },
    });
    setEdges((eds) => addEdge(edge, eds));
  }, []);

  const addNode = useCallback((typeKey) => {
    const def = NODE_TYPES[typeKey];
    const pos = screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
    const node = {
      id: nextId(typeKey),
      type: 'entity',
      position: { x: pos.x + Math.random() * 60, y: pos.y + Math.random() * 60 },
      data: { typeKey, name: def.short, meta: {} },
    };
    setNodes((n) => [...n, node]);
    setSelection({ kind: 'node', data: node });
  }, [screenToFlowPosition]);

  // Applica una modifica proveniente dall'Inspector all'entità selezionata.
  const applyChange = useCallback((updated) => {
    if (selection?.kind === 'node') {
      setNodes((ns) => ns.map((n) => (n.id === updated.id ? { ...n, data: updated.data } : n)));
    } else if (selection?.kind === 'edge') {
      setEdges((es) => es.map((e) => (e.id === updated.id
        ? styleEdge({ ...e, data: updated.data }) : e)));
    }
    setSelection((s) => (s ? { ...s, data: updated } : s));
  }, [selection]);

  const deleteSelection = useCallback((sel) => {
    if (sel.kind === 'node') {
      setNodes((ns) => ns.filter((n) => n.id !== sel.data.id));
      setEdges((es) => es.filter((e) => e.source !== sel.data.id && e.target !== sel.data.id));
    } else {
      setEdges((es) => es.filter((e) => e.id !== sel.data.id));
    }
    setSelection(null);
  }, []);

  const exportJson = useCallback(() => {
    const doc = {
      version: SCHEMA_VERSION,
      title,
      nodes: nodes.map(({ id, type, position, data }) => ({ id, type, position, data })),
      edges: edges.map(({ id, source, target, sourceHandle, targetHandle, data }) =>
        ({ id, source, target, sourceHandle, targetHandle, data })),
    };
    const blob = new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_') || 'diagramma'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [title, nodes, edges]);

  const importJson = useCallback((file) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const doc = JSON.parse(reader.result);
        setTitle(doc.title || 'Diagramma importato');
        setNodes(doc.nodes || []);
        setEdges((doc.edges || []).map(styleEdge));
        setSelection(null);
        setTimeout(() => fitView({ padding: 0.2 }), 50);
      } catch (err) {
        alert('File JSON non valido: ' + err.message);
      }
    };
    reader.readAsText(file);
  }, [fitView]);

  const loadSample = useCallback(() => {
    setTitle(sampleDiagram.title);
    setNodes(sampleDiagram.nodes);
    setEdges(sampleDiagram.edges.map(styleEdge));
    setSelection(null);
    setTimeout(() => fitView({ padding: 0.2 }), 50);
  }, [fitView]);

  const clearAll = useCallback(() => {
    if (!confirm('Svuotare il diagramma?')) return;
    setNodes([]); setEdges([]); setSelection(null);
  }, []);

  const minimapColor = useCallback((n) => NODE_TYPES[n.data?.typeKey]?.color || '#94a3b8', []);

  return (
    <div className="app">
      <Toolbar title={title} onTitle={setTitle} onAddNode={addNode}
        onExport={exportJson} onImport={importJson} onLoadSample={loadSample} onClear={clearAll} />
      <div className="app__body">
        <div className="app__canvas">
          <ReactFlow
            nodes={nodes} edges={edges} nodeTypes={nodeTypes}
            onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect}
            onNodeClick={(_, n) => setSelection({ kind: 'node', data: n })}
            onEdgeClick={(_, e) => setSelection({ kind: 'edge', data: e })}
            onPaneClick={() => setSelection(null)}
            fitView defaultEdgeOptions={{ type: 'smoothstep' }}
          >
            <Background gap={16} color="#e2e8f0" />
            <Controls />
            <MiniMap nodeColor={minimapColor} pannable zoomable />
          </ReactFlow>
        </div>
        <Inspector selection={selection} onChange={applyChange} onDelete={deleteSelection} />
      </div>
    </div>
  );
}
