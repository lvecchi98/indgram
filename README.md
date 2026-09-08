# Indgram

Editor web per descrivere processi produttivi industriali come **rete di
operazioni**, con **entità "viventi"** (metadati registrati una volta sola e
condivisi) e **viste filtrabili** dello stesso modello: flusso completo,
per componente, per impianto, per attrezzatura, per operatore, per area.

## Avvio

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # build di produzione
npm test         # verifica per codice della logica (grafo, metriche, progetti)
```

## Salvataggio e progetti

I dati si salvano **automaticamente nel browser** (`localStorage`, Web Storage
API — MDN): il lavoro sopravvive a reload e chiusura del tab. Nella toolbar il
menu 🗂 gestisce **più progetti** (nuovo, duplica, elimina, cambio rapido).

`localStorage` è legato a **quel browser su quel computer** e non si sincronizza
tra dispositivi: per spostare un processo su un altro PC usa **Esporta JSON** →
**Importa JSON** (che lo carica come nuovo progetto).

## Pubblicazione (GitHub Pages)

Il workflow `.github/workflows/deploy.yml` compila e pubblica l'app a ogni push
su `main`. Prerequisito una tantum: **Settings → Pages → Source = GitHub
Actions**. URL risultante: `https://<utente>.github.io/indgram/`. Da lì è
usabile da qualsiasi computer (anche Windows) con il solo browser, senza
installare nulla.

## Concetto chiave: dati normalizzati, diagramma derivato

Il diagramma **non** si disegna a mano: si descrivono le **operazioni** con un
form guidato e il flusso si **genera da solo**.

- **Entità (anagrafica)** — componenti, impianti, attrezzature (con seriali),
  operatori, aree. Registrate una volta sola con i loro metadati. Sono
  "viventi": modificandone una, il cambiamento si riflette ovunque sia usata
  (single source of truth). Modello risorse di **ISA-95 / IEC 62264**
  (Equipment, Material, Personnel, Physical Asset).
- **Operazioni** — i passi di processo. Non duplicano i dati: li
  **referenziano** (input/output = componenti; impianto; attrezzature+seriali;
  operatori; area) più i propri parametri di trasformazione (IDEF0 I-C-O-M,
  *FIPS PUB 183*).
- **Flusso** — derivato: due operazioni sono collegate quando un componente
  prodotto dall'una è consumato dall'altra. È una **rete di operazioni**
  (framework *P-graph*, Friedler et al., 1992; equivalente a una rete di Petri
  con posti = materiali, transizioni = operazioni). Layout automatico (dagre).

## Viste (proiezioni dello stesso modello)

| Vista | Cosa mostra |
|---|---|
| **Flusso completo** | L'intera rete di operazioni con materie in ingresso e prodotti |
| **Per componente** | La genealogia di un componente: da quali fasi/sotto-processi passa, risalita ai componenti padre (A, B → C) |
| **Per impianto** | Solo ciò che si esegue su quell'impianto (es. JM010), con componenti lavorati e attrezzature |
| **Per attrezzatura** | Dove e come è impiegata un'attrezzatura (es. TL001) e i suoi seriali |
| **Per operatore / area** | Operazioni svolte da un operatore o in un'area/reparto |

## Pannello riepilogo

Sotto il diagramma, un **riepilogo** aggrega le metriche delle operazioni
della vista/target correnti (es. solo ciò che gira su JM010, o l'intera
genealogia di C):

- **Tempo ciclo totale** = Σ C/T e **collo di bottiglia** = max C/T
  (Value Stream Mapping — Rother & Shook, *Learning to See*, LEI 1999;
  Theory of Constraints — Goldratt, *The Goal*, 1984).
- **Costo totale / pezzo** = Σ [ costo/pz + (C/T+setup)/3600 · (tariffa
  macchina + tariffa manodopera · n. operatori) ] (activity-based per centro
  di lavoro).
- **Conteggi risorse** — impianti, attrezzature, operatori, aree *distinti* +
  energia totale (inventario risorse ISA-95).

I calcoli sono in `src/model/metrics.js`, verificati da test (`npm test`).

## Esempio incluso

Riproduce il caso: **Componenti A e B** → carteggiatura manuale (operatore)
nella cabina **FC005** → incollaggio sul robot **JM010** con le 3 maschere di
assemblaggio **TL001** (3 seriali) → nasce il **Componente C**.

## Fonti (verificabili)

IDEF0 (*FIPS PUB 183*, NIST 1993) · ISA-95 (*IEC 62264-1*) · BPMN 2.0
(*OMG / ISO/IEC 19510*) · ISO 22400-2 (KPI manufacturing) · P-graph
(Friedler, Tarján, Huang, Fan, *Chem. Eng. Sci.* 1992).

## Stack

React 18 · React Flow (`@xyflow/react`) · dagre (`@dagrejs/dagre`) · Vite.
Logica di derivazione in `src/model/graph.js`, coperta da test (`npm test`).
