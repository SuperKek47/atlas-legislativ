/* Atlasul legislativ — efecte: sunet (WebAudio), zborul recompenselor spre bara de sus, confetti, bannere, serii. */
'use strict';
A.fx = {};
const F = A.fx;
const st = () => (A.S && A.S.settings) || {};
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches || st().fx === false;

/* ================= SUNET ================= */
let ctx = null, master = null, nbuf = null;
const ac = () => {
  if (!ctx) {
    ctx = A._actx || (A._actx = new (window.AudioContext || window.webkitAudioContext)());
    master = ctx.createGain();
    const comp = ctx.createDynamicsCompressor(); master.connect(comp); comp.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  master.gain.value = st().volume == null ? .8 : st().volume;
  return ctx;
};
const tone = (f, t, d, o = {}) => {
  const os = ctx.createOscillator(), g = ctx.createGain();
  os.type = o.type || 'sine'; os.frequency.setValueAtTime(f, t);
  if (o.to) os.frequency.exponentialRampToValueAtTime(o.to, t + d);
  const v = o.vol == null ? .15 : o.vol, a = o.a == null ? .008 : o.a;
  g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v, t + a); g.gain.exponentialRampToValueAtTime(.0001, t + d);
  os.connect(g).connect(master); os.start(t); os.stop(t + d + .03);
};
const noise = (t, d, vol, f0, f1, q = 1.2) => {
  if (!nbuf) { nbuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate); const a = nbuf.getChannelData(0); for (let i = 0; i < a.length; i++) a[i] = Math.random() * 2 - 1; }
  const s = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = ctx.createGain();
  s.buffer = nbuf; s.loop = true; fl.type = 'bandpass'; fl.Q.value = q;
  fl.frequency.setValueAtTime(f0, t); fl.frequency.exponentialRampToValueAtTime(f1, t + d);
  g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + d * .3); g.gain.exponentialRampToValueAtTime(.0001, t + d);
  s.connect(fl).connect(g).connect(master); s.start(t); s.stop(t + d + .03);
};
const NOTES = [523, 659, 784, 1047, 1319, 1568, 2093];
const fan = tier => {
  const t = ctx.currentTime + .01, k = Math.min(NOTES.length, 3 + tier), gap = .085;
  if (tier >= 2) tone(110, t, .55, { to: 42, vol: .3 });
  for (let i = 0; i < k; i++) {
    tone(NOTES[i], t + i * gap, .26, { type: 'triangle', vol: .12 });
    if (tier >= 2) tone(NOTES[i] * 2, t + i * gap, .18, { vol: .035 });
  }
  const tc = t + k * gap, hold = .5 + tier * .16;
  for (const f of [523, 659, 784, 1047]) { tone(f, tc, hold, { type: 'triangle', vol: .08 }); tone(f / 2, tc, hold, { vol: .06 }); }
  if (tier >= 3) for (let j = 0; j < 9; j++) tone(2000 + Math.random() * 2400, tc + .05 + j * .07, .2, { vol: .035 });
  if (tier >= 4) { for (const f of [1047, 1319, 1568, 2093]) tone(f, tc + .42, hold, { type: 'triangle', vol: .07 }); noise(tc, .9, .05, 600, 5000, .8); }
};
const SND = {
  click: t => tone(1200, t, .03, { type: 'triangle', vol: .05 }),
  xp: t => { tone(880, t, .07, { vol: .1 }); tone(1320, t + .05, .1, { vol: .08 }); },
  ok: t => { tone(660, t, .08, { vol: .11 }); tone(990, t + .07, .12, { vol: .11 }); },
  ko: t => tone(240, t, .22, { type: 'triangle', to: 150, vol: .13 }),
  warn: t => { tone(330, t, .09, { type: 'triangle', vol: .1 }); tone(262, t + .08, .14, { type: 'triangle', vol: .1 }); },
  coin: t => { tone(1318, t, .06, { type: 'square', vol: .045 }); tone(1760, t + .05, .14, { vol: .1 }); },
  chest: t => { tone(120, t, .3, { to: 50, vol: .3 }); [392, 523, 659].forEach((f, i) => tone(f, t + .07 + i * .08, .2, { type: 'triangle', vol: .12 })); },
  stamp: t => { tone(140, t, .14, { to: 70, vol: .3 }); [523, 659, 784, 1047].forEach((f, i) => tone(f, t + .08 + i * .07, .16, { type: 'triangle', vol: .1 })); },
  level: () => fan(3),
  win: () => fan(2),
  pop: t => tone(420, t, .07, { to: 900, vol: .12 }),
  whoosh: t => noise(t, .35, .09, 400, 3200),
  card: t => { noise(t, .12, .07, 2500, 900); tone(660, t + .02, .1, { type: 'triangle', vol: .1 }); tone(990, t + .08, .12, { type: 'triangle', vol: .09 }); },
  claim: t => [784, 988, 1318].forEach((f, i) => tone(f, t + i * .07, .18, { type: 'triangle', vol: .11 })),
  boost: t => { tone(300, t, .5, { type: 'sawtooth', to: 1200, vol: .05 }); noise(t, .5, .05, 500, 4000); [523, 784, 1047].forEach(f => tone(f, t + .4, .5, { type: 'triangle', vol: .08 })); },
  unlock: t => { tone(440, t, .12, { type: 'triangle', vol: .1 }); tone(660, t + .1, .2, { type: 'triangle', vol: .1 }); },
  tick: t => tone(1800, t, .02, { type: 'triangle', vol: .04 }),
  fan1: () => fan(1), fan2: () => fan(2), fan3: () => fan(3), fan4: () => fan(4), fan5: () => fan(5),
};
let lastClick = 0, lastHit = 0;
A.sound = (kind, i) => {
  if (!A.S || !A.S.settings.sound) return;
  try {
    ac(); const t = ctx.currentTime + .005;
    if (kind === 'click') { if (t - lastClick < .05) return; lastClick = t; }
    if (kind === 'coinhit') {
      if (t - lastHit < .035) return; lastHit = t;
      const f = 1318 * Math.pow(2, ((i || 0) % 9) * 2 / 12);
      tone(f, t, .09, { type: 'triangle', vol: .1 }); tone(f * 2, t, .12, { vol: .045 }); return;
    }
    (SND[kind] || SND.pop)(t);
  } catch (e) { }
};

