/* Atlasul legislativ — nucleu: utilitare, stare, registru, acte, trimiteri, rutare, HUD. */
'use strict';
const A = window.A = { acts: {}, routes: {}, timers: [], comments: {}, commentIds: new Set() };

/* ---------------- utilitare ---------------- */
A.$ = (s, r = document) => r.querySelector(s);
A.$$ = (s, r = document) => Array.from(r.querySelectorAll(s));
A.esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
A.fold = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ş/g, 's').replace(/ţ/g, 't');
A.SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
A.idToNum = id => { const [b, s] = String(id).split('_'); return b + (s ? s.split('').map(d => A.SUP[+d]).join('') : ''); };
A.pad = n => String(n).padStart(2, '0');
A.today = (d = new Date()) => `${d.getFullYear()}-${A.pad(d.getMonth() + 1)}-${A.pad(d.getDate())}`;
A.addDays = (iso, n) => { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + n); return A.today(d); };
A.rand = (a, b) => a + Math.random() * (b - a);
A.randi = (a, b) => Math.floor(A.rand(a, b + 1));
A.pick = arr => arr[Math.floor(Math.random() * arr.length)];
A.shuffle = arr => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
A.clamp = (x, a, b) => Math.max(a, Math.min(b, x));
A.fmt = n => {
  n = Math.floor(n || 0);
  if (Math.abs(n) < 1e6) return n.toLocaleString('ro-RO');
  const u = [[1e12, ' bln.'], [1e9, ' mld.'], [1e6, ' mil.']];
  for (const [v, s] of u) if (Math.abs(n) >= v) return (n / v).toLocaleString('ro-RO', { maximumFractionDigits: 2 }) + s;
};
A.lei = n => A.fmt(n) + ' lei';
A.dur = ms => {
  ms = Math.max(0, ms); const s = Math.ceil(ms / 1000);
  if (s < 60) return s + ' s';
  const m = Math.floor(s / 60), h = Math.floor(m / 60);
  if (h < 1) return m + ' min ' + A.pad(s % 60) + ' s';
  if (h < 24) return h + ' h ' + A.pad(m % 60) + ' min';
  return Math.floor(h / 24) + ' z ' + (h % 24) + ' h';
};
A.plural = (n, one, many) => (n === 1 ? `1 ${one}` : `${A.fmt(n)} ${n % 100 >= 1 && n % 100 <= 19 && n !== 1 ? many : 'de ' + many}`).replace('de de', 'de');
A.html = (el, h) => { el.innerHTML = h; return el; };
A.debounce = (fn, ms) => { let t; return (...x) => { clearTimeout(t); t = setTimeout(() => fn(...x), ms); }; };
A.labelCase = s => (s && s === s.toUpperCase() && /[A-ZĂÂÎȘȚŞŢ]/.test(s)) ? s.charAt(0) + s.slice(1).toLowerCase() : s;

