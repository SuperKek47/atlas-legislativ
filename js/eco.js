/* Atlasul legislativ — biroul de avocați: echipă cu salarii, consultații, procese în instanță, flota de mașini,
   dosare-cufăr, dosarul de aur, misiunile zilei. Totul crește din „puterea juridică” (ce ai studiat). */
'use strict';
A.eco = {};
const E = A.eco;

/* ---------------- constante ---------------- */
/* cost = plata de angajare; sal = salariul pe zi reală; base = onorariul de bază al unei consultații de o stea */
E.ROLES = {
  secretar: { name: 'Secretar', many: 'Secretari', cost: 4000, sal: 150, base: 0, speed: 0, gen: 0, court: false, disc: .6, desc: 'Scurtează cu 10% deblocarea dosarelor-cufăr.' },
  stagiar: { name: 'Avocat stagiar', many: 'Avocați stagiari', cost: 3000, sal: 200, base: 200, speed: .8, gen: .05, court: false, disc: .6, desc: 'Consultații simple, în jur de 200 de lei.' },
  jurist: { name: 'Jurist', many: 'Juriști', cost: 12000, sal: 350, base: 320, speed: 1, gen: .1, court: false, disc: .45, desc: 'Consultații obișnuite.' },
  avocat: { name: 'Avocat', many: 'Avocați', cost: 40000, sal: 700, base: 500, speed: 1.2, gen: .15, court: true, disc: .3, desc: 'Consultații mai bine plătite și procese în instanță.' },
  senior: { name: 'Avocat senior', many: 'Avocați seniori', cost: 150000, sal: 1500, base: 900, speed: 1.5, gen: .25, court: true, disc: .2, desc: 'Rapid, scump, cu clienți generoși.' },
  partener: { name: 'Partener', many: 'Parteneri', cost: 600000, sal: 3500, base: 1600, speed: 1.8, gen: .35, court: true, disc: .1, desc: 'Cel mai bun om al firmei.' },
};
E.ROLE_ORDER = ['secretar', 'stagiar', 'jurist', 'avocat', 'senior', 'partener'];
E.CARDS_FOR = [0, 2, 4, 10, 20, 50, 100, 200];
E.OFFICES = [
  ['Garsonieră', 3, 0], ['Birou', 5, 25000], ['Cabinet', 8, 150000], ['Etaj de birouri', 12, 900000], ['Clădire proprie', 18, 5000000], ['Turn de birouri', 26, 25000000],
];
/* [nume, km/h, preț, bonus de prestigiu la onorarii, tip de caroserie] */
E.CARS = [
  ['Autobuz (abonament)', 30, 400, 0, 'bus'], ['Dacia Logan', 80, 47000, .02, 'logan'], ['Škoda Octavia', 100, 85000, .04, 'octavia'],
  ['Volkswagen Passat', 110, 120000, .06, 'passat'], ['Mercedes-Benz E-Class', 125, 205000, .1, 'eclass'], ['Tesla Model 3', 130, 245000, .12, 'tesla'],
  ['Toyota Land Cruiser 300', 130, 415000, .15, 'lc300'], ['Mercedes-Maybach', 140, 850000, .25, 'maybach'],
];
E.TUNING = {
  motor: { name: 'Motor', max: 3, base: 6000, grow: 4, desc: '+10% viteză pe nivel, pentru toată flota' },
  gps: { name: 'Navigație GPS', max: 2, base: 15000, grow: 5, desc: '-15% din distanță pe nivel' },
  sofer: { name: 'Șofer personal', max: 1, base: 150000, grow: 1, desc: 'Avocatul pregătește dosarul pe drum: -20% din durata ședinței' },
};
E.PAINTS = [['Gri de serviciu', '#8A9399'], ['Albastru topografic', '#2B5C8A'], ['Roșu sirenă', '#B8262D'], ['Negru mat', '#202426'], ['Verde codru', '#2F6B3A'], ['Alb perlat', '#ECEDEA'], ['Violet ștampilă', '#5A3F8F'], ['Bordo', '#6E1F2B'], ['Argintiu', '#B9C0C7']];
E.VINYLS = [['Fără', ''], ['Sigla firmei', 'logo'], ['Dungi', 'stripes']];
E.PAINT_COST = 6000; E.VINYL_COST = 15000;
E.CHESTS = {
  simplu: { name: 'Dosar simplu', sp: 1, ms: 60 * 60e3, color: '#8A6A3C', money: [300, 900], clients: [1, 1], cards: [1, 2], roles: ['stagiar', 'jurist', 'secretar'], buff: .2, cosm: .1, nitro: .25 },
  argint: { name: 'Dosar de argint', sp: 2, ms: 3 * 60 * 60e3, color: '#8E9AA6', money: [1200, 3500], clients: [2, 2], cards: [3, 5], roles: ['stagiar', 'jurist', 'avocat', 'secretar'], buff: .4, cosm: .25, nitro: 1 },
  aur: { name: 'Dosar de aur', sp: 3, ms: 8 * 60 * 60e3, color: '#C99A1E', money: [5000, 14000], clients: [3, 3], cards: [6, 10], roles: ['jurist', 'avocat', 'senior'], buff: .7, cosm: .45, nitro: 2 },
  magic: { name: 'Dosar magic', sp: 4, ms: 14 * 60 * 60e3, color: '#7B4BD6', money: [12000, 32000], clients: [4, 4], cards: [9, 15], roles: ['jurist', 'avocat', 'senior'], buff: .85, cosm: .6, nitro: 2 },
  decan: { name: 'Dosar legendar', sp: 5, ms: 24 * 60 * 60e3, color: '#E4572E', money: [25000, 70000], clients: [4, 4], cards: [12, 20], roles: ['avocat', 'senior', 'partener'], buff: 1, cosm: .75, nitro: 3 },
};
E.FREE_NAME = 'Dosar de la CNAJGS';
/* romb auriu = punct-speță; deschiderea unui dosar costă E.CHESTS[tip].sp puncte-speță (dosarul gratuit de la CNAJGS nu costă) */
E.spGem = '<svg class="spg" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 22 12 12 22 2 12Z"/></svg>';
E.FREE_EVERY = 4 * 60 * 60e3;
E.KM_PER_UNIT = 0.269;
E.TIME_COMPRESS = 4;
E.CONSULT_MIN = 10 * 60e3;   // orice consultație durează cel puțin 10 minute
E.PROCS = {
  civil: [['Litigiu de vecinătate', 6, 900], ['Revendicarea unui bun', 15, 2000], ['Rezoluțiunea contractului', 30, 4000], ['Repararea prejudiciului', 60, 8500], ['Moștenire contestată', 120, 18000]],
  'proc-civ': [['Ședință de pregătire', 5, 750], ['Asigurarea acțiunii', 12, 1700], ['Ședință în fond', 35, 4500], ['Apel', 75, 10000], ['Recurs la Curtea Supremă', 150, 22000]],
  familie: [['Divorț', 8, 1100], ['Încasarea pensiei de întreținere', 15, 2000], ['Stabilirea domiciliului copilului', 25, 3200], ['Partajul bunurilor', 70, 10000], ['Stabilirea paternității', 110, 16000]],
  executare: [['Contestarea actelor executorului', 10, 1400], ['Ridicarea sechestrului', 30, 4100], ['Executarea unei hotărâri complexe', 90, 14000]],
  _: [['Ședință scurtă', 8, 1000], ['Ședință în fond', 35, 4300], ['Proces complex', 100, 15000]],
};
E.CLIENTS = {
  civil: ['Vecinul și gardul', 'Contract de vânzare-cumpărare', 'Datorie neachitată', 'Testament contestat', 'Daune după inundație', 'Garanția unui produs', 'Chiria neplătită', 'Servitute de trecere', 'Tutela unui părinte bolnav', 'Procură pentru vânzarea casei'],
  'proc-civ': ['Termen de apel ratat?', 'Cum depun cererea?', 'Cât costă taxa de stat?', 'Citație primită', 'Cerere de recuzare', 'Hotărâre în lipsă'],
  familie: ['Divorț și copii', 'Pensie de întreținere', 'Partaj după divorț', 'Recunoașterea paternității', 'Contract matrimonial', 'Adopție', 'Program de întrevederi'],
  executare: ['Executor la ușă', 'Conturi blocate', 'Hotărâre neexecutată', 'Bunuri sechestrate'],
  _: ['Consultație generală'],
};
E.STAR_MULT = [0, 1, 2.5, 6];
E.STAR_MIN = [0, 30, 60, 120];   // durata de bază, în minute, la putere juridică zero
E.BUFFS = [
  { kind: 'xp', mult: 2, min: 30, label: 'XP dublu' },
  { kind: 'speed', mult: 1.5, min: 60, label: 'Procese și consultații cu 50% mai rapide' },
  { kind: 'money', mult: 2, min: 30, label: 'Onorarii duble' },
];
E.QUESTS = [
  ['read', 'Citește {n} articole', [8, 12, 20]], ['und', 'Rezumă {n} articole', [3, 5, 8]], ['correct', 'Răspunde corect la {n} întrebări', [10, 15, 25]],
  ['consult', 'Termină {n} consultații', [2, 3, 5]], ['won', 'Câștigă {n} procese', [1, 2, 3]],
  ['chest', 'Deschide {n} dosare-cufăr', [1, 2]], ['refs', 'Deschide {n} trimiteri', [5, 10]],
];

