import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ReactFlow, Background, Controls, MiniMap,
  applyNodeChanges, applyEdgeChanges, useReactFlow, MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { nodeTypes } from './components/nodes.jsx';
import Inspector from './components/Inspector.jsx';
import Toolbar from './components/Toolbar.jsx';
import ViewBar from './components/ViewBar.jsx';
import RegistryPanel from './components/RegistryPanel.jsx';
import OperationForm from './components/OperationForm.jsx';
import SummaryPanel from './components/SummaryPanel.jsx';

import { ENTITY_DEFS, OPERATION_DEF, MODEL_VERSION, emptyModel, uid, getEntity, entityLabel } from './model/model.js';
import { graphForView } from './model/graph.js';
import { layoutGraph } from './model/layout.js';
import { sampleModel } from './data/sampleModel.js';
import { loadStore, saveStore } from './model/storage.js';
import {
  ensureProject, currentProject, listProjects, upsertModel,
  createProject, duplicateProject, deleteProject, selectProject,
} from './model/projects.js';

/** Costruisce nodi/archi React Flow (con layout e badge) per la vista. */
function buildFlow(model, view, target) {
  const graph = graphForView(model, view, target);
  const pos = layoutGraph(graph);

  const nodes = graph.nodes.map((n) => {
    const p = pos.get(n.id) || { x: 0, y: 0 };
    if (n.kind === 'operation') {
      const op = model.operations.find((o) => o.id === n.refId);
      return { id: n.id, type: 'operation', position: p,
        data: { kind: 'operation', refId: n.refId, label: n.label,
          processType: op?.processType, badges: opBadges(model, op) } };
    }
    return { id: n.id, type: 'material', position: p,
      data: { kind: 'material', refId: n.refId, label: n.label, sublabel: n.sublabel, role: n.role } };
  });

  const edges = graph.edges.map((e) => {
    const c = getEntity(model, 'component', e.componentId);
    const code = c?.meta?.code || c?.name || '';
    return { id: e.id, source: e.source, target: e.target, type: 'smoothstep',
      label: code, animated: e.source.startsWith('op:') && e.target.startsWith('op:'),
      style: { stroke: ENTITY_DEFS.component.color, strokeWidth: 2 },
      labelStyle: { fontSize: 10, fontWeight: 600, fill: '#047857' },
      labelBgStyle: { fill: '#fff', fillOpacity: 0.85 },
      markerEnd: { type: MarkerType.ArrowClosed, color: ENTITY_DEFS.component.color } };
  });

  return { nodes, edges };
}

function opBadges(model, op) {
  if (!op) return [];
  const b = [];
  if (op.equipmentId) b.push({ icon: '🏭', text: codeOf(model, 'equipment', op.equipmentId), color: ENTITY_DEFS.equipment.color, title: 'Impianto' });
  for (const t of op.tooling || []) if (t.toolingId)
    b.push({ icon: '🔧', text: codeOf(model, 'tooling', t.toolingId) + ((t.serials || []).length ? ` ×${t.serials.length}` : ''), color: ENTITY_DEFS.tooling.color, title: 'Attrezzatura' });
  if ((op.operatorIds || []).length) b.push({ icon: '👤', text: String(op.operatorIds.length), color: ENTITY_DEFS.operator.color, title: 'Operatori' });
  if (op.areaId) b.push({ icon: '📍', text: codeOf(model, 'area', op.areaId), color: ENTITY_DEFS.area.color, title: 'Area' });
  return b;
}
const codeOf = (model, kind, id) => getEntity(model, kind, id)?.meta?.code || getEntity(model, kind, id)?.name || '?';

/** Carica lo store dal browser e garantisce almeno un progetto (seed esempio). */
function initStore() {
  const loaded = loadStore();
  const seeded = ensureProject(loaded, sampleModel);
  if (seeded !== loaded) saveStore(seeded);
  return seeded;
}