/* ---------------- stare persistentă ---------------- */
A.STATE_V = 3;
A.defaultState = () => ({
  v: A.STATE_V, created: Date.now(),
  ledger: {},        // recompense reversibile: cheie -> {xp, money}
  points: { grile: 0, spete: 0 },   // monede de studiu (grile și spețe rezolvate corect)
  study: { micro: {}, chapters: {}, unitDone: {}, prep: {} },   // micro-secțiuni parcurse, mini-boși învinși, pregătirea pentru revanșă
  perks: {},         // trofeele mini-boșilor: id -> câte
  spete: {},         // id -> {ok, ko, last}
  activity: { lastStudy: 0, lastSeen: Date.now() },
  brand: null,       // {stamp, insignia, logo} desenate de jucător (dataURL)
  arts: {},          // "CF:43_1": {r, u, ap, st, n, b, due, ok, ko}
  xp: 0, days: {}, frozen: {},
  stamps: {},        // id -> date
  album: {},         // term card ids
  quiz: { answered: 0, correct: 0, bestCombo: 0, survivalBest: 0, taxOk: 0, sessions: 0, refsOpened: 0, crits: {} },
  chaptersDone: {},  // "CF:n7": date
  conq: {},          // raioane cucerite: unit -> date
  last: null,
  settings: { goal: 60, sound: true, theme: 'dark' },
  eco: null,
});
A.store = {
  data: null,
  dirty: false,
  async load() {
    let d = null;
    if (A.api) try { const r = await fetch('/api/state', { cache: 'no-store' }); if (r.ok) { const j = await r.json(); if (j && j.v) d = j; } } catch (e) { }
    if (!d) { try { d = JSON.parse(localStorage.getItem('atlas-state') || 'null'); } catch (e) { } }
    this.data = Object.assign(A.defaultState(), d || {});
    for (const k of Object.keys(A.defaultState())) if (this.data[k] === undefined) this.data[k] = A.defaultState()[k];
    this.data.quiz = Object.assign(A.defaultState().quiz, this.data.quiz);
    this.data.settings = Object.assign(A.defaultState().settings, this.data.settings);
    A.migrate(this.data);
    return this.data;
  },
  save: null,
  async flush() {
    const body = JSON.stringify(this.data);
    try { localStorage.setItem('atlas-state', body); } catch (e) { }
    if (A.api) try { await fetch('/api/state', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body }); } catch (e) { }
  },
};
A.store._save = A.debounce(() => A.store.flush(), 1500);
A.store.save = () => { A.rev++; A.store._save(); };
A.rev = 0;   // crește la fiecare salvare; invalidează calculele memorate
/* migrare: progresul vechi (v2) trece în structura v3, cu copie de siguranță */
A.migrate = d => {
  d.perks = d.perks || {};
  if (!d.ui2) { d.ui2 = 1; if (d.settings && d.settings.theme === 'auto') d.settings.theme = 'dark'; }   // interfața de arenă e gândită pe fundal închis
  if (d.study) { d.study.prep = d.study.prep || {}; d.study.chapters = d.study.chapters || {}; }
  if ((d.v || 1) >= A.STATE_V) return d;
  try { localStorage.setItem('atlas-state-backup-v' + (d.v || 1), JSON.stringify(d)); } catch (e) { }
  const f = A.defaultState();
  for (const k of ['ledger', 'points', 'study', 'spete', 'activity', 'perks']) if (!d[k]) d[k] = f[k];
  // recompensele deja primite pentru citit/înțeles/aplicat se trec în registru, ca să nu poată fi luate din nou
  for (const [k, r] of Object.entries(d.arts || {})) {
    if (r.r) d.ledger['read:' + k] = { xp: 2, money: 0 };
    if (r.ap) d.ledger['appl:' + k] = { xp: 25, money: 0 };
    if (r.u && !r.sum) delete r.u;   // „Am înțeles” cere acum un rezumat
  }
  d.v = A.STATE_V;
  return d;
};
window.addEventListener('beforeunload', () => {
  try { localStorage.setItem('atlas-state', JSON.stringify(A.store.data)); } catch (e) { }
  try { navigator.sendBeacon && navigator.sendBeacon('/api/state', new Blob([JSON.stringify(A.store.data)], { type: 'application/json' })); } catch (e) { }
});
Object.defineProperty(A, 'S', { get: () => A.store.data });

