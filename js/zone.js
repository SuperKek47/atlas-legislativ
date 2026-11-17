/* Atlasul legislativ — zonele hărții (Centru, Sud, Nord): progres pe zone, venit pasiv, apărarea zonei, bossul de zonă. */
'use strict';
(() => {
const Z = A.zonex = {};
const ST = A.study, Q = A.quiz;
const DAY = 864e5, CAP_DAYS = 3, DECAY = 12, FLOOR = 25;
const st = id => { A.S.zones = A.S.zones || {}; return (A.S.zones[id] = A.S.zones[id] || { ctrl: 100, day: null, acc: 0, capt: null, boss: null }); };
Z.state = st;
Z.captured = id => ST.zoneDone(id);
Z.bossed = id => !!st(id).boss;
Z.allBossed = () => A.zones.every(z => Z.bossed(z.id));
Z.rate = id => {
  const z = ST.zone(id); let t = 0;
  for (const u of z.units) { const r = A.raion(u); if (r && A.conquered(u)) t += 60 + Math.round((r.n || 0) * 0.8); }
  return Math.round(t * (Z.bossed(id) ? 1.5 : 1));
};
Z.income = id => Math.round(Z.rate(id) * st(id).ctrl / 100);
/* trece timpul: pe zi, controlul scade cu 12 puncte, iar venitul se adună proporțional cu controlul */
Z.tick = () => {
  const today = A.today(); let changed = false;
  for (const z of A.zones) {
    if (!ST.zoneDone(z.id)) continue;
    const s = st(z.id);
    if (!s.capt) { s.capt = today; s.day = today; s.ctrl = 100; s.acc = 0; changed = true; continue; }
    const d = Math.min(14, Math.floor((Date.parse(today) - Date.parse(s.day || today)) / DAY));
    if (d > 0) {
      const rate = Z.rate(z.id), cap = rate * CAP_DAYS;
      for (let i = 0; i < d; i++) { s.acc = Math.min(cap, s.acc + rate * s.ctrl / 100); s.ctrl = Math.max(FLOOR, s.ctrl - DECAY); }
      s.day = today; changed = true;
    }
  }
  if (changed) A.store.save();
};
Z.collect = id => {
  const s = st(id), E = A.eco;
  if (!E || !E.s() || !E.s().started) { A.toast('Înființează mai întâi biroul, ca să poți încasa venitul zonei.', 4000); return 0; }
  const n = Math.round(s.acc); if (n < 1) { A.toast('Nu s-a adunat încă nimic. Revino mâine.', 3000); return 0; }
  const got = E.earn(n); s.acc = 0; A.store.save(); A.sound('coin'); A.toast(`Venit din zona ${ST.zone(id).name}: +${A.lei(got)}`, 3500); return got;
};
/* momentul în care ultimul raion al zonei e cucerit */
Z.afterConquer = unit => {
  const z = ST.zoneOf(unit); if (!ST.zoneDone(z.id)) return null;
  const s = st(z.id); if (s.capt) return null;
  Z.tick();
  A.fx && A.fx.celebrate('raion', `Zona ${z.name} este a ta!`, 'Încasezi venit pasiv, dar trebuie să o aperi.');
  const nx = A.zones.filter(x => !ST.zoneDone(x.id) && ST.zoneOpen(x.id));
  return { zone: z, opened: nx };
};

/* ---------- bara de zone de pe hartă ---------- */
Z.barHTML = () => {
  const act = ST.activeZone();
  return A.zones.map(z => {
    const o = ST.zoneOpen(z.id), d = ST.zoneDone(z.id), k = ST.zoneStat(z.id), s = st(z.id), alert = d && s.capt && s.ctrl < 50;
    return `<button type="button" class="zchip ${z.id === act.id ? 'on' : ''} ${d ? 'done' : ''} ${o ? '' : 'lock'} ${alert ? 'alert' : ''}" data-zone="${z.id}" style="--zc:${z.color}"><i></i><b>${A.esc(z.name)}</b><small>${o ? `${k.k}/${k.n}` : 'blocat'}</small></button>`;
  }).join('');
};
Z.bindBar = (view, refresh) => {
  const bar = A.$('.zonebar', view); if (!bar) return;
  bar.onclick = e => {
    const b = e.target.closest('[data-zone]'); if (!b) return;
    const z = ST.zone(b.dataset.zone);
    if (!ST.zoneOpen(z.id)) { const rq = ST.zone(z.requires); A.toast(`Zona ${z.name} se deschide după ce cucerești toată zona ${rq ? rq.name : ''}.`, 3800); A.sound('warn'); return; }
    Z.panel(z.id, refresh);
  };
};

/* ---------- fereastra unei zone ---------- */
Z.panel = (id, refresh) => {
  const z = ST.zone(id), k = ST.zoneStat(id), s = st(id), done = ST.zoneDone(id), act = ST.activeZone().id === id, cur = act ? ST.current() : null;
  const rows = z.units.map(u => {
    const r = A.raion(u), nm = (MD_MAP.units.find(x => x[0] === u) || [u, u])[1], res = (A.reserved || []).find(x => x.unit === u);
    const cls = A.conquered(u) ? 'won' : u === cur ? 'cur' : r ? '' : 'soon';
    const label = r ? `${A.esc(r.short)} · ${A.esc(A.disc[r.disc].name)}` : res ? `${A.esc(res.title)} · în pregătire` : 'în pregătire';
    return `<li class="zr ${cls}"><span class="zdot"></span><div><b>${A.esc(nm)}</b><small>${label}</small></div><em>${A.conquered(u) ? 'cucerit' : u === cur ? 'curent' : r ? '' : 'în curând'}</em></li>`;
  }).join('');
  let ctl = '';
  if (done) {
    const inc = Z.income(id), rate = Z.rate(id);
    ctl = `<div class="zctl"><div class="zrow"><span>Controlul zonei</span><b>${Math.round(s.ctrl)}%</b></div><div class="bar"><i style="width:${s.ctrl}%;${s.ctrl < 50 ? 'background:var(--seal)' : ''}"></i></div>
      <p class="muted">Venit: ${A.lei(inc)} pe zi (maxim ${A.lei(rate)}). Controlul scade cu ${DECAY}% în fiecare zi; apără zona ca să nu piardă venitul.</p>
      <div class="zrow"><span>Adunat</span><b>${A.lei(Math.round(s.acc))}</b></div>
      <div class="mbtns"><button class="btn primary" data-z="collect">Încasează</button><button class="btn ${s.ctrl < 100 ? 'primary' : ''}" data-z="defend">Apără zona</button></div>
      ${s.boss ? `<p class="ztitle">Titlu câștigat: <b>${A.esc(z.title)}</b></p>` : `<div class="mbtns"><a class="btn boss" href="#/cariera/duel/zona-${id}" data-close>Provoacă ${A.esc(z.boss)}</a></div><p class="faint">Bossul zonei îți aduce titlul „${A.esc(z.title)}”, un dosar legendar și +50% venit.</p>`}</div>`;
  } else if (!act) ctl = `<div class="mbtns"><button class="btn primary" data-z="activate">Continuă în zona ${A.esc(z.name)}</button></div>`;
  const m = A.modal(`<div class="zpanel" style="--zc:${z.color}"><h2>Zona ${A.esc(z.name)}</h2><p class="muted">${A.esc(z.sub)}</p>
    <div class="zprog"><div class="bar"><i style="width:${k.n ? k.k / k.n * 100 : 0}%"></i></div><span>${k.k} din ${k.n} raioane${k.soon ? ` · ${k.soon} în pregătire` : ''}</span></div>
    ${ctl}<ul class="zlist">${rows}</ul><div class="mbtns"><button class="btn" data-close>Închide</button></div></div>`);
  m.el.addEventListener('click', e => {
    const b = e.target.closest('[data-z]'); if (!b) return;
    if (b.dataset.z === 'collect') { Z.collect(id); m.close(); A.hud(); refresh && refresh(); Z.panel(id, refresh); }
    else if (b.dataset.z === 'defend') { m.close(); Z.defend(id, refresh); }
    else if (b.dataset.z === 'activate') { ST.setZone(id); m.close(); A.sound('level'); refresh && refresh(); }
  });
};

/* ---------- apărarea zonei: 5 grile din articolele cucerite ---------- */
Z.defend = async (id, refresh) => {
  const z = ST.zone(id), s = st(id);
  const keys = []; for (const u of z.units) { const r = A.raion(u); if (r && A.conquered(u)) for (const l of r.lists) for (const a of l.arts) keys.push(A.key(l.act, a)); }
  if (!keys.length) { A.toast('Nu ai încă articole în această zonă.', 3000); return; }
  const layer = A.arena.layer('btest', '<div class="quiz"><div class="empty">Pregătesc atacul…</div></div>'), root = A.$('.quiz', layer);
  const shuf = a => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
  const pick = shuf(keys).slice(0, 60);
  const pool = await Q.pool('keys:' + pick.join(',')); await Q.loadBank();
  const list = [];
  for (const it of shuf(pool)) {
    if (list.length >= 5) break;
    const k = A.key(it.act.id, it.art.id), bank = [...(Q.studyByKey[k] || []), ...(Q.bankByKey[k] || [])];
    let q = null;
    if (bank.length) q = Q.fromBank(A.pick(bank), pool); else { q = Q.makeFor(it, pool, ['regula', 'text', 'tf', 'def', 'term']); if (q) q.auto = true; }
    if (q && q.options && !q.input) list.push({ key: k, q });
  }
  if (!list.length) { layer.close(); A.toast('Nu am putut forma întrebări pentru zonă.', 3000); return; }
  const n = list.length, res = []; let i = 0, closed = false; const KL = ['A', 'B', 'C', 'D'];
  const shut = () => { if (closed) return; closed = true; layer.close(); refresh && refresh(); };
  const draw = () => {
    const q = list[i].q;
    root.innerHTML = `<div class="bt-top"><button type="button" class="bt-x" aria-label="Închide">✕</button><div class="bar"><i style="width:${i / n * 100}%"></i></div><span class="faint">${i + 1}/${n}</span></div>
      <div class="qcard"><div class="src">Apărare · zona ${A.esc(z.name)}${q.src ? ' · ' + A.esc(q.src.label) : ''}</div><div class="q">${A.esc(q.q)}</div>${q.ctx ? `<div class="ctx">${q.ctx}</div>` : ''}
      <div class="opts ${q.long ? 'long' : ''}">${q.options.map((o, k) => `<button class="opt" data-i="${k}"><span class="k">${KL[k]}</span><span>${A.esc(o.t)}</span></button>`).join('')}</div><div id="fb"></div></div>`;
    A.$('.bt-x', root).onclick = () => { A.toast('Apărare întreruptă.', 2500); shut(); };
    A.$$('.opt', root).forEach(b => b.onclick = () => answer(+b.dataset.i, b));
  };
  const answer = (k, b) => {
    const q = list[i].q, ok = !!q.options[k].ok;
    A.$$('.opt', root).forEach((o, j) => { o.disabled = true; if (q.options[j].ok) o.classList.add('right'); }); if (!ok) b.classList.add('wrong');
    res.push(ok); A.sound(ok ? 'ok' : 'ko'); A.fx && A.fx.combo(ok); G_review(list[i].key, ok);
    const right = (q.options.find(o => o.ok) || {}).t;
    A.$('#fb', root).innerHTML = `<div class="feedback ${ok ? 'ok' : 'ko'}"><div><b>${ok ? 'Corect.' : 'Greșit.'}</b>${!ok && right ? `<div class="why">Răspunsul corect: ${A.esc(right)}</div>` : ''}</div><button class="btn primary" id="nx">${i + 1 < n ? 'Continuă' : 'Vezi rezultatul'}</button></div>`;
    const nx = A.$('#nx', root); nx.onclick = () => { i++; if (i < n) draw(); else finish(); }; nx.focus();
  };
  const G_review = (key, ok) => { try { A.game.review(key, ok); } catch (e) { } };
  const finish = () => {
    const ok = res.filter(Boolean).length, full = ok >= Math.max(1, n - 1), part = !full && ok >= Math.ceil(n / 2);
    const was = s.ctrl; s.ctrl = full ? 100 : part ? Math.min(100, s.ctrl + 35) : Math.min(100, s.ctrl + 10);
    A.S.quiz.answered += n; A.S.quiz.correct += ok; A.studied && A.studied(); A.store.save();
    layer.remove(); closed = true;
    A.arena.victory({ win: full, crowns: full ? 3 : part ? 2 : 1, banner: full ? 'ZONĂ APĂRATĂ' : part ? 'ATAC RESPINS' : 'ZONA CEDEAZĂ', title: `${ok} din ${n} corecte`,
      sub: `Controlul zonei ${z.name}: ${Math.round(was)}% → ${Math.round(s.ctrl)}%.${full ? '' : ' Răspunde corect la aproape toate întrebările ca să restabilești controlul complet.'}`, rewards: [],
      primary: { t: 'Continuă', fn: () => refresh && refresh() }, secondary: full ? null : { t: 'Încă o dată', fn: () => Z.defend(id, refresh) } });
    if (full) { A.sound('win'); setTimeout(() => A.fx && A.fx.confetti('big'), 300); }
  };
  draw();
};

/* ---------- bossul de zonă ---------- */
Z.duel = (view, id) => {
  const z = ST.zone(id); if (!z || !ST.zoneDone(id)) return A.go('#/harta');
  const E = A.eco, s = E.s(), zs = st(id), rematch = !!zs.boss;
  return A.dosar.run(view, {
    unit: 'decan', name: z.boss, title: `Dosarul contra ${z.boss}`,
    onLose: (score, host) => {
      const fee = s ? Math.min(Math.max(0, s.money), 8000) : 0; if (s) { s.money -= fee; A.store.save(); }
      host.innerHTML = `<p>Cheltuieli de judecată: ${A.lei(fee)}. Recitește și depune un dosar nou.</p><div class="mbtns"><a class="btn primary" href="#/cariera/duel/zona-${id}">Dosar nou</a><a class="btn" href="#/harta">Harta</a></div>`;
    },
    onWin: (score, host) => {
      if (rematch) { const g = E.earn(3000); host.innerHTML = `<p>Proces câștigat din nou: +${A.lei(g)}.</p><div class="mbtns"><a class="btn primary" href="#/harta">Harta</a></div>`; A.store.save(); return; }
      zs.boss = A.today();
      const prize = E.earn(40000), lg = s && s.started ? E.grantChest('decan', z.boss) : false;
      A.game.addXP(600); A.S.points.spete += 8; A.store.save(); A.game.checkStamps();
      A.fx.celebrate('raion', `${z.title}!`, `${z.boss} a căzut.`);
      host.innerHTML = `<div class="stampwrap slam" style="color:var(--seal)">${A.stampSVG('cucerit', z.name, '✓', 'var(--seal)', -10)}</div>
        <p>Ai primit titlul <b>${A.esc(z.title)}</b>. +${A.lei(prize)} · +600 XP · +8 puncte-speță${lg ? ' · un dosar legendar' : ''}. Venitul zonei crește cu 50%.</p>
        <div class="mbtns"><a class="btn primary" href="#/harta">Harta</a></div>`;
    },
  });
};
})();
