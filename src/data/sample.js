import { SCHEMA_VERSION } from '../model/schema.js';

/**
 * Diagramma di esempio: MACRO-PROCESSO "Assemblaggio telaio".
 * Mostra i vari livelli: componenti (materia prima), sotto-processi di
 * trasformazione (taglio, stampaggio, incollaggio), impianti, attrezzature
 * e area/reparto, collegati con archi tipizzati e ricchi di metadati.
 */
export const sampleDiagram = {
  version: SCHEMA_VERSION,
  title: 'Assemblaggio telaio',
  nodes: [
    {
      id: 'area-1', type: 'entity',
      position: { x: 40, y: 20 },
      data: { typeKey: 'area', name: 'Reparto Telai', subtitle: 'Area A · Work Center',
        meta: { areaCode: 'WC-TELAI', isa95Level: 'Work Center', surface_m2: 850, department: 'Produzione' } },
    },
    {
      id: 'comp-tubo', type: 'entity',
      position: { x: 40, y: 160 },
      data: { typeKey: 'component', name: 'Tubo alluminio', subtitle: 'Materia prima',
        meta: { partNumber: 'RM-AL-6061', materialClass: 'Materia prima', material: 'Al 6061-T6', uom: 'm', mass_kg: 1.2 } },
    },
    {
      id: 'proc-taglio', type: 'entity',
      position: { x: 320, y: 160 },
      data: { typeKey: 'process', name: 'Taglio materia prima', subtitle: 'Taglio',
        meta: { code: 'P-010', processType: 'Taglio', cycleTime_s: 45, yield_pct: 98 } },
    },
    {
      id: 'proc-stamp', type: 'entity',
      position: { x: 600, y: 160 },
      data: { typeKey: 'process', name: 'Stampaggio', subtitle: 'Stampaggio',
        meta: { code: 'P-020', processType: 'Stampaggio', cycleTime_s: 90, yield_pct: 95 } },
    },
    {
      id: 'comp-staffa', type: 'entity',
      position: { x: 600, y: 20 },
      data: { typeKey: 'component', name: 'Staffa', subtitle: 'Semilavorato',
        meta: { partNumber: 'SL-STF-01', materialClass: 'Semilavorato', material: 'Acciaio S235', qty: 2, uom: 'pz' } },
    },
    {
      id: 'proc-incoll', type: 'entity',
      position: { x: 880, y: 160 },
      data: { typeKey: 'process', name: 'Incollaggio', subtitle: 'Incollaggio',
        meta: { code: 'P-030', processType: 'Incollaggio', cycleTime_s: 120, yield_pct: 99 } },
    },
    {
      id: 'comp-telaio', type: 'entity',
      position: { x: 1160, y: 160 },
      data: { typeKey: 'component', name: 'Telaio assemblato', subtitle: 'Prodotto finito',
        meta: { partNumber: 'FG-TEL-100', materialClass: 'Prodotto finito', qty: 1, uom: 'pz' } },
    },
    {
      id: 'equip-sega', type: 'entity',
      position: { x: 320, y: 340 },
      data: { typeKey: 'equipment', name: 'Sega a nastro CNC', subtitle: 'Impianto',
        meta: { assetTag: 'EQ-SAW-01', isa95Level: 'Work Unit', manufacturer: 'Acme', oee_pct: 82 } },
    },
    {
      id: 'equip-pressa', type: 'entity',
      position: { x: 600, y: 340 },
      data: { typeKey: 'equipment', name: 'Pressa 200 t', subtitle: 'Impianto',
        meta: { assetTag: 'EQ-PRS-02', isa95Level: 'Work Unit', power_kW: 55, oee_pct: 78 } },
    },
    {
      id: 'tool-stampo', type: 'entity',
      position: { x: 820, y: 340 },
      data: { typeKey: 'tooling', name: 'Stampo staffa', subtitle: 'Attrezzatura',
        meta: { toolId: 'TL-DIE-07', toolType: 'Stampo', lifeCycles: 100000 } },
    },
  ],
  edges: [
    { id: 'e1', source: 'comp-tubo', target: 'proc-taglio', sourceHandle: 'out__s', targetHandle: 'input__t',
      data: { typeKey: 'material', meta: { qty: 1, uom: 'm', state: 'Solido' } } },
    { id: 'e2', source: 'proc-taglio', target: 'proc-stamp', sourceHandle: 'output__s', targetHandle: 'input__t',
      data: { typeKey: 'material', meta: { state: 'Solido' } } },
    { id: 'e3', source: 'proc-stamp', target: 'comp-staffa', sourceHandle: 'output__s', targetHandle: 'in__t',
      data: { typeKey: 'material', meta: {} } },
    { id: 'e4', source: 'comp-staffa', target: 'proc-incoll', sourceHandle: 'out__s', targetHandle: 'input__t',
      data: { typeKey: 'assembly', meta: { qtyPer: 2, joinMethod: 'Incollaggio', critical: true } } },
    { id: 'e5', source: 'proc-stamp', target: 'proc-incoll', sourceHandle: 'output__s', targetHandle: 'input__t',
      data: { typeKey: 'sequence', meta: {} } },
    { id: 'e6', source: 'proc-incoll', target: 'comp-telaio', sourceHandle: 'output__s', targetHandle: 'in__t',
      data: { typeKey: 'material', meta: { qty: 1, uom: 'pz' } } },
    { id: 'e7', source: 'equip-sega', target: 'proc-taglio', sourceHandle: 'link__s', targetHandle: 'mechanism__t',
      data: { typeKey: 'mechanism', meta: { allocation_pct: 100 } } },
    { id: 'e8', source: 'equip-pressa', target: 'proc-stamp', sourceHandle: 'link__s', targetHandle: 'mechanism__t',
      data: { typeKey: 'mechanism', meta: { allocation_pct: 100 } } },
    { id: 'e9', source: 'tool-stampo', target: 'proc-stamp', sourceHandle: 'link__s', targetHandle: 'mechanism__t',
      data: { typeKey: 'mechanism', meta: { role: 'Stampo' } } },
  ],
};