/* ---------------- registru: raioane, discipline, acte ---------------- */
A.loadRegistry = async () => {
  let reg = null;
  if (A.api) try { const r = await fetch('/api/registry', { cache: 'no-store' }); if (r.ok) reg = await r.json(); } catch (e) { }
  if (!reg) {
    const atlas = await A.json('data/atlas.json');
    const index = await A.json('data/acts/index.json');
    reg = { atlas, index, packs: [] };
  }
  const { atlas, index } = reg;
  A.disc = atlas.disciplines;
  A.index = index;                     // id -> {name, short, aliases, n, arts, books}
  A.raioane = [];
  A.unitById = Object.fromEntries(MD_MAP.units.map(([id, name, d]) => [id, { id, name, d }]));
  const addRaion = (r, src) => {
    const unit = A.unitById[r.unit]; if (!unit) return;
    const places = (r.places || []).map(p => Object.assign({}, p, { available: !!index[p.act] }));
    const existing = A.raioane.find(x => x.unit === r.unit);
    if (existing) { existing.places.push(...places); return; }
    A.raioane.push({ unit: r.unit, name: unit.name, disc: r.disc, title: r.title || '', short: r.short || r.title || '', about: r.about || '', boss: r.boss || '', requires: r.requires || null, places, src });
  };
  for (const r of atlas.raioane) addRaion(r, 'core');
  for (const p of (reg.packs || [])) {
    if (p.discipline && !A.disc[p.discipline.id]) A.disc[p.discipline.id] = { name: p.discipline.name, color: p.discipline.color || '#555' };
    if (p.raion) addRaion(p.raion, 'pack');
  }
  const taken = new Set(A.raioane.map(r => r.unit));
  A.reserved = (atlas.reserved || []).filter(r => !taken.has(r.unit));
  A.actRaion = {}; A.artUnit = {};
  for (const r of A.raioane) {
    r.lists = []; r.n = 0;
    for (const p of r.places) {
      if (!p.available) continue;
      if (!A.actRaion[p.act] || p.role === 'capital') A.actRaion[p.act] = r.unit;
      const arts = A.placeArts(p); p.arts = arts; r.lists.push({ act: p.act, arts }); r.n += arts.length;
      for (const a of arts) A.artUnit[p.act + ':' + a] = r.unit;
    }
  }
  A.finalBoss = atlas.finalBoss || null;
  A.aliasMap = {};
  for (const [id, a] of Object.entries(index)) for (const al of (a.aliases || [])) A.aliasMap[al] = id;
  for (const [id, a] of Object.entries(atlas.pendingActs || {})) if (!index[id]) for (const al of a.aliases) A.aliasMap[al] = A.aliasMap[al] || ('?' + id);
  A.pendingActs = atlas.pendingActs || {};
  A.commentIds = new Set(reg.comments || []);
};
A.artKey = id => { const m = String(id).match(/^(\d+)(?:_(\d+))?/); return m ? +m[1] * 1000 + (+m[2] || 0) : 0; };
A.placeArts = p => { const ix = A.index[p.act]; if (!ix) return []; if (!p.from) return ix.arts.slice(); const lo = A.artKey(p.from), hi = A.artKey(p.to) + 999; return ix.arts.filter(a => { const k = A.artKey(a); return k >= lo && k <= hi; }); };
A.unitOf = (act, art) => A.artUnit[act + ':' + art] || A.actRaion[act];
A.conquered = unit => !!(A.S.conq && A.S.conq[unit]);
A.locked = unit => A.study && A.study.order ? !A.study.unitOpen(unit) : (() => { const r = A.raion(unit); return !!(r && r.requires && !A.conquered(r.requires)); })();
A.placeLabel = p => (A.index[p.act] ? A.index[p.act].short : p.act) + (p.from ? `, art. ${A.idToNum(p.from)}–${A.idToNum(p.to)}` : '');
A.actName = id => (A.index[id] && A.index[id].name) || (A.pendingActs[id] && A.pendingActs[id].name) || id;
A.actShort = id => (A.index[id] && A.index[id].short) || id;
A.raion = unit => A.raioane.find(r => r.unit === unit);
A.raionActs = r => r.places.filter(p => p.available).map(p => p.act);

A.loadAct = async id => {
  if (A.acts[id]) return A.acts[id];
  if (!A.index[id]) throw new Error('Actul ' + id + ' nu este disponibil');
  const d = await A.json(`data/acts/${id}.json`);
  d.id = id;
  d.artById = {}; d.nodeById = {}; d.kids = {};
  d.articles.forEach((a, i) => { a.i = i; d.artById[a.id] = a; a.blockById = {}; for (const b of a.blocks) a.blockById[b.id] = b; });
  for (const n of d.nodes) { d.nodeById[n.id] = n; (d.kids[n.parent || 'root'] = d.kids[n.parent || 'root'] || []).push(n.id); n.label = A.labelCase(n.label); n.name = A.labelCase(n.name) === n.name ? n.name : n.name; }
  // grupuri de lectură: nodurile care au articole direct; articolele fără nod formează un grup
  d.groups = d.nodes.filter(n => n.arts.length);
  const orphan = d.articles.filter(a => !a.node || !d.nodeById[a.node]);
  if (orphan.length) {
    const g = { id: 'n0', kind: 'h', lvl: 1, label: '', name: 'Articole', parent: null, arts: orphan.map(a => a.id) };
    d.nodes.unshift(g); d.nodeById.n0 = g; d.groups.unshift(g);
    orphan.forEach(a => a.node = 'n0');
  }
  d.groups.sort((x, y) => d.artById[x.arts[0]].i - d.artById[y.arts[0]].i);
  d.groupIndex = Object.fromEntries(d.groups.map((g, i) => [g.id, i]));
  if (A.commentIds.has(id)) { try { A.comments[id] = await A.json(`data/comentarii/${id}.json`); } catch (e) { } }
  A.acts[id] = d;
  return d;
};
A.loadAll = async () => { for (const id of Object.keys(A.index)) await A.loadAct(id); return A.acts; };
A.nodePath = (act, nodeId) => { const p = []; let n = act.nodeById[nodeId]; while (n) { p.unshift(n); n = act.nodeById[n.parent]; } return p; };