/* ---------------- stare ---------------- */
E.fresh = () => ({
  started: false, firm: { name: 'Biroul meu', color: '#5A3F8F' }, home: null, branches: [],
  money: 0, earned: 0, nitro: 1, office: 0,
  staff: [], nextStaffId: 1, cards: {}, fired: [], lastHire: 0,
  fleet: [], tune: { motor: 0, gps: 0, sofer: 0 }, nextCarId: 1,
  slots: [null, null, null, null], freeAt: Date.now(), freeStock: 1,
  clients: [], consults: [], procs: [], offers: {}, buffs: {},
  stats: { won: 0, lost: 0, consults: 0, chests: 0, golden: 0, procs: 0 },
  owned: { paints: ['#8A9399'], vinyls: [''] },
  daily: null, golden: { next: Date.now() + 20 * 60e3 }, nid: 1, passiveBank: 0, v: 3,
});
E.s = () => A.S.eco;
E.init = () => {
  if (!A.S.eco) A.S.eco = E.fresh();
  const s = E.s(), f = E.fresh(), oldV = s.v;
  for (const k of Object.keys(f)) if (s[k] === undefined) s[k] = f[k];
  if (oldV !== 3) E.migrate(s);
  E.ensureDaily();
};
/* progresul vechi al firmei: mașina unică devine flotă, angajații primesc salariu */
E.migrate = s => {
  const old = s.car || { tier: 0 };
  const map = [0, 1, 2, 3, 4, 5, 6];
  s.fleet = old.tier > 0 ? [{ id: s.nextCarId++, tier: map[old.tier] || 1, paint: old.paint || '#8A9399', vinyl: old.vinyl || '' }] : [];
  s.tune = { motor: old.motor || 0, gps: old.gps || 0, sofer: old.sofer || 0 };
  delete s.car;
  const now = Date.now();
  for (const m of s.staff) { if (!m.me) m.paidTo = now; m.hired = m.hired || now; }
  for (const p of s.procs) p.car = p.car || 0;
  s.v = 3;
};
E.id = () => (E.s().nid++);

/* ---------------- puterea juridică: tot ce ai studiat ---------------- */
E.power = () => A.memo('power', () => {
  let read = 0, und = 0;
  for (const r of Object.values(A.S.arts)) { if (r.r) read++; if (r.r && r.u) und++; }
  const sp = Object.values(A.S.spete || {}).filter(x => x.ok).length;
  return Math.round(und * 1 + (read - und) * 0.3 + A.S.quiz.correct * 0.05 + sp * 2);
});
E.understood = () => A.memo('und', () => Object.values(A.S.arts).filter(r => r.r && r.u).length);

/* ---------------- bani și multiplicatori ---------------- */
E.buffMult = kind => { let m = 1; for (const b of Object.values(E.s().buffs)) if (b.kind === kind && b.until > Date.now()) m *= b.mult; return m; };
E.prestige = () => { const s = E.s(); return Math.max(0, ...s.fleet.map(c => E.CARS[c.tier][3])); };
E.feeMult = () => E.perkMult('onorarii', .06) * (1 + A.game.stampBonus()) * (1 + 0.03 * A.raioane.filter(r => A.conquered(r.unit)).length + (A.S.conq && A.S.conq.__decan ? .1 : 0)) * (1 + E.prestige()) * E.buffMult('money');
E.earn = (n, at) => {
  const s = E.s(); if (!s) return 0;
  n = Math.round(n * E.feeMult());
  s.money += n; s.earned += n;
  if (at) A.fly('+' + A.lei(n), at.x, at.y);
  A.store.save(); A.hud();
  return n;
};
E.spend = n => { const s = E.s(); if (s.money < n) { A.noMoney(); return false; } s.money -= n; A.sound('coin'); A.store.save(); A.hud(); return true; };
E.addNitro = n => { E.s().nitro += n; A.store.save(); };
E.staffXpMult = () => 1;

