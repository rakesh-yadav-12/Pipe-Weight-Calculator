/* This file only reads the inputs and talks to the server.
   Every calculation happens in Python (see app.py -> calc_weight). */

const g = id => document.getElementById(id);
const ID = { od: 'wc-od', a: 'wc-a', b: 'wc-b', t: 'wc-t', rate: 'wc-rate' };
const fmt = (n, d) => Number(n).toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d });
const state = { mode: 'round', view: 'rate' };
const LABELS = { mode: { round: 'Round Pipe', hollow: 'Hollow Section' }, view: { rate: 'Rate (\u20B9)', weight: 'Weight (kg)' } };
const radio = name => (name === 'wc-mode' ? state.mode : state.view);
function toggle(kind) {
  const opts = kind === 'mode' ? ['round', 'hollow'] : ['rate', 'weight'];
  state[kind] = state[kind] === opts[0] ? opts[1] : opts[0];
  g('wc-tg-' + kind).querySelector('span').textContent = LABELS[kind][state[kind]];
  applyLayout();
}
let reqSeq = 0;

function val(k) { return g(ID[k]).value; }

function clearOut() { g('wc-out').className = 'wc-out'; g('wc-out').replaceChildren(); }

function showMsg(text, warn) {
  const o = g('wc-out');
  o.className = 'wc-out ' + (warn ? 'warn' : 'hint');
  o.replaceChildren(Object.assign(document.createElement('p'), { textContent: text }));
}

function row(label, value) {
  const p = document.createElement('p');
  p.className = 'wc-row';
  const s = document.createElement('span'); s.textContent = label + ': ';
  const b = document.createElement('b'); b.textContent = value;
  p.append(s, b);
  return p;
}

function describe(mode, view) {
  const t = val('t'), rate = val('rate');
  const size = mode === 'round'
    ? val('od') + ' mm OD x ' + t + ' mm thick round pipe'
    : val('a') + ' x ' + val('b') + ' mm, ' + t + ' mm thick hollow section';
  return (view === 'rate' ? 'Rate for ' : 'Weight for ') + size + (view === 'rate' ? ' at \u20B9' + rate + '/kg' : '') + ':';
}

async function calculate() {
  const mode = radio('wc-mode'), view = radio('wc-view');
  const mySeq = ++reqSeq;
  let r;
  try {
    const res = await fetch('/api/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode, view, od: val('od'), a: val('a'), b: val('b'), t: val('t'), rate: val('rate') })
    });
    r = await res.json();
  } catch (e) {
    showMsg('Could not reach the server - please try again.', true);
    return;
  }
  if (mySeq !== reqSeq) return;

  if (view === 'rate') {
    if (!r.rate_ok) { showMsg(r.message || 'Enter rate per kg', !/^Enter/.test(r.message || 'Enter')); return; }
    const o = g('wc-out'); o.className = 'wc-out ok';
    o.replaceChildren(
      Object.assign(document.createElement('p'), { textContent: describe(mode, view) }),
      row('Rate / MTR', '\u20B9 ' + fmt(r.rate_per_metre, 2)),
      row('Rate / Foot', '\u20B9 ' + fmt(r.rate_per_foot, 2))
    );
  } else {
    if (!r.ok) { showMsg(r.message, !/^Enter/.test(r.message)); return; }
    const o = g('wc-out'); o.className = 'wc-out ok';
    const lines = [Object.assign(document.createElement('p'), { textContent: describe(mode, view) })];
    if (mode === 'hollow' && r.equivalent_od) lines.push(row('Equivalent OD', fmt(r.equivalent_od, 2) + ' mm'));
    lines.push(row('Kg / MTR', fmt(r.kg_per_metre, 3) + ' kg'));
    lines.push(row('Weight / Pipe (' + fmt(r.length_m, 2) + ' m)', fmt(r.weight_per_pipe, 2) + ' kg'));
    o.replaceChildren(...lines);
  }
}

let liveTimer = 0;
function liveCalc() { clearTimeout(liveTimer); liveTimer = setTimeout(calculate, 120); }

function applyLayout() {
  const mode = radio('wc-mode'), view = radio('wc-view');
  document.querySelectorAll('.wc-r').forEach(x => x.classList.toggle('wc-hide', mode !== 'round'));
  document.querySelectorAll('.wc-h').forEach(x => x.classList.toggle('wc-hide', mode === 'round'));
  document.querySelectorAll('.vr').forEach(x => x.classList.toggle('wc-hide', view !== 'rate'));
  calculate();
}

Object.keys(ID).forEach(k => {
  const i = g(ID[k]);
  i.addEventListener('input', () => {
    const v = i.value.replace(/,/g, '.').replace(/[^0-9.]/g, '').replace(/^(\d*\.\d*)\./, '$1');
    if (v !== i.value) i.value = v;
    liveCalc();
  });
  i.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); calculate(); } });
});

g('wc-tg-mode').onclick = () => toggle('mode');
g('wc-tg-view').onclick = () => toggle('view');
g('wc-clr').onclick = () => {
  Object.keys(ID).forEach(k => g(ID[k]).value = '');
  calculate();
  try { g(radio('wc-mode') === 'round' ? 'wc-od' : 'wc-a').focus({ preventScroll: true }); } catch (e) {}
};

applyLayout();