/* ================= ZBORUL RECOMPENSELOR ================= */
const SVG = {
  lei: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#E8B923" stroke="#6B4A05" stroke-width="2"/><circle cx="12" cy="12" r="6.5" fill="none" stroke="#B98A12" stroke-width="1.6"/><path d="M8 8c2 1 6 1 8 0" stroke="#fff" stroke-opacity=".6" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>',
  gr: '<svg viewBox="0 0 24 24"><path d="M12 2 22 12 12 22 2 12Z" fill="#2DBF8A" stroke="#0B4A35" stroke-width="2" stroke-linejoin="round"/><path d="M12 5.5 18.5 12 12 18.5" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1.6"/></svg>',
  sp: '<svg viewBox="0 0 24 24"><path d="M12 2 22 12 12 22 2 12Z" fill="#F2C230" stroke="#6B4A05" stroke-width="2" stroke-linejoin="round"/><path d="M12 5.5 18.5 12 12 18.5" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="1.6"/></svg>',
  xp: '<svg viewBox="0 0 24 24"><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9z" fill="#5CA8FF" stroke="#173A6B" stroke-width="1.8" stroke-linejoin="round"/></svg>',
  nitro: '<svg viewBox="0 0 24 24"><rect x="7" y="4" width="10" height="17" rx="3" fill="#6FC3FF" stroke="#0B1424" stroke-width="1.6"/><rect x="9" y="1.5" width="6" height="3" rx="1" fill="#0B1424"/></svg>',
  boost: '<svg viewBox="0 0 24 24"><path d="M12 2c1 4 6 6 6 11a6 6 0 0 1-12 0c0-3 2-4 2-7 1 2 2 3 3 3 0-3 0-5 1-7z" fill="#FF6B5E" stroke="#0B1424" stroke-width="1.6" stroke-linejoin="round"/></svg>',
  chest: '<svg viewBox="0 0 24 24"><rect x="3" y="9" width="18" height="12" rx="2" fill="#8A6A3C" stroke="#0B1424" stroke-width="1.8"/><path d="M3.5 9 5 4h14l1.5 5Z" fill="#A98550" stroke="#0B1424" stroke-width="1.8" stroke-linejoin="round"/><rect x="10.5" y="11" width="3" height="4" rx=".8" fill="#F3E7C4" stroke="#0B1424" stroke-width="1.2"/></svg>',
};
const TARGETS = {
  lei: ['.hud .chip.money'], gr: ['.hud [data-gem="grile"]'], sp: ['.hud [data-gem="spete"]'],
  xp: ['.hud .lvl', '.hud .rank', '.hud .xpbar'], card: ['[data-nav="firma"]'], boost: ['[data-nav="firma"]'], nitro: ['[data-nav="firma"]'],
  chest: ['.dockslots .cs', '[data-nav="harta"]'],
};
const visible = el => { const r = el.getBoundingClientRect(); return r.width > 2 && r.height > 2 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth; };
const targetFor = k => { for (const sel of TARGETS[k] || TARGETS.lei) for (const el of document.querySelectorAll(sel)) if (visible(el)) return el; return null; };
const pointOf = f => {
  if (f && f.getBoundingClientRect) { const r = f.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }
  if (f && f.x != null) return f;
  return { x: innerWidth / 2, y: innerHeight * .55 };
};
const pulse = el => { if (!el) return; el.classList.remove('fxpulse'); void el.offsetWidth; el.classList.add('fxpulse'); setTimeout(() => el.classList.remove('fxpulse'), 420); };
const pieces = (k, n) => {
  n = Math.max(1, Math.round(n || 1));
  if (k === 'lei') return n < 30 ? 1 : n < 100 ? 2 : n < 300 ? 3 : Math.max(4, Math.min(16, Math.round(Math.log10(n + 1) * 3.2)));
  if (k === 'xp') return Math.max(2, Math.min(10, Math.ceil(n / 12)));
  if (k === 'card') return Math.min(n, 6);
  return Math.min(n, k === 'gr' || k === 'sp' ? 10 : 5);
};
/* k: lei|gr|sp|xp|card|boost|nitro|chest; n: cantitatea; from: element sau {x,y}; o: {img, delay, done} */
/* ===== cifrele din bara de sus cresc treptat, pe măsură ce sosesc particulele ===== */
F.hold = { lei: 0, gr: 0, sp: 0 }; F.holdAt = 0;
const paintNow = () => {
  const H = F.hold, e = A.eco && A.eco.s && A.eco.s();
  const set = (sel, v, byB) => { const el = document.querySelector(sel); if (!el) return; const t = A.fmt(v);
    if (byB) { const b = el.querySelector('b'); if (b && b.textContent !== t) b.textContent = t; }
    else { const n = [...el.childNodes].filter(x => x.nodeType === 3).pop(); if (n && n.textContent !== t) n.textContent = t; } };
  if (H.lei > 0 && e) set('.hud .chip.money', e.money - H.lei, false);
  if (H.gr > 0) set('.hud [data-gem="grile"]', (A.S.points.grile || 0) - H.gr, true);
  if (H.sp > 0) set('.hud [data-gem="spete"]', (A.S.points.spete || 0) - H.sp, true);
};
F.paintHold = () => { if (F.scan) F.scan(); paintNow(); };
F.addHold = (k, n) => { F.hold[k] += n; F.holdAt = Date.now(); paintNow(); };
F.release = (k, n) => { F.hold[k] = Math.max(0, F.hold[k] - n); F.holdAt = Date.now(); if (A.hud) A.hud(); };
F.releaseAll = () => { F.hold.lei = F.hold.gr = F.hold.sp = 0; if (A.hud) A.hud(); };
setInterval(() => {
  const H = F.hold; if (!(H.lei || H.gr || H.sp)) return;
  if (Date.now() - F.holdAt > 5000 && !document.querySelector('.fxp, .fx')) F.releaseAll();
}, 1000);

