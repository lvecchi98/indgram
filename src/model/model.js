/**
 * MODELLO DATI NORMALIZZATO — "entità viventi" + "operazioni".
 *
 * Idea centrale (single source of truth):
 *   - Le ENTITÀ (componenti, impianti, attrezzature, operatori, aree) sono
 *     registrate UNA volta sola in un'anagrafica, ciascuna con i propri
 *     metadati. Questo è il modello risorse di ISA-95 / IEC 62264
 *     (Equipment, Material, Personnel, Physical Asset).
 *   - Le OPERAZIONI (i passi di processo) NON duplicano i dati: li
 *     REFERENZIANO per id. Un'operazione ha input/output (componenti),
 *     un impianto, attrezzature (con seriali), operatori, un'area e i
 *     propri parametri di trasformazione (IDEF0 I-C-O-M; FIPS PUB 183).
 *
 * Il diagramma di flusso è DERIVATO da questo modello (vedi graph.js):
 * è una rete di operazioni collegate dai componenti che si scambiano —
 * formalmente una rete di processo (framework P-graph, Friedler et al.,
 * "Graph-theoretic approach to process synthesis", 1992; equivalente a
 * una rete di Petri con posti = materiali e transizioni = operazioni).
 *
 * Le "viste" (flusso, per componente, per impianto, per attrezzatura) sono
 * proiezioni/filtri della stessa rete: nessun dato viene duplicato.
 */

export const MODEL_VERSION = '0.2.0';

let _seq = 0;
export function uid(prefix = 'id') {
  _seq += 1;
  return `${prefix}_${Date.now().toString(36)}${_seq.toString(36)}`;
}

// ---------------------------------------------------------------------------
// Definizione dei tipi di ENTITÀ dell'anagrafica
// ---------------------------------------------------------------------------

export const ENTITY_DEFS = {
  component: {
    kind: 'component', label: 'Componente / Materia', short: 'Componente',
    color: '#059669', icon: '🧩', prefix: 'CMP',
    standard: 'ISA-95 Material',
    fields: [
      { key: 'code', label: 'Codice / Part Number', type: 'text', group: 'Identificazione' },
      { key: 'materialClass', label: 'Classe (ISA-95)', type: 'select', group: 'Identificazione',
        options: ['Materia prima', 'Semilavorato', 'Prodotto finito', 'Componente acquistato', 'Consumabile'] },
      { key: 'material', label: 'Materiale', type: 'text', group: 'Identificazione' },
      { key: 'mass_kg', label: 'Massa [kg]', type: 'number', group: 'Fisico' },
      { key: 'uom', label: 'Unità di misura', type: 'text', group: 'Fisico' },
      { key: 'supplier', label: 'Fornitore', type: 'text', group: 'Approvvigionamento' },
    ],
  },
  equipment: {
    kind: 'equipment', label: 'Impianto', short: 'Impianto',
    color: '#d97706', icon: '🏭', prefix: 'EQ',
    standard: 'ISA-95 Equipment (Work Unit)',
    fields: [
      { key: 'code', label: 'Asset tag', type: 'text', group: 'Identificazione' },
      { key: 'isa95Level', label: 'Livello ISA-95', type: 'select', group: 'Identificazione',
        options: ['Work Center', 'Work Unit', 'Equipment Module'] },
      { key: 'manufacturer', label: 'Costruttore', type: 'text', group: 'Identificazione' },
      { key: 'model', label: 'Modello', type: 'text', group: 'Identificazione' },
      { key: 'power_kW', label: 'Potenza [kW]', type: 'number', group: 'Prestazioni' },
      { key: 'oee_pct', label: 'OEE [%]', type: 'number', group: 'Prestazioni' },
    ],
  },
  tooling: {
    kind: 'tooling', label: 'Attrezzatura', short: 'Attrezzatura',
    color: '#7c3aed', icon: '🔧', prefix: 'TL',
    standard: 'ISA-95 Physical Asset',
    fields: [
      { key: 'code', label: 'Codice attrezzatura', type: 'text', group: 'Identificazione' },
      { key: 'toolType', label: 'Tipo', type: 'select', group: 'Identificazione',
        options: ['Stampo', 'Maschera / Fixture', 'Utensile', 'Calibro', 'Attrezzo manuale', 'Altro'] },
      { key: 'serials', label: 'Seriali (uno per riga)', type: 'list', group: 'Identificazione' },
      { key: 'lifeCycles', label: 'Vita utile [cicli]', type: 'number', group: 'Manutenzione' },
      { key: 'maintInterval', label: 'Intervallo manutenzione', type: 'text', group: 'Manutenzione' },
    ],
  },
  operator: {
    kind: 'operator', label: 'Operatore / Ruolo', short: 'Operatore',
    color: '#db2777', icon: '👤', prefix: 'OP',
    standard: 'ISA-95 Personnel',
    fields: [
      { key: 'code', label: 'Matricola / Codice', type: 'text', group: 'Identificazione' },
      { key: 'role', label: 'Ruolo / Mansione', type: 'text', group: 'Identificazione' },
      { key: 'shift', label: 'Turno', type: 'text', group: 'Organizzazione' },
      { key: 'certification', label: 'Certificazioni', type: 'text', group: 'Organizzazione' },
    ],
  },
  area: {
    kind: 'area', label: 'Area / Reparto', short: 'Area',
    color: '#0891b2', icon: '📍', prefix: 'AR',
    standard: 'ISA-95 Area / Work Center',
    fields: [
      { key: 'code', label: 'Codice area', type: 'text', group: 'Identificazione' },
      { key: 'isa95Level', label: 'Livello ISA-95', type: 'select', group: 'Identificazione',
        options: ['Site', 'Area', 'Work Center'] },
      { key: 'surface_m2', label: 'Superficie [m²]', type: 'number', group: 'Logistica' },
      { key: 'costCenter', label: 'Centro di costo', type: 'text', group: 'Logistica' },
    ],
  },
};

