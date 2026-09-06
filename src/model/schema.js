/**
 * MODELLO DATI — Diagrammi di processo produttivo industriale
 *
 * Fondato su standard verificabili e citabili:
 *
 *  - IEC 62264 / ISA-95 "Enterprise-control system integration"
 *    Gerarchia dei ruoli/asset (Role Based Equipment Hierarchy):
 *    Enterprise -> Site -> Area -> Work Center -> Work Unit.
 *    Categorie di risorsa: Personnel, Equipment, Physical Asset, Material.
 *    Rif.: ISA-95.00.01 / IEC 62264-1, clausole sui modelli di equipment e resource.
 *
 *  - IDEF0 (FIPS PUB 183, NIST, 1993) "Integration Definition for Function Modeling"
 *    Ogni funzione/attività ha 4 tipi di frecce ICOM:
 *      Input (I)   -> ciò che viene trasformato        (lato sinistro)
 *      Control (C) -> vincoli/condizioni che governano (lato alto)
 *      Output (O)  -> risultato della trasformazione   (lato destro)
 *      Mechanism(M)-> risorse che eseguono (impianti, attrezzature, persone) (lato basso)
 *    Rif.: FIPS PUB 183, sez. "Box and Arrow Semantics".
 *
 *  - BPMN 2.0 (OMG, ISO/IEC 19510) "Business Process Model and Notation"
 *    Semantica del flusso: Task, Sequence Flow, Gateway (divergenza/convergenza).
 *    Rif.: OMG BPMN 2.0.2, tabella degli elementi di flusso.
 *
 * NOTA sull'estensibilità: ogni entità porta un dizionario `meta` libero,
 * così lo schema resta interoperabile con gli standard MA totalmente
 * personalizzabile. I campi elencati qui sotto sono i "campi noti"
 * pre-popolati nel pannello; l'utente può aggiungerne di arbitrari.
 */

// ---------------------------------------------------------------------------
// TIPI DI NODO
// ---------------------------------------------------------------------------