F.fly = (k, n, from, o = {}) => {
  if (!o.auto && (k === 'lei' || k === 'gr' || k === 'sp')) F.cover(k, n);
  const tgt = targetFor(k), tp = tgt ? pointOf(tgt) : { x: innerWidth / 2, y: 28 }, sp = pointOf(from);
  const cnt = pieces(k, n), delay = o.delay || 0;
  if (reduced()) { setTimeout(() => { pulse(tgt); F.release(k, n); A.sound(k === 'card' ? 'card' : 'coinhit', 0); o.done && o.done(); }, delay + 200); return; }
  const isCard = k === 'card', w = isCard ? 38 : 28, h = isCard ? 48 : 28;
  let arrived = 0;
  for (let i = 0; i < cnt; i++) {
    const el = document.createElement('div'); el.className = 'fxp ' + (isCard ? 'fxcard' : '');
    el.style.cssText = `left:${sp.x - w / 2}px;top:${sp.y - h / 2}px;width:${w}px;height:${h}px`;
    el.innerHTML = isCard && o.img ? `<img src="${o.img}" alt="">` : (SVG[k] || SVG.lei);
    document.body.appendChild(el);
    const bx = (Math.random() - .5) * 150, by = (Math.random() - .6) * 110;
    const dx = tp.x - sp.x, dy = tp.y - sp.y, d = delay + i * (isCard ? 150 : 65);
    const a = el.animate([
      { transform: 'translate(0,0) scale(.2) rotate(0deg)', opacity: 0 },
      { transform: `translate(${bx}px,${by}px) scale(1.15) rotate(${(Math.random() - .5) * 40}deg)`, opacity: 1, offset: .3, easing: 'cubic-bezier(.5,0,.9,.6)' },
      { transform: `translate(${dx}px,${dy}px) scale(.42) rotate(0deg)`, opacity: .95 },
    ], { duration: isCard ? 1050 : 880, delay: d, easing: 'cubic-bezier(.25,.1,.25,1)', fill: 'both' });
    if (i === 0 || isCard) setTimeout(() => A.sound(isCard ? 'whoosh' : 'pop'), d);
    const part = k === 'lei' || k === 'gr' || k === 'sp' ? (i === cnt - 1 ? n - Math.floor(n / cnt) * (cnt - 1) : Math.floor(n / cnt)) : 0;
    a.onfinish = () => {
      el.remove(); pulse(tgt); if (part) F.release(k, part);
      A.sound(isCard ? 'card' : k === 'xp' ? 'xp' : 'coinhit', i);
      if (++arrived === cnt) o.done && o.done();
    };
  }
};
/* list: [{k, n, img, from}] — pornesc în cascadă */
F.rewards = (list, base = 0) => {
  let d = base;
  for (const r of list) { if (!r || !r.k || !(r.n > 0)) continue; F.fly(r.k, r.n, r.from, { img: r.img, delay: d }); d += 220 + pieces(r.k, r.n) * 40; }
};

