/* Atlasul legislativ — exerciții generate automat din textul legii și sesiunile de antrenament. */
'use strict';
A.quiz = {};
const Q = A.quiz;

/* ---------------- termene ---------------- */
const WORDNUM = { un: 1, o: 1, una: 1, doi: 2, 'două': 2, trei: 3, patru: 4, cinci: 5, 'șase': 6, 'şase': 6, 'șapte': 7, 'şapte': 7, opt: 8, 'nouă': 9, zece: 10, cincisprezece: 15, 'douăzeci': 20, treizeci: 30 };
const UNITS = { zi: 'zile', zile: 'zile', 'lună': 'luni', luni: 'luni', an: 'ani', ani: 'ani', 'oră': 'ore', ore: 'ore', 'săptămână': 'săptămâni', 'săptămâni': 'săptămâni' };
const SING = { zile: 'zi', luni: 'lună', ani: 'an', ore: 'oră', 'săptămâni': 'săptămână' };
const POOL = { zile: [3, 5, 7, 10, 14, 15, 20, 30, 45, 60, 90], luni: [1, 2, 3, 6, 9, 12, 18], ani: [1, 2, 3, 5, 7, 10, 15, 20, 30], ore: [2, 3, 12, 24, 48, 72], 'săptămâni': [1, 2, 3, 4, 6] };
const TERM_RX = new RegExp(String.raw`(?<![\d.,/])(\d{1,3}|un|o|una|doi|două|trei|patru|cinci|[șş]ase|[șş]apte|opt|nouă|zece|cincisprezece|douăzeci|treizeci)\s+(?:de\s+)?(zile|zi|luni|lună|ani|an|ore|oră|săptămâni|săptămână)(\s+(?:lucrătoare|calendaristice))?\b`, 'giu');
Q.fmtTerm = (n, unit, suffix = '') => (n === 1 ? `1 ${SING[unit]}` : `${n} ${n >= 20 ? 'de ' : ''}${unit}`) + (suffix ? suffix.replace(/\s+/, ' ') : '');
Q.findTerms = text => {
  const out = []; TERM_RX.lastIndex = 0; let m;
  while ((m = TERM_RX.exec(text))) {
    const raw = m[1].toLowerCase(), n = /^\d/.test(raw) ? +raw : WORDNUM[raw];
    if (!n || n > 400) continue;
    const before = text.slice(Math.max(0, m.index - 12), m.index).toLowerCase();
    if (/art\.\s*$|alin\.\s*\(?$|nr\.\s*$|pct\.\s*$/.test(before)) continue;
    out.push({ s: m.index, e: m.index + m[0].length, n, unit: UNITS[m[2].toLowerCase()], suffix: m[3] || '' });
  }
  return out;
};
Q.distractNums = (n, unit) => {
  const pool = (POOL[unit] || [1, 2, 3, 5, 10]).filter(x => x !== n);
  const near = pool.sort((a, b) => Math.abs(a - n) - Math.abs(b - n)).slice(0, 5);
  return A.shuffle(near).slice(0, 3);
};

/* ---------------- domenii (ce se întreabă) ---------------- */
Q.scopeLabel = scope => {
  if (scope === 'citite') return 'Articolele citite';
  if (scope === 'tot') return 'Toată legislația';
  const [k, a, b] = scope.split(':');
  if (k === 'act') return A.actName(a);
  if (k === 'raion') { const r = A.raion(a); return r ? `${r.name} · ${r.title || A.disc[r.disc].name}` : a; }
  if (k === 'node') { const act = A.acts[a]; const n = act && act.nodeById[b]; return n ? `${act.meta.short} · ${n.label} ${n.name}` : a; }
  return scope;
};
Q.pool = async scope => {
  const items = [];
  const open = id => scope === 'tot' || !A.study || !A.study.order || A.study.unitOpen(A.unitOf(id.act, id.art) || '');
  const add = (act, ids) => { for (const id of ids) { const a = act.artById[id]; if (a && !a.abrogat && a.blocks.length && (scope === 'tot' || open({ act: act.id, art: id }))) items.push({ act, art: a }); } };
  if (scope === 'citite' || scope === 'tot') {
    for (const id of Object.keys(A.index)) {
      const ids = scope === 'tot' ? A.index[id].arts : A.index[id].arts.filter(a => (A.S.arts[A.key(id, a)] || {}).r);
      if (ids.length) add(await A.loadAct(id), ids);
    }
    if (!items.length && scope === 'citite') return Q.pool('tot');
    return items;
  }
  const [k, a, b] = scope.split(':');
  if (k === 'act') { const act = await A.loadAct(a); add(act, A.index[a].arts); }
  else if (k === 'raion') { const r = A.raion(a); for (const l of (r ? r.lists : [])) { const act = await A.loadAct(l.act); add(act, l.arts); } }
  else if (k === 'node') {
    const act = await A.loadAct(a); const ids = [];
    const walk = nid => { const n = act.nodeById[nid]; ids.push(...n.arts); (act.kids[nid] || []).forEach(walk); };
    walk(b); add(act, ids);
  } else if (k === 'keys') {
    for (const key of scope.slice(5).split(',')) { const [ac, ar] = key.split(':'); const act = await A.loadAct(ac); add(act, [ar]); }
  }
  return items;
};

/* ---------------- generatoare ---------------- */
const trunc = (s, n) => s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : s;
const artText = a => a.blocks.filter(b => b.k !== 'note').map(b => b.t).join(' ');
const srcOf = ({ act, art }) => ({ act: act.id, art: art.id, label: `${act.meta.short}, art. ${art.num}` });
/* Textul unui bloc, completat cu enumerarea care îl urmează când blocul se încheie cu „:” (altfel enunțul ar fi trunchiat). */
const fullText = (art, b) => {
  if (!/:\s*$/.test(b.t)) return b.t;
  const i = art.blocks.indexOf(b), sub = [];
  for (let j = i + 1; j < art.blocks.length; j++) {
    const x = art.blocks[j]; if (x.k === 'note') continue;
    if (!(x.id.startsWith(b.id + '.') || (/^x\d+$/.test(b.id) && /^[lp]/.test(x.id)))) break;
    sub.push(x.t.replace(/[;.]\s*$/, ''));
  }
  return sub.length ? b.t + ' ' + sub.join('; ') + '.' : b.t;
};
Q.gens = {
  /* ce prevede legea despre o instituție (dispoziția corectă față de dispoziții vecine) */
  regula(it, pool) {
    if (!it.art.title || it.art.title.length < 5) return null;
    const mine = it.art.blocks.filter(b => b.k !== 'note' && b.t.length > 70 && b.t.length < 420);
    if (!mine.length) return null;
    const b = A.pick(mine);
    const others = [];
    for (const x of pool) {
      if (x.art === it.art || x.act !== it.act) continue;
      for (const y of x.art.blocks) if (y.k !== 'note' && y.t.length > 70 && y.t.length < 420) others.push(y.t);
    }
    const ds = [...new Set(A.shuffle(others))].filter(t => t !== b.t).slice(0, 2);
    if (ds.length < 2) return null;
    return { kind: 'regula', q: `Ce prevede ${it.act.meta.name.startsWith('Cod') ? 'codul' : 'legea'} despre „${it.art.title}”?`,
      options: A.shuffle([{ t: trunc(b.t, 240), ok: 1 }, ...ds.map(t => ({ t: trunc(t, 240) }))]), long: true };
  },
  text(it, pool) {
    if (!it.art.title) return null;
    const b = it.art.blocks.find(x => x.k !== 'note' && x.t.length > 60); if (!b) return null;
    const others = A.shuffle(pool.filter(x => x.act === it.act && x.art.title && x.art.title !== it.art.title));
    const ds = [...new Set(others.map(x => x.art.title))].slice(0, 3); if (ds.length < 3) return null;
    return { kind: 'text', q: 'La ce instituție se referă acest text?', ctx: A.esc(trunc(b.t, 320)), options: A.shuffle([{ t: it.art.title, ok: 1 }, ...ds.map(t => ({ t }))]) };
  },
  term(it) {
    const cands = [];
    for (const b of it.art.blocks) if (b.k !== 'note') for (const m of Q.findTerms(b.t)) cands.push({ b, m });
    if (!cands.length) return null;
    const { b, m } = A.pick(cands); const T = fullText(it.art, b);
    const a0 = Math.max(0, m.s - 170), a1 = Math.min(T.length, Math.max(m.e + 140, T === b.t ? 0 : b.t.length + 220));
    const ctx = (a0 > 0 ? '…' : '') + A.esc(T.slice(a0, m.s)) + '<span class="gap">?</span>' + A.esc(T.slice(m.e, a1)) + (a1 < T.length ? '…' : '');
    const right = Q.fmtTerm(m.n, m.unit, m.suffix);
    const card = `${it.act.id}:${it.art.id}:${b.id}:${m.s}`;
    return { kind: 'term', q: 'Ce termen lipsește?', ctx, options: A.shuffle([{ t: right, ok: 1 }, ...Q.distractNums(m.n, m.unit).map(n => ({ t: Q.fmtTerm(n, m.unit, m.suffix) }))]), card, cardLabel: right };
  },
  /* „variante”: același text al articolului în 3 versiuni, doar una corectă (înlocuiește adevărat/fals) */
  tf(it) {
    const cands = [];
    for (const b of it.art.blocks) if (b.k !== 'note') for (const m of Q.findTerms(b.t)) cands.push({ b, m });
    if (!cands.length) return null;
    const { b, m } = A.pick(cands); const T = fullText(it.art, b);
    const a0 = Math.max(0, m.s - 110), a1 = Math.min(T.length, Math.max(m.e + 90, T === b.t ? 0 : Math.min(T.length, b.t.length + 160)));
    const ver = n => (a0 > 0 ? '…' : '') + T.slice(a0, m.s) + Q.fmtTerm(n, m.unit, m.suffix) + T.slice(m.e, a1) + (a1 < T.length ? '…' : '');
    const wrong = Q.distractNums(m.n, m.unit).slice(0, 2);
    if (wrong.length < 2) return null;
    return { kind: 'tf', q: 'Care variantă reproduce corect legea?', options: A.shuffle([{ t: ver(m.n), ok: 1 }, ...wrong.map(n => ({ t: ver(n) }))]), long: true };
  },
  _oldtf(it) {
    const cands = [];
    for (const b of it.art.blocks) if (b.k !== 'note') for (const m of Q.findTerms(b.t)) cands.push({ b, m });
    if (!cands.length) return null;
    const { b, m } = A.pick(cands); const T = fullText(it.art, b);
    const truth = Math.random() < .5;
    const n = truth ? m.n : A.pick(Q.distractNums(m.n, m.unit));
    const a0 = Math.max(0, m.s - 160), a1 = Math.min(T.length, Math.max(m.e + 120, T === b.t ? 0 : b.t.length + 220));
    const ctx = (a0 > 0 ? '…' : '') + A.esc(T.slice(a0, m.s)) + '<b>' + A.esc(Q.fmtTerm(n, m.unit, m.suffix)) + '</b>' + A.esc(T.slice(m.e, a1)) + (a1 < T.length ? '…' : '');
    return { kind: 'tf', q: 'Adevărat sau fals, conform legii?', ctx, options: [{ t: 'Adevărat', ok: truth ? 1 : 0 }, { t: 'Fals', ok: truth ? 0 : 1 }], explainExtra: truth ? '' : `Corect este: ${Q.fmtTerm(m.n, m.unit, m.suffix)}.` };
  },
  def(it, pool) {
    const defs = it.art.blocks.filter(b => b.def);
    if (!defs.length) return null;
    const b = A.pick(defs);
    const defText = x => trunc(x.t.slice(x.def.length).replace(/^\s*[–—-]\s*/, ''), 170);
    const others = [];
    for (const x of pool) for (const y of x.art.blocks) if (y.def && y !== b) others.push(y);
    const ds = A.shuffle(others).slice(0, 3); if (ds.length < 3) return null;
    return { kind: 'def', q: `Ce înseamnă „${b.def}”, în sensul ${it.act.meta.name.startsWith('Cod') ? 'codului' : 'legii'}?`, options: A.shuffle([{ t: defText(b), ok: 1 }, ...ds.map(y => ({ t: defText(y) }))]) };
  },
};
Q.taxQuestion = async () => {
  const lts = await A.loadAct('LTS').catch(() => null);
  const ranges = [[500, 5000], [5001, 50000], [50001, 1500000], [1500001, 5000000]];
  const [lo, hi] = A.pick(ranges);
  const v = Math.round(A.rand(lo, hi) / 100) * 100;
  const pf = Math.random() < .5;
  let tax, rule;
  if (v <= 5000) { tax = Math.max(v * 0.05, pf ? 150 : 250); rule = `pct. 1.1.1: 5% din valoare, dar nu mai puțin de ${pf ? 150 : 250} lei`; }
  else if (v <= 50000) { tax = 250 + 0.04 * (v - 5001); rule = 'pct. 1.1.2: 250 lei + 4% din ce depășește 5.001 lei'; }
  else if (v <= 1500000) { tax = 2050 + 0.03 * (v - 50001); rule = 'pct. 1.1.3: 2.050 lei + 3% din ce depășește 50.001 lei'; }
  else { tax = 45550 + 0.02 * (v - 1500001); rule = 'pct. 1.1.4: 45.550 lei + 2% din ce depășește 1.500.001 lei'; }
  tax = Math.round(tax * 100) / 100;
  return { kind: 'tax', q: `Ce taxă de stat se achită pentru o cerere de chemare în judecată cu caracter patrimonial, depusă de o persoană ${pf ? 'fizică' : 'juridică'}, valoarea acțiunii fiind de ${A.fmt(v)} lei?`, input: { answer: tax, tol: 1.01 }, hint: `Regula: anexa nr. 1 la Legea taxei de stat, ${rule}.`, explainExtra: `Anexa nr. 1 la Legea taxei de stat, ${rule}. Rezultat: ${tax.toLocaleString('ro-RO')} lei.`, src: lts ? { act: 'LTS', art: '4', label: 'LTS, anexa nr. 1' } : null };
};
/* ---------------- banca de grile (INJ, avocatură, notariat) ---------------- */
Q.bank = null; Q.recent = [];
Q.loadBank = async () => {
  if (Q.bank) return Q.bank;
  try { const d = await A.json('data/grile.json'); Q.bank = d.q || []; } catch (e) { Q.bank = []; }
  Q.bankByKey = {}; Q.studyByKey = {};
  for (const g of Q.bank) for (const r of (g.r || []).slice(0, 1)) (Q.bankByKey[r.act + ':' + r.art] = Q.bankByKey[r.act + ':' + r.art] || []).push(g);
  for (const g of (A.study && A.study.bank ? A.study.bank.grile : [])) for (const r of (g.r || []).slice(0, 1)) (Q.studyByKey[r.act + ':' + r.art] = Q.studyByKey[r.act + ':' + r.art] || []).push(Object.assign({ s: 'Grilă de studiu' }, g));
  return Q.bank;
};
Q.bankFor = pool => {
  if (!Q.bankByKey) return [];
  const out = [];
  for (const it of pool) { const k = A.key(it.act.id, it.art.id); const l = Q.bankByKey[k], st = Q.studyByKey[k]; if (l) out.push(...l); if (st) out.push(...st, ...st); }
  return out;
};
A.quizRecent = () => Q.recent;
Q.fromBank = (g, pool) => {
  const r = (g.r || [])[0] || {};
  const it = pool.find(x => x.act.id === r.act && x.art.id === r.art);
  const opts = g.o.map((t, i) => ({ t, ok: i === g.a ? 1 : 0 }));
  Q.recent.push(g.id); if (Q.recent.length > 60) Q.recent.shift();
  return { kind: 'bank', id: g.id, q: g.q, options: A.shuffle(opts), tag: g.s, explainExtra: g.e || '',
    src: { act: r.act, art: r.art, label: (A.index[r.act] ? A.index[r.act].short : r.act) + ', art. ' + A.idToNum(r.art) + (r.al ? ` alin. (${A.idToNum(r.al)})` : '') },
    key: it ? A.key(it.act.id, it.art.id) : (r.act ? A.key(r.act, r.art) : null) };
};
Q.make = async (pool, kinds, bankShare) => {
  await Q.loadBank();
  const share = bankShare !== undefined ? bankShare : (kinds ? 0 : 0.6);
  if (share > 0) {
    const cands = Q.bankFor(pool).filter(g => !Q.recent.includes(g.id));
    if (cands.length && Math.random() < share) return Q.fromBank(A.pick(cands), pool);
  }
  kinds = kinds || ['regula', 'text', 'term', 'term', 'tf', 'def', 'regula'];
  for (let i = 0; i < 40; i++) {
    const it = A.pick(pool); if (!it) return null;
    const kind = A.pick(kinds);
    const q = Q.gens[kind](it, pool);
    if (q) { q.src = srcOf(it); q.key = A.key(it.act.id, it.art.id); return q; }
  }
  return null;
};

/* întrebare generată despre un articol anume (distractorii vin din pool) */
Q.makeFor = (it, pool, kinds) => {
  kinds = kinds || ['regula', 'text', 'term', 'term', 'tf', 'def', 'regula'];
  for (let i = 0; i < 30; i++) { const q = Q.gens[A.pick(kinds)](it, pool); if (q) { q.src = srcOf(it); q.key = A.key(it.act.id, it.art.id); return q; } }
  return null;
};

/* ---------------- sesiune ---------------- */
/* opt: {mode, scope, n, kinds, lives, seconds, perQuestion, title, onDone(result), keys, rival} */
Q.run = async (view, opt) => {
  view.innerHTML = `<div class="quiz"><div class="empty">Pregătesc întrebările…</div></div>`;
  /* sesiune pe secțiune: grilele se aleg la fiecare sesiune (opt.makeGrile) */
  const gList = opt.makeGrile ? opt.makeGrile() : null;
  if (gList && !gList.length) { view.innerHTML = `<div class="quiz"><div class="empty">Secțiunea nu are încă grile de studiu. <a href="#/antrenament">Înapoi</a></div></div>`; return; }
  let pool = gList ? [] : opt.keys ? await Q.pool('keys:' + opt.keys.join(',')) : (opt.mode === 'taxa' ? [] : await Q.pool(opt.scope || 'citite'));
  if (!gList && opt.mode !== 'taxa' && !pool.length) { view.innerHTML = `<div class="quiz"><div class="empty">Nu există încă articole în acest domeniu. Citește câteva articole și revino.</div></div>`; return; }
  const fullPool = opt.keys ? await Q.pool(opt.scope || 'tot') : pool;
  const st = { i: 0, ok: 0, combo: 0, best: 0, lives: opt.lives || 0, xp: 0, money: 0, start: Date.now(), heat: 1, answered: 0, wrong: [] };
  const total = gList ? gList.length : (opt.n || 10);
  let gQueue = gList ? gList.slice() : null;
  const deadline = opt.seconds ? Date.now() + opt.seconds * 1000 : 0;
  let cur = null, qStart = 0, keysQueue = opt.keys ? opt.keys.slice() : null;
  const root = document.createElement('div'); root.className = 'quiz'; view.innerHTML = ''; view.appendChild(root);

  const finish = () => {
    A.guardStop();
    A.timers.forEach(t => clearInterval(t)); A.timers = [];
    const acc = st.answered ? st.ok / st.answered : 0;
    A.S.quiz.sessions++; A.store.save();
    const res = { ok: st.ok, answered: st.answered, acc, best: st.best, ms: Date.now() - st.start, xp: st.xp, money: st.money, wrong: st.wrong };
    if (opt.onDone) return opt.onDone(res, root);
    let chest = '';
    root.innerHTML = `<div class="qcard summary"><div class="big">${st.ok}/${st.answered}</div>
      <p class="muted">${opt.title || 'Antrenament'} · ${Math.round(acc * 100)}% corecte · cel mai lung combo ${st.best}</p>
      <p><b>+${A.fmt(st.xp)} XP</b> &nbsp; <b>+${A.lei(st.money)}</b></p>${chest}
      ${st.wrong.length ? `<div class="weak" style="text-align:left;margin:18px 0"><h3 style="margin-bottom:6px">De recitit</h3>${[...new Set(st.wrong)].slice(0, 8).map(k => { const [a, r] = k.split(':'); return `<a href="#/act/${a}/a/${r}"><span>${A.actShort(a)}, art. ${A.idToNum(r)}</span><span class="faint">deschide</span></a>`; }).join('')}</div>` : ''}
      <div style="display:flex;gap:10px;justify-content:center;margin-top:16px"><button class="btn primary" id="again">Încă o sesiune</button><a class="btn" href="#/antrenament">Înapoi</a></div></div>`;
    A.$('#again', root).onclick = () => Q.run(view, opt);
    A.game.checkStamps();
  };

  const next = async () => {
    if (deadline && Date.now() >= deadline) return finish();
    if (opt.lives && st.lives <= 0) return finish();
    if (opt.hp && st.ok >= opt.hp) return finish();
    if (!opt.lives && !opt.seconds && st.i >= total) return finish();
    if (keysQueue && !keysQueue.length) return finish();
    if (gQueue && !gQueue.length) return finish();
    st.i++;
    if (gQueue) { const g = gQueue.shift(); cur = Q.fromBank(g, []); cur.study = { m: g.m, id: g.id }; }
    else if (opt.mode === 'taxa') cur = await Q.taxQuestion();
    else if (keysQueue) {
      const k = keysQueue.shift(); const p1 = pool.filter(x => A.key(x.act.id, x.art.id) === k);
      await Q.loadBank(); const bc = Q.bankFor(p1).filter(g => !Q.recent.includes(g.id));
      if (bc.length && Math.random() < .6) cur = Q.fromBank(A.pick(bc), p1);
      else cur = p1.length ? Q.makeFor(p1[0], p1.concat(fullPool), opt.kinds) : null;
      if (!cur) cur = await Q.make(fullPool, opt.kinds || ['regula', 'text', 'term', 'term', 'tf', 'def', 'regula'], 0);
    }
    else cur = await Q.make(pool, opt.kinds, opt.bankShare);
    if (!cur) return finish();
    qStart = Date.now();
    draw();
    A.guardStart(() => { if (!A.$('#fb', root) || A.$('#fb', root).innerHTML) return; answer(false, null, null, 'leave'); });
  };
  const perQ = () => opt.perQuestion ? Math.max(8, opt.perQuestion - (st.heat - 1) * 4) : 0;
  const head = () => {
    const progress = opt.hp ? `<div class="bossbar" title="Cât i-a mai rămas adversarului"><i style="width:${Math.max(0, 100 - st.ok / opt.hp * 100)}%"></i><b>${Math.max(0, opt.hp - st.ok)}</b></div>`
      : opt.lives ? '' : opt.seconds ? '' : `<div class="bar"><i style="width:${((st.i - 1) / total) * 100}%"></i></div>`;
    const mult = Q.mult(st.combo);
    return `<div class="top">
      <span class="faint" style="min-width:110px">${A.esc(opt.title || '')}${opt.lives || opt.hp ? '' : opt.seconds ? '' : ` · ${st.i}/${total}`}</span>
      ${progress || '<span style="flex:1"></span>'}
      ${opt.lives ? `<span class="lives" title="Vieți">${'●'.repeat(st.lives)}${'○'.repeat(Math.max(0, opt.lives - st.lives))}</span><span class="faint">presiune ${st.heat}/5</span>` : ''}
      ${opt.seconds || perQ() ? `<span class="timer" id="timer"></span>` : ''}
      <span class="combo">${st.combo >= 3 ? `combo ×${mult.toLocaleString('ro-RO')}` : st.combo ? `${st.combo} la rând` : ''}</span></div>`;
  };
  const draw = () => {
    const keysL = ['A', 'B', 'C', 'D'];
    root.innerHTML = head() + `<div class="qcard">
      ${cur.src ? `<div class="src">${A.esc(cur.src.label)}${cur.tag ? ` · <span class="tag">${A.esc(cur.tag)}</span>` : ''}</div>` : ''}
      <div class="q">${A.esc(cur.q)}</div>
      ${cur.ctx ? `<div class="ctx">${cur.ctx}</div>` : ''}
      ${cur.input ? `<form class="numin" id="numf"><input id="numv" inputmode="decimal" autocomplete="off" placeholder="Suma în lei" aria-label="Răspuns"><button class="btn primary">Verifică</button></form>`
        : `<div class="opts ${cur.long ? 'long' : ''}">${cur.options.map((o, i) => `<button class="opt" data-i="${i}"><span class="k">${keysL[i]}</span><span>${A.esc(o.t)}</span></button>`).join('')}</div>`}
      ${cur.hint ? `<div class="hintbox"><button class="btn small" id="hint">Indiciu: regula de calcul (recompensa scade cu 60%)</button></div>` : ''}
      <div id="fb"></div></div>`;
    const hb = A.$('#hint', root); if (hb) hb.onclick = () => { cur.hinted = true; hb.parentNode.innerHTML = `<div class="why">${A.esc(cur.hint)}</div>`; };
    if (cur.input) { const f = A.$('#numf', root); A.$('#numv', root).focus(); f.onsubmit = e => { e.preventDefault(); const v = parseFloat(A.$('#numv', root).value.replace(/\s/g, '').replace(',', '.')); if (isNaN(v)) return; answer(Math.abs(v - cur.input.answer) <= cur.input.tol, f); }; }
    else A.$$('.opt', root).forEach(b => b.onclick = e => answer(!!cur.options[+b.dataset.i].ok, b, e));
    tickTimer();
  };
  const tickTimer = () => {
    const el = A.$('#timer', root); if (!el) return;
    const limit = deadline || (perQ() ? qStart + perQ() * 1000 : 0);
    const left = limit - Date.now();
    el.textContent = Math.max(0, Math.ceil(left / 1000)) + ' s';
    el.style.color = left < 5000 ? 'var(--seal)' : '';
    if (left <= 0 && !A.$('#fb', root).innerHTML) { if (deadline) return finish(); answer(false, null, null, true); }
  };
  A.every(250, tickTimer);

  const answer = (ok, el, ev, timeout) => {
    if (A.$('#fb', root).innerHTML) return;
    A.guardStop();
    if (cur.hinted && ok) cur.hintMult = .4;
    st.answered++; A.S.quiz.answered++; A.studied();
    A.$$('.opt', root).forEach((b, i) => { b.disabled = true; if (cur.options[i].ok) b.classList.add('right'); });
    let gained = '';
    if (ok) {
      st.ok++; st.combo++; st.best = Math.max(st.best, st.combo);
      A.S.quiz.correct++; A.S.quiz.bestCombo = Math.max(A.S.quiz.bestCombo, st.combo);
      let mult = Q.mult(st.combo);
      const crit = Math.random() < 0.08;
      if (crit) { mult *= 3; A.S.quiz.crits[A.today()] = (A.S.quiz.crits[A.today()] || 0) + 1; }
      const r = el ? el.getBoundingClientRect() : { left: innerWidth / 2, top: innerHeight / 2, width: 0 };
      const hm = cur.hintMult || 1;
      const xp = A.game.addXP(5 * mult * hm, { x: r.left + r.width - 60, y: r.top });
      st.xp += xp;
      const money = A.eco ? A.eco.earn(12 * mult * hm, null, 'antrenament') : 0; st.money += money;
      if (cur.kind === 'bank') { A.S.points.grile++; gained += ' +1 grilă.'; }
      if (cur.study && A.study && A.study.credit) A.study.credit(cur.study.m, cur.study.id);
      if (crit) A.fly('Lovitură critică!', r.left + 40, r.top - 10, true);
      A.sound(crit ? 'claim' : 'ok'); A.fx.combo(true);
      if (cur.key) A.game.review(cur.key, true);
      if (cur.card && !A.S.album[cur.card]) { A.S.album[cur.card] = cur.cardLabel; gained = ' Termen nou în album.'; }
      if (cur.kind === 'tax') A.S.quiz.taxOk++;
      if (st.combo > 0 && st.combo % 10 === 0 && A.eco) { A.eco.addNitro(1); gained += ' +1 nitro pentru combo.'; }
      if (opt.lives && st.ok % 5 === 0) st.heat = Math.min(5, st.heat + 1);
    } else {
      st.combo = 0; if (opt.lives) st.lives--;
      if (el && el.classList) el.classList.add('wrong');
      A.sound('ko'); A.fx.combo(false);
      if (cur.key) { A.game.review(cur.key, false); st.wrong.push(cur.key); }
    }
    A.store.save();
    const src = cur.src ? `<a class="ref" href="#/act/${cur.src.act}/a/${cur.src.art}" target="_self">Deschide ${A.esc(cur.src.label)}</a>` : '';
    const right = cur.options ? (cur.options.find(o => o.ok) || {}).t : '';
    A.$('#fb', root).innerHTML = `<div class="feedback ${ok ? 'ok' : 'ko'}"><div><b>${timeout === 'leave' ? 'Ai ieșit din aplicație: răspuns pierdut.' : timeout ? 'Timpul a expirat.' : ok ? 'Corect.' : 'Greșit.'}</b>${A.esc(gained)}
      ${!ok && right ? `<div class="why">Răspunsul corect: ${A.esc(right)}</div>` : ''}${cur.explainExtra ? `<div class="why">${A.esc(cur.explainExtra)}</div>` : ''}${src ? `<div class="why">${src}</div>` : ''}</div>
      <button class="btn primary" id="nx">Continuă</button></div>`;
    A.$('#nx', root).onclick = next; A.$('#nx', root).focus();
  };
  root.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT') return;
    const i = { a: 0, b: 1, c: 2, d: 3, '1': 0, '2': 1, '3': 2, '4': 3 }[e.key.toLowerCase()];
    if (i !== undefined) { const b = A.$$('.opt', root)[i]; b && !b.disabled && b.click(); }
  });
  await next();
};
Q.mult = combo => 1 + Math.min(2, Math.floor(combo / 3) * 0.5);

