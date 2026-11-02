/* Atlasul legislativ — structura de studiu: raion -> 9 capitole (mini-boși) -> micro-secțiuni.
   Cucerire secvențială: un singur raion activ; capitolele se deschid pe rând. */
'use strict';
A.study = {};
const ST = A.study;

ST.load = async () => {
  try { ST.schema = await A.json('data/schema.json'); } catch (e) { ST.schema = { order: [], raioane: {} }; }
  try { ST.bank = await A.json('data/studiu.json'); } catch (e) { ST.bank = { grile: [], spete: [] }; }
  ST.bank.grile = ST.bank.grile || []; ST.bank.spete = ST.bank.spete || [];
  // ordinea: schema, apoi raioanele din pachete
  ST.order = (ST.schema.order || []).filter(u => A.raion(u));
  for (const r of A.raioane) if (!ST.order.includes(r.unit)) ST.order.push(r.unit);
  // index articol -> micro-secțiune
  ST.where = {}; ST.microById = {}; ST.chapById = {};
  for (const [u, R] of Object.entries(ST.schema.raioane || {})) {
    R.chapters.forEach((c, ci) => {
      c.unit = u; c.ci = ci; ST.chapById[c.id] = c;
      c.micro.forEach((m, mi) => { m.unit = u; m.ci = ci; m.mi = mi; ST.microById[m.id] = m; for (const a of m.arts) ST.where[m.act + ':' + a] = m; });
    });
  }
  // raioanele din pachete fără schemă: un singur capitol cu micro-secțiuni de câte 10 articole
  for (const r of A.raioane) if (!ST.schema.raioane[r.unit]) {
    const micro = []; for (const l of r.lists) for (let i = 0; i < l.arts.length; i += 10) micro.push({ act: l.act, arts: l.arts.slice(i, i + 10), name: `${A.actShort(l.act)}, art. ${A.idToNum(l.arts[i])}–${A.idToNum(l.arts[Math.min(i + 9, l.arts.length - 1)])}` });
    const c = { id: r.unit + '.c1', name: r.title || r.name, boss: r.boss || 'Paznicul raionului', micro, unit: r.unit, ci: 0 };
    micro.forEach((m, mi) => { m.id = c.id + '.m' + (mi + 1); m.unit = r.unit; m.ci = 0; m.mi = mi; ST.microById[m.id] = m; for (const a of m.arts) ST.where[m.act + ':' + a] = m; });
    ST.schema.raioane[r.unit] = { boss: r.boss, chapters: [c] }; ST.chapById[c.id] = c;
  }
  for (const [u, R] of Object.entries(ST.schema.raioane)) { const r = A.raion(u); if (r && R.boss) r.boss = R.boss; }
  // banca de studiu pe micro-secțiuni
  ST.gByMicro = {}; ST.sByMicro = {};
  for (const g of ST.bank.grile) (ST.gByMicro[g.m] = ST.gByMicro[g.m] || []).push(g);
  for (const s of ST.bank.spete) (ST.sByMicro[s.m] = ST.sByMicro[s.m] || []).push(s);
};

ST.chapters = unit => (ST.schema.raioane[unit] || { chapters: [] }).chapters;
ST.current = () => ST.order.find(u => !A.conquered(u)) || null;
ST.unitOpen = unit => A.conquered(unit) || unit === ST.current();
ST.beaten = cid => !!(A.S.study.chapters || {})[cid];
ST.chapterOpen = c => A.conquered(c.unit) || (c.unit === ST.current() && (c.ci === 0 || ST.beaten(ST.chapters(c.unit)[c.ci - 1].id)));
ST.microOf = (act, art) => ST.where[act + ':' + art] || null;
ST.artOpen = (act, art) => { const m = ST.microOf(act, art); if (!m) return true; return ST.chapterOpen(ST.chapById[m.id.replace(/\.m\d+$/, '')]); };
ST.chapOf = m => ST.chapById[m.id.replace(/\.m\d+$/, '')];

