/* Atlasul legislativ — progres personal: XP, niveluri, ranguri, serie de zile, ștampile, HUD. */
'use strict';
A.game = {};
const G = A.game;

G.RANKS = [
  [1, 'Student la drept'], [3, 'Stagiar'], [6, 'Jurist'], [10, 'Consilier juridic'], [15, 'Avocat'],
  [21, 'Judecător de judecătorie'], [28, 'Judecător la Curtea de Apel'], [36, 'Judecător la Curtea Supremă'], [45, 'Legiuitor'],
];
G.need = L => Math.round(40 * Math.pow(L, 1.65));          // XP cumulat necesar pentru a trece de nivelul L
G.level = xp => { let L = 1; while (xp >= G.need(L)) L++; return L; };
G.rank = L => { let r = G.RANKS[0][1]; for (const [l, n] of G.RANKS) if (L >= l) r = n; return r; };
G.levelInfo = () => {
  const xp = A.S.xp, L = G.level(xp), lo = L > 1 ? G.need(L - 1) : 0, hi = G.need(L);
  return { L, xp, lo, hi, pct: (xp - lo) / (hi - lo), rank: G.rank(L) };
};

/* ------------ XP ------------ */
G.boostMult = () => {
  const b = A.S.eco && A.S.eco.buffs; let m = 1;
  if (b) for (const x of Object.values(b)) if (x.until > Date.now() && x.kind === 'xp') m *= x.mult;
  return m * (A.eco ? A.eco.staffXpMult() : 1);
};
G.addXP = (n, at) => {
  if (A.eco && A.eco.perk) n = Math.round(n * A.eco.perkMult('scoala', .10));
  n = Math.max(1, Math.round(n * G.boostMult()));
  const before = G.level(A.S.xp);
  A.S.xp += n; if (A.eco && A.eco.quest) A.eco.quest('xp', n);
  const d = A.today(); A.S.days[d] = (A.S.days[d] || 0) + n;
  const after = G.level(A.S.xp);
  if (at) A.fly('+' + n + ' XP', at.x, at.y);
  if (after > before) G.levelUp(after);
  if (A.S.days[d] >= A.S.settings.goal && (A.S.days[d] - n) < A.S.settings.goal) G.goalReached();
  A.store.save(); A.hud(); G.checkStamps();
  return n;
};
G.levelUp = L => {
  A.sound('level'); A.confetti();
  const rank = G.rank(L), prev = G.rank(L - 1);
  const promo = rank !== prev;
  A.whenFree(() => A.modal(`<div class="stampwrap slam">${A.stampSVG(promo ? 'promovare' : 'nivel nou', rank, String(L))}</div>
    <h2>${promo ? 'Ai fost promovat: ' + A.esc(rank) : 'Nivelul ' + L}</h2>
    <p>${promo ? 'Rang nou în cariera ta juridică.' : 'Mai aproape de următorul rang: ' + A.esc(G.nextRank(L)) + '.'}</p>
    <button class="btn primary" data-close>Continuă</button>`));
  A.eco && A.eco.grantChest(promo ? 'aur' : 'argint', 'Nivel nou');
};
G.nextRank = L => { for (const [l, n] of G.RANKS) if (l > L) return `${n} (nivelul ${l})`; return 'ultimul rang'; };
G.goalReached = () => {
  A.sound('chest');
  A.toast(`<b>Obiectivul zilei atins.</b>&nbsp;Ai primit un dosar de argint.`);
  A.eco && A.eco.grantChest('argint', 'Obiectivul zilei');
};

/* ------------ serie de zile ------------ */
G.MIN_DAY = 10;
G.streak = () => {
  const days = A.S.days, frozen = A.S.frozen;
  let d = A.today(), n = 0, guard = 0;
  if ((days[d] || 0) < G.MIN_DAY) d = A.addDays(d, -1);   // azi nu s-a terminat încă
  while (guard++ < 4000) {
    if ((days[d] || 0) >= G.MIN_DAY) { n++; d = A.addDays(d, -1); continue; }
    const month = d.slice(0, 7);
    const used = Object.keys(frozen).filter(x => x.startsWith(month));
    if (frozen[d] || (used.length < 2 && n > 0 && A.S.created < new Date(d + 'T23:59:59').getTime())) {
      if (!frozen[d]) { frozen[d] = 1; A.store.save(); }
      d = A.addDays(d, -1); continue;
    }
    break;
  }
  return n;
};
G.bestStreak = () => { const s = G.streak(); A.S.quiz.bestStreak = Math.max(A.S.quiz.bestStreak || 0, s); return A.S.quiz.bestStreak; };