/* ---------------- progres pe articole ---------------- */
A.key = (act, art) => act + ':' + art;
A.art = k => A.S.arts[k] || null;
A.artRec = k => (A.S.arts[k] = A.S.arts[k] || {});
A.score = rec => !rec ? 0 : (rec.ap || (rec.b || 0) >= 3) ? 1 : rec.u ? 0.7 : rec.r ? 0.5 : 0;
A.levelDots = rec => [!!(rec && rec.r), !!(rec && rec.u), !!(rec && (rec.b || 0) >= 3), !!(rec && rec.ap)];
A.actStats = id => {
  const ix = A.index[id]; if (!ix) return { n: 0, read: 0, mastery: 0 };
  let read = 0, sum = 0;
  for (const a of ix.arts) { const rec = A.S.arts[id + ':' + a]; if (rec && rec.r) read++; sum += A.score(rec); }
  return { n: ix.arts.length, read, mastery: ix.arts.length ? sum / ix.arts.length : 0 };
};
A.listStats = (id, artIds) => {
  let read = 0, sum = 0;
  for (const a of artIds) { const rec = A.S.arts[id + ':' + a]; if (rec && rec.r) read++; sum += A.score(rec); }
  return { n: artIds.length, read, mastery: artIds.length ? sum / artIds.length : 0 };
};
A.memo = (key, fn) => { const m = A._memo || (A._memo = {}); if (m.rev !== A.rev) { A._memo = { rev: A.rev }; } const c = A._memo; if (!(key in c)) c[key] = fn(); return c[key]; };
A.raionStats = unit => A.memo('rs:' + unit, () => A._raionStats(unit));
A._raionStats = unit => {
  const r = A.raion(unit); if (!r) return { n: 0, read: 0, mastery: 0 };
  let n = 0, read = 0, msum = 0;
  for (const l of r.lists || []) { const s = A.listStats(l.act, l.arts); n += s.n; read += s.read; msum += s.mastery * s.n; }
  return { n, read, mastery: n ? msum / n : 0 };
};
A.totalStats = () => A.memo('total', () => A._totalStats());
A._totalStats = () => { let n = 0, read = 0, m = 0; for (const id of Object.keys(A.index)) { const s = A.actStats(id); n += s.n; read += s.read; m += s.mastery * s.n; } return { n, read, mastery: n ? m / n : 0 }; };