export const NODE_TYPES = {
  process: {
    key: 'process',
    label: 'Processo / Trasformazione',
    short: 'Processo',
    color: '#2563eb',
    icon: '⚙️',
    standard: 'IDEF0 activity (FIPS 183) + BPMN Task',
    // Handle disposti secondo la semantica ICOM di IDEF0
    handles: {
      input: { side: 'left', label: 'Input (materia)' },
      control: { side: 'top', label: 'Control (vincoli)' },
      output: { side: 'right', label: 'Output' },
      mechanism: { side: 'bottom', label: 'Mechanism (risorse)' },
    },
    fields: [
      // -- Identificazione --
      { key: 'code', label: 'Codice processo', type: 'text', group: 'Identificazione' },
      { key: 'processType', label: 'Tipo trasformazione', type: 'select', group: 'Identificazione',
        options: ['Taglio', 'Stampaggio', 'Laminazione', 'Incollaggio',
                  'Assemblaggio', 'Saldatura', 'Trattamento termico',
                  'Verniciatura', 'Controllo qualità', 'Altro'] },
      { key: 'description', label: 'Descrizione', type: 'textarea', group: 'Identificazione' },

      // -- Tempi (Lean / value stream) --
      { key: 'cycleTime_s', label: 'Tempo ciclo C/T [s]', type: 'number', group: 'Tempi (Lean)' },
      { key: 'taktTime_s', label: 'Takt time [s]', type: 'number', group: 'Tempi (Lean)' },
      { key: 'setupTime_s', label: 'Setup / changeover C/O [s]', type: 'number', group: 'Tempi (Lean)' },
      { key: 'waitTime_s', label: 'Tempo di attesa [s]', type: 'number', group: 'Tempi (Lean)' },
      { key: 'wip_pcs', label: 'WIP [pz]', type: 'number', group: 'Tempi (Lean)' },
      { key: 'throughput_uh', label: 'Cadenza [pz/h]', type: 'number', group: 'Tempi (Lean)' },
      { key: 'operators', label: 'N. operatori', type: 'number', group: 'Tempi (Lean)' },

      // -- Qualità / KPI (ISO 22400-2) --
      { key: 'yield_pct', label: 'Resa / Yield [%]', type: 'number', group: 'Qualità (ISO 22400)' },
      { key: 'scrapRatio_pct', label: 'Scrap ratio [%]', type: 'number', group: 'Qualità (ISO 22400)' },
      { key: 'defect_ppm', label: 'Difettosità [ppm]', type: 'number', group: 'Qualità (ISO 22400)' },
      { key: 'ctq', label: 'Caratteristica critica (CTQ)', type: 'text', group: 'Qualità (ISO 22400)' },
      { key: 'controlParam', label: 'Parametro controllato', type: 'text', group: 'Qualità (ISO 22400)' },
      { key: 'tolerance', label: 'Tolleranza', type: 'text', group: 'Qualità (ISO 22400)' },

      // -- Costo --
      { key: 'costPerPiece', label: 'Costo / pezzo [€]', type: 'number', group: 'Costo' },
      { key: 'machineCostRate_h', label: 'Costo macchina [€/h]', type: 'number', group: 'Costo' },
      { key: 'laborCostRate_h', label: 'Costo manodopera [€/h]', type: 'number', group: 'Costo' },
      { key: 'costCenter', label: 'Centro di costo', type: 'text', group: 'Costo' },

      // -- Risorse --
      { key: 'energy_kWh', label: 'Energia [kWh/pz]', type: 'number', group: 'Risorse' },
    ],
  },

  component: {
    key: 'component',
    label: 'Componente / Materia',
    short: 'Componente',
    color: '#059669',
    icon: '🧩',
    standard: 'ISA-95 Material + BPMN Data Object',
    handles: {
      in: { side: 'left', label: 'in' },
      out: { side: 'right', label: 'out' },
    },
    fields: [
      { key: 'partNumber', label: 'Part Number', type: 'text' },
      { key: 'materialClass', label: 'Classe materiale (ISA-95)', type: 'select',
        options: ['Materia prima', 'Semilavorato', 'Prodotto finito',
                  'Componente acquistato', 'Consumabile'] },
      { key: 'material', label: 'Materiale', type: 'text' },
      { key: 'qty', label: 'Quantità', type: 'number' },
      { key: 'uom', label: 'Unità di misura', type: 'text' },
      { key: 'mass_kg', label: 'Massa [kg]', type: 'number' },
      { key: 'supplier', label: 'Fornitore', type: 'text' },
    ],
  },

  equipment: {
    key: 'equipment',
    label: 'Impianto',
    short: 'Impianto',
    color: '#d97706',
    icon: '🏭',
    standard: 'ISA-95 Equipment (Work Unit) + IDEF0 Mechanism',
    handles: {
      link: { side: 'top', label: 'usa' },
    },
    fields: [
      { key: 'assetTag', label: 'Asset tag', type: 'text' },
      { key: 'isa95Level', label: 'Livello ISA-95', type: 'select',
        options: ['Work Center', 'Work Unit', 'Equipment Module'] },
      { key: 'manufacturer', label: 'Costruttore', type: 'text' },
      { key: 'model', label: 'Modello', type: 'text' },
      { key: 'capacity', label: 'Capacità nominale', type: 'text' },
      { key: 'power_kW', label: 'Potenza [kW]', type: 'number' },
      { key: 'oee_pct', label: 'OEE [%]', type: 'number' },
    ],
  },

  tooling: {
    key: 'tooling',
    label: 'Attrezzatura',
    short: 'Attrezzatura',
    color: '#7c3aed',
    icon: '🔧',
    standard: 'ISA-95 Physical Asset + IDEF0 Mechanism',
    handles: {
      link: { side: 'top', label: 'usa' },
    },
    fields: [
      { key: 'toolId', label: 'ID attrezzatura', type: 'text' },
      { key: 'toolType', label: 'Tipo', type: 'select',
        options: ['Stampo', 'Utensile', 'Maschera / Fixture', 'Calibro',
                  'Attrezzo manuale', 'Altro'] },
      { key: 'lifeCycles', label: 'Vita utile [cicli]', type: 'number' },
      { key: 'maintInterval', label: 'Intervallo manutenzione', type: 'text' },
    ],
  },

  area: {
    key: 'area',
    label: 'Area / Reparto',
    short: 'Area',
    color: '#0891b2',
    icon: '📍',
    standard: 'ISA-95 Area / Work Center (equipment hierarchy)',
    handles: {
      link: { side: 'top', label: 'contiene' },
    },
    fields: [
      { key: 'areaCode', label: 'Codice area', type: 'text' },
      { key: 'isa95Level', label: 'Livello ISA-95', type: 'select',
        options: ['Site', 'Area', 'Work Center'] },
      { key: 'surface_m2', label: 'Superficie [m²]', type: 'number' },
      { key: 'department', label: 'Reparto', type: 'text' },
      { key: 'costCenter', label: 'Centro di costo', type: 'text' },
    ],
  },
};