/* ---------------- echipa ---------------- */
E.capacity = () => E.OFFICES[E.s().office][1];
/* limita de angajați: sediul și articolele înțelese (2 + câte unul la 30 de articole rezumate) */
E.staffLimit = () => Math.min(E.capacity() + E.perk('loc'), 2 + E.perk('loc') + Math.floor(E.understood() / 30));
E.HIRE_GAP = 24 * 3600e3;   // cel mult o angajare pe zi reală
E.hireBlock = () => {
  const s = E.s();
  if (s.staff.length >= E.capacity()) return `Biroul e plin (${E.capacity()} locuri). Mută-te într-un sediu mai mare.`;
  if (s.staff.length >= E.staffLimit()) return `Limita ta e de ${E.staffLimit()} oameni. Rezumă încă ${30 - E.understood() % 30} articole ca să mai poți angaja unul.`;
  if (Date.now() - (s.lastHire || 0) < E.HIRE_GAP) return `Următoarea angajare peste ${A.dur(s.lastHire + E.HIRE_GAP - Date.now())}.`;
  return null;
};
E.hireCost = role => E.ROLES[role].cost;
E.NAMES = ['Ana', 'Ion', 'Maria', 'Victor', 'Elena', 'Andrei', 'Natalia', 'Sergiu', 'Cristina', 'Vlad', 'Irina', 'Mihai', 'Olga', 'Dumitru', 'Tatiana', 'Petru', 'Lilia', 'Radu', 'Doina', 'Igor'];
E.hire = (role, name, rehire) => {
  const s = E.s(), b = E.hireBlock(); if (b) { A.toast(b); A.sound('warn'); return false; }
  const cost = rehire ? Math.round(E.ROLES[role].cost * (1 - E.ROLES[role].disc)) : E.hireCost(role);
  if (!E.spend(cost)) return false;
  const now = Date.now();
  s.staff.push({ id: s.nextStaffId++, role, name: (name || '').trim().slice(0, 24) || A.pick(E.NAMES), lvl: rehire ? rehire.lvl : 1, hired: now, paidTo: now });
  if (rehire) s.fired = s.fired.filter(f => f !== rehire);
  s.lastHire = now;
  A.toast(`Ai angajat: ${A.esc(s.staff[s.staff.length - 1].name)}, ${E.ROLES[role].name.toLowerCase()}.`); A.store.save(); return true;
};
E.rename = (id, name) => { const m = E.s().staff.find(x => x.id === id); if (!m || m.me) return; m.name = name.trim().slice(0, 24) || m.name; A.store.save(); };
E.fire = id => {
  const s = E.s(), m = s.staff.find(x => x.id === id); if (!m || m.me || E.busy(id)) return;
  s.staff = s.staff.filter(x => x.id !== id);
  s.fired.push({ role: m.role, name: m.name, lvl: m.lvl || 1, at: Date.now() });
  A.toast(`${A.esc(m.name)} a fost concediat. Îl poți reangaja cu reducere timp de 7 zile.`); A.store.save();
};
E.REHIRE_DAYS = 7;
E.firedOpen = () => { const n = Date.now(); E.s().fired = E.s().fired.filter(f => n - f.at < E.REHIRE_DAYS * 864e5); return E.s().fired; };
/* îmbunătățirea unui angajat: bani + cartonașe + grile rezolvate (puncte-grilă care se consumă) */
/* puncte-speță cerute de nivelurile superioare: seniori și parteneri, apoi orice rol de la nivelul 4 */
E.upgradeNeed = m => { const lvl = m.lvl || 1; const spete = m.role === 'partener' ? 2 * lvl : m.role === 'senior' ? lvl : lvl >= 4 ? lvl - 3 : 0; return { money: Math.round(E.ROLES[m.role].cost * 0.5 * Math.pow(2, lvl - 1)), cards: E.CARDS_FOR[lvl] || 999, grile: 20 * lvl, spete }; };
E.upgrade = id => {
  const s = E.s(), m = s.staff.find(x => x.id === id); if (!m) return;
  const need = E.upgradeNeed(m), have = s.cards[m.role] || 0;
  if (have < need.cards) { A.toast(`Îți lipsesc ${need.cards - have} cartonașe de ${E.ROLES[m.role].name.toLowerCase()}.`); A.sound('warn'); return; }
  if ((A.S.points.grile || 0) < need.grile) { A.toast(`Îți lipsesc ${need.grile - (A.S.points.grile || 0)} grile rezolvate. Joacă sau antrenează-te.`); A.sound('warn'); return; }
  if ((A.S.points.spete || 0) < need.spete) { A.toast(`Îți lipsesc ${need.spete - (A.S.points.spete || 0)} puncte-speță. Rezolvă spețe.`); A.sound('warn'); return; }
  if (!E.spend(need.money)) return;
  s.cards[m.role] -= need.cards; A.S.points.grile -= need.grile; A.S.points.spete -= need.spete; m.lvl = (m.lvl || 1) + 1;
  A.sound('level'); A.toast(`${A.esc(m.me ? 'Tu' : m.name)}: nivelul ${m.lvl}.`); A.store.save();
};
E.lvlMult = m => 1 + 0.1 * ((m.lvl || 1) - 1);
E.free = (filter) => E.s().staff.filter(m => filter(m) && !E.busy(m.id) && !m.strike);
E.busy = id => E.s().consults.some(c => c.staff === id) || E.s().procs.some(p => p.staff === id);
/* salariile curg pe zile reale; fără bani, angajatul intră în grevă (nu lucrează) până îl plătești */
E.paySalaries = () => {
  const s = E.s(), now = Date.now(); let changed = false;
  for (const m of s.staff) {
    if (m.me) continue;
    let guard = 0;
    while (now - (m.paidTo || now) >= 864e5 && guard++ < 60) {
      const sal = E.ROLES[m.role].sal;
      if (s.money < sal) { if (!m.strike) { m.strike = true; A.toast(`${A.esc(m.name)} e în grevă: nu ai bani de salariu (${A.lei(sal)}/zi).`, 6000); } changed = true; break; }
      s.money -= sal; m.paidTo += 864e5; m.strike = false; changed = true;
    }
  }
  if (changed) { A.store.save(); A.hud(); }
};
E.dailyCost = () => E.s().staff.filter(m => !m.me).reduce((x, m) => x + E.ROLES[m.role].sal, 0);

/* ---------------- stăpânire pe discipline ---------------- */
E.discMastery = disc => A.memo('dm:' + disc, () => { const rs = A.raioane.filter(r => r.disc === disc); if (!rs.length) return 0; return rs.reduce((x, r) => x + A.raionStats(r.unit).mastery, 0) / rs.length; });
E.unitMastery = unit => A.raionStats(unit).mastery;
E.unlocked = () => A.raioane.filter(r => A.raionActs(r).length && !A.locked(r.unit));