/* ================= CONFETTI ================= */
const COLS = { std: ['#E8B923', '#7B5BD6', '#4A90E2', '#E0533F', '#2DBF8A', '#fff'], gold: ['#F2C230', '#E8B923', '#FFE08A', '#fff6d0', '#C99A1E'] };
F.confetti = (kind = 'big') => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || st().fx === false) return;
  if (typeof kind !== 'string') kind = 'big';
  const cfg = {
    small: { n: 60, at: [[.5, .45]], cols: COLS.std }, big: { n: 110, at: [[.25, .5], [.75, .5], [.5, .35]], cols: COLS.std },
    gold: { n: 120, at: [[.5, .4], [.3, .5], [.7, .5]], cols: COLS.gold }, mega: { n: 150, at: [[.15, .55], [.85, .55], [.5, .3], [.35, .45], [.65, .45]], cols: COLS.std.concat(COLS.gold) },
  }[kind] || { n: 100, at: [[.5, .4]], cols: COLS.std };
  const phone = A.phone && A.phone(), scale = phone ? .6 : 1;
  const c = document.createElement('canvas'); c.className = 'confetti'; document.body.appendChild(c);
  const w = c.width = innerWidth, h = c.height = innerHeight, x = c.getContext('2d');
  const P = [];
  cfg.at.forEach(([fx, fy], bi) => { for (let i = 0; i < Math.round(cfg.n * scale / cfg.at.length * 1.4); i++) {
    const ang = -Math.PI / 2 + (Math.random() - .5) * 2.2, sp = 7 + Math.random() * 9;
    P.push({ x: w * fx, y: h * fy, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, r: 3 + Math.random() * 5, c: cfg.cols[Math.floor(Math.random() * cfg.cols.length)], a: Math.random() * 6, va: (Math.random() - .5) * .4, w: Math.random() < .5, d: bi * 6 });
  } });
  let f = 0;
  const step = () => {
    x.clearRect(0, 0, w, h); let live = 0;
    for (const p of P) {
      if (f < p.d) { live++; continue; }
      p.vy += .32; p.vx *= .992; p.x += p.vx; p.y += p.vy; p.a += p.va;
      if (p.y < h + 20) live++;
      x.save(); x.translate(p.x, p.y); x.rotate(p.a); x.fillStyle = p.c;
      if (p.w) x.fillRect(-p.r, -p.r / 2, p.r * 2, p.r); else { x.beginPath(); x.arc(0, 0, p.r / 1.6, 0, 7); x.fill(); }
      x.restore();
    }
    f++; if (live && f < 220) requestAnimationFrame(step); else c.remove();
  };
  requestAnimationFrame(step);
};
A.confetti = F.confetti;