// ---------------------------------------------------------------------------
// TIPI DI ARCO (edge)
// Ogni arco è un'entità con metadati propri (richiesta esplicita dell'utente:
// il nodo/collegamento che unisce due componenti per crearne un terzo porta metadati).
// ---------------------------------------------------------------------------

export const EDGE_TYPES = {
  material: {
    key: 'material',
    label: 'Flusso di materia',
    color: '#059669',
    animated: true,
    standard: 'IDEF0 Input/Output arrow',
    fields: [
      { key: 'qty', label: 'Quantità trasferita', type: 'number' },
      { key: 'uom', label: 'Unità di misura', type: 'text' },
      { key: 'state', label: 'Stato materia', type: 'select',
        options: ['Solido', 'Liquido', 'Granulo', 'Foglio/Lamina', 'Assemblato'] },
      { key: 'transport', label: 'Mezzo di trasporto', type: 'text' },
    ],
  },
  control: {
    key: 'control',
    label: 'Controllo / Vincolo',
    color: '#dc2626',
    animated: false,
    standard: 'IDEF0 Control arrow',
    fields: [
      { key: 'spec', label: 'Specifica / Norma', type: 'text' },
      { key: 'parameter', label: 'Parametro controllato', type: 'text' },
      { key: 'tolerance', label: 'Tolleranza', type: 'text' },
    ],
  },
  mechanism: {
    key: 'mechanism',
    label: 'Assegnazione risorsa',
    color: '#d97706',
    animated: false,
    standard: 'IDEF0 Mechanism arrow',
    fields: [
      { key: 'role', label: 'Ruolo', type: 'text' },
      { key: 'allocation_pct', label: 'Allocazione [%]', type: 'number' },
    ],
  },
  assembly: {
    key: 'assembly',
    label: 'Assemblaggio (BOM)',
    color: '#2563eb',
    animated: false,
    standard: 'Distinta base / BOM (component -> assembly)',
    fields: [
      // -- BOM --
      { key: 'qtyPer', label: 'Q.tà per assemblato', type: 'number', group: 'BOM' },
      { key: 'joinMethod', label: 'Metodo di giunzione', type: 'select', group: 'BOM',
        options: ['Incollaggio', 'Saldatura', 'Avvitatura', 'Rivettatura',
                  'Incastro', 'Altro'] },
      { key: 'critical', label: 'Giunzione critica', type: 'boolean', group: 'BOM' },
      // -- Parametri di processo della giunzione --
      { key: 'torque_Nm', label: 'Coppia di serraggio [N·m]', type: 'number', group: 'Parametri giunzione' },
      { key: 'temp_C', label: 'Temperatura [°C]', type: 'number', group: 'Parametri giunzione' },
      { key: 'time_s', label: 'Tempo [s]', type: 'number', group: 'Parametri giunzione' },
      { key: 'force_N', label: 'Forza [N]', type: 'number', group: 'Parametri giunzione' },
      { key: 'consumable', label: 'Adesivo / consumabile', type: 'text', group: 'Parametri giunzione' },
      { key: 'consumableQty', label: 'Q.tà consumabile', type: 'text', group: 'Parametri giunzione' },
      { key: 'standardRef', label: 'Norma di riferimento', type: 'text', group: 'Parametri giunzione' },
    ],
  },
  sequence: {
    key: 'sequence',
    label: 'Sequenza di processo',
    color: '#64748b',
    animated: false,
    standard: 'BPMN Sequence Flow',
    fields: [
      { key: 'condition', label: 'Condizione (gateway)', type: 'text' },
    ],
  },
};

// Metadati comuni a tutte le entità
export const COMMON_ENTITY_FIELDS = [
  { key: 'owner', label: 'Responsabile', type: 'text' },
  { key: 'notes', label: 'Note', type: 'textarea' },
];

export function newNodeMeta(typeKey) {
  return { name: '', level: 0, meta: {}, extra: {} };
}

export const SCHEMA_VERSION = '0.1.0';