/* ---------------- clienți și consultații ---------------- */
E.newClient = (stars, disc) => {
  const discs = A.raioane.filter(r => A.raionActs(r).length && !A.locked(r.unit)).map(r => r.disc);
  disc = disc || A.pick(discs.length ? discs : ['civil']);
  return { id: E.id(), disc, stars, title: A.pick(E.CLIENTS[disc] || E.CLIENTS._) };
};
/* clienții vin în funcție de puterea juridică: sub 50 aproape nimeni, peste 100 tot mai des și mai bogați */
E.walkInterval = () => { const P = E.power(); if (P < 50) return 6 * 3600e3; if (P < 100) return 90 * 60e3; return Math.max(10 * 60e3, 60 * 60e3 * 100 / P); };
E.maxWaiting = () => Math.min(10, 1 + Math.floor(E.power() / 100));
E.walkStars = () => { const P = E.power(), r = Math.random(); if (r < Math.max(0, Math.min(.25, (P - 200) / 2000))) return 3; if (r < Math.min(.5, P / 800)) return 2; return 1; };
E.consultPreview = (c, m) => {
  const R = E.ROLES[m.role], mast = E.discMastery(c.disc), P = E.power();
  const ms = Math.max(E.CONSULT_MIN, E.STAR_MIN[c.stars] * 60e3 * 100 / (100 + P) / (R.speed * E.lvlMult(m)) / E.buffMult('speed'));
  const fee = R.base * E.STAR_MULT[c.stars] * E.lvlMult(m) * (1 + mast) * (1 + Math.min(1, P / 1000));
  const gen = Math.min(.8, R.gen + .3 * mast);
  return { ms, fee, gen };
};
E.startConsult = (clientId, staffId) => {
  const s = E.s(), c = s.clients.find(x => x.id === clientId), m = s.staff.find(x => x.id === staffId);
  if (!c || !m || E.busy(m.id) || m.strike) return;
  const p = E.consultPreview(c, m), now = Date.now();
  s.clients = s.clients.filter(x => x.id !== clientId);
  s.consults.push({ id: E.id(), client: c, staff: m.id, start: now, end: now + p.ms, fee: p.fee, gen: p.gen });
  A.store.save();
};
E.collectConsult = (id, at) => {
  const s = E.s(), c = s.consults.find(x => x.id === id); if (!c || c.end > Date.now()) return;
  s.consults = s.consults.filter(x => x.id !== id);
  const generous = Math.random() < c.gen;
  const got = E.earn(c.fee * (generous ? 2 : 1), at);
  s.stats.consults++; E.quest('consult', 1);
  A.sound('coin');
  A.toast(generous ? `<b>Client generos!</b>&nbsp;${A.esc(c.client.title)}: +${A.lei(got)}` : `${A.esc(c.client.title)}: +${A.lei(got)}`);
  A.store.save(); A.game.checkStamps();
};
E.prepConsult = id => {
  const s = E.s(), c = s.consults.find(x => x.id === id); if (!c || c.prep || c.end <= Date.now()) return;
  const r = A.raioane.find(x => x.disc === c.client.disc && !A.locked(x.unit));
  if (!c.prepQ) { c.prepQ = 'consult:' + c.id; A.store.save(); }
  A.quiz.mini(r ? 'raion:' + r.unit : 'citite', 'Pregătește consultația', (ok, none) => {
    if (none) return A.toast('Nu am găsit întrebări pentru această disciplină.');
    c.prep = 1;
    if (ok) { c.fee *= 1.3; const left = c.end - Date.now(); c.end = Math.max(c.start + E.CONSULT_MIN, c.end - left * .25); A.game.addXP(5); A.toast('Consultație pregătită: +30% onorariu.'); }
    A.store.save(); A.render();
  }, null, c.prepQ);
};

/* ---------------- procese în instanță ---------------- */
E.unitPt = u => (MD_MAP.labels[u] || [500, 600]).slice(0, 2);
E.km = (a, b) => { const [x1, y1] = E.unitPt(a), [x2, y2] = E.unitPt(b); return Math.max(8, Math.hypot(x1 - x2, y1 - y2) * E.KM_PER_UNIT); };
E.originFor = unit => { const s = E.s(); let best = s.home, bd = 1e9; for (const b of s.branches) { const d = b === unit ? 0 : E.km(b, unit); if (d < bd) { bd = d; best = b; } } return { from: best || unit, km: best === unit ? 6 : bd }; };
E.carById = id => id ? E.s().fleet.find(c => c.id === id) : null;
E.carTier = id => { const c = E.carById(id); return c ? c.tier : 0; };
E.carBusy = id => !!id && E.s().procs.some(p => p.car === id);
E.speed = carId => E.CARS[E.carTier(carId)][1] * (1 + 0.1 * E.s().tune.motor);
E.travelMs = (unit, carId) => { const { km } = E.originFor(unit); const d = km * (1 - 0.15 * E.s().tune.gps); return d / E.speed(carId) * 3600e3 / E.TIME_COMPRESS / E.buffMult('speed'); };
E.offersFor = unit => {
  const s = E.s(), r = A.raion(unit); if (!r) return [];
  const now = Date.now(); let o = s.offers[unit];
  if (!o || o.until < now) {
    const list = E.PROCS[r.disc] || E.PROCS._;
    const mast = E.unitMastery(unit);
    const maxIdx = Math.min(list.length - 1, 1 + Math.floor(mast * list.length * 1.3));
    o = s.offers[unit] = { until: now + 30 * 60e3, list: A.shuffle(list.slice(0, maxIdx + 1)).slice(0, 3).map(([t, min, base]) => ({ id: E.id(), t, min, base })) };
    A.store.save();
  }
  return o.list;
};
E.procPreview = (unit, offer, m, carId) => {
  const R = E.ROLES[m.role], mast = E.unitMastery(unit);
  const travel = E.travelMs(unit, carId);
  const hearing = offer.min * 60e3 * (E.s().tune.sofer ? .8 : 1) / E.buffMult('speed');
  const win = Math.min(.95, .35 + .55 * mast + (m.role === 'senior' ? .08 : m.role === 'partener' ? .14 : 0));
  const jackpot = .04 + .2 * mast;
  return { travel, hearing, total: travel * 2 + hearing, win, jackpot, fee: offer.base * (R.base / 500) * E.lvlMult(m) * (1 + mast) };
};
E.startProc = (unit, offerId, staffId, carId) => {
  const s = E.s(), m = s.staff.find(x => x.id === staffId), o = (s.offers[unit] || { list: [] }).list.find(x => x.id === offerId);
  if (!m || !o || E.busy(m.id) || m.strike || !E.ROLES[m.role].court) return;
  if (carId && E.carBusy(carId)) { A.toast('Mașina aleasă e deja pe drum.'); return; }
  const p = E.procPreview(unit, o, m, carId), now = Date.now();
  s.offers[unit].list = s.offers[unit].list.filter(x => x.id !== offerId);
  s.procs.push({ id: E.id(), unit, title: o.t, staff: m.id, car: carId || 0, start: now, t1: now + p.travel, t2: now + p.travel + p.hearing, end: now + p.total, fee: p.fee, win: p.win, jackpot: p.jackpot, prep: 0 });
  s.stats.procs++; A.store.save();
};
E.procPhase = p => { const n = Date.now(); return n < p.t1 ? 'pe drum spre instanță' : n < p.t2 ? 'în ședință' : n < p.end ? 'pe drum înapoi' : 'gata'; };
E.cut = (p, frac) => { const n = Date.now(), left = Math.max(0, p.end - n), cut = left * frac; p.end -= cut; p.t2 = Math.min(p.t2, p.end); p.t1 = Math.min(p.t1, p.t2); A.store.save(); };
E.nitroProc = id => { const s = E.s(), p = s.procs.find(x => x.id === id); if (!p || s.nitro < 1 || p.end <= Date.now()) return; s.nitro--; E.cut(p, .5); A.sound('xp'); A.toast('Nitro: drumul s-a scurtat la jumătate.'); };
E.collectProc = (id, at) => {
  const s = E.s(), p = s.procs.find(x => x.id === id); if (!p || p.end > Date.now()) return;
  s.procs = s.procs.filter(x => x.id !== id);
  const won = Math.random() < p.win, jack = won && Math.random() < p.jackpot;
  const got = E.earn(p.fee * (won ? (jack ? 3 : 1) : .25), at);
  if (won) { s.stats.won++; s.notoriety = (s.notoriety || 0) + 10; E.quest('won', 1); } else s.stats.lost++;
  A.sound(won ? 'coin' : 'ko');
  const u = A.unitById[p.unit].name;
  A.toast(won ? `<b>${jack ? 'Onorariu de succes!' : 'Proces câștigat'}</b>&nbsp;la ${A.esc(u)}: ${A.esc(p.title)}, +${A.lei(got)}` : `Proces pierdut la ${A.esc(u)}. Onorariu de consultanță: +${A.lei(got)}`, 4200);
  A.store.save(); A.game.checkStamps();
};
/* pregătirea dosarului: aceleași 3 întrebări pentru același dosar, oricâte ieșiri ar fi */
E.prepProc = id => {
  const s = E.s(), p = s.procs.find(x => x.id === id); if (!p || p.prep >= 3 || p.end <= Date.now()) return;
  const ask = () => A.quiz.mini('raion:' + p.unit, `Pregătește dosarul (${p.prep + 1}/3)`, (ok, none) => {
    if (none) return A.toast('Nu am găsit întrebări pentru acest raion.');
    p.prep++;
    if (ok) { E.cut(p, .15); A.game.addXP(5); A.toast('Dosar mai bine pregătit: -15% din timpul rămas.'); }
    A.store.save(); A.render();
    if (p.prep < 3 && p.end > Date.now()) setTimeout(ask, 250);
  }, null, `proc:${p.id}:${p.prep}`);
  ask();
};
E.openBranchCost = () => Math.round(25000 * Math.pow(2.5, Math.max(0, E.s().branches.length - 1)));
E.openBranch = unit => {
  const s = E.s(); if (s.branches.includes(unit)) return;
  if (A.locked(unit)) { A.toast('Raionul este blocat.'); return; }
  if (A.raionStats(unit).mastery < .1) { A.toast('Ai nevoie de cel puțin 10% stăpânire în acest raion.'); return; }
  if (!E.spend(E.openBranchCost())) return;
  s.branches.push(unit); A.toast(`Filială deschisă la ${A.esc(A.unitById[unit].name)}.`); A.confetti(); A.store.save(); A.game.checkStamps();
};

