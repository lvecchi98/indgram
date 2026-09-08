import { test } from 'node:test';
import assert from 'node:assert/strict';

import { summarize, operationCost, operatorCount } from '../src/model/metrics.js';
import { operationSetForView } from '../src/model/graph.js';
import { sampleModel } from '../src/data/sampleModel.js';

// Modello sintetico con TUTTI i campi di costo/tempo/energia, per verificare
// le formule con numeri controllati.
const costModel = {
  entities: { component: {}, equipment: { e1: { id: 'e1' } }, tooling: {}, operator: { o1: { id: 'o1' }, o2: { id: 'o2' } }, area: { a1: { id: 'a1' } } },
  operations: [
    {
      id: 'op1', name: 'Op1', inputs: [], outputs: [],
      equipmentId: 'e1', tooling: [], operatorIds: ['o1', 'o2'], areaId: 'a1',
      // timeH = (180+60)/3600 = 1/15 h; costo tempo = 1/15·(120 + 30·2) = 12; +1.5 → 13.5
      meta: { cycleTime_s: 180, setupTime_s: 60, machineCostRate_h: 120, laborCostRate_h: 30, operators: 2, costPerPiece: 1.5, energy_kWh: 4 },
    },
    {
      id: 'op2', name: 'Op2', inputs: [], outputs: [],
      equipmentId: 'e1', tooling: [], operatorIds: ['o1'], areaId: 'a1',
      // timeH = 360/3600 = 0.1 h; costo tempo = 0.1·(90 + 0·1) = 9; +0 → 9
      meta: { cycleTime_s: 360, machineCostRate_h: 90, energy_kWh: 6 },
    },
  ],
};

test('operatorCount: campo esplicito ha priorità, altrimenti conta i referenziati', () => {
  assert.equal(operatorCount(costModel.operations[0]), 2); // esplicito
  assert.equal(operatorCount(costModel.operations[1]), 1); // da operatorIds
});

test('operationCost: costPerPiece + (C/T+setup)/3600 · (macchina + manodopera·operatori)', () => {
  assert.equal(operationCost(costModel.operations[0]), 13.5);
  assert.equal(operationCost(costModel.operations[1]), 9);
});

test('summarize: tempo ciclo totale è la somma dei C/T', () => {
  const s = summarize(costModel, ['op1', 'op2']);
  assert.equal(s.totalCycleTime_s, 540); // 180 + 360
});

test('summarize: collo di bottiglia è l’operazione con C/T massimo', () => {
  const s = summarize(costModel, ['op1', 'op2']);
  assert.equal(s.bottleneck.opId, 'op2');
  assert.equal(s.bottleneck.cycleTime_s, 360);
});

test('summarize: costo totale/pezzo è la somma dei costi di operazione', () => {
  const s = summarize(costModel, ['op1', 'op2']);
  assert.equal(s.totalCost, 22.5); // 13.5 + 9
});

test('summarize: energia totale e conteggi risorse DISTINTE', () => {
  const s = summarize(costModel, ['op1', 'op2']);
  assert.equal(s.totalEnergy_kWh, 10); // 4 + 6
  assert.equal(s.operationCount, 2);
  assert.equal(s.counts.equipment, 1); // e1 in entrambe → distinta
  assert.equal(s.counts.operators, 2); // o1, o2
  assert.equal(s.counts.areas, 1);
});

test('summarize: insieme vuoto → tutto a zero, nessun collo di bottiglia', () => {
  const s = summarize(costModel, []);
  assert.equal(s.operationCount, 0);
  assert.equal(s.totalCycleTime_s, 0);
  assert.equal(s.totalCost, 0);
  assert.equal(s.bottleneck, null);
});

// Integrazione con le viste reali del modello di esempio.
test('summarize sulla vista "per impianto" JM010: solo l’incollaggio', () => {
  const ids = operationSetForView(sampleModel, 'equipment', 'jm010');
  const s = summarize(sampleModel, ids);
  assert.equal(s.operationCount, 1);
  assert.equal(s.totalCycleTime_s, 240); // solo opIncoll
  assert.equal(s.counts.tooling, 1); // TL001
});

test('summarize sulla vista "flusso completo": 3 operazioni, C/T 600', () => {
  const ids = operationSetForView(sampleModel, 'flow', '');
  const s = summarize(sampleModel, ids);
  assert.equal(s.operationCount, 3);
  assert.equal(s.totalCycleTime_s, 600); // 180 + 180 + 240
  assert.equal(s.bottleneck.opId, 'opIncoll');
  assert.equal(s.counts.equipment, 2); // FC005 + JM010
});
