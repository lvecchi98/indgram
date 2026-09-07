import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  emptyStore, createProject, upsertModel, duplicateProject, deleteProject,
  selectProject, listProjects, currentProject, ensureProject,
} from '../src/model/projects.js';
import { emptyModel } from '../src/model/model.js';

const mk = (title) => ({ ...emptyModel(title) });

test('createProject: aggiunge il progetto e lo rende corrente; nome = titolo modello', () => {
  const s = createProject(emptyStore(), mk('Linea A'));
  assert.equal(listProjects(s).length, 1);
  assert.equal(currentProject(s).name, 'Linea A');
  assert.equal(s.currentId, currentProject(s).id);
});

test('upsertModel: aggiorna modello e nome del progetto corrente', () => {
  let s = createProject(emptyStore(), mk('Bozza'));
  const id = s.currentId;
  s = upsertModel(s, id, mk('Assemblaggio C'));
  assert.equal(currentProject(s).name, 'Assemblaggio C');
  assert.equal(listProjects(s).length, 1); // aggiornamento, non nuovo progetto
});

test('createProject multipli: coesistono e si può cambiare progetto', () => {
  let s = createProject(emptyStore(), mk('Uno'));
  const first = s.currentId;
  s = createProject(s, mk('Due'));
  assert.equal(listProjects(s).length, 2);
  s = selectProject(s, first);
  assert.equal(currentProject(s).name, 'Uno');
});

test('duplicateProject: crea una copia col suffisso e la rende corrente', () => {
  let s = createProject(emptyStore(), mk('Verniciatura'));
  const id = s.currentId;
  s = duplicateProject(s, id);
  assert.equal(listProjects(s).length, 2);
  assert.equal(currentProject(s).name, 'Verniciatura (copia)');
  assert.notEqual(s.currentId, id);
});

test('deleteProject: rimuove e, se era corrente, passa al più recente rimasto', () => {
  let s = createProject(emptyStore(), mk('A'));
  s = createProject(s, mk('B')); // B corrente e più recente
  const bId = s.currentId;
  s = deleteProject(s, bId);
  assert.equal(listProjects(s).length, 1);
  assert.equal(currentProject(s).name, 'A');
});

test('deleteProject dell’ultimo progetto: store senza corrente', () => {
  let s = createProject(emptyStore(), mk('Solo'));
  s = deleteProject(s, s.currentId);
  assert.equal(listProjects(s).length, 0);
  assert.equal(currentProject(s), null);
});

test('ensureProject: crea un seed solo se non c’è nessun progetto', () => {
  let s = ensureProject(emptyStore(), mk('Seed'));
  assert.equal(currentProject(s).name, 'Seed');
  const before = s.currentId;
  s = ensureProject(s, mk('Altro'));
  assert.equal(s.currentId, before); // non ne crea un secondo
});
