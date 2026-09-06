# Indgram

Editor web di **diagrammi di flusso intelligenti** per descrivere processi
produttivi industriali su più livelli: macro-processo, sotto-processi,
componenti, impianti, attrezzature e aree/reparti — con **metadati ricchi e
personalizzabili** su ogni nodo e su ogni collegamento.

## Avvio

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # build di produzione in dist/
```

All'apertura viene caricato l'esempio **"Assemblaggio telaio"** (taglio →
stampaggio → incollaggio → telaio, con impianti e attrezzature associati).

## Come si usa

- **Palette in alto**: aggiungi nodi (Processo, Componente, Impianto,
  Attrezzatura, Area).
- **Collegamenti**: trascina da un bordo di un nodo all'altro. Il pannello
  destro permette di scegliere il *tipo di arco* e i suoi metadati.
- **Pannello destro (Inspector)**: modifica i metadati dell'entità
  selezionata; i campi standard sono precompilati e puoi **aggiungere campi
  personalizzati** liberi.
- **Esporta / Importa JSON**: persistenza su file locale (versionabile con git).

## Modello dati — fondamento normativo

Il modello (`src/model/schema.js`) è derivato da standard pubblici e
verificabili, così resta interoperabile pur essendo totalmente estendibile:

| Concetto nell'app | Standard di riferimento |
|---|---|
| Semantica ICOM del nodo Processo (Input a sinistra, Control in alto, Output a destra, Mechanism in basso) | **IDEF0** — *FIPS PUB 183*, NIST, 1993, "Box and Arrow Semantics" |
| Gerarchia asset: Area / Work Center / Work Unit; categorie di risorsa (Personnel, Equipment, Physical Asset, Material) | **ISA-95 / IEC 62264-1**, "Enterprise-control system integration", modelli di equipment e resource |
| Flusso di sequenza, gateway, task | **BPMN 2.0** — *OMG / ISO/IEC 19510* |
| Distinta base (component → assembly) sull'arco `assembly` | Bill of Materials (BOM) |
| KPI di manufacturing: yield, scrap ratio, difettosità (ppm) | **ISO 22400-2** "Key performance indicators for manufacturing operations management" |
| Tempi Lean: cycle time, takt, setup/changeover, WIP | Value Stream Mapping / Lean manufacturing |

### Tipi di nodo
`process` · `component` · `equipment` (impianto) · `tooling` (attrezzatura) · `area`

### Tipi di arco (ognuno con metadati propri)
`material` (flusso di materia, IDEF0 I/O) · `control` (vincolo, IDEF0 C) ·
`mechanism` (assegnazione risorsa, IDEF0 M) · `assembly` (BOM) ·
`sequence` (BPMN Sequence Flow)

## Stack

React 18 + [React Flow (`@xyflow/react`)](https://reactflow.dev/) + Vite.
React Flow è la libreria di riferimento per editor a nodi con nodi custom e
metadati arbitrari.

## Prossimi passi possibili

- Sotto-diagrammi annidati (drill-down da macro-processo a sotto-processi)
- Validazione ICOM (ogni processo deve avere almeno un Input e un Output)
- Calcoli di bilancio (tempo ciclo totale, resa cumulata, consumo energetico)
- Indici/ricerca per componente, impianto, area
