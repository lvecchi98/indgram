/**
 * AGGREGAZIONE METRICHE (logica pura, testabile — nessun React).
 *
 * Aggrega i parametri delle operazioni di una vista (un insieme di id). Le
 * formule sono fondate su fonti verificabili:
 *
 *  - Tempo ciclo totale = Σ C/T_i e collo di bottiglia = max C/T_i.
 *    Value Stream Mapping (Rother & Shook, "Learning to See", Lean Enterprise
 *    Institute, 1999) e Theory of Constraints (Goldratt, "The Goal", 1984):
 *    il vincolo del flusso è l'operazione con il tempo ciclo maggiore.
 *
 *  - Costo per pezzo di un'operazione (activity-based, per centro di lavoro):
 *      costo = costPerPiece + (C/T + setup)/3600 · (tariffa_macchina
 *                                     + tariffa_manodopera · n_operatori)
 *    I tempi sono in secondi, le tariffe in €/h → divisione per 3600.
 *    Il costo totale della vista è la somma sui passi.
 *
 *  - Conteggi risorse = numero di entità DISTINTE coinvolte (impianti,
 *    attrezzature, operatori, aree) + energia totale Σ energy_kWh.
 *    Inventario risorse ISA-95 / IEC 62264 (Equipment, Physical Asset,
 *    Personnel).
 */

const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);

/** Numero di operatori usato per il costo manodopera: campo esplicito o, in
 *  mancanza, quanti operatori sono referenziati dall'operazione. */
export function operatorCount(op) {
  const explicit = num(op.meta?.operators);
  if (explicit > 0) return explicit;
  return (op.operatorIds || []).length;
}

/** Costo per pezzo di una singola operazione (costPerPiece + tempo·tariffe). */
export function operationCost(op) {
  const m = op.meta || {};
  const timeH = (num(m.cycleTime_s) + num(m.setupTime_s)) / 3600;
  const timeCost = timeH * (num(m.machineCostRate_h) + num(m.laborCostRate_h) * operatorCount(op));
  return num(m.costPerPiece) + timeCost;
}

/** Aggrega le metriche per un insieme di operazioni (Set o array di id). */
export function summarize(model, opIds) {
  const set = opIds instanceof Set ? opIds : new Set(opIds);
  const ops = model.operations.filter((o) => set.has(o.id));

  let totalCycleTime_s = 0;
  let totalEnergy_kWh = 0;
  let totalCost = 0;
  let bottleneck = null; // { opId, name, cycleTime_s }
  const equipment = new Set();
  const tooling = new Set();
  const operators = new Set();
  const areas = new Set();

  for (const op of ops) {
    const m = op.meta || {};
    const ct = num(m.cycleTime_s);
    totalCycleTime_s += ct;
    totalEnergy_kWh += num(m.energy_kWh);
    totalCost += operationCost(op);
    if (ct > 0 && (bottleneck === null || ct > bottleneck.cycleTime_s)) {
      bottleneck = { opId: op.id, name: op.name || 'Operazione', cycleTime_s: ct };
    }
    if (op.equipmentId) equipment.add(op.equipmentId);
    for (const t of op.tooling || []) if (t.toolingId) tooling.add(t.toolingId);
    for (const x of op.operatorIds || []) operators.add(x);
    if (op.areaId) areas.add(op.areaId);
  }

  return {
    operationCount: ops.length,
    totalCycleTime_s,
    bottleneck,
    totalCost,
    totalEnergy_kWh,
    counts: {
      equipment: equipment.size,
      tooling: tooling.size,
      operators: operators.size,
      areas: areas.size,
    },
  };
}