export const ENTITY_KINDS = Object.keys(ENTITY_DEFS);

// Colore/definizione anche per l'operazione (nodo processo).
export const OPERATION_DEF = {
  kind: 'operation', label: 'Operazione / Processo', short: 'Operazione',
  color: '#2563eb', icon: '⚙️',
  standard: 'IDEF0 activity (FIPS 183) + BPMN Task',
};

export const PROCESS_TYPES = [
  'Taglio', 'Stampaggio', 'Laminazione', 'Carteggiatura', 'Incollaggio',
  'Assemblaggio', 'Saldatura', 'Avvitatura', 'Trattamento termico',
  'Verniciatura', 'Controllo qualità', 'Movimentazione', 'Altro',
];

// Parametri (metadati) dell'operazione, raggruppati per sezione.
export const OPERATION_FIELDS = [
  { key: 'cycleTime_s', label: 'Tempo ciclo C/T [s]', type: 'number', group: 'Tempi (Lean)' },
  { key: 'setupTime_s', label: 'Setup / changeover [s]', type: 'number', group: 'Tempi (Lean)' },
  { key: 'taktTime_s', label: 'Takt time [s]', type: 'number', group: 'Tempi (Lean)' },
  { key: 'operators', label: 'N. operatori', type: 'number', group: 'Tempi (Lean)' },
  { key: 'yield_pct', label: 'Resa / Yield [%]', type: 'number', group: 'Qualità (ISO 22400)' },
  { key: 'scrapRatio_pct', label: 'Scrap ratio [%]', type: 'number', group: 'Qualità (ISO 22400)' },
  { key: 'defect_ppm', label: 'Difettosità [ppm]', type: 'number', group: 'Qualità (ISO 22400)' },
  { key: 'ctq', label: 'Caratteristica critica (CTQ)', type: 'text', group: 'Qualità (ISO 22400)' },
  { key: 'costPerPiece', label: 'Costo / pezzo [€]', type: 'number', group: 'Costo' },
  { key: 'machineCostRate_h', label: 'Costo macchina [€/h]', type: 'number', group: 'Costo' },
  { key: 'laborCostRate_h', label: 'Costo manodopera [€/h]', type: 'number', group: 'Costo' },
  { key: 'energy_kWh', label: 'Energia [kWh/pz]', type: 'number', group: 'Risorse' },
  { key: 'notes', label: 'Note', type: 'textarea', group: 'Altro' },
];

// ---------------------------------------------------------------------------
// Helper sul modello
// ---------------------------------------------------------------------------

export function emptyModel(title = 'Nuovo processo') {
  return {
    version: MODEL_VERSION,
    title,
    entities: { component: {}, equipment: {}, tooling: {}, operator: {}, area: {} },
    operations: [],
  };
}

export function listEntities(model, kind) {
  return Object.values(model.entities[kind] || {});
}

export function getEntity(model, kind, id) {
  return model.entities[kind]?.[id] || null;
}

/** Restituisce label leggibile "CODICE — Nome" per un'entità. */
export function entityLabel(entity) {
  if (!entity) return '—';
  const code = entity.meta?.code;
  return code ? `${code} — ${entity.name || ''}`.trim().replace(/—\s*$/, '').trim() : (entity.name || '(senza nome)');
}