/* ---------------- flota ---------------- */
E.buyCar = tier => { const s = E.s(); if (tier < 1) return; if (!E.spend(E.CARS[tier][2])) return; s.fleet.push({ id: s.nextCarId++, tier, paint: '#8A9399', vinyl: '' }); A.sound('level'); A.toast(`Mașină nouă în garaj: ${E.CARS[tier][0]}.`); A.store.save(); };
E.sellCar = id => { const s = E.s(), c = E.carById(id); if (!c || E.carBusy(id)) return; const v = Math.round(E.CARS[c.tier][2] * .5); s.fleet = s.fleet.filter(x => x.id !== id); s.money += v; A.toast(`Ai vândut ${E.CARS[c.tier][0]} cu ${A.lei(v)}.`); A.store.save(); };
E.tuneCost = k => Math.round(E.TUNING[k].base * Math.pow(E.TUNING[k].grow, E.s().tune[k]));
E.tune = k => { const t = E.s().tune; if (t[k] >= E.TUNING[k].max) return; if (!E.spend(E.tuneCost(k))) return; t[k]++; A.store.save(); };


/* ---------------- trofeele mini-boșilor ---------------- */
/* fiecare mini-boss învins lasă un trofeu; trofeele se adună din toate raioanele */
E.PERKS = [
  { id: 'onorarii', n: 'Clauza de succes', d: '+6% la toate onorariile, pentru totdeauna.' },
  { id: 'vopsea', n: 'Atelierul de vopsitorie', d: 'O vopsea de colecție pentru flotă și +1 nitro.' },
  { id: 'dosar', n: 'Dosar de aur sigilat', d: 'Un dosar de aur, pe loc, plus unul la fiecare raion cucerit.' },
  { id: 'loc', n: 'Birou mai încăpător', d: '+1 loc în echipă, peste limita obișnuită.' },
  { id: 'curier', n: 'Curier propriu', d: 'Dosarele-cufăr se deblochează cu 12% mai repede.' },
  { id: 'scoala', n: 'Școala de drept', d: '+10% XP din tot ce faci.' },
  { id: 'filiala', n: 'Rețea de filiale', d: '+15% la veniturile pasive din filiale.' },
  { id: 'reputatie', n: 'Reputație în oraș', d: 'Un client de trei stele te așteaptă la fiecare pornire a zilei.' },
  { id: 'slot', n: 'Arhivă nouă', d: '+1 slot de dosar-cufăr (maximum 6).' },
];
E.perk = id => (A.S.perks || {})[id] || 0;
E.perkMult = (id, step) => 1 + step * E.perk(id);
E.grantPerk = (id, src) => {
  const P = E.PERKS.find(x => x.id === id); if (!P) return null;
  A.S.perks = A.S.perks || {}; A.S.perks[id] = (A.S.perks[id] || 0) + 1;
  const s = E.s();
  if (id === 'vopsea') { const v = A.pick(E.PAINTS.filter(x => !s.owned.paints.includes(x[1]))) || null; if (v) s.owned.paints.push(v[1]); s.nitro++; }
  if (id === 'dosar') E.grantChest('aur', src || 'Trofeu de mini-boss');
  if (id === 'slot' && s.slots.length < 6) s.slots.push(null);
  if (id === 'reputatie') s.clients.push(E.newClient(3));
  A.store.save();
  return P;
};

/* ---------------- dosare-cufăr ---------------- */
E.grantChest = (type, src) => {
  const s = E.s(); if (!s || !s.started) return false;
  const i = s.slots.findIndex(x => !x);
  if (i < 0) { A.toast(`${E.CHESTS[type].name}: sloturile sunt pline. Deschide un dosar ca să faci loc.`); return false; }
  s.slots[i] = { id: E.id(), type, src, unlockEnd: null };
  A.sound('chest'); A.store.save(); A.hud();
  return true;
};
/* dosarele se pot pune la deblocat abia după etapa de începător */
E.CHEST_MIN_READ = 10;
E.chestsLocked = () => Math.max(0, E.CHEST_MIN_READ - A.totalStats().read);
E.unlockMs = type => E.CHESTS[type].ms * (1 - Math.min(.4, .1 * E.s().staff.filter(x => x.role === 'secretar' && !x.strike).length)) / E.buffMult('speed') / E.perkMult('curier', .12);
E.unlocking = () => E.s().slots.find(x => x && x.unlockEnd && x.unlockEnd > Date.now());
E.startUnlock = i => { const s = E.s(), c = s.slots[i]; if (!c || c.unlockEnd || E.unlocking()) return;
  const left = E.chestsLocked(); if (left) { A.toast(`Dosarele se deschid după etapa de începător: mai citește ${left} ${left === 1 ? 'articol' : 'articole'}.`); A.sound('warn'); return; } c.unlockEnd = Date.now() + E.unlockMs(c.type); A.store.save(); };