/* ------------ registrul recompenselor reversibile ------------ */
/* o acțiune dă XP și bani o singură dată; dacă e anulată, recompensa se retrage */
G.grant = (key, xp, money, at) => {
  const L = A.S.ledger; if (L[key]) return false;
  const gx = xp ? G.addXP(xp, at) : 0;
  const gm = money && A.eco ? A.eco.earn(money, null, key) : 0;
  L[key] = { xp: gx, money: gm }; A.store.save(); return true;
};
G.revoke = key => {
  const L = A.S.ledger, e = L[key]; if (!e) return;
  A.S.xp = Math.max(0, A.S.xp - (e.xp || 0));
  const d = A.today(); if (A.S.days[d]) A.S.days[d] = Math.max(0, A.S.days[d] - (e.xp || 0));
  if (e.money && A.S.eco) { A.S.eco.money -= e.money; A.S.eco.earned = Math.max(0, A.S.eco.earned - e.money); }
  delete L[key]; A.store.save(); A.hud();
};

/* ------------ acțiuni pe articole ------------ */
G.REWARD = { read: [2, 5], und: [8, 20], appl: [25, 150] };
G.markRead = (actId, artId, at) => {
  const k = A.key(actId, artId), rec = A.artRec(k);
  if (rec.r) { delete rec.r; if (rec.u) { delete rec.u; G.revoke('und:' + k); } G.revoke('read:' + k); A.study.onProgress(actId, artId); A.store.save(); return false; }
  rec.r = A.today(); A.studied();
  A.S.last = { act: actId, art: artId, t: Date.now() };
  G.grant('read:' + k, ...G.REWARD.read, at);
  if (!rec.b) { rec.b = 0; rec.due = A.addDays(A.today(), 1); }
  A.study.onProgress(actId, artId);
  return true;
};
/* „Am înțeles” cere un rezumat cu cuvintele tale: minimum 100 de caractere, nu copiat din articol */
G.MIN_SUM = 100; G.MIN_CASE = 80;
G.copyRatio = (txt, artText) => {
  const w = A.fold(txt).replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean), src = ' ' + A.fold(artText).replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ') + ' ';
  if (w.length < 4) return 0;
  let hit = 0, n = 0; for (let i = 0; i + 4 <= w.length; i++) { n++; if (src.includes(' ' + w.slice(i, i + 4).join(' ') + ' ')) hit++; }
  return n ? hit / n : 0;
};
G.checkSummary = (txt, artText) => {
  const t = (txt || '').trim();
  if (t.length < G.MIN_SUM) return `Mai scrie: ai ${t.length} din minimum ${G.MIN_SUM} de caractere.`;
  if (new Set(A.fold(t).split(/\W+/).filter(w => w.length > 2)).size < 10) return 'Rezumatul are prea puține cuvinte diferite.';
  if (G.copyRatio(t, artText) > .55) return 'Pare copiat din articol. Spune ideea cu cuvintele tale.';
  return null;
};
G.markUnderstood = (actId, artId, summary, at) => {
  const k = A.key(actId, artId), rec = A.artRec(k);
  if (!rec.r) { rec.r = A.today(); G.grant('read:' + k, ...G.REWARD.read); }
  rec.sum = summary.trim(); rec.u = rec.u || A.today(); A.studied();
  G.grant('und:' + k, ...G.REWARD.und, at);
  A.study.onProgress(actId, artId); A.store.save(); G.checkStamps();
};
G.unmarkUnderstood = (actId, artId) => {
  const k = A.key(actId, artId), rec = A.artRec(k);
  delete rec.u; G.revoke('und:' + k); A.study.onProgress(actId, artId); A.store.save();
};
G.markApplied = (actId, artId, text) => {
  const k = A.key(actId, artId), rec = A.artRec(k);
  if (!text || text.trim().length < G.MIN_CASE) return false;
  if (!rec.r) { rec.r = A.today(); G.grant('read:' + k, ...G.REWARD.read); }
  rec.ap = text.trim(); A.studied();
  G.grant('appl:' + k, ...G.REWARD.appl);
  A.store.save(); G.checkStamps(); return true;
};
G.removeApplied = (actId, artId) => {
  const k = A.key(actId, artId), rec = A.artRec(k);
  delete rec.ap; G.revoke('appl:' + k); A.store.save();
};
G.toggleStar = (actId, artId) => { const rec = A.artRec(A.key(actId, artId)); rec.st = !rec.st; if (!rec.st) delete rec.st; A.store.save(); return !!rec.st; };
G.setNote = (actId, artId, txt) => { const rec = A.artRec(A.key(actId, artId)); if (txt) rec.n = txt; else delete rec.n; A.store.save(); };

