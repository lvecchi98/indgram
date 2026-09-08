/**
 * PERSISTENZA nel browser via localStorage.
 *
 * localStorage conserva i dati sullo STESSO browser dello STESSO computer, e
 * sopravvive a reload e chiusura del tab (Web Storage API — MDN,
 * "Window.localStorage"). Non si sincronizza tra dispositivi: per spostare i
 * dati tra PC si usa Esporta/Importa JSON. Tutte le operazioni sono protette
 * da try/catch perché lo storage può essere assente o disabilitato (es.
 * navigazione privata).
 */

import { emptyStore } from './projects.js';

const KEY = 'indgram:store:v1';

export function loadStore() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !parsed.projects) return emptyStore();
    return parsed;
  } catch {
    return emptyStore();
  }
}

export function saveStore(store) {
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
    return true;
  } catch {
    return false; // storage pieno o non disponibile
  }
}
