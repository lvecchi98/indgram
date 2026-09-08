import React, { useState } from 'react';
import { summarize } from '../model/metrics.js';
import { operationSetForView } from '../model/graph.js';

/** Formatta secondi in "Xm Ys" / "Xs". */
function fmtTime(s) {
  if (!s) return '—';
  if (s < 60) return `${Math.round(s)} s`;
  const m = Math.floor(s / 60);
  const r = Math.round(s % 60);
  return r ? `${m}m ${r}s` : `${m} min`;
}
function fmtEur(v) {
  if (!v) return '—';
  return `${v.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}

const VIEW_LABEL = {
  flow: 'flusso completo', component: 'componente', equipment: 'impianto',
  tooling: 'attrezzatura', operator: 'operatore', area: 'area',
};

/**
 * Pannello riepilogo: aggrega le metriche delle operazioni della vista/target
 * correnti. I numeri provengono da src/model/metrics.js (coperto da test).
 */
export default function SummaryPanel({ model, view, target }) {
  const [open, setOpen] = useState(true);
  const ids = operationSetForView(model, view, target);
  const s = summarize(model, ids);

  return (
    <section className={`summary ${open ? 'is-open' : ''}`}>
      <button className="summary__head" onClick={() => setOpen((o) => !o)}>
        <span className="summary__title">📊 Riepilogo — {VIEW_LABEL[view] || view}</span>
        <span className="summary__count">{s.operationCount} operazioni</span>
        <span className="summary__chev">{open ? '▾' : '▸'}</span>
      </button>

      {open && (s.operationCount === 0 ? (
        <div className="summary__empty">Nessuna operazione in questa vista.</div>
      ) : (
        <div className="summary__tiles">
          <Stat label="Tempo ciclo totale" value={fmtTime(s.totalCycleTime_s)}
            sub="Σ C/T — Value Stream Mapping" />
          <Stat label="Collo di bottiglia" value={s.bottleneck ? fmtTime(s.bottleneck.cycleTime_s) : '—'}
            sub={s.bottleneck ? s.bottleneck.name : 'max C/T — Theory of Constraints'} accent="warn" />
          <Stat label="Costo totale / pezzo" value={fmtEur(s.totalCost)}
            sub="costo/pz + tempo·tariffe" />
          <Stat label="Energia" value={s.totalEnergy_kWh ? `${s.totalEnergy_kWh.toLocaleString('it-IT')} kWh/pz` : '—'}
            sub="Σ energia per pezzo" />
          <Stat label="Risorse" value={`${s.counts.equipment}🏭 · ${s.counts.tooling}🔧`}
            sub={`${s.counts.operators} operatori · ${s.counts.areas} aree`} />
        </div>
      ))}
    </section>
  );
}

function Stat({ label, value, sub, accent }) {
  return (
    <div className={`stat ${accent ? `stat--${accent}` : ''}`}>
      <div className="stat__label">{label}</div>
      <div className="stat__value">{value}</div>
      {sub && <div className="stat__sub">{sub}</div>}
    </div>
  );
}