/* deschiderea imediată: 15 grile grele, cel puțin 14 corecte; altfel dosarul se deschide doar la timp */
E.SPEED_N = 15; E.SPEED_PASS = 14;
E.speedChest = i => {
  const s = E.s(), c = s.slots[i]; if (!c || !c.unlockEnd || c.unlockEnd <= Date.now() || c.speedLocked) return;
  A.go(`#/joc/test/${i}`);
};
E.speedResult = (i, ok, n) => {
  const s = E.s(), c = s.slots[i]; if (!c) return;
  if (ok >= E.SPEED_PASS) { c.unlockEnd = Date.now(); A.toast(`<b>${ok}/${n} corecte.</b>&nbsp;Dosarul se deschide acum.`, 5000); A.sound('level'); }
  else { c.speedLocked = true; A.toast(`${ok}/${n} corecte. Dosarul se va deschide la timpul lui.`, 5000); A.sound('ko'); }
  A.store.save();
};
E.rollChest = type => {
  const C = E.CHESTS[type], L = A.game.levelInfo().L, out = { money: 0, clients: [], cards: {}, buff: null, cosm: null, nitro: 0 };
  out.money = Math.round(A.rand(...C.money) * (1 + L / 12));
  const nC = A.randi(...C.clients);
  for (let k = 0; k < nC; k++) { const st = type === 'simplu' ? 1 : type === 'argint' ? A.pick([1, 2, 2]) : type === 'aur' ? A.pick([2, 3]) : 3; out.clients.push(E.newClient(st)); }
  const nCards = A.randi(...C.cards);
  for (let k = 0; k < nCards; k++) { const r = A.pick(C.roles); out.cards[r] = (out.cards[r] || 0) + 1; }
  if (Math.random() < C.buff) out.buff = A.pick(E.BUFFS);
  if (Math.random() < C.cosm) {
    const s = E.s(); const paints = E.PAINTS.filter(p => !s.owned.paints.includes(p[1])), vin = E.VINYLS.filter(v => !s.owned.vinyls.includes(v[1]));
    const opts = [...paints.map(p => ({ k: 'paint', v: p[1], n: 'Vopsea: ' + p[0] })), ...vin.map(v => ({ k: 'vinyl', v: v[1], n: 'Colantare: ' + v[0] }))];
    if (opts.length) out.cosm = A.pick(opts);
  }
  out.nitro = C.nitro >= 1 ? C.nitro : (Math.random() < C.nitro ? 1 : 0);
  return out;
};
E.applyLoot = (loot, at) => {
  const s = E.s();
  E.earn(loot.money / E.feeMult(), at);
  s.clients.push(...loot.clients); s.clients = s.clients.slice(-12);
  for (const [r, n] of Object.entries(loot.cards)) s.cards[r] = (s.cards[r] || 0) + n;
  if (loot.buff) { const b = loot.buff; s.buffs[b.kind] = { kind: b.kind, mult: b.mult, until: Math.max(Date.now(), (s.buffs[b.kind] || {}).until || 0) + b.min * 60e3, label: b.label }; }
  if (loot.cosm) { if (loot.cosm.k === 'paint') s.owned.paints.push(loot.cosm.v); else s.owned.vinyls.push(loot.cosm.v); }
  s.nitro += loot.nitro;
  s.stats.chests++; E.quest('chest', 1);
  A.store.save(); A.game.checkStamps();
};
E.chestSVG = (type, open) => {
  const c = E.CHESTS[type].color;
  return `<svg viewBox="0 0 150 120" class="${open ? 'open' : ''}"><g>
    <rect x="18" y="50" width="114" height="58" rx="6" fill="${c}" stroke="#1B2A33" stroke-width="3"/>
    <rect x="18" y="50" width="114" height="12" fill="rgba(0,0,0,.18)"/>
    <rect x="66" y="58" width="18" height="22" rx="3" fill="#F3E7C4" stroke="#1B2A33" stroke-width="2.5"/>
    <g class="chest-lid"><path d="M20 50 L28 22 Q30 16 38 16 L112 16 Q120 16 122 22 L130 50 Z" fill="${c}" stroke="#1B2A33" stroke-width="3"/>
    <rect x="46" y="24" width="58" height="10" rx="2" fill="#F6F8F4" opacity=".85"/><text x="75" y="32.5" font-size="8" text-anchor="middle" font-family="Bahnschrift,sans-serif" fill="#1B2A33">DOSAR</text></g></g></svg>`;
};
E.scaleLoot = (l, mult) => {
  if (mult <= 1) return l;
  l.money *= mult;
  const extra = l.clients.map(c => E.newClient(c.stars)); l.clients = l.clients.concat(extra);
  for (const k of Object.keys(l.cards)) l.cards[k] *= mult;
  l.nitro *= mult;
  return l;
};
E.openChest = (i, free) => {
  const s = E.s(); let type;
  const left0 = E.chestsLocked(); if (left0) { A.toast(`Dosarele se deschid după etapa de începător: mai citește ${left0} ${left0 === 1 ? 'articol' : 'articole'}.`); A.sound('warn'); return; }
  if (free) { if (s.freeStock < 1) return; s.freeStock--; if (s.freeStock < 2 && s.freeAt < Date.now()) s.freeAt = Date.now() + E.FREE_EVERY; type = 'simplu'; }
  else {
    const c = s.slots[i]; if (!c || !c.unlockEnd || c.unlockEnd > Date.now()) return;
    const sp = E.CHESTS[c.type].sp || 0;
    if ((A.S.points.spete || 0) < sp) { A.toast(`Pentru ${E.CHESTS[c.type].name.toLowerCase()} îți trebuie ${sp} ${sp === 1 ? 'punct-speță' : 'puncte-speță'}. Ai ${A.S.points.spete || 0}. Rezolvă spețe în jocul rapid.`, 4500); A.sound('warn'); return; }
    A.S.points.spete -= sp; type = c.type; s.slots[i] = null; A.hud();
  }
  A.store.save();
  const reveal = mult => {
    const loot = E.scaleLoot(E.rollChest(type), mult);
    E.applyLoot(loot);
    A.sound('chest');
    const items = [`<li><b>${A.lei(loot.money)}</b></li>`];
    if (loot.clients.length) items.push(`<li>${loot.clients.length} ${loot.clients.length === 1 ? 'client nou' : 'clienți noi'} pentru consultație (${loot.clients.map(c => '★'.repeat(c.stars)).join(', ')})</li>`);
    const cards = Object.entries(loot.cards).map(([r, n]) => `${n} × ${E.ROLES[r].name}`).join(', ');
    if (cards) items.push(`<li>Cartonașe de îmbunătățire: ${cards}</li>`);
    if (loot.buff) items.push(`<li>Buff: ${A.esc(loot.buff.label)}, ${loot.buff.min} min</li>`);
    if (loot.cosm) items.push(`<li>${A.esc(loot.cosm.n)}</li>`);
    if (loot.nitro) items.push(`<li>${loot.nitro} nitro</li>`);
    const m = A.modal(`<div class="chestbox">${E.chestSVG(type, false)}</div><h2>${free ? E.FREE_NAME : E.CHESTS[type].name}${mult > 1 ? ' · dublat' : ''}</h2>
      <ul class="loot">${items.join('')}</ul>
      <div class="mbtns"><a class="btn primary" href="#/firma/consultatii" data-close>Vezi clienții</a><button class="btn" data-close>Închide</button></div>`, () => A.render());
    setTimeout(() => { const svg = A.$('.chestbox svg', m.el); svg && svg.classList.add('open'); }, 150);
  };
  if (type === 'aur') E.goldenBonus(reveal); else reveal(1);
};