/* ---------------- întrebare unică în fereastră (dosar de aur, grăbire, consultație) ---------------- */
Q.mini = async (scope, title, onAnswer, kinds, fixedKey) => {
  A.S.fixedQ = A.S.fixedQ || {};
  let q = fixedKey ? A.S.fixedQ[fixedKey] : null;
  if (!q) {
    const pool = await Q.pool(scope);
    q = pool.length ? await Q.make(pool, kinds || ['regula', 'term', 'tf', 'text', 'def'], kinds ? 0 : 0.6) : null;
    if (q && fixedKey) { A.S.fixedQ[fixedKey] = q; A.store.save(); }
  }
  if (!q) { onAnswer(false, true); return; }
  const keysL = ['A', 'B', 'C', 'D'];
  let done = false;
  const m = A.modal(`<div class="miniq" style="text-align:left"><div class="faint" style="font-size:13px">${A.esc(title)}${q.src ? ' · ' + A.esc(q.src.label) : ''}</div>
    <div class="q" style="font-family:var(--serif);font-size:19px;margin:8px 0">${A.esc(q.q)}</div>
    ${q.ctx ? `<div class="ctx" style="font-family:var(--serif);background:var(--paper-2);padding:10px 12px;border-left:3px solid var(--rule)">${q.ctx}</div>` : ''}
    <div class="opts ${q.long ? 'long' : ''}">${q.options.map((o, i) => `<button class="opt" data-i="${i}"><span class="k">${keysL[i]}</span><span>${A.esc(o.t)}</span></button>`).join('')}</div><div id="mfb"></div></div>`, () => { if (!done) A.guardStop(); });
  m.el.classList.add('wide');
  const settle = (ok, b, left) => {
    if (done) return; done = true; A.guardStop();
    if (fixedKey) { delete A.S.fixedQ[fixedKey]; }
    A.$$('.opt', m.el).forEach((x, i) => { x.disabled = true; if (q.options[i].ok) x.classList.add('right'); });
    if (!ok && b) b.classList.add('wrong');
    A.S.quiz.answered++; if (ok) { A.S.quiz.correct++; if (q.kind === 'bank') A.S.points.grile++; }
    A.studied();
    if (q.key) A.game.review(q.key, ok); A.sound(ok ? 'ok' : 'ko'); A.fx.combo(ok); A.store.save();
    A.$('#mfb', m.el).innerHTML = `<div class="feedback ${ok ? 'ok' : 'ko'}"><b>${left ? 'Ai ieșit din aplicație: răspuns pierdut.' : ok ? 'Corect.' : 'Greșit.'}</b><button class="btn primary" id="mok">Continuă</button></div>`;
    A.$('#mok', m.el).onclick = () => { m.close(); onAnswer(ok); };
  };
  A.$$('.opt', m.el).forEach(b => b.onclick = () => settle(!!q.options[+b.dataset.i].ok, b));
  A.guardStart(() => settle(false, null, true));
};
