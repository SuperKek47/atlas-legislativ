/* Atlasul legislativ — testul de bloc: la fiecare 5 articole citite, 5 grile (câte una pe articol).
   5 din 5 = blocul e înțeles (steaua întreagă); 3–4 = puncte-grilă, blocul rămâne nerezolvat; sub 3 = nimic.
   Recompensele se dau doar la sfârșit, nu la fiecare răspuns. */
'use strict';
(() => {
const B = A.block = {};
const ST = A.study, Q = A.quiz, G = A.game;

/* steaua articolului: goală, jumătate (citit), întreagă (înțeles) */
B.star = rec => {
  const lv = rec && rec.u ? 2 : rec && rec.r ? 1 : 0;
  const id = 'sg' + Math.random().toString(36).slice(2, 7);
  const P = 'M12 2.6l2.9 6.1 6.7.9-4.9 4.7 1.2 6.7L12 17.7l-5.9 3.3 1.2-6.7L2.4 9.6l6.7-.9z';
  return `<svg class="stars s${lv}" viewBox="0 0 24 24" role="img" aria-label="${['necitit', 'citit (jumătate de stea)', 'înțeles (stea întreagă)'][lv]}"><defs><linearGradient id="${id}" x1="0" x2="1" y1="0" y2="0"><stop offset="50%" stop-color="#F2C230"/><stop offset="50%" stop-color="rgba(0,0,0,0)"/></linearGradient></defs>
    <path d="${P}" class="bg"/><path d="${P}" class="fg" ${lv === 1 ? `fill="url(#${id})"` : ''}/></svg>`;
};

/* bara de la capătul blocului (sub ultimul articol al blocului) */
B.barHTML = (actId, artId) => {
  const b = ST.blockOf(actId, artId); if (!b || !b.last) return '';
  const s = ST.blockState(b.m, b.bi), tag = `data-blk="${b.m.id}" data-bi="${b.bi}"`;
  if (s.und >= s.n) return `<div class="blkbar done" ${tag}><span class="bk-ico">${B.star({ r: 1, u: 1 })}</span><div><b>Bloc înțeles</b><small>${s.n} articole cu steaua întreagă</small></div></div>`;
  if (s.read < s.n) return `<div class="blkbar wait" ${tag}><span class="bk-ico">${B.star({ r: s.read ? 1 : 0 })}</span><div><b>Bloc de ${s.n} articole · ${s.read}/${s.n} citite</b><small>Citește-le pe toate ca să deblochezi testul.</small></div></div>`;
  return `<div class="blkbar ready" ${tag}><button type="button" class="blkgo" data-blkgo><b>Testează-ți cunoștințele</b><small>${s.n} grile, câte una pe articol · ${s.n} din ${s.n} corecte = înțeles</small></button></div>`;
};
B.bind = (view, refresh) => {
  view.addEventListener('click', e => {
    const go = e.target.closest('[data-blkgo]'); if (!go) return;
    const bar = go.closest('.blkbar'); B.open(bar.dataset.blk, +bar.dataset.bi, () => refresh(bar.dataset.blk, +bar.dataset.bi));
  });
};

/* ---------- întrebările blocului ---------- */
const store = () => (A.S.study.blk = A.S.study.blk || {});
const buildQuestions = async (m, bi) => {
  const arts = ST.blocks(m)[bi], c = ST.chapOf(m);
  const keys = new Set(arts.map(a => A.key(m.act, a)));
  for (const mm of (c ? c.micro : [m])) if (mm.act === m.act) for (const a of mm.arts) { if (keys.size >= 40) break; keys.add(A.key(mm.act, a)); }
  const pool = await Q.pool('keys:' + [...keys].join(',')); await Q.loadBank();
  const used = store()[m.id + '#' + bi] || [], now = [], out = [];
  for (const a of arts) {
    const k = A.key(m.act, a), it = pool.find(x => x.act.id === m.act && x.art.id === a); if (!it) continue;
    const bank = [...(Q.studyByKey[k] || []), ...(Q.bankByKey[k] || [])], fresh = bank.filter(g => !used.includes(g.id));
    let q = null;
    if (bank.length) { const g = A.pick(fresh.length ? fresh : bank); q = Q.fromBank(g, pool); now.push(g.id); }
    else { q = Q.makeFor(it, pool, ['regula', 'text', 'tf', 'def', 'term']); if (q) q.auto = true; }
    if (q && q.options && !q.input) out.push({ art: a, key: k, q });
  }
  store()[m.id + '#' + bi] = now; return out;
};

B.build = buildQuestions;

/* ---------- testul ---------- */
B.open = async (mid, bi, done) => {
  const m = ST.microById[mid]; if (!m) return;
  const arts = ST.blocks(m)[bi], s0 = ST.blockState(m, bi);
  if (s0.read < s0.n) { A.toast('Citește mai întâi toate articolele blocului.', 3500); return; }
  const layer = A.arena.layer('btest', '<div class="quiz"><div class="empty">Pregătesc grilele…</div></div>');
  const root = A.$('.quiz', layer); let closed = false;
  const shut = () => { if (closed) return; closed = true; layer.close(); done && done(); };
  const list = await buildQuestions(m, bi);
  if (!list.length) {   // nu s-a putut forma nicio întrebare: blocul se trece după citire
    arts.forEach(a => G.passArt(m.act, a)); A.store.save(); A.toast('Blocul nu are întrebări: l-am trecut ca înțeles.', 4000); return shut();
  }
  const n = list.length, res = []; let i = 0;
  const keysL = ['A', 'B', 'C', 'D'];
  const draw = () => {
    const x = list[i], q = x.q;
    root.innerHTML = `<div class="bt-top"><button type="button" class="bt-x" aria-label="Închide testul">✕</button><div class="bar"><i style="width:${i / n * 100}%"></i></div><span class="faint">${i + 1}/${n}</span></div>
      <div class="qcard"><div class="src">${A.esc(q.src ? q.src.label : '')}${q.auto ? ' · întrebare generată' : ''}</div><div class="q">${A.esc(q.q)}</div>
      ${q.ctx ? `<div class="ctx">${q.ctx}</div>` : ''}
      <div class="opts ${q.long ? 'long' : ''}">${q.options.map((o, k) => `<button class="opt" data-i="${k}"><span class="k">${keysL[k]}</span><span>${A.esc(o.t)}</span></button>`).join('')}</div><div id="fb"></div></div>`;
    A.$('.bt-x', root).onclick = () => { A.toast('Test întrerupt: nu s-au acordat recompense.', 3500); shut(); };
    A.$$('.opt', root).forEach(b => b.onclick = () => answer(+b.dataset.i, b));
  };
  const answer = (k, b) => {
    const x = list[i], q = x.q, ok = !!q.options[k].ok;
    A.$$('.opt', root).forEach((o, j) => { o.disabled = true; if (q.options[j].ok) o.classList.add('right'); });
    if (!ok) b.classList.add('wrong');
    res.push({ art: x.art, key: x.key, ok }); A.sound(ok ? 'ok' : 'ko'); A.fx && A.fx.combo(ok);
    if (x.key) G.review(x.key, ok);
    const right = (q.options.find(o => o.ok) || {}).t;
    A.$('#fb', root).innerHTML = `<div class="feedback ${ok ? 'ok' : 'ko'}"><div><b>${ok ? 'Corect.' : 'Greșit.'}</b>${!ok && right ? `<div class="why">Răspunsul corect: ${A.esc(right)}</div>` : ''}${q.explainExtra ? `<div class="why">${A.esc(q.explainExtra)}</div>` : ''}</div><button class="btn primary" id="nx">${i + 1 < n ? 'Continuă' : 'Vezi rezultatul'}</button></div>`;
    const nx = A.$('#nx', root); nx.onclick = () => { i++; if (i < n) draw(); else finish(); }; nx.focus();
  };

  const finish = () => {
    const ok = res.filter(r => r.ok).length, full = ok === n, partial = !full && ok >= 3, L = A.S.ledger;
    let xp = 0, money = 0, pts = 0, newU = 0;
    const take = (key, x, mo) => { if (L[key]) return; G.grant(key, x, mo); if (L[key]) { xp += L[key].xp || 0; money += L[key].money || 0; } };
    if (full || partial) {
      const P = (A.S.study.bpts = A.S.study.bpts || {});
      for (const r of res) if (r.ok) { if (!P[r.key]) { P[r.key] = 1; pts++; } take('blk:' + r.key, 3, 8); }
      A.S.points.grile = (A.S.points.grile || 0) + pts;
    }
    if (full) for (const a of arts) { const k = A.key(m.act, a), was = !!(A.S.arts[k] || {}).u, l0 = L['und:' + k]; if (G.passArt(m.act, a)) newU++; const l1 = L['und:' + k]; if (!was && l1 && !l0) { xp += l1.xp || 0; money += l1.money || 0; } }
    A.S.quiz.answered += n; A.S.quiz.correct += ok; A.studied();
    if (A.eco && A.eco.quest) { if (ok >= 3) A.eco.quest('correct', ok); if (newU) A.eco.quest('und', newU); }
    if (newU && A.arena.onUnderstood) for (let j = 0; j < newU; j++) A.arena.onUnderstood();
    A.store.save(); G.checkStamps();
    const R = A.arena, E = A.eco;
    const rewards = [{ ico: R.ICO.lei, n: Math.round(money), label: 'lei' }, { ico: R.ICO.xp, n: Math.round(xp), label: 'XP' }, { ico: R.ICO.gr, n: pts, label: 'puncte-grilă' }];
    const info = { done: () => shut() };
    layer.remove(); closed = true;   // ecranul de rezultat ia locul testului
    if (full) {
      R.victory({ win: true, crowns: 3, banner: 'BLOC ÎNȚELES', title: `${ok} din ${n} corecte`, sub: `Cele ${arts.length} articole au primit steaua întreagă.${pts ? '' : ' Punctele-grilă pentru ele fuseseră acordate deja.'}`, rewards,
        extra: `<div class="bt-stars">${arts.map(() => B.star({ r: 1, u: 1 })).join('')}</div>`, primary: { t: 'Continuă', fn: () => done && done() } });
      A.sound('win'); setTimeout(() => A.fx && A.fx.confetti('big'), 300);
    } else if (partial) {
      R.victory({ win: false, crowns: 1, banner: 'APROAPE', title: `${ok} din ${n} corecte`, sub: `Blocul nu este rezolvat: trebuie ${n} din ${n}. Ai primit punctele-grilă pentru răspunsurile corecte. Reia testul, cu toate articolele.`, rewards,
        primary: { t: 'Reia testul', fn: () => B.open(mid, bi, done) }, secondary: { t: 'Recitesc', fn: () => done && done() } });
    } else {
      R.victory({ win: false, crowns: 0, banner: 'NEREUȘIT', title: `${ok} din ${n} corecte`, sub: `Sub 3 răspunsuri corecte nu se acordă nimic. Recitește articolele și reia testul.`, rewards: [],
        primary: { t: 'Reia testul', fn: () => B.open(mid, bi, done) }, secondary: { t: 'Recitesc', fn: () => done && done() } });
    }
  };
  draw();
};
})();