/* ---------------- trimiteri: rezolvare ---------------- */
A.targetAct = (t, fromAct) => {
  if (!t.a) return fromAct;
  const id = A.aliasMap[t.a];
  if (!id) return { external: t.a };
  if (id[0] === '?') return { pending: id.slice(1) };
  return id;
};
A.describeAlias = alias => {
  if (!alias) return '';
  if (alias.startsWith('cod:')) return 'Codul ' + alias.slice(4).replace('procedura', 'de procedură').replace('executare', 'de executare').replace('contraventional', 'contravențional').replace('educatiei', 'educației');
  if (alias.startsWith('lege:')) return 'Legea nr. ' + alias.slice(5);
  return alias;
};
A.findArt = (act, artId, fromAct) => {
  let id = String(artId);
  if (act.id === 'CC' && fromAct && fromAct !== 'CC') {
    const m = id.match(/^48_(\d+)$/);   // numerotarea veche a CC: art. 48ⁿ = art. 64+n
    if (m) { const alt = String(64 + +m[1]); if (act.artById[alt]) return { art: act.artById[alt], oldNum: '48' + m[1].split('').map(d => A.SUP[+d]).join('') }; }
  }
  if (act.artById[id]) return { art: act.artById[id] };
  if (/^\d{2,}$/.test(id)) for (const k of [1, 2]) { const alt = id.slice(0, -k) + '_' + id.slice(-k); if (act.artById[alt]) return { art: act.artById[alt] }; }
  return null;
};
A.findAlin = (art, al) => {
  if (art.blockById['a' + al]) return 'a' + al;
  if (/^\d{2}$/.test(al) && art.blockById['a' + al[0] + '_' + al[1]]) return 'a' + al[0] + '_' + al[1];
  return null;
};
/* întoarce {act, art, hit:Set(blockIds), ctx:Set(blockIds), label, warn} sau {missing} */
A.resolve = async (t, fromAct) => {
  const tgt = A.targetAct(t, fromAct);
  if (typeof tgt === 'object') {
    if (tgt.pending) return { missing: 'pending', act: tgt.pending, label: A.actName(tgt.pending) };
    return { missing: 'external', label: A.describeAlias(tgt.external) };
  }
  const act = await A.loadAct(tgt);
  if (t.whole && !t.art) {
    if (t.anx) { const anx = (act.annexes || []).find(x => x.id === 'anexa-' + t.anx); return { act, annex: anx || null, missing: anx ? null : 'annex', label: `${act.meta.short} · anexa nr. ${t.anx}` }; }
    return { act, whole: true, label: act.meta.name };
  }
  if (t.anx) {
    const anx = (act.annexes || []).find(x => x.id === 'anexa-' + t.anx);
    if (!anx) return { missing: 'annex', label: `anexa nr. ${t.anx}` };
    const hit = new Set();
    if (t.pct) for (const b of anx.blocks) if (b.n === t.pct || (b.n || '').startsWith(t.pct + '.')) hit.add(b.id);
    return { act, annex: anx, hit, label: `${act.meta.short} · anexa nr. ${t.anx}${t.pct ? ' · pct. ' + t.pct : ''}` };
  }
  if (t.art2) {
    const list = [];
    const a1 = A.findArt(act, t.art, fromAct), a2 = A.findArt(act, t.art2, fromAct);
    if (a1 && a2) for (let i = a1.art.i; i <= a2.art.i; i++) list.push(act.articles[i]);
    return { act, range: list, label: `${act.meta.short} · art. ${A.idToNum(t.art)}–${A.idToNum(t.art2)}`, missing: list.length ? null : 'art' };
  }
  const f = A.findArt(act, t.art, fromAct);
  if (!f) return { missing: 'art', act, label: `${act.meta.short} · art. ${A.idToNum(t.art)}` };
  const art = f.art, hit = new Set(), ctx = new Set();
  let label = `${act.meta.short} · art. ${art.num}`, warn = f.oldNum ? `Trimitere la numerotarea veche a Codului civil (art. ${f.oldNum}); afișez art. ${art.num}.` : '';
  if (t.a === 'lege:137/2015') warn = 'Trimitere la Legea nr. 137/2015, abrogată; se citește ca trimitere la Legea nr. 9/2026.';
  const alIds = [];
  if (t.al) {
    const a1 = A.findAlin(art, t.al);
    if (!a1) return { act, art, missing: 'al', label: label + ` · alin. (${A.idToNum(t.al)})`, hit, ctx };
    if (t.al2) { const a2 = A.findAlin(art, t.al2); let on = false; for (const b of art.blocks) { if (b.id === a1) on = true; if (on && b.k === 'al') alIds.push(b.id); if (b.id === a2) break; } }
    else alIds.push(a1);
    label += ` · alin. (${A.idToNum(t.al)})` + (t.al2 ? `–(${A.idToNum(t.al2)})` : '');
  }
  const under = (b, base) => b.id === base || b.id.startsWith(base + '.');
  if (t.lit || t.pct) {
    const kind = t.lit ? 'l' : 'p', from = t.lit || t.pct, to = t.lit2 || t.pct2 || from;
    const base = alIds[0] || null;
    const letters = art.blocks.filter(b => (b.k === (t.lit ? 'lit' : 'pct')) && (!base || under(b, base)));
    let on = false;
    for (const b of letters) {
      if ((b.n || '').replace(/[⁰-⁹]/g, '') === from || b.n === from) on = true;
      if (on) { hit.add(b.id); for (const x of art.blocks) if (x.id.startsWith(b.id + '.')) hit.add(x.id); }
      if (on && ((b.n || '') === to || (b.n || '').replace(/[⁰-⁹]/g, '') === to)) break;
    }
    if (!hit.size) return { act, art, missing: kind === 'l' ? 'lit' : 'pct', label: label + ` · ${t.lit ? 'lit. ' + from + ')' : 'pct. ' + from}`, hit, ctx };
    if (base) ctx.add(base); else { const intro = art.blocks.find(b => b.k === 'p'); if (intro) ctx.add(intro.id); }
    label += t.lit ? ` · lit. ${from})${t.lit2 ? '–' + t.lit2 + ')' : ''}` : ` · pct. ${from}${t.pct2 ? '–' + t.pct2 : ''}`;
  } else if (alIds.length) {
    for (const id of alIds) for (const b of art.blocks) if (under(b, id)) hit.add(b.id);
  }
  return { act, art, hit, ctx, label, warn };
};

