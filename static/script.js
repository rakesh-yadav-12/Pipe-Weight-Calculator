/* This file only reads the inputs and talks to the server.
   Every calculation happens in Python (see app.py -> calc_weight). */

const V = { od: '', a: '', b: '', t: '' };
let mode = 'round';
let reqSeq = 0; // ignore stale/slow responses if the user types fast

const g = id => document.getElementById(id);
const ID = { od: 'wc-od', a: 'wc-a', b: 'wc-b', t: 'wc-t' };
const fmt = (n, d) => Number(n).toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d });
const pop = id => { const c = g(id); c.classList.remove('pop'); void c.offsetWidth; c.classList.add('pop'); };

let last = '';

async function recalc() {
  const mySeq = ++reqSeq;
  const payload = { mode, od: V.od, a: V.a, b: V.b, t: V.t };

  let r;
  try {
    const res = await fetch('/api/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    r = await res.json();
  } catch (e) {
    g('wc-er').className = 'wc-er';
    g('wc-er').textContent = 'Could not reach the server - is app.py still running?';
    return;
  }
  if (mySeq !== reqSeq) return; // a newer request already came back

  g('wc-v1').textContent = r.ok ? fmt(r.kg_per_metre, 3) : '–';
  g('wc-v2').textContent = r.ok ? fmt(r.weight_per_pipe, 2) : '–';
  g('wc-eq').textContent = mode === 'hollow' && r.equivalent_od ? fmt(r.equivalent_od, 2) + ' mm' : '-';

  const sig = r.ok ? String(r.kg_per_metre) : '';
  if (sig && sig !== last) { pop('wc-k1'); pop('wc-k2'); }
  last = sig;

  const fx = g('wc-fx');
  const t = Number(V.t) || 0, a = Number(V.a) || 0, b = Number(V.b) || 0;
  if (r.ok) {
    fx.innerHTML = (mode === 'round' ? '' : '<b>OD</b> = (' + a + ' + ' + b + ') &times; 0.6363 = <b>' + fmt(r.equivalent_od, 2) + '</b><br>') +
      '<b>Kg/MTR</b> = (' + (mode === 'round' ? Number(V.od) || 0 : fmt(r.equivalent_od, 2)) + ' &minus; ' + t + ') &times; ' + t + ' &times; 0.0246615 = <b>' + fmt(r.kg_per_metre, 3) + '</b><br>' +
      '<b>Weight/Pipe</b> = ' + fmt(r.kg_per_metre, 3) + ' &times; ' + fmt(r.length_m, 2) + ' = <b>' + fmt(r.weight_per_pipe, 2) + ' kg</b>';
  } else {
    fx.innerHTML = mode === 'round'
      ? '<b>Round Pipe:</b> (OD &minus; thk) &times; thk &times; 0.0246615 = Kg/MTR<br>Weight/Pipe = Kg/MTR &times; 6.00'
      : '<b>Hollow Section:</b> (mm + mm) &times; 0.6363 &rArr; OD<br>[{(mm + mm) &times; 0.6363} &minus; thk] &times; thk &times; 0.0246615 = Kg/MTR<br>Weight/Pipe = Kg/MTR &times; 6.00';
  }

  const er = g('wc-er');
  er.className = 'wc-er';
  er.textContent = (!r.ok && r.message) ? r.message : '';
}

function setMode(m) {
  mode = m;
  document.querySelectorAll('.wc-tabs button').forEach(x => x.classList.toggle('on', x.dataset.m === m));
  document.querySelectorAll('.wc-r').forEach(x => x.classList.toggle('wc-hide', m !== 'round'));
  document.querySelectorAll('.wc-h').forEach(x => x.classList.toggle('wc-hide', m === 'round'));
  recalc();
  setTimeout(() => { try { g(m === 'round' ? 'wc-od' : 'wc-a').focus({ preventScroll: true }); } catch (e) {} }, 60);
}

Object.keys(ID).forEach(k => {
  const i = g(ID[k]);
  i.addEventListener('input', () => {
    const v = i.value.replace(/,/g, '.').replace(/[^0-9.]/g, '').replace(/^(\d*\.\d*)\./, '$1');
    if (v !== i.value) i.value = v;
    V[k] = v;
    recalc();
  });
});

document.querySelectorAll('.wc-tabs button').forEach(b => b.onclick = () => setMode(b.dataset.m));

g('wc-clr').onclick = () => {
  V.od = V.a = V.b = V.t = '';
  Object.keys(ID).forEach(k => g(ID[k]).value = '');
  recalc();
  try { g(mode === 'round' ? 'wc-od' : 'wc-a').focus({ preventScroll: true }); } catch (e) {}
};

setMode(mode);
