/**
 * DERIVAZIONE DEL GRAFO dalle operazioni (logica pura, testabile).
 *
 * Il flusso è una RETE DI OPERAZIONI: due operazioni sono collegate quando
 * un componente prodotto dall'una è consumato dall'altra (precedenza).
 * I componenti che entrano senza essere prodotti da un'altra operazione del
 * sottoinsieme mostrato sono "materie in ingresso" (nodi sorgente); quelli
 * prodotti e non più consumati sono "prodotti" (nodi pozzo). Questo evita
 * cicli e produce un DAG pulito anche per le trasformazioni in-place (input
 * e output stesso componente), coerentemente con il framework P-graph
 * (Friedler et al., 1992). Nessun dato è duplicato: i nodi referenziano le
 * entità per id (refId).
 */

const inputComps = (op) => (op.inputs || []).map((i) => i.componentId).filter(Boolean);
const outputComps = (op) => (op.outputs || []).map((o) => o.componentId).filter(Boolean);

export function producersOf(model, componentId) {
  return model.operations.filter((op) => outputComps(op).includes(componentId));
}
export function consumersOf(model, componentId) {
  return model.operations.filter((op) => inputComps(op).includes(componentId));
}

/**
 * Costruisce il grafo per un dato insieme di operazioni (`opSet`).
 * - Archi di precedenza op->op quando produttore e consumatore sono ENTRAMBI
 *   nell'insieme mostrato.
 * - Nodo materiale "in ingresso" quando un input non ha produttore nel set.
 * - Nodo materiale "prodotto" quando un output non ha consumatore nel set.
 * Così ogni vista è auto-consistente: si vede sempre cosa entra e cosa esce.
 */
export function buildSubgraph(model, opSet) {
  const set = opSet instanceof Set ? opSet : new Set(opSet);
  const ops = model.operations.filter((o) => set.has(o.id));
  const nodes = [];
  const edges = [];
  const seenMat = new Set();
  const seenPrec = new Set();
  let e = 0;
  const eid = () => `e${e++}`;
  const opNodeId = (id) => `op:${id}`;

  for (const op of ops) {
    nodes.push({ id: opNodeId(op.id), kind: 'operation', refId: op.id,
      label: op.name || 'Operazione', sublabel: op.processType || '' });
  }

  const addMat = (id, componentId, role) => {
    if (seenMat.has(id)) return;
    seenMat.add(id);
    const c = model.entities.component?.[componentId];
    nodes.push({ id, kind: 'material', role, refId: componentId,
      label: c?.name || componentId, sublabel: c?.meta?.code || '' });
  };

  for (const op of ops) {
    // Input: precedenza da produttori nel set, altrimenti materia in ingresso.
    for (const c of inputComps(op)) {
      const producersInSet = producersOf(model, c).filter((p) => p.id !== op.id && set.has(p.id));
      if (producersInSet.length) {
        for (const p of producersInSet) {
          const key = `${p.id}->${op.id}:${c}`;
          if (!seenPrec.has(key)) {
            seenPrec.add(key);
            edges.push({ id: eid(), source: opNodeId(p.id), target: opNodeId(op.id), componentId: c });
          }
        }
      } else {
        const mid = `min:${c}`;
        addMat(mid, c, 'raw');
        edges.push({ id: eid(), source: mid, target: opNodeId(op.id), componentId: c });
      }
    }
    // Output: se nessun consumatore nel set, è un prodotto (pozzo).
    for (const c of outputComps(op)) {
      const consumersInSet = consumersOf(model, c).filter((cn) => cn.id !== op.id && set.has(cn.id));
      if (!consumersInSet.length) {
        const mid = `mout:${c}`;
        addMat(mid, c, 'finished');
        edges.push({ id: eid(), source: opNodeId(op.id), target: mid, componentId: c });
      }
    }
  }

  return { nodes, edges };
}

/** Grafo completo (tutte le operazioni). */
export function buildFullGraph(model) {
  return buildSubgraph(model, new Set(model.operations.map((o) => o.id)));
}

/**
 * Genealogia di un componente: operazioni che lo generano (a monte) e che lo
 * consumano (a valle), risalendo/discendendo la catena.
 */
export function componentTrace(model, componentId) {
  const ops = new Set();
  const upVisited = new Set();
  const downVisited = new Set();
  const up = (comp) => {
    if (upVisited.has(comp)) return;
    upVisited.add(comp);
    for (const p of producersOf(model, comp)) {
      ops.add(p.id);
      for (const ci of inputComps(p)) up(ci);
    }
  };
  const down = (comp) => {
    if (downVisited.has(comp)) return;
    downVisited.add(comp);
    for (const cn of consumersOf(model, comp)) {
      ops.add(cn.id);
      for (const co of outputComps(cn)) down(co);
    }
  };
  up(componentId);
  down(componentId);
  return ops;
}

/** Insieme di operazioni da mostrare per una data vista. */
export function operationSetForView(model, view, targetId) {
  switch (view) {
    case 'component':
      return targetId ? componentTrace(model, targetId) : new Set();
    case 'equipment':
      return new Set(model.operations.filter((o) => o.equipmentId === targetId).map((o) => o.id));
    case 'tooling':
      return new Set(model.operations
        .filter((o) => (o.tooling || []).some((t) => t.toolingId === targetId)).map((o) => o.id));
    case 'operator':
      return new Set(model.operations.filter((o) => (o.operatorIds || []).includes(targetId)).map((o) => o.id));
    case 'area':
      return new Set(model.operations.filter((o) => o.areaId === targetId).map((o) => o.id));
    case 'flow':
    default:
      return new Set(model.operations.map((o) => o.id));
  }
}

/** Grafo pronto per una vista. */
export function graphForView(model, view, targetId) {
  return buildSubgraph(model, operationSetForView(model, view, targetId));
}