/* ---------------- randare text juridic ---------------- */
A.renderText = (b, actId) => {
  const t = b.t || '';
  if (!b.r || !b.r.length) return A.esc(t);
  let out = '', pos = 0;
  const refs = b.r.slice().sort((x, y) => x[0] - y[0]);
  for (const [s, e, tg] of refs) {
    if (s < pos) continue;
    out += A.esc(t.slice(pos, s));
    const tgt = A.targetAct(tg, actId);
    const cls = typeof tgt === 'object' ? 'ref ext' : (tg.whole ? 'ref act' : 'ref');
    out += `<a class="${cls}" data-from="${actId}" data-t='${A.esc(JSON.stringify(tg))}'>${A.esc(t.slice(s, e))}</a>`;
    pos = e;
  }
  return out + A.esc(t.slice(pos));
};
A.blockHTML = (b, actId, extraCls = '') => {
  const lvl = Math.min(4, Math.max(1, b.lvl || 1));
  if (/^_{5,}\s*$/.test(b.t || '')) return '';
  if (b.k === 'note' || /^\*?\s*Not[ăa]\s*:/.test(b.t || '')) return `<p class="note ${extraCls}" data-b="${b.id}">${A.esc(b.t)}</p>`;
  let lab = '';
  if (b.k === 'al') lab = `(${b.n})`;
  else if (b.k === 'lit' || b.k === 'pct') lab = `${b.n})`;
  else if (b.k === 'dash') lab = '–';
  let body = A.renderText(b, actId);
  let cls = `l${lvl}`;
  if (b.def) { cls += ' def'; const i = (b.t || '').indexOf(b.def); if (i === 0 && !b.r) body = `<span class="term">${A.esc(b.def)}</span>${A.esc(b.t.slice(b.def.length))}`; }
  if (b.v) body += ` — <b>${A.esc(b.v)}</b>`;
  return `<p class="${cls} ${extraCls}" data-b="${b.id}">${lab ? `<span class="lab">${A.esc(lab)}</span>` : ''}${body}</p>`;
};

/* ---------------- sunet ---------------- */
A.sound = (kind) => {
  if (!A.S || !A.S.settings.sound) return;
  try {
    const ctx = A._actx || (A._actx = new (window.AudioContext || window.webkitAudioContext)());
    const seq = { click: [[1200, .025]], xp: [[880, .06]], ok: [[660, .07], [990, .09]], ko: [[220, .14]], level: [[523, .1], [659, .1], [784, .1], [1046, .22]], coin: [[1318, .05], [1760, .08]], chest: [[392, .08], [523, .08], [659, .14]], stamp: [[140, .12], [523, .08], [659, .08], [784, .08], [1046, .2]], warn: [[330, .08], [262, .12]] }[kind] || [[600, .05]];
    if (kind === 'click' && A._lastClick && ctx.currentTime - A._lastClick < .05) return;
    if (kind === 'click') A._lastClick = ctx.currentTime;
    const vol = kind === 'click' ? .04 : .12;
    let t = ctx.currentTime;
    for (const [f, d] of seq) {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = kind === 'stamp' || kind === 'click' ? 'triangle' : 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + d);
      o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + d + .02); t += d * .9;
    }
  } catch (e) { }
};