/* ---------------- rândul de dosare de pe hartă (ca sloturile din Clash) ---------------- */
E.shortDur = ms => { ms = Math.max(0, ms); const h = Math.floor(ms / 3600e3), m = Math.floor(ms % 3600e3 / 60e3), sec = Math.floor(ms % 60e3 / 1000);
  return h ? `${h}h ${String(m).padStart(2, '0')}m` : m ? `${m}m ${String(sec).padStart(2, '0')}s` : `${sec}s`; };
E.dockHTML = () => {
  const s = E.s();
  if (!s || !s.started) return `<a class="cs found" href="#/firma"><b>Înființează biroul</b><small>ca să primești dosare</small></a>`;
  if (!s.slots.length) s.slots.push(null, null, null, null);
  const n = Date.now(), lock = E.chestsLocked(), busy = E.unlocking();
  return s.slots.slice(0, 4).map((c, i) => {
    if (!c) return `<button type="button" class="cs empty" data-cs="${i}" aria-label="Slot liber"><span class="ph"></span><small>Slot liber</small></button>`;
    const C = E.CHESTS[c.type], img = `<span class="ci">${E.chestSVG(c.type)}</span>`;
    if (lock) return `<button type="button" class="cs locked" data-cs="${i}" style="--c:${C.color}">${img}<small>🔒 încă ${lock} art.</small></button>`;
    if (c.unlockEnd && c.unlockEnd <= n) return `<button type="button" class="cs ready" data-cs="${i}" style="--c:${C.color}">${img}<b>DESCHIDE!</b><small>${E.spGem}${C.sp}</small></button>`;
    if (c.unlockEnd) return `<button type="button" class="cs run" data-cs="${i}" style="--c:${C.color}">${img}<b class="num" data-t="${c.unlockEnd}">${E.shortDur(c.unlockEnd - n)}</b><small>se deblochează</small></button>`;
    return `<button type="button" class="cs idle ${busy ? '' : 'go'}" data-cs="${i}" style="--c:${C.color}">${img}<b>${busy ? E.shortDur(E.unlockMs(c.type)) : 'Deblochează'}</b><small>${busy ? 'în așteptare' : E.shortDur(E.unlockMs(c.type))}</small></button>`;
  }).join('');
};
/* semnătura stării: dacă nu s-a schimbat, actualizăm doar cronometrele (butoanele rămân pe loc sub deget) */
E.dockKey = () => { const s = E.s(); if (!s || !s.started) return '-'; const n = Date.now();
  return [E.chestsLocked(), !!E.unlocking(), s.freeStock, ...s.slots.slice(0, 4).map(c => !c ? 0 : c.type + (c.unlockEnd ? (c.unlockEnd <= n ? 'R' : 'U') : 'I'))].join('|'); };
E.dockTimers = root => A.$$('[data-t]', root).forEach(el => { el.textContent = E.shortDur(+el.dataset.t - Date.now()); });
E.dockTap = i => {
  const s = E.s(), c = s && s.slots[i]; if (!s) return;
  if (!c) { A.toast('Slot liber. Dosarele vin din jocul rapid (butonul PLAY), mini-boși, misiuni și serii de zile.'); return; }
  const lock = E.chestsLocked(); if (lock) { A.toast(`Dosarele se deschid după etapa de începător: mai citește ${lock} ${lock === 1 ? 'articol' : 'articole'}.`); A.sound('warn'); return; }
  if (c.unlockEnd && c.unlockEnd <= Date.now()) return E.openChest(i);
  if (c.unlockEnd) { const C = E.CHESTS[c.type];
    const m = A.modal(`<div class="chestbox">${E.chestSVG(c.type)}</div><h2>${C.name}</h2><p>Se deschide peste <b>${E.shortDur(c.unlockEnd - Date.now())}</b>.</p>
      ${c.speedLocked ? '<p class="faint">Testul a fost picat: dosarul se deschide la timpul lui.</p>' : `<p>Sau îl deschizi acum: ${E.SPEED_N} grile grele, ai nevoie de ${E.SPEED_PASS} corecte. O singură încercare.</p>`}
      <div class="mbtns">${c.speedLocked ? '' : `<button class="btn primary" id="spd">Deschide acum: testul</button>`}<button class="btn" data-close>Închide</button></div>`);
    const b = A.$('#spd', m.el); if (b) b.onclick = () => { m.close(); E.speedChest(i); }; return; }
  if (E.unlocking()) { A.toast('Se deblochează deja alt dosar. Câte unul pe rând.'); A.sound('warn'); return; }
  E.startUnlock(i); A.sound('chest');
};
E.freeHTML = () => {
  const s = E.s(); if (!s || !s.started) return '';
  const ready = s.freeStock > 0 && !E.chestsLocked();
  return `<button type="button" class="fab free ${ready ? 'hot' : ''}" data-free aria-label="${E.FREE_NAME}"><span class="ci">${E.chestSVG('simplu')}</span>${ready ? `<b class="nb">${s.freeStock}</b>` : `<small class="num" data-t="${s.freeAt}">${E.shortDur(s.freeAt - Date.now())}</small>`}</button>`;
};

/* ---------------- misiunile zilei ---------------- */
E.ensureDaily = () => {
  const s = E.s(), d = A.today();
  if (s.daily && s.daily.date === d) return;
  const picks = A.shuffle(E.QUESTS).slice(0, 3).map(([id, t, ns]) => { const n = A.pick(ns); return { id, t: t.replace('{n}', n), n, p: 0, done: false }; });
  s.daily = { date: d, quests: picks, claimed: false };
  A.store.save();
};
E.quest = (id, n) => {
  const s = E.s(); if (!s || !s.daily) return; E.ensureDaily();
  for (const q of s.daily.quests) if (q.id === id && !q.done) { q.p += n; if (q.p >= q.n) { q.done = true; A.toast(`Misiune îndeplinită: ${A.esc(q.t)}`); } }
  if (!s.daily.claimed && s.daily.quests.every(q => q.done)) { s.daily.claimed = true; E.grantChest('aur', 'Misiunile zilei'); A.toast('<b>Toate misiunile zilei sunt îndeplinite.</b>&nbsp;Ai primit un dosar de aur.', 5000); }
  A.store.save();
};

