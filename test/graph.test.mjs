import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildFullGraph, componentTrace, operationSetForView, graphForView,
} from '../src/model/graph.js';
import { sampleModel } from '../src/data/sampleModel.js';

test('grafo completo: 3 operazioni + materie raw A,B + prodotto finito C', () => {
  const g = buildFullGraph(sampleModel);
  const ops = g.nodes.filter((n) => n.kind === 'operation');
  const raw = g.nodes.filter((n) => n.role === 'raw');
  const fin = g.nodes.filter((n) => n.role === 'finished');
  assert.equal(ops.length, 3);
  assert.deepEqual(raw.map((n) => n.refId).sort(), ['cmpA', 'cmpB']);
  assert.deepEqual(fin.map((n) => n.refId), ['cmpC']);
});

test('precedenza: carteggiature -> incollaggio, nessun self-loop', () => {
  const g = buildFullGraph(sampleModel);
  const prec = g.edges.filter((e) => e.source.startsWith('op:') && e.target.startsWith('op:'));
  // opCartA->opIncoll (A) e opCartB->opIncoll (B)
  assert.equal(prec.length, 2);
  assert.ok(prec.every((e) => e.source !== e.target), 'nessun self-loop');
  const toIncoll = prec.filter((e) => e.target === 'op:opIncoll');
  assert.equal(toIncoll.length, 2);
});

test('genealogia di C risale a incollaggio e alle due carteggiature', () => {
  const trace = componentTrace(sampleModel, 'cmpC');
  assert.deepEqual([...trace].sort(), ['opCartA', 'opCartB', 'opIncoll'].sort());
});

test('vista per impianto JM010 = solo incollaggio', () => {
  const s = operationSetForView(sampleModel, 'equipment', 'jm010');
  assert.deepEqual([...s], ['opIncoll']);
});

test('vista per impianto FC005 = le due carteggiature', () => {
  const s = operationSetForView(sampleModel, 'equipment', 'fc005');
  assert.deepEqual([...s].sort(), ['opCartA', 'opCartB'].sort());
});

test('vista per attrezzatura TL001 = solo incollaggio', () => {
  const s = operationSetForView(sampleModel, 'tooling', 'tl001');
  assert.deepEqual([...s], ['opIncoll']);
});

test('proiezione vista impianto JM010: mostra incollaggio con input A,B e output C', () => {
  const g = graphForView(sampleModel, 'equipment', 'jm010');
  const ops = g.nodes.filter((n) => n.kind === 'operation');
  assert.deepEqual(ops.map((n) => n.refId), ['opIncoll']);
  const mats = g.nodes.filter((n) => n.kind === 'material').map((n) => n.refId).sort();
  assert.deepEqual(mats, ['cmpA', 'cmpB', 'cmpC']);
});