/* ================= BANNER ================= */
F.banner = (title, sub, cls = '') => {
  const el = document.createElement('div'); el.className = 'fxbanner ' + cls;
  el.innerHTML = `<b>${A.esc(title)}</b>${sub ? `<small>${A.esc(sub)}</small>` : ''}`;
  document.body.appendChild(el); requestAnimationFrame(() => el.classList.add('in'));
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 500); }, 2300);
};
/* clipe de sărbătoare: sunet + confetti + vibrație (+ banner) */
F.celebrate = (type, title, sub) => {
  const M = {
    section: { snd: 'fan1', cf: 'small', buzz: [20, 40, 20] }, daily: { snd: 'fan3', cf: 'big', buzz: [30, 50, 30, 50, 80] },
    streak: { snd: 'fan3', cf: 'gold', buzz: [30, 50, 30, 50, 80] }, boss: { snd: 'fan4', cf: 'mega', buzz: [40, 60, 40, 60, 120] },
    raion: { snd: 'fan5', cf: 'mega', buzz: [40, 60, 40, 60, 160] }, combo: { snd: 'claim', cf: 'small', buzz: [15, 30, 15] },
  }[type] || { snd: 'claim', cf: 'small' };
  A.sound(M.snd); F.confetti(M.cf); M.buzz && A.buzz && A.buzz(M.buzz);
  if (title) F.banner(title, sub, type);
};
/* serie de răspunsuri corecte la rând */
F.run = 0;
F.combo = ok => {
  if (!ok) { F.run = 0; return; }
  F.run++;
  if ([5, 10, 15, 20, 30, 50].includes(F.run)) F.celebrate('combo', `Serie de ${F.run}!`, 'răspunsuri corecte la rând');
};
F.tier = type => ({ simplu: 1, argint: 2, aur: 3, magic: 4, decan: 5 })[type] || 1;