export default function App() {
  const [store, setStore] = useState(initStore);
  const [model, setModel] = useState(() => currentProject(store).model);
  const [view, setView] = useState('flow');
  const [target, setTarget] = useState('');
  const [selection, setSelection] = useState(null);
  const [form, setForm] = useState(null); // { editId } | { } | null
  const [rfNodes, setRfNodes] = useState([]);
  const [rfEdges, setRfEdges] = useState([]);
  const { fitView } = useReactFlow();
  const fitRef = useRef();

  useEffect(() => {
    const { nodes, edges } = buildFlow(model, view, target);
    setRfNodes(nodes);
    setRfEdges(edges);
    clearTimeout(fitRef.current);
    fitRef.current = setTimeout(() => fitView({ padding: 0.2, duration: 300 }), 40);
  }, [model, view, target, fitView]);

  const onNodesChange = useCallback((c) => setRfNodes((n) => applyNodeChanges(c, n)), []);
  const onEdgesChange = useCallback((c) => setRfEdges((e) => applyEdgeChanges(c, e)), []);

  // ---- Salvataggio automatico (debounce) nel browser ----
  useEffect(() => {
    const t = setTimeout(() => {
      setStore((s) => { const ns = upsertModel(s, s.currentId, model); saveStore(ns); return ns; });
    }, 500);
    return () => clearTimeout(t);
  }, [model]);

  // ---- Progetti ----
  const persist = useCallback((ns) => { saveStore(ns); setStore(ns); }, []);
  const resetUi = useCallback(() => { setSelection(null); setView('flow'); setTarget(''); }, []);

  const switchProject = useCallback((id) => {
    const target = store.projects[id];
    if (!target || id === store.currentId) return;
    persist(selectProject(upsertModel(store, store.currentId, model), id));
    setModel(target.model); resetUi();
  }, [store, model, persist, resetUi]);

  const newProject = useCallback(() => {
    const m = emptyModel('Nuovo processo');
    persist(createProject(upsertModel(store, store.currentId, model), m));
    setModel(m); resetUi();
  }, [store, model, persist, resetUi]);

  const duplicateCurrent = useCallback(() => {
    const ns = duplicateProject(upsertModel(store, store.currentId, model), store.currentId);
    persist(ns); setModel(currentProject(ns).model); resetUi();
  }, [store, model, persist, resetUi]);

  const deleteCurrent = useCallback(() => {
    const p = currentProject(store);
    if (!p || !confirm(`Eliminare il progetto "${p.name}"? L’azione non è reversibile.`)) return;
    const ns = ensureProject(deleteProject(store, store.currentId), emptyModel('Nuovo processo'));
    persist(ns); setModel(currentProject(ns).model); resetUi();
  }, [store, persist, resetUi]);

  // ---- Entità ----
  const createEntity = useCallback((kind, name) => {
    const id = uid(kind);
    setModel((m) => {
      const count = Object.keys(m.entities[kind]).length + 1;
      const code = `${ENTITY_DEFS[kind].prefix}${String(count).padStart(3, '0')}`;
      return { ...m, entities: { ...m.entities, [kind]: { ...m.entities[kind], [id]: { id, name, meta: { code } } } } };
    });
    return id;
  }, []);

  const changeEntity = useCallback((kind, id, patch) => {
    setModel((m) => ({ ...m, entities: { ...m.entities, [kind]: { ...m.entities[kind], [id]: { ...m.entities[kind][id], ...patch } } } }));
  }, []);

  const deleteEntity = useCallback((kind, id) => {
    const ent = getEntity(model, kind, id);
    if (!confirm(`Eliminare ${entityLabel(ent)}? Verrà rimossa anche dalle operazioni che la usano.`)) return;
    setModel((m) => {
      const kindMap = { ...m.entities[kind] };
      delete kindMap[id];
      const operations = m.operations.map((op) => cleanOpRefs(op, kind, id));
      return { ...m, entities: { ...m.entities, [kind]: kindMap }, operations };
    });
    setSelection(null);
  }, [model]);

  // ---- Operazioni ----
  const saveOperation = useCallback((op) => {
    setModel((m) => {
      if (form?.editId) {
        return { ...m, operations: m.operations.map((o) => (o.id === form.editId ? { ...op, id: form.editId } : o)) };
      }
      return { ...m, operations: [...m.operations, { ...op, id: uid('op') }] };
    });
    setForm(null);
  }, [form]);

  const deleteOperation = useCallback((id) => {
    if (!confirm('Eliminare questa operazione?')) return;
    setModel((m) => ({ ...m, operations: m.operations.filter((o) => o.id !== id) }));
    setSelection(null);
  }, []);

  // ---- Selezione ----
  const onNodeClick = useCallback((_, node) => {
    if (node.data.kind === 'operation') setSelection({ type: 'operation', id: node.data.refId });
    else setSelection({ type: 'entity', kind: 'component', id: node.data.refId });
  }, []);

  const selectRegistry = useCallback((type, kind, id) => setSelection({ type, kind, id }), []);
  const focusEntity = useCallback((kind, id) => setSelection({ type: 'entity', kind, id }), []);

  // ---- File ----
  const exportJson = useCallback(() => {
    const blob = new Blob([JSON.stringify({ ...model, version: MODEL_VERSION }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `${(model.title || 'processo').replace(/\s+/g, '_')}.json`; a.click();
    URL.revokeObjectURL(url);
  }, [model]);

  const importJson = useCallback((file) => {
    const r = new FileReader();
    r.onload = () => { try {
      const parsed = JSON.parse(r.result);
      if (!parsed.entities || !parsed.operations) throw new Error('Struttura non riconosciuta');
      if (!parsed.title) parsed.title = file.name.replace(/\.json$/i, '');
      persist(createProject(upsertModel(store, store.currentId, model), parsed)); // importa come NUOVO progetto
      setModel(parsed); resetUi();
    } catch (e) { alert('File non valido: ' + e.message); } };
    r.readAsText(file);
  }, [store, model, persist, resetUi]);

  const loadSample = useCallback(() => {
    const m = JSON.parse(JSON.stringify(sampleModel));
    persist(createProject(upsertModel(store, store.currentId, model), m)); // esempio come NUOVO progetto
    setModel(m); resetUi();
  }, [store, model, persist, resetUi]);

  const onView = useCallback((v) => { setView(v); if (v === 'flow') setTarget(''); }, []);

  return (
    <div className="app">
      <Toolbar title={model.title} onTitle={(t) => setModel((m) => ({ ...m, title: t }))}
        projects={listProjects(store)} currentId={store.currentId}
        onSelectProject={switchProject} onNewProject={newProject}
        onDuplicateProject={duplicateCurrent} onDeleteProject={deleteCurrent}
        onNewOperation={() => setForm({})} onExport={exportJson} onImport={importJson}
        onLoadSample={loadSample}
        onClear={() => { if (confirm('Svuotare il contenuto di questo progetto?')) { setModel(emptyModel(model.title)); setSelection(null); } }} />

      <div className="app__body">
        <RegistryPanel model={model} selection={selection} onSelect={selectRegistry} onCreate={createEntity} />

        <div className="app__center">
          <ViewBar view={view} target={target} onView={onView} onTarget={setTarget} model={model} />
          <div className="app__canvas">
            {needsTarget(view, target)
              ? <div className="canvas-hint">Seleziona un {ENTITY_DEFS[targetKind(view)]?.short.toLowerCase()} nel menù in alto per proiettare la vista.</div>
              : <ReactFlow nodes={rfNodes} edges={rfEdges} nodeTypes={nodeTypes}
                  onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
                  onNodeClick={onNodeClick} onPaneClick={() => setSelection(null)}
                  nodesConnectable={false} fitView proOptions={{ hideAttribution: true }}>
                  <Background gap={16} color="#e2e8f0" />
                  <Controls />
                  <MiniMap zoomable pannable
                    nodeColor={(n) => n.type === 'operation' ? OPERATION_DEF.color : ENTITY_DEFS.component.color} />
                </ReactFlow>}
          </div>
          {!needsTarget(view, target) && <SummaryPanel model={model} view={view} target={target} />}
        </div>

        <Inspector selection={selection} model={model}
          onEditOperation={(id) => setForm({ editId: id })} onDeleteOperation={deleteOperation}
          onChangeEntity={changeEntity} onDeleteEntity={deleteEntity} onFocusEntity={focusEntity} />
      </div>

      {form && <OperationForm model={model} onCreateEntity={createEntity}
        initial={form.editId ? model.operations.find((o) => o.id === form.editId) : null}
        onSave={saveOperation} onCancel={() => setForm(null)} />}
    </div>
  );
}

const targetKind = (view) => ({ component: 'component', equipment: 'equipment', tooling: 'tooling', operator: 'operator', area: 'area' }[view]);
const needsTarget = (view, target) => view !== 'flow' && !target;

/** Rimuove i riferimenti a un'entità eliminata dalle operazioni. */
function cleanOpRefs(op, kind, id) {
  const o = { ...op };
  if (kind === 'component') {
    o.inputs = (o.inputs || []).filter((r) => r.componentId !== id);
    o.outputs = (o.outputs || []).filter((r) => r.componentId !== id);
  }
  if (kind === 'equipment' && o.equipmentId === id) o.equipmentId = '';
  if (kind === 'area' && o.areaId === id) o.areaId = '';
  if (kind === 'tooling') o.tooling = (o.tooling || []).filter((t) => t.toolingId !== id);
  if (kind === 'operator') o.operatorIds = (o.operatorIds || []).filter((x) => x !== id);
  return o;
}