/* ------------ repetare spațiată (cutii Leitner) ------------ */
G.INTERVALS = [1, 1, 3, 7, 14, 30, 60];
G.review = (k, ok) => {
  const rec = A.artRec(k);
  rec.b = rec.b || 0;
  if (ok) { rec.b = Math.min(6, rec.b + 1); rec.ok = (rec.ok || 0) + 1; }
  else { rec.b = 1; rec.ko = (rec.ko || 0) + 1; }
  rec.due = A.addDays(A.today(), G.INTERVALS[rec.b]);
  if (ok && !rec.u && rec.b >= 2) rec.u = A.today();
};
G.dueKeys = () => { const t = A.today(); return Object.entries(A.S.arts).filter(([k, r]) => r.r && r.due && r.due <= t).map(([k]) => k); };

/* ------------ capitol terminat ------------ */
G.checkChapter = (act, node) => {
  const k = act.id + ':' + node.id;
  if (A.S.chaptersDone[k]) return;
  const live = node.arts.filter(a => !act.artById[a].abrogat);
  if (live.length && live.every(a => (A.S.arts[A.key(act.id, a)] || {}).r)) {
    A.S.chaptersDone[k] = A.today();
    G.addXP(50); A.sound('chest');
    A.toast(`<b>Capitol parcurs:</b>&nbsp;${A.esc(node.label)} ${A.esc(node.name || '')}. `, 4200);
    A.store.save();
  }
};