/* ---------------- toasts, modale, confetti ---------------- */
A.phone = () => innerWidth <= 620;
/* serverul propriu (aplicația de pe calculator) există doar pe 127.0.0.1 */
A.api = location.protocol !== 'file:' && /^(127\.0\.0\.1|localhost)$/.test(location.hostname);
/* încărcarea datelor: din rețea, sau din fișierele .js alăturate când aplicația e deschisă direct ca fișier */
A.json = async url => {
  const pre = (window.__ATLAS_DATA || {})[url]; if (pre) return pre;
  if (location.protocol === 'file:') {
    await new Promise((ok, ko) => { const sc = document.createElement('script'); sc.src = url.replace(/\.json$/, '.js'); sc.onload = ok; sc.onerror = ko; document.head.appendChild(sc); });
    const d = (window.__ATLAS_DATA || {})[url]; if (d) return d; throw new Error('Lipsește ' + url);
  }
  const r = await fetch(url); if (!r.ok) throw new Error(url + ': ' + r.status); return r.json();
};
A.toast = (html, ms = 3200) => {
  ms = A.phone() ? Math.min(2600, ms) : Math.round(ms * 1.4);   // pe telefon scurte; pe calculator stau cu 40% mai mult
  const host = A.$('#toasts'), key = String(html);
  const same = A.$$('.toast', host).find(t => t.dataset.k === key && !t.classList.contains('out'));
  if (same) { clearTimeout(same._t); same.classList.remove('bump'); void same.offsetWidth; same.classList.add('bump'); same._t = setTimeout(() => A.toastOut(same), ms); return same; }
  const el = document.createElement('div'); el.className = 'toast'; el.dataset.k = key; el.innerHTML = key.includes('<svg') || key.includes('<img') ? key : `<span>${key}</span>`;
  host.appendChild(el); el._t = setTimeout(() => A.toastOut(el), ms);
  const max = A.phone() ? 1 : 5;
  let live = A.$$('.toast:not(.out)', host);
  while (live.length > max) { A.toastOut(live[0]); live = A.$$('.toast:not(.out)', host); }
  return el;
};
/* afișează un modal doar când nu e deschis altul (nu întrerupe întrebări sau formulare) */
A.whenFree = fn => { const t = () => { const ov = A.$('#overlay'); if (ov && !ov.innerHTML && !A.guard.on && !A.$('#view .quiz .qcard:not(.summary)')) fn(); else setTimeout(t, 600); }; setTimeout(t, 300); };
A.toastOut = el => { el.classList.add('out'); setTimeout(() => el.remove(), 650); };
/* true doar în aplicația de pe calculator (fereastra Electron) */
A.desktop = () => !!(window.stratiev && window.stratiev.desktop);
A.noMoney = () => { A.toast('Nu ai destui bani pentru asta.'); A.sound('warn'); };
A.modal = (html, onClose) => {
  const ov = A.$('#overlay');
  ov.innerHTML = `<div class="modal" role="dialog" aria-modal="true">${html}</div>`;
  const close = () => { if (!ov.innerHTML) return; ov.innerHTML = ''; document.removeEventListener('keydown', esc); if (A._modalEsc === esc) A._modalEsc = null; onClose && onClose(); };
  const esc = e => { if (e.key === 'Escape') close(); };
  if (A._modalEsc) document.removeEventListener('keydown', A._modalEsc);
  A._modalEsc = esc; document.addEventListener('keydown', esc);
  ov.onclick = e => { if (e.target === ov) close(); };
  A.$$('[data-close]', ov).forEach(b => b.onclick = close);
  const f = A.$('.modal button, .modal a', ov); f && f.focus();
  return { el: A.$('.modal', ov), close };
};
A.confetti = () => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const c = document.createElement('canvas'); c.className = 'confetti'; document.body.appendChild(c);
  const w = c.width = innerWidth, h = c.height = innerHeight, x = c.getContext('2d');
  const cols = ['#B98A12', '#5A3F8F', '#2B5C8A', '#B23A2E', '#2E7D5B'];
  const P = Array.from({ length: 140 }, () => ({ x: w / 2, y: h / 3, vx: A.rand(-9, 9), vy: A.rand(-14, -4), r: A.rand(3, 7), c: A.pick(cols), a: A.rand(0, 6) }));
  let f = 0; const step = () => { x.clearRect(0, 0, w, h); for (const p of P) { p.vy += .35; p.x += p.vx; p.y += p.vy; p.a += .2; x.fillStyle = p.c; x.save(); x.translate(p.x, p.y); x.rotate(p.a); x.fillRect(-p.r, -p.r / 2, p.r * 2, p.r); x.restore(); } if (++f < 120) requestAnimationFrame(step); else c.remove(); }; step();
};
A.fly = (text, x, y, crit) => {
  const el = document.createElement('div'); el.className = 'xpfly' + (crit ? ' crit' : ''); el.textContent = text;
  el.style.left = (x - 20) + 'px'; el.style.top = (y - 20) + 'px'; document.body.appendChild(el); setTimeout(() => el.remove(), 1200);
};

/* ---------------- ieșirea din aplicație în timpul unei întrebări ---------------- */
A.guard = { on: null, warned: false };
A.guardStart = onLeave => { A.guard.on = onLeave; };
A.guardStop = () => { A.guard.on = null; };
const leave = () => {
  const f = A.guard.on; if (!f || A.micOn) return;
  A.guard.on = null; f();
};
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') leave(); });
window.addEventListener('blur', () => setTimeout(() => { if (!document.hasFocus()) leave(); }, 400));
A.studied = () => { if (A.S) A.S.activity.lastStudy = Date.now(); };
A.AFK_MS = 30 * 60e3;
A.active = () => A.S && Date.now() - (A.S.activity.lastStudy || 0) < A.AFK_MS;

/* ---------------- ștampile (SVG) ---------------- */
A.stampSVG = (top, bottom, glyph, color = 'var(--stamp)', rot = -8) => `
<svg class="stamp-svg" viewBox="0 0 120 120" style="color:${color}">
 <defs><path id="sp-t-${top.length}${bottom.length}" d="M 18 60 A 42 42 0 0 1 102 60"/><path id="sp-b-${top.length}${bottom.length}" d="M 14 60 A 46 46 0 0 0 106 60"/></defs>
 <g transform="rotate(${rot} 60 60)">
  <circle class="ring" cx="60" cy="60" r="55" stroke-width="3.5"/>
  <circle class="ring" cx="60" cy="60" r="47" stroke-width="1.2"/>
  <circle class="ring" cx="60" cy="60" r="30" stroke-width="1.2"/>
  <text font-size="10.5" letter-spacing="1.2" font-weight="600"><textPath href="#sp-t-${top.length}${bottom.length}" startOffset="50%" text-anchor="middle">${A.esc(top)}</textPath></text>
  <text font-size="9.5" letter-spacing="1.1"><textPath href="#sp-b-${top.length}${bottom.length}" startOffset="50%" text-anchor="middle">${A.esc(bottom)}</textPath></text>
  <text x="60" y="${glyph.length > 2 ? 66 : 70}" text-anchor="middle" font-size="${glyph.length > 2 ? 16 : 26}" font-weight="700">${A.esc(glyph)}</text>
 </g>
</svg>`;

