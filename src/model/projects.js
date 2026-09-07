/**
 * GESTIONE PROGETTI (logica pura, testabile — nessun localStorage, nessun React).
 *
 * Uno "store" raccoglie più progetti (processi) dello stesso utente:
 *   { projects: { [id]: { id, name, model, createdAt, updatedAt } }, currentId }
 * Il nome del progetto è sempre il titolo del suo modello (una sola verità).
 * La persistenza vera (localStorage) è in storage.js: qui solo trasformazioni
 * pure, così i comportamenti sono verificabili con i test.
 */

import { uid, emptyModel } from './model.js';

export function emptyStore() {
  return { projects: {}, currentId: null };
}

const nameOf = (model) => (model?.title || '').trim() || 'Senza nome';

/** Crea un progetto dal modello dato e lo rende corrente. */
export function createProject(store, model) {
  const id = uid('prj');
  const now = Date.now();
  const project = { id, name: nameOf(model), model, createdAt: now, updatedAt: now };
  return { ...store, projects: { ...store.projects, [id]: project }, currentId: id };
}

/** Aggiorna il modello del progetto `id` (usato dall'autosave). */
export function upsertModel(store, id, model) {
  const prev = store.projects[id];
  if (!prev) return store;
  const project = { ...prev, name: nameOf(model), model, updatedAt: Date.now() };
  return { ...store, projects: { ...store.projects, [id]: project } };
}

/** Duplica un progetto (nome + " (copia)"), rendendo corrente la copia. */
export function duplicateProject(store, id) {
  const src = store.projects[id];
  if (!src) return store;
  const copyModel = { ...src.model, title: `${nameOf(src.model)} (copia)` };
  return createProject(store, copyModel);
}

/** Elimina un progetto; se era corrente, passa al più recente rimasto. */
export function deleteProject(store, id) {
  if (!store.projects[id]) return store;
  const projects = { ...store.projects };
  delete projects[id];
  let currentId = store.currentId;
  if (currentId === id) {
    const rest = Object.values(projects).sort((a, b) => b.updatedAt - a.updatedAt);
    currentId = rest.length ? rest[0].id : null;
  }
  return { ...store, projects, currentId };
}

/** Seleziona il progetto corrente. */
export function selectProject(store, id) {
  return store.projects[id] ? { ...store, currentId: id } : store;
}

/** Progetti ordinati per ultima modifica (più recente prima). */
export function listProjects(store) {
  return Object.values(store.projects).sort((a, b) => b.updatedAt - a.updatedAt);
}

export function currentProject(store) {
  return (store.currentId && store.projects[store.currentId]) || null;
}

/** Garantisce almeno un progetto: se lo store è vuoto ne crea uno (seed). */
export function ensureProject(store, seedModel) {
  if (currentProject(store)) return store;
  return createProject(store, seedModel || emptyModel());
}