/* ------------ ștampile (realizări) ------------ */
const T = () => A.totalStats();
G.STAMPS = [
  ['primul-articol', 'Primul articol', 'Ai citit primul articol.', 'citit', 'I', s => T().read >= 1],
  ['50-art', 'Cititor', '50 de articole citite.', 'cititor', '50', s => T().read >= 50],
  ['250-art', 'Cititor de cursă lungă', '250 de articole citite.', 'maraton', '250', s => T().read >= 250],
  ['1000-art', 'Om al codurilor', '1.000 de articole citite.', 'mii de articole', '1K', s => T().read >= 1000],
  ['toate', 'Atlasul complet', 'Toate articolele din toate actele, citite.', 'atlas', '∞', s => { const t = T(); return t.n > 0 && t.read >= t.n; }],
  ['cap-1', 'Primul capitol', 'Un capitol citit integral.', 'capitol', '§', s => Object.keys(s.chaptersDone).length >= 1],
  ['cap-25', 'Arhivar', '25 de capitole citite integral.', 'arhivar', '25§', s => Object.keys(s.chaptersDone).length >= 25],
  ['cf', 'Codul familiei citit', 'Toate articolele din Codul familiei.', 'codul familiei', 'CF', s => { const x = A.actStats('CF'); return x.n && x.read >= x.n; }],
  ['cc-1', 'Cartea întâi', 'Dispozițiile generale ale Codului civil, citite.', 'codul civil', 'I', s => G.bookDone('CC', 'Cartea întâi')],
  ['cpc', 'Procesualist', 'Tot Codul de procedură civilă, citit.', 'procedură', 'CPC', s => { const x = A.actStats('CPC'); return x.n && x.read >= x.n; }],
  ['ser-3', 'Trei zile la rând', 'Serie de 3 zile.', 'serie', '3', s => G.streak() >= 3],
  ['ser-7', 'O săptămână', 'Serie de 7 zile.', 'serie', '7', s => G.streak() >= 7],
  ['ser-30', 'O lună fără pauză', 'Serie de 30 de zile.', 'serie', '30', s => G.streak() >= 30],
  ['ser-100', 'Disciplină de fier', 'Serie de 100 de zile.', 'serie', '100', s => G.streak() >= 100],
  ['ok-10', 'Primele răspunsuri', '10 răspunsuri corecte.', 'antrenament', '10', s => s.quiz.correct >= 10],
  ['ok-100', 'O sută corecte', '100 de răspunsuri corecte.', 'antrenament', '100', s => s.quiz.correct >= 100],
  ['ok-1000', 'Mia de aur', '1.000 de răspunsuri corecte.', 'antrenament', '1K', s => s.quiz.correct >= 1000],
  ['combo-10', 'Combo 10', '10 răspunsuri corecte la rând.', 'combo', '×10', s => s.quiz.bestCombo >= 10],
  ['combo-30', 'Fără greșeală', '30 de răspunsuri corecte la rând.', 'combo', '×30', s => s.quiz.bestCombo >= 30],
  ['surv-20', 'Supraviețuitor', '20 de răspunsuri în urmărire.', 'urmărire', '20', s => s.quiz.survivalBest >= 20],
  ['termene-25', 'Vânătorul de termene', '25 de termene în album.', 'termene', 'T25', s => Object.keys(s.album).length >= 25],
  ['taxe-10', 'Calculatorul', '10 taxe de stat calculate corect.', 'taxa de stat', 'lei', s => s.quiz.taxOk >= 10],
  ['aplicat', 'Din cod în dosar', 'Primul articol aplicat într-un caz real.', 'aplicat', 'AP', s => Object.values(s.arts).some(r => r.ap)],
  ['aplicat-25', 'Practician', '25 de articole aplicate.', 'practică', '25', s => Object.values(s.arts).filter(r => r.ap).length >= 25],
  ['trimiteri-50', 'Navigatorul', '50 de trimiteri deschise.', 'trimiteri', '→50', s => s.quiz.refsOpened >= 50],
  ['bufnita', 'Bufnița', 'Ai învățat după ora 23:00.', 'noapte', '23', s => s.quiz.night],
  ['matinal', 'Matinal', 'Ai învățat înainte de ora 7:00.', 'dimineața', '7', s => s.quiz.morning],
  ['critic', 'Lovitură critică', 'Trei lovituri critice într-o zi.', 'critic', '×3', s => (s.quiz.crits[A.today()] || 0) >= 3],
  ['filiala', 'Prima filială', 'Ai deschis biroul de avocați.', 'firma', 'F1', s => s.eco && s.eco.branches && s.eco.branches.length >= 1],
  ['filiale-4', 'Rețea națională', 'Filiale în 4 raioane.', 'firma', 'F4', s => s.eco && s.eco.branches && s.eco.branches.length >= 4],
  ['mil', 'Primul milion', '1.000.000 de lei onorarii câștigate.', 'onorarii', '1M', s => s.eco && s.eco.earned >= 1e6],
  ['procese-50', 'Pledant', '50 de procese câștigate.', 'instanță', '50', s => s.eco && (s.eco.stats.won || 0) >= 50],
  ['consult-100', 'Ușa mereu deschisă', '100 de consultații.', 'consultații', '100', s => s.eco && (s.eco.stats.consults || 0) >= 100],
  ['dosare-50', 'Colecționar de dosare', '50 de dosare deschise.', 'dosare', '50', s => s.eco && (s.eco.stats.chests || 0) >= 50],
  ['aur', 'Dosarul de aur', 'Ai prins un dosar de aur.', 'noroc', '★', s => s.eco && (s.eco.stats.golden || 0) >= 1],
  ['cucerire-1', 'Primul raion cucerit', 'Ai învins primul boss de raion.', 'cucerire', '1', s => A.raioane.some(r => A.conquered(r.unit))],
  ['cucerire-civil', 'Stăpânul Codului civil', 'Toate raioanele Codului civil sunt cucerite.', 'codul civil', 'CC', s => A.raioane.filter(r => r.places.some(p => p.act === 'CC')).every(r => A.conquered(r.unit))],
  ['cucerire-toate', 'Harta întreagă', 'Toate raioanele sunt cucerite.', 'harta', '∞', s => A.raioane.every(r => A.conquered(r.unit))],
  ['decan', 'Decanul a căzut', 'L-ai învins pe Decan.', 'decanul', '#1', s => !!(s.conq && s.conq.__decan)],
];
G.STAMPS.push(
  ['mini-1', 'Primul mini-boss', 'Ai învins primul mini-boss.', 'mini-boss', 'I', s => Object.keys(s.study.chapters || {}).length >= 1],
  ['mini-9', 'Nouă capitole', 'Ai învins toți mini-bossii unui raion.', 'capitole', '9', s => A.raioane.some(r => A.study.chapters(r.unit).length && A.study.chapters(r.unit).every(c => (s.study.chapters || {})[c.id]))],
  ['rezumate-50', 'Cu vorbele mele', '50 de articole rezumate.', 'rezumate', '50', s => Object.values(s.arts).filter(r => r.sum).length >= 50],
  ['spete-10', 'Practicianul spețelor', '10 spețe rezolvate corect.', 'spețe', 'S10', s => Object.values(s.spete || {}).filter(x => x.ok).length >= 10],
  ['joc-25', 'Jucătorul', '25 de runde de joc încheiate.', 'joc', 'J25', s => (s.quiz.farm || 0) >= 25],
);
G.TIER = { 'primul-articol': 1, '50-art': 1, '250-art': 2, '1000-art': 3, toate: 4, 'cap-1': 1, 'cap-25': 2, cf: 3, 'cc-1': 2, cpc: 3, 'ser-3': 1, 'ser-7': 2, 'ser-30': 3, 'ser-100': 4, 'ok-10': 1, 'ok-100': 2, 'ok-1000': 3, 'combo-10': 2, 'combo-30': 3, 'surv-20': 2, 'termene-25': 2, 'taxe-10': 2, aplicat: 1, 'aplicat-25': 3, 'trimiteri-50': 1, bufnita: 1, matinal: 1, critic: 2, filiala: 1, 'filiale-4': 2, mil: 3, 'procese-50': 3, 'consult-100': 3, 'dosare-50': 2, aur: 2, 'cucerire-1': 2, 'cucerire-civil': 4, 'cucerire-toate': 4, decan: 4, 'mini-1': 2, 'mini-9': 3, 'rezumate-50': 3, 'spete-10': 2, 'joc-25': 2 };
G.TIER_PRIZE = [null, { money: 1000, xp: 25 }, { money: 5000, xp: 75 }, { money: 20000, xp: 200 }, { money: 100000, xp: 500 }];
G.bookDone = (act, book) => { const ix = A.index[act]; if (!ix || !ix.books || !ix.books[book]) return false; const s = A.listStats(act, ix.books[book].arts); return s.n && s.read >= s.n; };
G.stampBonus = () => Object.keys(A.S.stamps).length * 0.01;
G.checkStamps = A.debounce(() => {
  const h = new Date().getHours();
  if (h >= 23) A.S.quiz.night = true; if (h < 7) A.S.quiz.morning = true;
  for (const [id, name, desc, top, glyph, fn] of G.STAMPS) {
    if (A.S.stamps[id]) continue;
    let ok = false; try { ok = fn(A.S); } catch (e) { }
    if (ok) {
      A.S.stamps[id] = A.today(); A.store.save(); A.sound('stamp');
      const P = G.TIER_PRIZE[G.TIER[id] || 1];
      if (A.eco) { const s = A.eco.s(); s.money += P.money; s.earned += P.money; }
      G.addXP(P.xp);
      A.toast(`${A.stampSVG(top, 'atlasul legislativ', glyph)}<span><b>Ștampilă nouă:</b> ${A.esc(name)}<br><small>+${A.lei(P.money)} · +${P.xp} XP</small></span>`, 6000);
    }
  }
}, 400);