/* ---------------- rutare ---------------- */
A.route = (name, fn) => { A.routes[name] = fn; };
A.go = h => { if (location.hash !== h) location.hash = h; else A.render(); };
A.render = async () => {
  A.closePopups && A.closePopups();
  A.timers.forEach(t => clearInterval(t)); A.timers = [];
  const parts = (location.hash.replace(/^#\/?/, '') || 'harta').split('/').map(decodeURIComponent);
  const name = parts[0];
  const navOf = { lectura: 'lectura', cautare: 'lectura', raion: 'lectura', act: 'lectura', antrenament: 'lectura', firma: 'firma', garaj: 'firma', cariera: 'firma', profil: 'firma', setari: 'firma', harta: 'harta', joc: 'harta' };
  A.$$('.rail a[data-nav]').forEach(a => a.classList.toggle('on', a.dataset.nav === (navOf[name] || name)));
  const view = A.$('#view');
  const fn = A.routes[name] || A.routes.harta;
  try { await fn(view, parts.slice(1)); }
  catch (e) { console.error(e); view.innerHTML = `<div class="empty">Pagina nu a putut fi deschisă: ${A.esc(e.message)}</div>`; }
  A.hud();
};
A.every = (ms, fn) => { const t = setInterval(fn, ms); A.timers.push(t); return t; };
window.addEventListener('hashchange', () => A.render());

/* insignele roșii de pe file: ce așteaptă să fie luat */
A.navBadges = () => {
  const E = A.eco, s = E && E.s && E.s(); const n = Date.now();
  const set = (k, c) => { const a = A.$(`.rail a[data-nav="${k}"]`); if (!a) return; let b = a.querySelector('.nb'); if (!c) { b && b.remove(); return; } if (!b) { b = document.createElement('b'); b.className = 'nb'; a.appendChild(b); } b.textContent = c > 9 ? '9+' : c; };
  if (!s || !s.started) { set('harta', 0); set('firma', 0); return; }
  const chests = E.chestsLocked() ? 0 : s.slots.filter(c => c && c.unlockEnd && c.unlockEnd <= n).length + (s.freeStock > 0 ? 1 : 0);
  const office = s.consults.filter(c => c.end <= n).length + s.procs.filter(p => p.end <= n).length;
  set('harta', chests); set('firma', office);
  try { set('lectura', A.game.dueKeys().length); } catch (e) { }
};

/* ---------------- ecranul de pornire și trecerile cu estompare ---------------- */
A.splashDone = () => {
  const sp = A.$('#splash'); if (!sp) return;
  const wait = Math.max(0, 1800 - performance.now());
  setTimeout(() => { sp.classList.add('out'); document.documentElement.classList.remove('splashing'); setTimeout(() => sp.remove(), 650); }, wait);
};
/* estompează ecranul, schimbă pagina, apoi îl readuce */
A.fadeGo = hash => {
  const f = A.$('#fader'); if (!f) return A.go(hash);
  f.classList.add('on');
  setTimeout(() => { A.go(hash); setTimeout(() => f.classList.remove('on'), 120); }, 380);
};

/* ---------------- tema ---------------- */
A.applyTheme = () => {
  const t = A.S.settings.theme;
  const dark = t === 'dark' || (t === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
};

/* ---------------- pornire ---------------- */
A.boot = async () => {
  await A.store.load();
  A.applyTheme();
  await A.loadRegistry();
  A.study && await A.study.load();
  A.game && A.game.init();
  A.eco && A.eco.init();
  A.render();
  A.splashDone();
  // păstrează serverul local în viață și salvează periodic
  if (A.api) setInterval(() => { fetch('/api/ping').catch(() => { }); }, 15000);
  setInterval(() => { A.eco && A.eco.tick(); }, 1000);
};
document.addEventListener('DOMContentLoaded', () => A.boot());
document.addEventListener('pointerdown', e => { if (e.target.closest('button, .btn, a.mode, .opt')) A.sound('click'); }, true);
