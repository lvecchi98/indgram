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
import Breadcrumb from './components/Breadcrumb.jsx';
import SearchPanel from './components/SearchPanel.jsx';
import { NODE_TYPES, EDGE_TYPES, SCHEMA_VERSION } from './model/schema.js';
import { sampleDoc } from './data/sample.js';
import { ROOT_FRAME, emptyDoc, makeFrameId, framePath, pruneFrame } from './model/doc.js';

const nodeTypes = { entity: ProcessNode };
let idSeq = 1;
const nextId = (prefix) => `${prefix}-${Date.now().toString(36)}-${idSeq++}`;
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

/** Accetta sia il nuovo formato a frame sia il vecchio formato piatto. */
function normalizeDoc(raw) {
  if (raw?.frames) return raw;
  if (raw?.nodes) {
    return { version: raw.version || SCHEMA_VERSION, title: raw.title || 'Diagramma',
      frames: { [ROOT_FRAME]: { nodes: raw.nodes, edges: raw.edges || [] } } };
  }
  return emptyDoc();
}

export default function App() {
  const [doc, setDoc] = useState(sampleDoc);
  const [frameId, setFrameId] = useState(ROOT_FRAME);
  const [selection, setSelection] = useState(null);
  const { screenToFlowPosition, fitView, setCenter } = useReactFlow();

  const frame = doc.frames[frameId] || { nodes: [], edges: [] };
  const nodes = frame.nodes;
  const styledEdges = useMemo(() => frame.edges.map(styleEdge), [frame.edges]);
  const path = useMemo(() => framePath(doc, frameId), [doc, frameId]);

  // Aggiorna il frame corrente in modo immutabile.
  const updateFrame = useCallback((mutator) => {
    setDoc((d) => {
      const f = d.frames[frameId] || { nodes: [], edges: [] };
      return { ...d, frames: { ...d.frames, [frameId]: mutator(f) } };
    });
  }, [frameId]);

  const onNodesChange = useCallback((c) =>
    updateFrame((f) => ({ ...f, nodes: applyNodeChanges(c, f.nodes) })), [updateFrame]);
  const onEdgesChange = useCallback((c) =>
    updateFrame((f) => ({ ...f, edges: applyEdgeChanges(c, f.edges) })), [updateFrame]);

  const onConnect = useCallback((params) => {
    const edge = { ...params, id: nextId('e'), data: { typeKey: DEFAULT_EDGE_TYPE, meta: {} } };
    updateFrame((f) => ({ ...f, edges: addEdge(edge, f.edges) }));
  }, [updateFrame]);

  const addNode = useCallback((typeKey) => {
    const def = NODE_TYPES[typeKey];
    const pos = screenToFlowPosition({ x: window.innerWidth / 2 - 180, y: window.innerHeight / 2 });
    const node = { id: nextId(typeKey), type: 'entity',
      position: { x: pos.x + Math.random() * 60, y: pos.y + Math.random() * 60 },
      data: { typeKey, name: def.short, meta: {} } };
    updateFrame((f) => ({ ...f, nodes: [...f.nodes, node] }));
    setSelection({ kind: 'node', data: node });
  }, [screenToFlowPosition, updateFrame]);

  // Drill-down: apre (o crea) la decomposizione di un processo.
  const enterNode = useCallback((node) => {
    if (node.data.typeKey !== 'process') return;
    let childId = node.data.frameId;
    if (childId && doc.frames[childId]) { setFrameId(childId); setSelection(null); return; }
    childId = makeFrameId();
    setDoc((d) => {
      const f = d.frames[frameId];
      const nodes = f.nodes.map((n) => n.id === node.id
        ? { ...n, data: { ...n.data, frameId: childId, subtitle: (n.data.subtitle || '') } } : n);
      return { ...d, frames: { ...d.frames, [frameId]: { ...f, nodes },
        [childId]: { nodes: [], edges: [] } } };
    });
    setFrameId(childId); setSelection(null);
  }, [doc.frames, frameId]);

  const applyChange = useCallback((updated) => {
    updateFrame((f) => selection?.kind === 'node'
      ? { ...f, nodes: f.nodes.map((n) => (n.id === updated.id ? { ...n, data: updated.data } : n)) }
      : { ...f, edges: f.edges.map((e) => (e.id === updated.id ? { ...e, data: updated.data } : e)) });
    setSelection((s) => (s ? { ...s, data: updated } : s));
  }, [selection, updateFrame]);

  const deleteSelection = useCallback((sel) => {
    if (sel.kind === 'node') {
      const child = sel.data.data?.frameId;
      setDoc((d) => {
        let nd = child ? pruneFrame(d, child) : d;
        const f = nd.frames[frameId];
        return { ...nd, frames: { ...nd.frames, [frameId]: {
          nodes: f.nodes.filter((n) => n.id !== sel.data.id),
          edges: f.edges.filter((e) => e.source !== sel.data.id && e.target !== sel.data.id),
        } } };
      });
    } else {
      updateFrame((f) => ({ ...f, edges: f.edges.filter((e) => e.id !== sel.data.id) }));
    }
    setSelection(null);
  }, [frameId, updateFrame]);

  const gotoNode = useCallback((targetFrame, nodeId) => {
    setFrameId(targetFrame);
    setTimeout(() => {
      const f = doc.frames[targetFrame];
      const n = f?.nodes.find((x) => x.id === nodeId);
      if (n) { setSelection({ kind: 'node', data: n }); setCenter(n.position.x + 90, n.position.y + 40, { zoom: 1.1, duration: 400 }); }
    }, 30);
  }, [doc.frames, setCenter]);

  const exportJson = useCallback(() => {
    const out = { version: SCHEMA_VERSION, title: doc.title,
      frames: Object.fromEntries(Object.entries(doc.frames).map(([fid, f]) => [fid, {
        nodes: f.nodes.map(({ id, type, position, data }) => ({ id, type, position, data })),
        edges: f.edges.map(({ id, source, target, sourceHandle, targetHandle, data }) =>
          ({ id, source, target, sourceHandle, targetHandle, data })),
      }])) };
    const blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${(doc.title || 'diagramma').replace(/\s+/g, '_')}.json`; a.click();
    URL.revokeObjectURL(url);
  }, [doc]);

  const importJson = useCallback((file) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = normalizeDoc(JSON.parse(reader.result));
        setDoc(parsed); setFrameId(ROOT_FRAME); setSelection(null);
        setTimeout(() => fitView({ padding: 0.2 }), 50);
      } catch (err) { alert('File JSON non valido: ' + err.message); }
    };
    reader.readAsText(file);
  }, [fitView]);

  const loadSample = useCallback(() => {
    setDoc(sampleDoc); setFrameId(ROOT_FRAME); setSelection(null);
    setTimeout(() => fitView({ padding: 0.2 }), 50);
  }, [fitView]);

  const clearAll = useCallback(() => {
    if (!confirm('Svuotare tutto il documento?')) return;
    setDoc(emptyDoc(doc.title)); setFrameId(ROOT_FRAME); setSelection(null);
  }, [doc.title]);

  const setTitle = useCallback((t) => setDoc((d) => ({ ...d, title: t })), []);
  const minimapColor = useCallback((n) => NODE_TYPES[n.data?.typeKey]?.color || '#94a3b8', []);

  return (
    <div className="app">
      <Toolbar title={doc.title} onTitle={setTitle} onAddNode={addNode}
        onExport={exportJson} onImport={importJson} onLoadSample={loadSample} onClear={clearAll} />
      <div className="app__body">
        <aside className="app__left">
          <SearchPanel doc={doc} onGoto={gotoNode} />
        </aside>
        <div className="app__canvas">
          <Breadcrumb path={path} onNavigate={(fid) => { setFrameId(fid); setSelection(null); }} />
          <ReactFlow
            nodes={nodes} edges={styledEdges} nodeTypes={nodeTypes}
            onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect}
            onNodeClick={(_, n) => setSelection({ kind: 'node', data: n })}
            onNodeDoubleClick={(_, n) => enterNode(n)}
            onEdgeClick={(_, e) => setSelection({ kind: 'edge', data: e })}
            onPaneClick={() => setSelection(null)}
            fitView defaultEdgeOptions={{ type: 'smoothstep' }}
          >
            <Background gap={16} color="#e2e8f0" />
            <Controls />
            <MiniMap nodeColor={minimapColor} pannable zoomable />
          </ReactFlow>
        </div>
        <Inspector selection={selection} onChange={applyChange} onDelete={deleteSelection}
          onEnter={selection?.kind === 'node' ? () => enterNode(selection.data) : null} />
      </div>
    </div>
  );
}