/* ------------ HUD ------------ */
A.hud = () => {
  const el = A.$('#hud'); if (!el || !A.S) return;
  const li = G.levelInfo(), st = G.streak(), today = A.S.days[A.today()] || 0, goal = A.S.settings.goal;
  const gp = Math.min(1, today / goal), C = 2 * Math.PI * 10;
  const eco = A.eco ? A.eco.hudBits() : '';
  const gem = (kind, n) => `<span class="gemw"><button class="chip gem ${kind}" data-gem="${kind}" aria-label="${kind === 'grile' ? 'Puncte grilă' : 'Puncte speță'}: ${A.fmt(n)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 22 12 12 22 2 12Z"/></svg><b>${A.fmt(n)}</b></button></span>`;
  const gems = `${gem('grile', A.S.points.grile)}${gem('spete', A.S.points.spete)}`;
  el.innerHTML = `
   <a class="rank" href="#/profil" style="text-decoration:none">
     <span class="stamp-mini">${A.stampSVG('nivel', li.rank, String(li.L), 'var(--stamp)', -6)}</span>
     <span><b>${A.esc(li.rank)}</b><small>Nivelul ${li.L}</small></span>
   </a>
   <div class="xpbar" title="Experiență"><div class="track"><div class="fill" style="width:${(li.pct * 100).toFixed(1)}%"></div></div>
     <div class="lbl"><span>${A.fmt(li.xp - li.lo)} / ${A.fmt(li.hi - li.lo)} XP</span><span>nivelul ${li.L + 1}</span></div></div>
   <span class="chip streak ${st ? '' : 'cold'}" title="Serie de zile cu cel puțin ${G.MIN_DAY} XP">
     <svg viewBox="0 0 24 24"><path d="M12 2c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-4-1-6 1-9z"/></svg>${st} ${st === 1 ? 'zi' : 'zile'}</span>
   <span class="chip goal" title="Obiectivul zilei: ${goal} XP">
     <svg class="goal-ring" viewBox="0 0 26 26"><circle class="bg" cx="13" cy="13" r="10"/><circle class="fg" cx="13" cy="13" r="10" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - gp)}"/></svg>
     ${A.fmt(today)}/${goal}</span>
   <span class="spacer"></span>
   ${gems}
   ${eco}`;
  /* romburi de puncte: click -> mini-fereastră sub ele */
  /* mini-fereastră fixă, sub elementul apăsat (nu e tăiată de bara de sus) */
  const pop = (anchor, text) => {
    const had = anchor._pop; A.$$('.gem-pop').forEach(p => p.remove()); A.$$('.hud [data-gem], .hud .lvl').forEach(x => { x._pop = false; });
    if (had) return;
    const r = anchor.getBoundingClientRect(), p = document.createElement('div'); p.className = 'gem-pop'; p.textContent = text;
    document.body.appendChild(p);
    const w = p.offsetWidth, x = Math.max(8, Math.min(innerWidth - w - 8, r.left + r.width / 2 - w / 2));
    p.style.left = x + 'px'; p.style.top = (r.bottom + 8) + 'px'; anchor._pop = true;
    setTimeout(() => { p.remove(); anchor._pop = false; }, 2500);
  };
  A.$$('.gem', el).forEach(b => b.onclick = e => { e.stopPropagation(); pop(b, b.dataset.gem === 'grile' ? 'puncte grilă' : 'puncte speță'); });
  /* telefon: scutul de nivel cu inelul de experiență */
  const lv = document.createElement('button'); lv.type = 'button'; lv.className = 'lvl'; lv.title = `${li.rank} · nivelul ${li.L}`;
  lv.onclick = e => { e.stopPropagation(); pop(lv, `${A.fmt(li.xp - li.lo)}/${A.fmt(li.hi - li.lo)} XP`); };
  lv.style.setProperty('--p', (li.pct * 100).toFixed(1) + '%');
  lv.innerHTML = `<span>${li.L}</span>`;
  el.prepend(lv);
  const xb = el.querySelector('.xpbar .track'); if (xb) xb.dataset.t = `${A.fmt(li.xp - li.lo)}/${A.fmt(li.hi - li.lo)}`;
  A.navBadges && A.navBadges();
};

G.init = () => { G.checkStamps(); };