/* progres */
ST.artDone = (act, art) => { const r = A.S.arts[act + ':' + art]; return !!(r && r.r && r.u); };
/* grile de studiu: o grilă e „trecută” la prima încercare corectă; prag pe micro-secțiune = min(10, nr. grile) */
ST.grileNeed = m => Math.min(10, (ST.gByMicro[m] || []).length);
ST.grilePassedN = m => Object.keys(((A.S.study.passed || {})[m]) || {}).length;
ST.isPassed = g => !!(((A.S.study.passed || {})[g.m]) || {})[g.id];
ST.credit = (m, gid) => {
  const P = A.S.study.passed = A.S.study.passed || {};
  P[m] = P[m] || {};
  if (P[m][gid]) return false;
  P[m][gid] = 1; A.store.save();
  const mi = ST.microById[m]; if (mi) ST.checkMicro(mi);
  return true;
};
ST.microStats = m => { let read = 0, und = 0; for (const a of m.arts) { const r = A.S.arts[m.act + ':' + a]; if (r && r.r) read++; if (r && r.r && r.u) und++; } const need = ST.grileNeed(m.id), gp = Math.min(need, ST.grilePassedN(m.id)); return { n: m.arts.length, read, und, gNeed: need, gPassed: gp, gDone: gp >= need, done: und === m.arts.length && gp >= need }; };
/* grilele unei secțiuni (nod din arborele actului): toate micro-secțiunile ei */
ST.sectionMicros = (act, nid) => { const ids = new Set(); const walk = x => { const n = act.nodeById[x]; if (!n) return; for (const a of n.arts) { const m = ST.microOf(act.id, a); if (m) ids.add(m.id); } (act.kids[x] || []).forEach(walk); }; walk(nid); return [...ids]; };
ST.sectionStats = (act, nid) => { let n = 0, p = 0, need = 0; for (const mid of ST.sectionMicros(act, nid)) { const k = (ST.gByMicro[mid] || []).length; n += k; need += ST.grileNeed(mid); p += Math.min(k, ST.grilePassedN(mid)); } return { n, p, need }; };
/* sesiune de 5 grile din secțiune: întâi cele netrecute și nearătate recent, apoi restul */
ST.pickSession = (act, nid, k = 5) => {
  const all = ST.sectionMicros(act, nid).flatMap(m => ST.gByMicro[m] || []);
  const recent = (A.quizRecent && A.quizRecent()) || [];
  const tiers = [all.filter(g => !ST.isPassed(g) && !recent.includes(g.id)), all.filter(g => !ST.isPassed(g)), all];
  const out = [];
  for (const t of tiers) for (const g of A.shuffle(t.slice())) { if (out.length >= k) break; if (!out.includes(g)) out.push(g); }
  return out.slice(0, k);
};
ST.chapStats = c => { let n = 0, read = 0, und = 0, md = 0; for (const m of c.micro) { const s = ST.microStats(m); n += s.n; read += s.read; und += s.und; if (s.done) md++; } return { n, read, und, micro: c.micro.length, microDone: md, done: md === c.micro.length }; };
ST.miniReady = c => ST.chapterOpen(c) && !ST.beaten(c.id) && ST.chapStats(c).done;
ST.beatenCount = unit => ST.chapters(unit).filter(c => ST.beaten(c.id)).length;
ST.bossReady = unit => { const cs = ST.chapters(unit); return unit === ST.current() && cs.length > 0 && cs.every(c => ST.beaten(c.id)); };
/* capitolul la care lucrezi acum într-un raion */
ST.activeChapter = unit => ST.chapters(unit).find(c => !ST.beaten(c.id)) || ST.chapters(unit).slice(-1)[0];

/* la bifarea unui articol: micro-secțiune terminată -> se deblochează grilele și spețele ei */
ST.checkMicro = m => {
  const s = ST.microStats(m);
  if (s.done && !A.S.study.micro[m.id]) {
    A.S.study.micro[m.id] = A.today();
    const g = (ST.gByMicro[m.id] || []).length, sp = (ST.sByMicro[m.id] || []).length;
    A.toast(`<b>Micro-secțiune parcursă:</b>&nbsp;${A.esc(m.name.slice(0, 60))}${g || sp ? ` · s-au deblocat ${g} grile și ${sp} spețe` : ''}`, 4500);
    A.game.addXP(20); A.sound('chest'); if (A.eco && A.eco.quest) A.eco.quest('sect', 1); if (A.fx) A.fx.celebrate('section');
    const c = ST.chapOf(m);
    if (ST.chapStats(c).done) A.toast(`<b>Capitol încheiat.</b>&nbsp;Mini-bossul ${A.esc(c.boss)} te așteaptă.`, 5000);
    A.store.save();
  } else if (!s.done && A.S.study.micro[m.id]) { delete A.S.study.micro[m.id]; A.store.save(); }
};
/* la bifarea unui articol: verifică micro-secțiunea (citire + grile) */
ST.onProgress = (act, art) => { const m = ST.microOf(act, art); if (m) ST.checkMicro(m); };

/* banca de studiu deblocată (micro-secțiuni parcurse) */
ST.unlockedMicros = () => Object.keys(A.S.study.micro || {}).filter(id => ST.microById[id]);
ST.unlockedSpete = () => ST.unlockedMicros().flatMap(id => ST.sByMicro[id] || []);
ST.unlockedGrile = () => ST.unlockedMicros().flatMap(id => ST.gByMicro[id] || []);
/* grilele de examen permise: doar din raioanele cucerite și cel curent */
ST.openUnits = () => ST.order.filter(u => ST.unitOpen(u));