/* ---------------- dosarul de aur ---------------- */
/* apare 15 secunde; un click îl prinde sigur, iar o întrebare-bonus îi dublează valoarea */
E.GOLDEN_MS = 15000;
E.spawnGolden = () => {
  if (A.$('.golden') || A.$('#overlay').innerHTML || A.guard.on) return;
  const el = document.createElement('button');
  el.className = 'golden'; el.type = 'button'; el.setAttribute('aria-label', 'Dosarul de aur');
  el.innerHTML = `<svg viewBox="0 0 60 48"><path d="M4 10 Q4 6 8 6 L22 6 L26 11 L52 11 Q56 11 56 15 L56 40 Q56 44 52 44 L8 44 Q4 44 4 40 Z" fill="#E2B11F" stroke="#7A5A08" stroke-width="2.5"/><path d="M4 18 L56 18" stroke="#7A5A08" stroke-width="2"/><text x="30" y="36" font-size="13" text-anchor="middle" font-family="Bahnschrift,sans-serif" font-weight="700" fill="#5A3F08">★</text></svg>`;
  el.style.left = A.randi(120, Math.max(130, innerWidth - 160)) + 'px'; el.style.top = A.randi(110, Math.max(120, innerHeight - 160)) + 'px';
  document.body.appendChild(el);
  let caught = false;
  const t = setTimeout(() => { if (!caught) el.remove(); }, E.GOLDEN_MS);
  el.addEventListener('pointerdown', ev => {
    ev.preventDefault(); ev.stopPropagation();
    if (caught) return; caught = true; clearTimeout(t); el.remove();
    E.catchGolden();
  });
};
E.catchGolden = () => {
  const s = E.s(); s.stats.golden++; A.sound('chest');
  const ok = E.grantChest('aur', 'Prins din zbor');
  A.store.save(); A.hud();
  if (ok) A.toast('<b>Ai prins dosarul de aur.</b>&nbsp;Ce e în el afli când îl deschizi, la birou.', 5000);
};
/* întrebarea-bonus la deschiderea unui dosar de aur: dublează ce iese din el */
E.goldenBonus = (onDone) => {
  const m = A.modal(`<div class="chestbox">${E.chestSVG('aur', false)}</div><h2>Dosar de aur</h2>
    <p>Răspunde corect la o întrebare și tot ce iese din dosar se dublează. Dacă greșești, primești conținutul simplu.</p>
    <div class="mbtns"><button class="btn primary" id="gq">Întrebarea-bonus</button><button class="btn" id="gt">Deschide-l așa</button></div>`);
  A.$('#gt', m.el).onclick = () => { m.close(); onDone(1); };
  A.$('#gq', m.el).onclick = () => { m.close(); A.quiz.mini('citite', 'Dosar de aur · bonus', okk => { if (!okk) A.toast('Răspuns greșit: dosarul se deschide simplu.'); onDone(okk ? 2 : 1); }); };
};

/* ---------------- venituri pasive din filiale (doar cât timp studiezi) ---------------- */
E.PASSIVE_CAP = 8 * 3600e3;
E.passiveRateRaw = () => { const s = E.s(); return s.branches.reduce((x, u) => x + 120 + 800 * E.unitMastery(u), 0) * (1 + 0.08 * s.staff.length) * E.perkMult('filiala', .15); };
E.passiveRaw = () => E.s().passiveBank || 0;
E.collectPassive = at => { const s = E.s(), v = s.passiveBank || 0; if (v < 1) return; s.passiveBank = 0; const got = E.earn(v, at); A.sound('coin'); A.toast(`Încasări din filiale: +${A.lei(got)}`); };

/* ---------------- ceasul jocului ---------------- */
E.tick = () => {
  const s = E.s(); if (!s || !s.started) return;
  const now = Date.now(), dt = Math.min(5000, now - (E._lastTick || now)); E._lastTick = now;
  // anti-AFK: filialele produc doar dacă ai studiat în ultimele 30 de minute
  if (A.active() && document.visibilityState === 'visible') s.passiveBank = Math.min(E.passiveRateRaw() * E.PASSIVE_CAP / 3600e3, (s.passiveBank || 0) + E.passiveRateRaw() * dt / 3600e3);
  if (!E._lastPay || now - E._lastPay > 60e3) { E._lastPay = now; E.paySalaries(); }
  if (s.freeStock < 2 && now >= s.freeAt) { s.freeStock++; s.freeAt = now + E.FREE_EVERY; A.toast(`Un ${E.FREE_NAME.toLowerCase()} te așteaptă la birou.`); A.store.save(); }
  if (now >= s.golden.next) { s.golden.next = now + A.randi(22, 45) * 60e3; if (document.visibilityState === 'visible' && A.active()) E.spawnGolden(); }
  if (!s.walkAt) s.walkAt = now + E.walkInterval();
  if (now >= s.walkAt) { s.walkAt = now + E.walkInterval(); if (s.clients.length < E.maxWaiting() && A.active()) { s.clients.push(E.newClient(E.walkStars())); A.toast('Un client nou așteaptă consultația.'); A.store.save(); } }
  let changed = false;
  for (const c of s.consults) if (c.end <= now && !c.notified) { c.notified = 1; changed = true; A.toast(`Consultație terminată: ${A.esc(c.client.title)}. Colectează onorariul.`); }
  for (const p of s.procs) if (p.end <= now && !p.notified) { p.notified = 1; changed = true; A.toast(`Avocatul s-a întors de la ${A.esc(A.unitById[p.unit].name)}. Află rezultatul procesului.`); }
  for (const c of s.slots) if (c && c.unlockEnd && c.unlockEnd <= now && !c.notified) { c.notified = 1; changed = true; A.toast(`${E.CHESTS[c.type].name} este gata de deschis.`); }
  if (changed) { A.store.save(); A.hud(); }
  A.$$('[data-until]').forEach(el => { el.textContent = A.dur(+el.dataset.until - now); });
  A.$$('[data-prog]').forEach(el => { const [a, b] = el.dataset.prog.split(',').map(Number); el.style.width = (A.clamp((now - a) / (b - a), 0, 1) * 100).toFixed(1) + '%'; });
  if (now % 5000 < 1000) A.hud();
};
E.readyCount = () => { const s = E.s(), n = Date.now(); return s.consults.filter(c => c.end <= n).length + s.procs.filter(p => p.end <= n).length + s.slots.filter(c => c && c.unlockEnd && c.unlockEnd <= n).length + (s.freeStock > 0 ? 1 : 0); };
E.hudBits = () => {
  const s = E.s(); if (!s || !s.started) return `<a class="chip" href="#/firma" style="text-decoration:none">Înființează biroul</a>`;
  const n = Date.now();
  const slots = s.slots.map(c => !c ? '<i class="sl"></i>' : c.unlockEnd && c.unlockEnd <= n ? `<i class="sl ready" style="background:${E.CHESTS[c.type].color}"></i>` : c.unlockEnd ? `<i class="sl run" style="border-color:${E.CHESTS[c.type].color}"></i>` : `<i class="sl full" style="background:${E.CHESTS[c.type].color}"></i>`).join('');
  const ready = E.readyCount();
  const buffs = Object.values(s.buffs).filter(b => b.until > n);
  return `${buffs.length ? `<span class="chip buff" title="${A.esc(buffs.map(b => b.label).join(', '))}">${A.esc(buffs[0].label.split(':')[0])} · <span data-until="${buffs[0].until}">${A.dur(buffs[0].until - n)}</span></span>` : ''}
   <a class="chip money ${s.money < 0 ? 'neg' : ''}" href="#/firma" style="text-decoration:none" title="Onorarii"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="var(--wheat)"/><text x="12" y="16.5" font-size="12" text-anchor="middle" fill="#3D2E05" font-family="Bahnschrift,sans-serif" font-weight="700">L</text></svg>${A.fmt(s.money)}</a>
`;
};
