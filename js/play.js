/* Atlasul legislativ — spețe cu răspuns liber (corectare offline pe concepte-cheie),
   jocul rapid (3 grile de examen + 1 speță) */
'use strict';
(() => {
const P = A.play = {};
const ST = A.study;

/* ---------------- corectarea răspunsului liber ---------------- */
P.norm = t => ' ' + A.fold(t).replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim() + ' ';
const NEG = /(?:^| )(nu|nici|fara|niciodata)(?: [a-z]+){0,2} $/;
/* caută o alternativă ca expresie întreagă; ignoră aparițiile negate („nu este nul”) */
P.has = (text, alt) => {
  const a = P.norm(alt).trim(); if (!a) return false;
  let i = -1;
  while ((i = text.indexOf(' ' + a + ' ', i + 1)) >= 0) {
    if (a.startsWith('nu ') || a.startsWith('nici ') || a.startsWith('fara ')) return true;
    const before = text.slice(Math.max(0, i - 24), i + 1);
    if (!NEG.test(before)) return true;
  }
  return false;
};
/* q: {need: [[sinonime], ...], not: [expresii care arată soluția opusă]} -> {verdict: ok|partial|ko, hit, miss} */
P.grade = (q, answer) => {
  const t = P.norm(answer || '');
  if (t.trim().length < 3) return { verdict: 'ko', hit: [], miss: q.need.map(g => g[0]), why: 'Nu ai scris un răspuns.' };
  const bad = (q.not || []).find(x => P.has(t, x));
  if (bad) return { verdict: 'ko', hit: [], miss: q.need.map(g => g[0]), why: `Răspunsul indică soluția opusă („${bad}”).` };
  const hit = [], miss = [];
  for (const g of q.need) (g.some(alt => P.has(t, alt)) ? hit : miss).push(g[0]);
  const verdict = !miss.length ? 'ok' : hit.length >= Math.ceil(q.need.length / 2) ? 'partial' : 'ko';
  return { verdict, hit, miss };
};

/* ---------------- ecranul unei spețe ---------------- */
const refLink = r => `<a href="#/act/${r.act}/a/${r.art}">${A.esc(A.actShort(r.act))}, art. ${A.idToNum(r.art)}${r.al ? ` alin. (${A.idToNum(r.al)})` : ''}</a>`;
P.mic = ta => {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition; if (!SR) return '';
  return `<button type="button" class="btn small mic" data-mic="${ta}" title="Dictează răspunsul">● Dictează</button>`;
};
P.bindMic = root => A.$$('[data-mic]', root).forEach(b => b.onclick = () => {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition; const ta = A.$('#' + b.dataset.mic, root);
  const r = new SR(); r.lang = 'ro-RO'; r.interimResults = false; b.classList.add('on'); A.micOn = true;
  r.onresult = e => { ta.value = (ta.value + ' ' + e.results[0][0].transcript).trim(); };
  r.onend = () => { b.classList.remove('on'); setTimeout(() => { A.micOn = false; }, 800); }; r.onerror = r.onend; r.start();
});
/* host: element; sp: speța; onDone({score 0..1, ok}) */
P.speta = (host, sp, onDone) => {
  host.innerHTML = `<div class="qcard speta"><div class="src">Speță · ${A.esc(sp.tip || 'litigiu civil')}${sp.m && ST.microById[sp.m] ? ' · ' + A.esc(ST.microById[sp.m].name.slice(0, 50)) : ''}</div>
    <div class="enunt">${sp.enunt.split('\n').map(p => `<p>${A.esc(p)}</p>`).join('')}</div>
    ${sp.q.map((q, i) => `<div class="sq"><label for="sa${i}"><b>${i + 1}. ${A.esc(q.q)}</b></label><textarea id="sa${i}" rows="3" placeholder="Răspunsul tău, pe scurt, cu temeiul legal"></textarea>${P.mic('sa' + i)}<div class="sfb" id="sf${i}"></div></div>`).join('')}
    <div class="mbtns"><button class="btn primary" id="sgo">Verifică răspunsurile</button></div></div>`;
  P.bindMic(host);
  let finished = false;
  const finish = left => {
    if (finished) return; finished = true; A.guardStop();
    let pts = 0;
    sp.q.forEach((q, i) => {
      const g = left ? { verdict: 'ko', why: 'Ai ieșit din aplicație: răspuns pierdut.' } : P.grade(q, A.$('#sa' + i, host).value);
      pts += g.verdict === 'ok' ? 1 : g.verdict === 'partial' ? .5 : 0;
      A.$('#sa' + i, host).disabled = true;
      A.$('#sf' + i, host).innerHTML = `<div class="feedback ${g.verdict === 'ok' ? 'ok' : g.verdict === 'partial' ? 'mid' : 'ko'}"><div><b>${g.verdict === 'ok' ? 'Corect.' : g.verdict === 'partial' ? 'Parțial corect.' : 'Greșit.'}</b> ${g.why ? A.esc(g.why) : g.miss && g.miss.length ? 'Lipsește: ' + g.miss.map(A.esc).join(', ') + '.' : ''}
        <div class="why"><b>Răspunsul model:</b> ${A.esc(q.model)}</div>${q.refs && q.refs.length ? `<div class="why">${q.refs.map(refLink).join(' · ')}</div>` : ''}</div></div>`;
    });
    const score = pts / sp.q.length;
    const rec = A.S.spete[sp.id] = A.S.spete[sp.id] || {}; const first = score >= .99 && !rec.ok; rec.last = A.today(); if (score >= .99) rec.ok = (rec.ok || 0) + 1; else rec.ko = (rec.ko || 0) + 1;
    A.studied(); A.store.save(); A.sound(score >= .99 ? 'ok' : score > 0 ? 'xp' : 'ko');
    A.$('#sgo', host).outerHTML = `<button class="btn primary" id="snext">Continuă</button>`;
    A.$('#snext', host).onclick = () => onDone({ score, ok: score >= .99, first });
  };
  A.$('#sgo', host).onclick = () => finish(false);
  A.guardStart(() => finish(true));
};
/* alegerea unei spețe: 60% din ultimele micro-secțiuni parcurse, 40% din cele mai vechi; greșelile revin mai des */
P.pickSpeta = (tip) => {
  const all = ST.unlockedSpete().filter(s => !tip || s.tip === tip); if (!all.length) return null;
  const done = Object.entries(A.S.study.micro).sort((a, b) => a[1] < b[1] ? 1 : -1).map(x => x[0]);
  const recent = new Set(done.slice(0, 3));
  const pool = Math.random() < .6 ? all.filter(s => recent.has(s.m)) : all.filter(s => !recent.has(s.m));
  const list = (pool.length ? pool : all).flatMap(s => { const r = A.S.spete[s.id] || {}; const w = (r.ko || 0) > (r.ok || 0) ? 3 : r.ok ? 1 : 2; return Array(w).fill(s); });
  return A.pick(list);
};

/* ---------------- grilele de examen permise ---------------- */
P.examPool = () => {
  const open = new Set(ST.openUnits());
  return (A.quiz.bank || []).filter(g => { const r = (g.r || [])[0]; if (!r) return false; const u = A.unitOf(r.act, r.art); return !u || open.has(u); });
};
const qHTML = (g, i, n, title) => `<div class="top"><span class="faint">${A.esc(title)} · ${i}/${n}</span><div class="bar"><i style="width:${(i - 1) / n * 100}%"></i></div><span class="timer" id="timer"></span></div>
  <div class="qcard"><div class="src">${A.esc(g.s || '')}</div><div class="q">${A.esc(g.q)}</div>
  <div class="opts">${g.opts.map((o, k) => `<button class="opt" data-i="${k}"><span class="k">${'ABCD'[k]}</span><span>${A.esc(o.t)}</span></button>`).join('')}</div><div id="fb"></div></div>`;
/* rulează o serie de grile de examen; perQ secunde fiecare; onDone(ok, n) */
P.examRun = async (root, list, title, perQ, onDone, onEach) => {
  let i = 0, ok = 0;
  const next = () => {
    if (i >= list.length) { A.guardStop(); return onDone(ok, list.length); }
    const g = list[i++]; g.opts = A.shuffle(g.o.map((t, k) => ({ t, ok: k === g.a })));
    root.innerHTML = qHTML(g, i, list.length, title);
    const t0 = Date.now(); let answered = false;
    const answer = (good, b, why) => {
      if (answered) return; answered = true; A.guardStop();
      A.$$('.opt', root).forEach((x, k) => { x.disabled = true; if (g.opts[k].ok) x.classList.add('right'); });
      if (!good && b) b.classList.add('wrong');
      A.S.quiz.answered++; if (good) { ok++; A.S.quiz.correct++; A.S.points.grile++; } A.studied();
      A.sound(good ? 'ok' : 'ko'); A.fx.combo(good); onEach && onEach(good, g);
      const r = (g.r || [])[0];
      A.$('#fb', root).innerHTML = `<div class="feedback ${good ? 'ok' : 'ko'}"><div><b>${why || (good ? 'Corect. +1 grilă' : 'Greșit.')}</b>${g.e ? `<div class="why">${A.esc(g.e)}</div>` : ''}${r ? `<div class="why">${refLink(r)}</div>` : ''}</div><button class="btn primary" id="nx">Continuă</button></div>`;
      A.$('#nx', root).onclick = next; A.store.save();
    };
    A.$$('.opt', root).forEach(b => b.onclick = () => answer(g.opts[+b.dataset.i].ok, b));
    A.guardStart(() => answer(false, null, 'Ai ieșit din aplicație: răspuns pierdut.'));
    const tick = () => { const el = A.$('#timer', root); if (!el || answered) return; const left = t0 + perQ * 1000 - Date.now(); el.textContent = Math.max(0, Math.ceil(left / 1000)) + ' s'; if (left <= 0) answer(false, null, 'Timpul a expirat.'); };
    const iv = A.every(250, () => { tick(); if (answered) clearInterval(iv); }); tick();
  };
  next();
};

/* ---------------- jocul rapid: 3 grile + 1 speță ---------------- */
A.route('joc', async (view, [mode, arg]) => {
  await A.quiz.loadBank();
  const E = A.eco, s = E.s(), pool = P.examPool(), spN = ST.unlockedSpete().length;
  if (pool.length < 3) {
    view.innerHTML = `<div class="playhome"><div class="playhero"><div class="faint">Joc rapid</div><h1>3 grile de examen și o speță</h1>
      <p class="muted">Nu sunt încă grile pentru raioanele deschise. Citește articole și revino.</p>
      <a class="btn primary" href="#/harta">Harta</a></div></div>`;
    return;
  }
  const root = document.createElement('div'); root.className = 'quiz'; view.innerHTML = ''; view.appendChild(root);
  const list = A.shuffle(pool).slice(0, 3).map(g => Object.assign({}, g));
  const pw = E.power(), mult = 1 + pw / 300;
  let money = 0, xp = 0, gok = 0;
  P.examRun(root, list, 'Joc rapid', 45, (ok) => {
    gok = ok;
    const sp = P.pickSpeta();
    if (!sp) return end(null);
    P.speta(root, sp, res => end(res));
  }, good => { if (good) { money += E.earn(150 * mult); xp += A.game.addXP(8); } });
  const end = res => {
    let spMsg = 'Nicio speță deblocată încă: parcurge micro-secțiuni ca să apară.';
    if (res) { if (res.ok) { if (res.first) A.S.points.spete++; money += E.earn(600 * mult); xp += A.game.addXP(30); spMsg = res.first ? 'Speță rezolvată pentru prima dată: +1 punct-speță.' : 'Speță rezolvată (punctul-speță se acordă doar la prima rezolvare).'; } else if (res.score > 0) { money += E.earn(250 * mult); xp += A.game.addXP(12); spMsg = 'Speță rezolvată parțial.'; } else spMsg = 'Speța nu a fost rezolvată.'; }
    const total = gok + (res && res.ok ? 1 : 0), n = 3 + (res ? 1 : 0);
    /* dosar doar dacă totul e corect (3/3 fără speță, 4/4 cu speță): simplu 63,5% · argint 20% · aur 15% · magic 1% · legendar 0,5% */
    const roll = Math.random() * 100;
    const type = total < n ? null : roll < 63.5 ? 'simplu' : roll < 83.5 ? 'argint' : roll < 98.5 ? 'aur' : roll < 99.5 ? 'magic' : 'decan';
    const got = type && E.grantChest(type, 'Joc rapid');
    A.S.quiz.farm = (A.S.quiz.farm || 0) + 1; E.quest('play', 1); if (total >= n) E.quest('perfect', 1); if (res && res.ok) E.quest('spete', 1); A.store.save(); A.game.checkStamps();
    const R = A.arena, crowns = total >= n ? 3 : total >= n - 1 ? 2 : total >= 2 ? 1 : 0;
    root.innerHTML = '';
    R.victory({ win: total >= 2, crowns, title: `${total} din ${n} corecte`, sub: `${gok}/3 grile · ${A.esc(spMsg)}<br>${type ? (got ? `Ai primit un ${E.CHESTS[type].name.toLowerCase()}.` : 'Sloturile de dosare sunt pline: deschide un dosar ca să primești altele.') : 'Fără dosar: ai nevoie de cel puțin 2 răspunsuri corecte.'}`,
      rewards: [{ ico: R.ICO.lei, n: Math.round(money), label: 'lei' }, { ico: R.ICO.xp, n: xp, label: 'XP' }, { ico: R.ICO.gr, n: gok, label: 'puncte-grilă' }].concat(type && got ? [{ ico: R.ICO.chest(type), label: E.CHESTS[type].name }] : []),
      primary: { t: 'Încă o rundă', fn: () => { if (A.arena.useEnergy()) A.render(); else A.go('#/harta'); } }, secondary: { t: 'Harta', href: '#/harta' } });
  };
});

})();
