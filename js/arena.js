/* Atlasul legislativ — „arena”, etapa a 2-a: ecranele de recompensă în stil Clash.
   Victorie/înfrângere cu coroane, deschiderea dosarului pas cu pas, nivel nou pe tot ecranul,
   energia pentru PLAY, seria de zile, Calea Atlasului, misiunile săptămânale, magazinul zilei. */
'use strict';
(() => {
const R = A.arena = {};
const E = () => A.eco;
const st = () => { const s = A.S; s.arena = s.arena || {}; const a = s.arena;
  a.energy = a.energy || { n: R.EMAX, at: Date.now() }; a.road = a.road || {}; a.streakPaid = a.streakPaid || {}; a.shop = a.shop || { date: '', bought: [] }; a.undCnt = a.undCnt || 0;
  return a; };

/* ---------- vibrație scurtă (unde telefonul o permite) ---------- */
A.buzz = p => { try { if (A.S && A.S.settings.vib !== false && navigator.vibrate) navigator.vibrate(p); } catch (e) { } };

/* ---------- stratul pe tot ecranul ---------- */
R.layer = (cls, html) => {
  const el = document.createElement('div'); el.className = 'fx ' + cls; el.innerHTML = html;
  document.body.appendChild(el); requestAnimationFrame(() => el.classList.add('in'));
  el.close = () => { el.classList.add('out'); setTimeout(() => el.remove(), 320); };
  return el;
};
const count = (el, to, ms = 700, fmt = A.fmt) => { const t0 = performance.now(); const f = t => { const k = Math.min(1, (t - t0) / ms); el.textContent = fmt(Math.round(to * (1 - Math.pow(1 - k, 3)))); if (k < 1) requestAnimationFrame(f); }; requestAnimationFrame(f); };
const CROWN = on => `<svg viewBox="0 0 64 52" class="crown ${on ? 'on' : ''}"><path d="M6 44 L2 12 L18 26 L32 4 L46 26 L62 12 L58 44 Z" stroke="#0B1424" stroke-width="4" stroke-linejoin="round"/><rect x="6" y="40" width="52" height="9" rx="3" stroke="#0B1424" stroke-width="4"/><circle cx="32" cy="27" r="4.5" fill="#fff" opacity=".7"/></svg>`;
const ICO = {
  lei: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#FFC83A" stroke="#0B1424" stroke-width="1.6"/><text x="12" y="16.5" font-size="12" text-anchor="middle" fill="#5A3A00" font-family="Arial" font-weight="900">L</text></svg>',
  xp: '<svg viewBox="0 0 24 24"><path d="M12 2l3 6.5 7 .8-5.2 4.7 1.5 7L12 17.5 5.7 21l1.5-7L2 9.3l7-.8z" fill="#6FC3FF" stroke="#0B1424" stroke-width="1.5" stroke-linejoin="round"/></svg>',
  gr: '<svg viewBox="0 0 24 24"><path d="M12 2l9 10-9 10-9-10z" fill="#C59BFF" stroke="#0B1424" stroke-width="1.5" stroke-linejoin="round"/></svg>',
  sp: '<svg viewBox="0 0 24 24"><path d="M12 2l2.6 7.4L22 12l-7.4 2.6L12 22l-2.6-7.4L2 12l7.4-2.6z" fill="#FF9EDB" stroke="#0B1424" stroke-width="1.5" stroke-linejoin="round"/></svg>',
  en: '<svg viewBox="0 0 24 24"><path d="M13 2L4 14h7l-1 8 9-12h-7z" fill="#FFE27A" stroke="#0B1424" stroke-width="1.5" stroke-linejoin="round"/></svg>',
  card: '<svg viewBox="0 0 24 24"><rect x="5" y="3" width="14" height="18" rx="2.5" fill="#8BEA7B" stroke="#0B1424" stroke-width="1.5"/><circle cx="12" cy="10" r="3" fill="#fff"/><path d="M8 17c1-2.5 7-2.5 8 0" stroke="#0B1424" stroke-width="1.4" fill="none"/></svg>',
  client: '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4.5" fill="#FFB27A" stroke="#0B1424" stroke-width="1.5"/><path d="M3.5 21c1.5-5 15.5-5 17 0z" fill="#2A86E0" stroke="#0B1424" stroke-width="1.5"/></svg>',
  buff: '<svg viewBox="0 0 24 24"><path d="M12 2c1 4 6 6 6 11a6 6 0 0 1-12 0c0-3 2-4 2-7 1 2 2 3 3 3 0-3 0-5 1-7z" fill="#FF6B5E" stroke="#0B1424" stroke-width="1.5" stroke-linejoin="round"/></svg>',
  nitro: '<svg viewBox="0 0 24 24"><rect x="7" y="4" width="10" height="17" rx="3" fill="#6FC3FF" stroke="#0B1424" stroke-width="1.5"/><rect x="9" y="1.5" width="6" height="3" rx="1" fill="#B3C4DE" stroke="#0B1424" stroke-width="1.2"/><path d="M12 8l-2 5h4l-2 5" stroke="#0B1424" stroke-width="1.5" fill="none"/></svg>',
  paint: '<svg viewBox="0 0 24 24"><path d="M4 18c0-4 4-4 4-8s4-7 8-6 5 6 2 9-6 1-8 4-6 5-6 1z" fill="#C59BFF" stroke="#0B1424" stroke-width="1.5"/><circle cx="14" cy="8" r="1.6" fill="#fff"/></svg>',
  chest: t => `<span class="ich">${E().chestSVG(t)}</span>`,
};
R.ICO = ICO;

/* ================= VICTORIE / ÎNFRÂNGERE ================= */
/* o: {win, crowns 0..3, title, sub, rewards:[{ico, n, label, fmt}], primary:{t, href|fn}, secondary:{t, href|fn}} */
R.victory = o => {
  const el = R.layer('victory ' + (o.win ? 'win' : 'lose'), `
    <div class="vbox">
      <div class="vbanner"><span>${o.win ? 'VICTORIE' : 'ÎNFRÂNGERE'}</span></div>
      <div class="crowns">${[0, 1, 2].map(() => CROWN(false)).join('')}</div>
      ${o.title ? `<h2 class="vtitle">${A.esc(o.title)}</h2>` : ''}
      ${o.sub ? `<p class="vsub">${o.sub}</p>` : ''}
      <div class="vrew">${(o.rewards || []).filter(r => r.n > 0 || r.n === undefined).map((r, i) => `<div class="rw" style="animation-delay:${.9 + i * .12}s">${r.ico || ''}<b data-n="${r.n || 0}">${r.n ? '0' : ''}</b><small>${A.esc(r.label || '')}</small></div>`).join('')}</div>
      ${o.extra || ''}
      <div class="vbtns">${o.secondary ? `<button class="btn" data-v="2">${A.esc(o.secondary.t)}</button>` : ''}<button class="btn primary" data-v="1">${A.esc((o.primary || { t: 'Continuă' }).t)}</button></div>
    </div>`);
  A.sound(o.win ? 'level' : 'ko'); A.buzz(o.win ? [30, 60, 30] : 120);
  const cs = A.$$('.crown', el);
  for (let i = 0; i < (o.crowns || 0); i++) setTimeout(() => { cs[i].classList.add('on', 'pop'); A.sound('coin'); A.buzz(20); }, 550 + i * 330);
  setTimeout(() => A.$$('.rw b[data-n]', el).forEach(b => { const n = +b.dataset.n; if (n) count(b, n, 800, v => '+' + A.fmt(v)); }), 950);
  if (o.win && (o.crowns || 0) >= 3) setTimeout(() => A.confetti(), 1500);
  const act = x => { if (!x) return el.close(); el.close(); if (x.fn) x.fn(); else if (x.href) A.go(x.href); };
  A.$('[data-v="1"]', el).onclick = () => act(o.primary || { href: '#/harta' });
  const b2 = A.$('[data-v="2"]', el); if (b2) b2.onclick = () => act(o.secondary);
  return el;
};

/* ================= DESCHIDEREA DOSARULUI ================= */
/* items: [{ico, big, label, rare}] */
R.lootShow = (type, title, items, onClose) => {
  const el = R.layer('loot', `
    <div class="lt-rays"></div>
    <div class="lt-title">${A.esc(title)}</div>
    <div class="lt-stage"><div class="lt-chest">${E().chestSVG(type)}</div><div class="lt-card" hidden></div></div>
    <div class="lt-left"></div>
    <div class="lt-hint">Atinge ca să deschizi</div>
    <div class="lt-sum" hidden></div>`);
  const chest = A.$('.lt-chest', el), card = A.$('.lt-card', el), hint = A.$('.lt-hint', el), left = A.$('.lt-left', el), sum = A.$('.lt-sum', el);
  let stage = 0, i = 0, busy = false;
  const showCard = () => {
    const it = items[i++];
    card.hidden = false; card.className = 'lt-card ' + (it.rare ? 'rare' : ''); card.innerHTML = `<div class="ic">${it.ico}</div><b>${A.esc(it.big)}</b><small>${A.esc(it.label)}</small>`;
    void card.offsetWidth; card.classList.add('pop'); A.sound(it.rare ? 'stamp' : 'coin'); A.buzz(it.rare ? [20, 40, 20] : 15);
    left.textContent = items.length - i ? `${items.length - i} ${items.length - i === 1 ? 'recompensă rămasă' : 'recompense rămase'}` : '';
    hint.textContent = items.length - i ? 'Atinge pentru următoarea' : 'Atinge pentru rezumat';
  };
  el.onclick = () => {
    if (busy) return;
    if (stage === 0) {
      stage = 1; busy = true; hint.textContent = ''; chest.classList.add('shake'); A.sound('chest'); A.buzz([15, 30, 15, 30, 40]);
      setTimeout(() => { chest.querySelector('svg').classList.add('open'); el.classList.add('burst'); }, 650);
      setTimeout(() => { chest.classList.add('gone'); busy = false; if (items.length) showCard(); else el.onclick(); }, 1050);
      return;
    }
    if (i < items.length) return showCard();
    if (stage === 1) {
      stage = 2; card.hidden = true; left.textContent = ''; hint.textContent = '';
      sum.hidden = false; sum.innerHTML = `<div class="ls-grid">${items.map(it => `<div class="ls ${it.rare ? 'rare' : ''}">${it.ico}<b>${A.esc(it.big)}</b><small>${A.esc(it.label)}</small></div>`).join('')}</div><button class="btn primary" data-ok>Gata</button>`;
      A.$('[data-ok]', sum).onclick = e => { e.stopPropagation(); el.close(); onClose && onClose(); };
    }
  };
  return el;
};
R.lootItems = (loot, mult) => {
  const it = [];
  if (loot.money) it.push({ ico: ICO.lei, big: A.lei(loot.money), label: mult > 1 ? 'onorarii · dublat' : 'onorarii' });
  if (loot.clients.length) it.push({ ico: ICO.client, big: '× ' + loot.clients.length, label: loot.clients.length === 1 ? 'client nou: ' + '★'.repeat(loot.clients[0].stars) : 'clienți noi: ' + loot.clients.map(c => '★'.repeat(c.stars)).join(' · ') });
  for (const [r, n] of Object.entries(loot.cards)) it.push({ ico: ICO.card, big: '× ' + n, label: 'cartonașe: ' + E().ROLES[r].name.toLowerCase() });
  if (loot.buff) it.push({ ico: ICO.buff, big: loot.buff.min + ' min', label: loot.buff.label, rare: true });
  if (loot.cosm) it.push({ ico: ICO.paint, big: 'Nou', label: loot.cosm.n, rare: true });
  if (loot.nitro) it.push({ ico: ICO.nitro, big: '× ' + loot.nitro, label: 'nitro' });
  return it;
};

/* ================= NIVEL NOU ================= */
R.levelUp = (L, rank, promo, nextRank, chest) => {
  A.sound('level'); A.buzz([30, 50, 30, 50, 80]);
  const el = R.layer('lvlup', `<div class="lu-rays"></div><div class="lu-box">
    <div class="lu-kicker">${promo ? 'PROMOVARE' : 'NIVEL NOU'}</div>
    <div class="lu-shield"><span>${L - 1}</span></div>
    <h2>${promo ? A.esc(rank) : 'Nivelul ' + L}</h2>
    <p>${promo ? 'Rang nou în cariera ta juridică.' : 'Următorul rang: ' + A.esc(nextRank) + '.'}</p>
    ${chest ? `<div class="lu-gift">${ICO.chest(chest)}<span>Ai primit un ${E().CHESTS[chest].name.toLowerCase()}</span></div>` : ''}
    <button class="btn primary" data-ok>Continuă</button></div>`);
  const sp = A.$('.lu-shield span', el);
  setTimeout(() => { sp.classList.add('flip'); setTimeout(() => { sp.textContent = L; A.sound('stamp'); A.confetti(); }, 200); }, 700);
  A.$('[data-ok]', el).onclick = () => el.close();
};

/* ================= ENERGIA PENTRU PLAY ================= */
R.EMAX = 5; R.EREGEN = 30 * 60e3; R.EPER_UND = 3;
R.energy = () => { const a = st(), e = a.energy, n = Date.now();
  if (e.n >= R.EMAX) { e.at = n; return { n: e.n, next: 0 }; }
  const k = Math.floor((n - e.at) / R.EREGEN); if (k > 0) { e.n = Math.min(R.EMAX, e.n + k); e.at += k * R.EREGEN; if (e.n >= R.EMAX) e.at = n; }
  return { n: e.n, next: e.n >= R.EMAX ? 0 : e.at + R.EREGEN - n }; };
R.energyHTML = () => { const e = R.energy(); return `<div class="energy" title="Energie: fiecare PLAY consumă una">${ICO.en}<span class="pips">${Array.from({ length: R.EMAX }, (_, i) => `<i class="${i < e.n ? 'on' : ''}"></i>`).join('')}</span><small>${e.n >= R.EMAX ? 'plin' : '+1 în ' + E().shortDur(e.next)}</small></div>`; };
R.useEnergy = () => {
  const e = R.energy(); if (e.n > 0) { st().energy.n--; if (st().energy.n === R.EMAX - 1) st().energy.at = Date.now(); A.store.save(); return true; }
  const m = A.modal(`<div class="noen">${ICO.en}</div><h2>Fără energie</h2><p>Fiecare PLAY consumă o energie. Primești una la fiecare ${R.EPER_UND} articole rezumate sau una la 30 de minute. Următoarea vine peste ${E().shortDur(e.next)}.</p>
    <div class="mbtns"><a class="btn primary" href="#/lectura" data-close>Mergi la lectură</a><button class="btn" data-close>Aștept</button></div>`);
  A.sound('warn'); return false;
};
R.onUnderstood = () => { const a = st(); a.undCnt++; if (a.undCnt % R.EPER_UND === 0) { const e = R.energy(); if (e.n < R.EMAX) { a.energy.n++; A.toast(`${ICO.en}<span><b>+1 energie</b> pentru ${R.EPER_UND} articole rezumate</span>`); } } R.roadCheck(); A.store.save(); };

/* ================= SERIA DE ZILE ================= */
R.STREAK = [[3, 'argint', 0], [7, 'aur', 0], [14, 'magic', 5000], [30, 'decan', 0], [60, 'decan', 20000], [100, 'decan', 50000]];
R.checkStreak = () => {
  if (!A.S || !A.game) return; const n = A.game.streak(), a = st();
  for (const [d, chest, lei] of R.STREAK) if (n >= d && !a.streakPaid[d]) {
    a.streakPaid[d] = A.today(); if (lei && E().s().started) E().earn(lei / E().feeMult());
    const got = E().grantChest(chest, `Seria de ${d} zile`);
    A.toast(`${ICO.buff}<span><b>Serie de ${d} zile!</b> ${got ? E().CHESTS[chest].name : ''}${lei ? ' · +' + A.lei(lei) : ''}</span>`, 6000); A.store.save();
  }
};
R.nextStreak = () => { const n = A.game.streak(); const x = R.STREAK.find(([d]) => d > n); return x ? x[0] : null; };

/* ================= CALEA ATLASULUI (pe raioane) ================= */
/* Fiecare raion are propria cale: 12 trepte pe care le urci de jos în sus, cu marele premiu în vârf.
   Pragurile depind de numărul de articole al raionului, iar premiile cresc cu etapa jocului (rangul raionului în ordinea de cucerire). */
R.ROADFR = [.04, .09, .15, .22, .30, .38, .46, .55, .64, .74, .85, 1];
ICO.medal = '<svg viewBox="0 0 24 24"><path d="M7 2h4l1 6H6zM17 2h-4l-1 6h6z" fill="#E05A5A" stroke="#0B1424" stroke-width="1.3" stroke-linejoin="round"/><circle cx="12" cy="15" r="6.5" fill="#FFD54A" stroke="#0B1424" stroke-width="1.5"/><path d="M12 11.5l1.1 2.3 2.5.3-1.8 1.7.5 2.5-2.3-1.2-2.3 1.2.5-2.5-1.8-1.7 2.5-.3z" fill="#C98F00"/></svg>';
ICO.mystery = '<svg viewBox="0 0 24 24"><rect x="3.5" y="6" width="17" height="13" rx="2.5" fill="#B9A7FF" stroke="#0B1424" stroke-width="1.5"/><path d="M3.5 9l8.5 5 8.5-5" fill="none" stroke="#0B1424" stroke-width="1.5"/><circle cx="12" cy="14.5" r="2.6" fill="#FF6B8A" stroke="#0B1424" stroke-width="1.3"/></svg>';
R.roadUnits = () => A.study.order.filter(u => A.raion(u) && A.study.chapters(u).length);
R.raionArts = unit => { let n = 0; for (const c of A.study.chapters(unit)) for (const m of c.micro) n += m.arts.length; return n; };
R.raionUnd = unit => { let n = 0; for (const c of A.study.chapters(unit)) for (const m of c.micro) for (const x of m.arts) { const r = A.S.arts[m.act + ':' + x]; if (r && r.r && r.u) n++; } return n; };
const hashOf = str => { let h = 0; for (const ch of String(str)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; };
R.roadFor = unit => {
  const N = R.raionArts(unit), k = Math.max(0, A.study.order.indexOf(unit)), vol = N / 250, mult = Math.pow(1.3, k) * vol;
  const money = b => Math.max(100, Math.round(b * mult / 100) * 100);
  const role = k < 3 ? 'stagiar' : k < 6 ? 'jurist' : k < 9 ? 'avocat' : 'senior';
  const gr = 8 + 3 * k, spn = 1 + Math.floor(k / 4), bmin = Math.min(120, 30 + 6 * k);
  const myst = [[{ k: 'lei', v: money(9000) }], [{ k: 'chest', v: 'magic' }], [{ k: 'card', role, v: 6 + k }], [{ k: 'sp', v: spn + 2 }], [{ k: 'nitro', v: 4 }, { k: 'buff', kind: 'xp', min: bmin }], [{ k: 'lei', v: money(5000) }, { k: 'gr', v: gr * 2 }]][hashOf(unit) % 6];
  const defs = [
    [{ k: 'lei', v: money(600) }], [{ k: 'chest', v: 'simplu' }], [{ k: 'gr', v: gr }], [{ k: 'en', v: 5 }],
    [{ k: 'card', role, v: 2 + Math.floor(k / 2) }], [{ k: 'chest', v: 'argint' }], [{ k: 'buff', kind: k % 2 ? 'money' : 'xp', min: bmin }],
    [{ k: 'lei', v: money(4000) }, { k: 'nitro', v: 2 }], [{ k: 'sp', v: spn }], [{ k: 'chest', v: 'aur' }], [{ k: 'mystery' }],
    [{ k: 'chest', v: 'decan' }, { k: 'medal' }, { k: 'lei', v: money(12000) }, { k: 'paint' }],
  ];
  return defs.map((parts, i) => ({ i, th: Math.max(i + 1, Math.ceil(R.ROADFR[i] * N)), parts, real: parts[0].k === 'mystery' ? myst : parts, grand: i === defs.length - 1, mystery: parts[0].k === 'mystery' }));
};
R.partLabel = p => ({
  lei: () => A.lei(p.v), chest: () => E().CHESTS[p.v].name, gr: () => `${p.v} puncte-grilă`, sp: () => `${p.v} ${p.v === 1 ? 'punct-speță' : 'puncte-speță'}`,
  en: () => 'energie plină', card: () => `${p.v} cartonașe de ${E().ROLES[p.role].name.toLowerCase()}`, buff: () => `${p.kind === 'xp' ? 'XP dublu' : 'Onorarii duble'} · ${p.min} min`,
  nitro: () => `${p.v} × nitro`, medal: () => 'Medalia raionului (+2% onorarii, pentru totdeauna)', paint: () => 'o vopsea nouă pentru mașini', mystery: () => 'Plic sigilat · surpriză',
}[p.k])();
R.partIco = p => p.k === 'chest' ? ICO.chest(p.v) : ICO[({ lei: 'lei', gr: 'gr', sp: 'sp', en: 'en', card: 'card', buff: 'buff', nitro: 'nitro', paint: 'paint', medal: 'medal', mystery: 'mystery' })[p.k]];
R.roadLabel = m => m.parts.map(R.partLabel).join(' + ');
const roadRec = unit => { const a = st(); a.roadR = a.roadR || {}; return (a.roadR[unit] = a.roadR[unit] || {}); };
R.roadReadyIn = unit => { if (!A.study.unitOpen(unit)) return []; const n = R.raionUnd(unit), rec = roadRec(unit); return R.roadFor(unit).filter(m => m.th <= n && !rec[m.i]); };
R.roadReady = () => R.roadUnits().flatMap(u => R.roadReadyIn(u));
R.roadCheck = () => { const r = R.roadReady(); if (r.length && !st()._roadToast) { st()._roadToast = 1; A.toast(`${ICO.xp}<span><b>Calea Atlasului:</b> o recompensă te așteaptă în Lectură.</span>`); setTimeout(() => { delete st()._roadToast; }, 60e3); } };
R.roadClaim = (unit, i) => {
  const m = R.roadFor(unit)[i], rec = roadRec(unit); if (!m || rec[i] || !A.study.unitOpen(unit) || R.raionUnd(unit) < m.th) return false;
  const e = E(), s = e.s();
  if (m.real.some(p => !['gr', 'sp', 'en', 'medal'].includes(p.k)) && !s.started) { A.toast('Înființează biroul ca să primești această recompensă.'); return false; }
  let chest = null; const got = [];
  for (const p of m.real) {
    if (p.k === 'lei') e.earn(p.v / e.feeMult());
    else if (p.k === 'chest') chest = p.v;
    else if (p.k === 'gr') A.S.points.grile += p.v;
    else if (p.k === 'sp') A.S.points.spete += p.v;
    else if (p.k === 'en') { st().energy.n = R.EMAX; st().energy.at = Date.now(); }
    else if (p.k === 'card') s.cards[p.role] = (s.cards[p.role] || 0) + p.v;
    else if (p.k === 'buff') R.buff(p.kind, 2, p.min, p.kind === 'xp' ? 'XP dublu' : 'Onorarii duble');
    else if (p.k === 'nitro') s.nitro += p.v;
    else if (p.k === 'medal') { const a = st(); a.medals = a.medals || []; if (!a.medals.includes(unit)) a.medals.push(unit); }
    else if (p.k === 'paint') { const free = e.PAINTS.filter(x => !s.owned.paints.includes(x[1])); if (free.length) { const x = free[hashOf(unit) % free.length]; s.owned.paints.push(x[1]); got.push('Vopsea: ' + x[0]); } else e.earn(5000 / e.feeMult()); }
  }
  rec[i] = A.today(); A.store.save(); A.sound('chest'); A.buzz([20, 40, 20]); A.hud();
  if (m.mystery) A.toast(`<b>Plic sigilat:</b>&nbsp;${A.esc(m.real.map(R.partLabel).join(' + '))}`, 5000);
  if (got.length) A.toast(A.esc(got.join(' · ')), 4000);
  if (chest) e.openChest(null, false, chest);   // dosarele de pe cale se deschid imediat, fără slot și fără așteptare
  return true;
};
R.roadUnit = () => { const a = st(), cur = A.study.current(), list = R.roadUnits(); return list.includes(a.roadSel) ? a.roadSel : (list.includes(cur) ? cur : list[list.length - 1] || list[0]); };
R.roadStrip = () => {
  const unit = R.roadUnit(); if (!unit) return '';
  const n = R.raionUnd(unit), ms = R.roadFor(unit), ready = R.roadReady().length, nx = ms.find(x => x.th > n), prev = ms.filter(x => x.th <= n).pop();
  const pre = prev ? prev.th : 0;
  return `<a class="road" href="#/calea/${unit}">${ready ? `<b class="nb">${ready}</b>` : ''}<div class="rd-h"><b>Calea Atlasului</b><small>${A.esc(A.raion(unit).name)} · ${A.fmt(n)}/${A.fmt(R.raionArts(unit))} articole înțelese</small></div>
    ${nx ? `<div class="rd-next">${R.partIco(nx.parts[0])}<span><small>la ${nx.th}</small><b>${A.esc(R.roadLabel(nx))}</b></span></div><span class="rd-bar"><i style="width:${Math.round((n - pre) / (nx.th - pre) * 100)}%"></i></span>` : '<div class="rd-next"><b>Ai parcurs toată calea raionului.</b></div>'}</a>`;
};
A.route('calea', async (view, [u0]) => {
  const units = R.roadUnits(), a = st(); if (u0 && units.includes(u0)) { a.roadSel = u0; A.store.save(); }
  const unit = R.roadUnit(), ra = A.raion(unit), n = R.raionUnd(unit), N = R.raionArts(unit), rec = roadRec(unit), ms = R.roadFor(unit), open = A.study.unitOpen(unit), med = (a.medals || []).length;
  view.innerHTML = `<div class="calea"><a class="backlink" href="#/lectura">‹ Lectură</a><h1>Calea Atlasului</h1>
    <div class="cl-chips">${units.map(x => { const rd = R.roadReadyIn(x).length, lock = !A.study.unitOpen(x); return `<a class="cl-chip ${x === unit ? 'on' : ''} ${lock ? 'lock' : ''}" href="#/calea/${x}">${lock ? '🔒 ' : ''}${A.esc(A.raion(x).name)}${rd ? `<b>${rd}</b>` : ''}</a>`; }).join('')}</div>
    <p class="muted">${A.esc(ra.name)}: ${A.fmt(n)} din ${A.fmt(N)} articole înțelese.${med ? ` Medalii: ${med} (+${med * 2}% onorarii).` : ''}</p>
    ${open ? '' : '<div class="lockbar"><b>Raion încă blocat.</b> Poți vedea premiile, dar le deschizi abia când ajungi aici.</div>'}
    <div class="cl-list"><div class="cl-start">▲ Start · urci spre marele premiu</div>${ms.map(m => { const got = rec[m.i], ok = open && n >= m.th;
      return `<div class="cl ${got ? 'got' : ok ? 'ready' : 'far'} ${m.grand ? 'grand' : ''}"><span class="cl-th">${m.th}</span><span class="cl-ic">${R.partIco(m.parts[0])}</span><span class="cl-t"><b>${m.grand ? 'Marele premiu · ' : ''}${A.esc(R.roadLabel(m))}</b><small>${got ? 'primită' : ok ? 'gata de luat' : `încă ${Math.max(0, m.th - n)} articole`}</small></span>${ok && !got ? `<button class="btn primary small" data-i="${m.i}">Ia</button>` : got ? '<span class="cl-ok">✓</span>' : ''}</div>`; }).join('')}</div></div>`;
  A.$$('[data-i]', view).forEach(b => b.onclick = () => { if (R.roadClaim(unit, +b.dataset.i)) A.render(); });
  const first = A.$('.cl.ready, .cl.far', view); first && first.scrollIntoView({ block: 'center' });
});

/* ================= MAGAZINUL ZILEI ================= */
R.OFFERS = [
  { id: 'argint', t: 'Dosar de argint', lei: 1500, ico: () => ICO.chest('argint'), give: () => E().grantChest('argint', 'Magazin') },
  { id: 'aur', t: 'Dosar de aur', lei: 6000, ico: () => ICO.chest('aur'), give: () => E().grantChest('aur', 'Magazin') },
  { id: 'magic', t: 'Dosar magic', sp: 6, ico: () => ICO.chest('magic'), give: () => E().grantChest('magic', 'Magazin') },
  { id: 'legendar', t: 'Dosar legendar', sp: 12, ico: () => ICO.chest('decan'), give: () => E().grantChest('decan', 'Magazin') },
  { id: 'xp2', t: 'XP dublu · 30 min', lei: 2500, ico: () => ICO.xp, give: () => R.buff('xp', 2, 30, 'XP dublu') },
  { id: 'money2', t: 'Onorarii duble · 30 min', lei: 2500, ico: () => ICO.lei, give: () => R.buff('money', 2, 30, 'Onorarii duble') },
  { id: 'nitro', t: '2 × nitro', lei: 900, ico: () => ICO.nitro, give: () => { E().s().nitro += 2; return true; } },
  { id: 'energie', t: 'Energie plină', gr: 8, ico: () => ICO.en, give: () => { const a = st(); a.energy.n = R.EMAX; a.energy.at = Date.now(); return true; } },
  { id: 'carti', t: '4 cartonașe de jurist', lei: 1200, ico: () => ICO.card, give: () => { const s = E().s(); s.cards.jurist = (s.cards.jurist || 0) + 4; return true; } },
  { id: 'speed', t: 'Procese mai rapide · 60 min', gr: 12, ico: () => ICO.buff, give: () => R.buff('speed', 1.5, 60, 'Procese și consultații cu 50% mai rapide') },
];
R.buff = (kind, mult, min, label) => { const s = E().s(); s.buffs[kind] = { kind, mult, until: Math.max(Date.now(), (s.buffs[kind] || {}).until || 0) + min * 60e3, label }; return true; };
R.todayOffers = () => { const d = A.today(); let h = 0; for (const c of d) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const rare = R.OFFERS.filter(o => o.sp), pool = R.OFFERS.filter(o => !o.sp), out = [rare[(parseInt(d.slice(-2), 10) || 0) % rare.length]]; while (out.length < 3) { h = (h * 1103515245 + 12345) >>> 0; out.push(pool.splice(h % pool.length, 1)[0]); } return out; };
R.shopHTML = () => {
  const a = st(); if (a.shop.date !== A.today()) a.shop = { date: A.today(), bought: [] };
  const left = new Date(); left.setHours(24, 0, 0, 0);
  return `<section class="fsec shop"><div class="sh"><h2>Magazinul zilei</h2><span class="faint">se schimbă peste ${E().shortDur(left - Date.now())}</span></div>
    <div class="offers">${R.todayOffers().map(o => { const got = a.shop.bought.includes(o.id);
      return `<button class="offer ${got ? 'sold' : ''}" data-buy="${o.id}" ${got ? 'disabled' : ''}><span class="oi">${o.ico()}</span><b>${A.esc(o.t)}</b><span class="price">${got ? 'cumpărat' : o.lei ? `${ICO.lei}${A.fmt(o.lei)}` : o.sp ? `${E().spGem}${o.sp}` : `${ICO.gr}${o.gr}`}</span></button>`; }).join('')}</div></section>`;
};
R.buy = id => {
  const o = R.OFFERS.find(x => x.id === id), a = st(); if (!o || a.shop.bought.includes(id)) return;
  if (o.gr && (A.S.points.grile || 0) < o.gr) { A.toast(`Îți trebuie ${o.gr} puncte-grilă. Ai ${A.S.points.grile || 0}.`); A.sound('warn'); return; }
  if (o.sp && (A.S.points.spete || 0) < o.sp) { A.toast(`Îți trebuie ${o.sp} puncte-speță. Ai ${A.S.points.spete || 0}.`); A.sound('warn'); return; }
  if (o.lei && E().s().money < o.lei) return A.noMoney();
  if (['argint', 'aur', 'magic', 'legendar'].includes(o.id) && !E().s().slots.some(x => !x)) { A.toast('Sloturile de dosare sunt pline.'); A.sound('warn'); return; }
  if (o.lei) E().s().money -= o.lei; if (o.gr) A.S.points.grile -= o.gr; if (o.sp) A.S.points.spete -= o.sp;
  o.give(); a.shop.bought.push(id); A.store.save(); A.sound('coin'); A.buzz(20); A.toast(`Ai cumpărat: ${A.esc(o.t)}.`); A.hud(); A.render();
};

/* ================= MISIUNI: zilnice (cu revendicare) și săptămânale ================= */
R.week = () => A.addDays(A.today(), -((new Date().getDay() + 6) % 7));
R.ensureWeekly = () => {
  const s = E().s(); if (!s || !s.started) return;
  if (s.weekly && s.weekly.week === R.week()) return;
  s.weekly = { week: R.week(), quests: A.shuffle(E().QUESTS).slice(0, 3).map(([id, t, ns]) => { const n = A.pick(ns) * 5; return { id, t: t.replace('{n}', n), n, p: 0, done: false }; }), claimed: false };
  A.store.save();
};
R.QREW = { d: { lei: 400, xp: 15 }, w: { lei: 3000, xp: 80 } };
R.claimable = () => { const s = E().s(); if (!s || !s.started) return 0; R.ensureWeekly(); let c = 0;
  for (const q of (s.daily ? s.daily.quests : [])) if (q.done && !q.cl) c++; for (const q of s.weekly.quests) if (q.done && !q.cl) c++; return c; };
R.claim = (kind, i) => {
  const s = E().s(), q = (kind === 'w' ? s.weekly : s.daily).quests[i]; if (!q || !q.done || q.cl) return;
  q.cl = 1; const r = R.QREW[kind]; E().earn(r.lei / E().feeMult()); A.game.addXP(r.xp); A.sound('coin'); A.buzz(20);
  if (kind === 'w' && s.weekly.quests.every(x => x.cl) && !s.weekly.claimed) { s.weekly.claimed = true; E().grantChest('aur', 'Misiunile săptămânii'); A.toast('<b>Toate misiunile săptămânii:</b>&nbsp;dosar de aur.', 5000); }
  A.store.save(); A.render();
};
R.questsHTML = () => {
  const s = E().s(); R.ensureWeekly();
  const row = (q, i, k) => `<div class="mq ${q.cl ? 'cl' : q.done ? 'done' : ''}"><div class="mq-t"><b>${A.esc(q.t)}</b><span class="mq-bar"><i style="width:${Math.min(100, q.p / q.n * 100)}%"></i><em>${Math.min(q.p, q.n)}/${q.n}</em></span></div>
    ${q.cl ? '<span class="mq-ok">✓</span>' : q.done ? `<button class="btn primary small" data-claim="${k}:${i}">Ia</button>` : `<span class="mq-rw">${ICO.lei}${A.fmt(R.QREW[k].lei)}</span>`}</div>`;
  const dEnd = new Date(); dEnd.setHours(24, 0, 0, 0); const wEnd = new Date(A.addDays(R.week(), 7) + 'T00:00:00');
  return `<section class="fsec quests"><div class="sh"><h2>Misiuni</h2></div>
    <div class="mq-h"><b>Azi</b><small>toate trei: dosar de aur · se schimbă peste ${E().shortDur(dEnd - Date.now())}</small></div>
    ${(s.daily ? s.daily.quests : []).map((q, i) => row(q, i, 'd')).join('')}
    <div class="mq-h"><b>Săptămâna aceasta</b><small>toate trei revendicate: dosar de aur · încă ${E().shortDur(wEnd - Date.now())}</small></div>
    ${s.weekly.quests.map((q, i) => row(q, i, 'w')).join('')}</section>`;
};
R.bindBiroul = view => {
  A.$$('[data-claim]', view).forEach(b => b.onclick = () => { const [k, i] = b.dataset.claim.split(':'); R.claim(k, +i); });
  A.$$('[data-buy]', view).forEach(b => b.onclick = () => R.buy(b.dataset.buy));
};

/* ================= RARITATEA MINI-BOȘILOR ================= */
R.rarity = ci => ci >= 8 ? ['leg', 'Legendar'] : ci >= 6 ? ['epic', 'Epic'] : ci >= 3 ? ['rare', 'Rar'] : ['com', 'Comun'];

/* ================= LEGĂTURI CU RESTUL JOCULUI ================= */
R.init = () => {
  const Eo = E();
  /* misiunile săptămânale avansează odată cu cele zilnice */
  const q0 = Eo.quest;
  Eo.quest = (id, n) => { q0(id, n); const s = Eo.s(); if (!s || !s.started) return; R.ensureWeekly();
    for (const q of s.weekly.quests) if (q.id === id && !q.done) { q.p += n; if (q.p >= q.n) { q.done = true; A.toast(`Misiune săptămânală îndeplinită: ${A.esc(q.t)}`); } } A.store.save(); };
  /* deschiderea dosarului: secvența pe tot ecranul */
  Eo.openChest = (i, free, direct) => {
    const s = Eo.s(); let type;
    const left0 = direct ? 0 : Eo.chestsLocked(); if (left0) { A.toast(`Dosarele se deschid după etapa de începător: mai citește ${left0} ${left0 === 1 ? 'articol' : 'articole'}.`); A.sound('warn'); return; }
    if (direct) type = direct;
    else if (free) { if (s.freeStock < 1) return; s.freeStock--; if (s.freeStock < 2 && s.freeAt < Date.now()) s.freeAt = Date.now() + Eo.FREE_EVERY; type = 'simplu'; }
    else { const c = s.slots[i]; if (!c || !c.unlockEnd || c.unlockEnd > Date.now()) return; type = c.type; s.slots[i] = null; }
    A.store.save();
    const reveal = mult => { const loot = Eo.scaleLoot(Eo.rollChest(type), mult); Eo.applyLoot(loot);
      R.lootShow(type, (free ? Eo.FREE_NAME : Eo.CHESTS[type].name) + (mult > 1 ? ' · dublat' : ''), R.lootItems(loot, mult), () => A.render()); };
    if (type === 'aur') Eo.goldenBonus(reveal); else reveal(1);
  };
  /* nivel nou pe tot ecranul */
  const G = A.game;
  G.levelUp = L => {
    const rank = G.rank(L), promo = rank !== G.rank(L - 1), chest = promo ? 'aur' : 'argint';
    const got = A.eco && A.eco.grantChest(chest, 'Nivel nou');
    A.whenFree(() => R.levelUp(L, rank, promo, G.nextRank(L), got ? chest : null));
  };
  /* energie pentru articolele rezumate; seria de zile la fiecare XP */
  const mu = G.markUnderstood;
  G.markUnderstood = (act, art, sum, at) => { const was = !!(A.S.arts[act + ':' + art] || {}).u; const r = mu(act, art, sum, at); if (!was && (A.S.arts[act + ':' + art] || {}).u) R.onUnderstood(); return r; };
  const ax = G.addXP; G.addXP = (n, at) => { const r = ax(n, at); R.checkStreak(); return r; };
  /* insignele: misiunile de revendicat la Birou, Calea Atlasului la Lectură */
  const nb = A.navBadges;
  A.navBadges = () => { nb(); try {
    const add = (k, c) => { const a = A.$(`.rail a[data-nav="${k}"]`); if (!a || !c) return; let b = a.querySelector('.nb'); const cur = b ? +b.textContent || 0 : 0; if (!b) { b = document.createElement('b'); b.className = 'nb'; a.appendChild(b); } const t = cur + c; b.textContent = t > 9 ? '9+' : t; };
    add('firma', R.claimable()); add('lectura', R.roadReady().length);
  } catch (e) { } };
};
R.init();
})();