/* ================= MESAJELE DE SUS (toast) ================= */
const plain = h => String(h).replace(/<svg[\s\S]*?<\/svg>/g, '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const ERR = /nu ai destui|nu ai bani|îți lipsesc|îți trebuie|sunt pline|nu poți|limita ta|grevă|se deschid după|înființează|blocat|nu ai |lipsesc/i;
const EVT = /nivel|serie|mini-boss|raion|obiectivul|decan|promov|ștampilă|medalia|capitol|trofeu|filialele au reluat/i;
const REW = /\+\s?[\d.,]+|încasat|ai primit|primit|ai prins|îndeplinit|cumpărat|vândut|câștigat|client generos|onorariu/i;
const kindOf = t => ERR.test(t) ? 'err' : EVT.test(t) ? 'evt' : REW.test(t) ? 'rew' : 'inf';
const TI = {
  err: '<svg viewBox="0 0 24 24"><path d="M12 3 22 20H2Z" fill="#FF6B6B" stroke="#2A0A0C" stroke-width="1.8" stroke-linejoin="round"/><path d="M12 9v5M12 16.5v.5" stroke="#2A0A0C" stroke-width="2.2" stroke-linecap="round"/></svg>',
  rew: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#2DBF8A" stroke="#06281D" stroke-width="1.8"/><path d="M7 12.5l3.2 3.2L17 9" fill="none" stroke="#06281D" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  evt: '<svg viewBox="0 0 24 24"><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9z" fill="#B28CFF" stroke="#1E0F40" stroke-width="1.8" stroke-linejoin="round"/></svg>',
  inf: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#5CA8FF" stroke="#0B2547" stroke-width="1.8"/><path d="M12 11v6M12 7.5v.5" stroke="#0B2547" stroke-width="2.4" stroke-linecap="round"/></svg>',
};
const note = (text, kind) => {
  const L = (A.S.notifs = A.S.notifs || []);
  L.push({ t: Date.now(), x: text, k: kind }); while (L.length > 30) L.shift();
  F.unread = (F.unread || 0) + 1; F.lastToast = Date.now(); bellUpdate();
};
A.toast = (html, ms = 3200, type) => {
  const host = A.$('#toasts'), key = String(html), text = plain(html), kind = type || kindOf(text);
  const dur = Math.min(8000, Math.max(4000, 1800 + 70 * text.length, Math.min(ms, 8000)));
  const same = A.$$('.toast', host).find(t => t.dataset.k === key && !t.classList.contains('out'));
  if (same) { clearTimeout(same._t); same.classList.remove('bump'); void same.offsetWidth; same.classList.add('bump'); same._t = setTimeout(() => A.toastOut(same), dur); return same; }
  const el = document.createElement('div'); el.className = 'toast t-' + kind; el.dataset.k = key;
  const hasIco = key.includes('<svg') || key.includes('<img');
  el.innerHTML = hasIco ? key : `<i class="ti">${TI[kind]}</i><span>${key}</span>`;
  host.appendChild(el); note(text, kind);
  el._t = setTimeout(() => A.toastOut(el), dur);
  /* cât ții degetul pe mesaj, rămâne; o atingere scurtă îl închide */
  let t0 = 0;
  el.addEventListener('pointerdown', () => { t0 = Date.now(); clearTimeout(el._t); });
  const up = () => { if (!t0) return; const short = Date.now() - t0 < 350; t0 = 0; if (short) A.toastOut(el); else el._t = setTimeout(() => A.toastOut(el), 2500); };
  el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up); el.addEventListener('pointerleave', up);
  let live = A.$$('.toast:not(.out)', host);
  while (live.length > 3) { A.toastOut(live[0]); live = A.$$('.toast:not(.out)', host); }
  return el;
};
A.toastOut = el => { if (el.classList.contains('out')) return; clearTimeout(el._t); el.classList.add('out'); setTimeout(() => el.remove(), 650); };

