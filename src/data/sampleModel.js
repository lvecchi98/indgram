import { MODEL_VERSION } from '../model/model.js';

/**
 * Esempio che riproduce fedelmente il caso descritto:
 *  - Componenti A e B → preparati per carteggiatura manuale (operatore) nella
 *    cabina FC005 → assemblati per incollaggio sull'impianto robotizzato JM010
 *    → nasce il componente C.
 *  - Durante l'incollaggio si usano le 3 maschere di assemblaggio TL001
 *    (3 seriali).
 */
export const sampleModel = {
  version: MODEL_VERSION,
  title: 'Assemblaggio componente C',
  entities: {
    component: {
      cmpA: { id: 'cmpA', name: 'Componente A', meta: { code: 'A', materialClass: 'Semilavorato', material: 'Composito', uom: 'pz' } },
      cmpB: { id: 'cmpB', name: 'Componente B', meta: { code: 'B', materialClass: 'Semilavorato', material: 'Composito', uom: 'pz' } },
      cmpC: { id: 'cmpC', name: 'Componente C', meta: { code: 'C', materialClass: 'Prodotto finito', uom: 'pz' } },
    },
    equipment: {
      jm010: { id: 'jm010', name: 'Robot di incollaggio', meta: { code: 'JM010', isa95Level: 'Work Unit', manufacturer: 'KUKA', oee_pct: 85 } },
      fc005: { id: 'fc005', name: 'Cabina di carteggiatura', meta: { code: 'FC005', isa95Level: 'Work Unit' } },
    },
    tooling: {
      tl001: { id: 'tl001', name: 'Maschera di assemblaggio C', meta: { code: 'TL001', toolType: 'Maschera / Fixture', serials: ['TL001-01', 'TL001-02', 'TL001-03'], lifeCycles: 50000 } },
    },
    operator: {
      op1: { id: 'op1', name: 'Operatore carteggiatura', meta: { code: 'OP-CART', role: 'Preparazione superfici' } },
    },
    area: {
      arAss: { id: 'arAss', name: 'Reparto Assemblaggi', meta: { code: 'AR-ASS', isa95Level: 'Area' } },
    },
  },
  operations: [
    {
      id: 'opCartA', name: 'Carteggiatura A', processType: 'Carteggiatura',
      inputs: [{ componentId: 'cmpA', qty: 1, uom: 'pz' }],
      outputs: [{ componentId: 'cmpA', qty: 1, uom: 'pz' }],
      equipmentId: 'fc005', tooling: [], operatorIds: ['op1'], areaId: 'arAss',
      meta: { cycleTime_s: 180, notes: 'Preparazione superficie manuale prima dell’incollaggio' },
    },
    {
      id: 'opCartB', name: 'Carteggiatura B', processType: 'Carteggiatura',
      inputs: [{ componentId: 'cmpB', qty: 1, uom: 'pz' }],
      outputs: [{ componentId: 'cmpB', qty: 1, uom: 'pz' }],
      equipmentId: 'fc005', tooling: [], operatorIds: ['op1'], areaId: 'arAss',
      meta: { cycleTime_s: 180 },
    },
    {
      id: 'opIncoll', name: 'Incollaggio A+B → C', processType: 'Incollaggio',
      inputs: [{ componentId: 'cmpA', qty: 1, uom: 'pz' }, { componentId: 'cmpB', qty: 1, uom: 'pz' }],
      outputs: [{ componentId: 'cmpC', qty: 1, uom: 'pz' }],
      equipmentId: 'jm010',
      tooling: [{ toolingId: 'tl001', serials: ['TL001-01', 'TL001-02', 'TL001-03'] }],
      operatorIds: [], areaId: 'arAss',
      meta: { cycleTime_s: 240, yield_pct: 99, ctq: 'Allineamento maschera', notes: 'Incollaggio robotizzato con 3 maschere di assemblaggio' },
    },
  ],
};
