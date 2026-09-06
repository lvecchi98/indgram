import dagre from '@dagrejs/dagre';

const W = 200, H = 84, MAT_W = 150, MAT_H = 60;

/**
 * Layout automatico (Sugiyama/layered) del grafo derivato, tramite dagre.
 * Le operazioni scorrono da sinistra a destra (rankdir LR).
 * Restituisce una mappa id -> { x, y } (angolo alto-sinistra).
 */
export function layoutGraph(graph, { rankdir = 'LR' } = {}) {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir, nodesep: 40, ranksep: 90, marginx: 20, marginy: 20 });
  g.setDefaultEdgeLabel(() => ({}));

  for (const n of graph.nodes) {
    const isOp = n.kind === 'operation';
    g.setNode(n.id, { width: isOp ? W : MAT_W, height: isOp ? H : MAT_H });
  }
  for (const e of graph.edges) g.setEdge(e.source, e.target);

  dagre.layout(g);

  const pos = new Map();
  for (const n of graph.nodes) {
    const { x, y, width, height } = g.node(n.id);
    pos.set(n.id, { x: x - width / 2, y: y - height / 2 });
  }
  return pos;
}

export const NODE_SIZE = { W, H, MAT_W, MAT_H };
