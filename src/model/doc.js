import { SCHEMA_VERSION } from './schema.js';

/**
 * MODELLO DOCUMENTO — gerarchia a "frame" (decomposizione IDEF0).
 *
 * Un documento è un insieme di FRAME. Il frame `root` è il livello più alto
 * (il macro-processo). Un nodo di tipo `process` può possedere un proprio
 * sotto-diagramma: il suo `data.frameId` punta a un altro frame che ne
 * rappresenta la decomposizione interna (come A0 -> A1, A2, A3 in IDEF0,
 * FIPS PUB 183, "Decomposition").
 *
 * Struttura:
 *   doc = {
 *     version, title,
 *     frames: {
 *       root:        { nodes: [...], edges: [...] },
 *       "<frameId>": { nodes: [...], edges: [...] },
 *       ...
 *     }
 *   }
 */

export const ROOT_FRAME = 'root';

export function emptyDoc(title = 'Nuovo diagramma') {
  return { version: SCHEMA_VERSION, title, frames: { [ROOT_FRAME]: { nodes: [], edges: [] } } };
}

export function makeFrameId() {
  return `frame-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e4)}`;
}

/** Restituisce un nuovo doc con il frame indicato sostituito. */
export function setFrame(doc, frameId, frame) {
  return { ...doc, frames: { ...doc.frames, [frameId]: frame } };
}

/** Trova in quale frame vive un nodo e il nodo stesso. */
export function locateNode(doc, nodeId) {
  for (const [frameId, frame] of Object.entries(doc.frames)) {
    const node = frame.nodes.find((n) => n.id === nodeId);
    if (node) return { frameId, node };
  }
  return null;
}

/**
 * Ricostruisce il "percorso" (breadcrumb) fino a un frame, risalendo i nodi
 * genitore che lo referenziano via `data.frameId`.
 */
export function framePath(doc, frameId) {
  const path = [];
  let current = frameId;
  const guard = new Set();
  while (current && current !== ROOT_FRAME && !guard.has(current)) {
    guard.add(current);
    // Cerca il nodo (in qualunque frame) che apre `current`.
    let parentNode = null, parentFrame = null;
    for (const [fid, frame] of Object.entries(doc.frames)) {
      const p = frame.nodes.find((n) => n.data?.frameId === current);
      if (p) { parentNode = p; parentFrame = fid; break; }
    }
    if (!parentNode) break;
    path.unshift({ frameId: current, label: parentNode.data.name || 'Sotto-processo' });
    current = parentFrame;
  }
  path.unshift({ frameId: ROOT_FRAME, label: doc.title });
  return path;
}

/** Rimuove un frame e (ricorsivamente) i suoi frame figli. */
export function pruneFrame(doc, frameId) {
  if (frameId === ROOT_FRAME) return doc;
  const frames = { ...doc.frames };
  const toRemove = [frameId];
  while (toRemove.length) {
    const fid = toRemove.pop();
    const frame = frames[fid];
    if (!frame) continue;
    for (const n of frame.nodes) if (n.data?.frameId) toRemove.push(n.data.frameId);
    delete frames[fid];
  }
  return { ...doc, frames };
}