/* istoricul mesajelor: clopoțel + listă */
const ago = t => { const m = Math.round((Date.now() - t) / 60e3); return m < 1 ? 'acum' : m < 60 ? `acum ${m} min` : `acum ${Math.round(m / 60)} h`; };
F.notifs = () => {
  const L = (A.S.notifs || []).slice().reverse(); F.unread = 0; bellUpdate();
  const m = A.modal(`<h2>Mesaje recente</h2><div class="nlist">${L.length ? L.map(n => `<div class="ni t-${n.k}"><i class="ti">${TI[n.k] || TI.inf}</i><span>${A.esc(n.x)}</span><small>${ago(n.t)}</small></div>`).join('') : '<p class="faint">Niciun mesaj încă.</p>'}</div>
    <div class="mbtns"><button class="btn" id="nclr">Șterge lista</button><button class="btn use" data-close>Închide</button></div>`);
  const c = A.$('#nclr', m.el); c.onclick = () => { A.S.notifs = []; A.store.save(); m.close(); };
};
let bellEl = null;
const bellUpdate = () => {
  if (!bellEl) {
    bellEl = document.createElement('button'); bellEl.type = 'button'; bellEl.className = 'fxbell'; bellEl.setAttribute('aria-label', 'Mesaje recente');
    bellEl.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 3a6 6 0 0 0-6 6v4l-2 3h16l-2-3V9a6 6 0 0 0-6-6zM10 19a2 2 0 0 0 4 0" fill="#FFE08A" stroke="#0B1424" stroke-width="1.6" stroke-linejoin="round"/></svg><b></b>';
    bellEl.onclick = () => F.notifs(); document.body.appendChild(bellEl);
  }
  const show = F.unread > 0 && Date.now() - (F.lastToast || 0) < 120e3;
  bellEl.classList.toggle('on', show); A.$('b', bellEl).textContent = F.unread > 9 ? '9+' : F.unread || '';
};
setInterval(() => { if (bellEl) bellUpdate(); }, 10e3);

/* ================= EFECTUL DE MONEDE LA ORICE ÎNCASARE ================= */
/* urmărește banii și punctele-grilă/speță: orice creștere, din orice loc, pornește zborul spre bara de sus */
{
  let seen = null, flushT = null, pt = { x: 0, y: 0, t: 0 }, covT = 0;
  const pend = { lei: 0, gr: 0, sp: 0 }, cov = { lei: 0, gr: 0, sp: 0 };
  addEventListener('pointerdown', e => { pt = { x: e.clientX, y: e.clientY, t: Date.now() }; }, true);
  F.cover = (k, n) => { cov[k] += n; covT = Date.now(); };
  const read = () => { const e = A.eco && A.eco.s && A.eco.s(); return { lei: e && e.started ? e.money : 0, gr: A.S.points.grile || 0, sp: A.S.points.spete || 0 }; };
  const flush = () => {
    flushT = null;
    if (document.querySelector('.fx')) { flushT = setTimeout(flush, 400); return; }   // pe ecran întreg zborul așteaptă să se închidă
    if (Date.now() - covT > 6000) { cov.lei = cov.gr = cov.sp = 0; }
    const from = Date.now() - pt.t < 3000 ? { x: pt.x, y: pt.y } : null; let d = 0;
    for (const k of ['lei', 'gr', 'sp']) {
      let n = pend[k]; pend[k] = 0; const c = Math.min(cov[k], n); cov[k] -= c; n -= c;
      if (n > 0) { F.fly(k, n, from, { auto: true, delay: d }); d += 250; }
    }
  };
  const scan = () => {
    if (!A.S || !A.S.points) return; const v = read();
    if (!seen) { seen = v; return; }
    let any = false; for (const k of ['lei', 'gr', 'sp']) { const d = v[k] - seen[k]; if (d > 0 && !(k === 'lei' && seen.lei === 0 && d > 1500 && !seen._ok)) { pend[k] += d; any = true; F.addHold(k, d); } }
    seen = v; seen._ok = true;
    if (any && !flushT) flushT = setTimeout(flush, 150);
  };
  F.scan = scan; setInterval(scan, 250);
}

/* ===== bara de departamente din Birou: își păstrează poziția la schimbarea secțiunii ===== */
{
  let left = 0;
  addEventListener('scroll', e => { const t = e.target; if (t && t.classList && t.classList.contains('ftabs')) left = t.scrollLeft; }, true);
  const fix = nav => {
    nav.dataset.fx = 1; nav.scrollLeft = left;
    const on = nav.querySelector('a.on');
    if (on) { const l = on.offsetLeft, r = l + on.offsetWidth; if (l < nav.scrollLeft + 12 || r > nav.scrollLeft + nav.clientWidth - 12) nav.scrollLeft = Math.max(0, l - (nav.clientWidth - on.offsetWidth) / 2); }
    left = nav.scrollLeft;
  };
  new MutationObserver(() => { const n = document.querySelector('.ftabs:not([data-fx])'); if (n) fix(n); }).observe(document.documentElement, { childList: true, subtree: true });
}
