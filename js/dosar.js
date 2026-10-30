/* Atlasul legislativ — dosarul bossului: un litigiu în etape împotriva bossului raionului.
   Calificarea raportului, temeiul de drept, excepțiile adversarului, concluziile, verdictul. */
'use strict';
(() => {
const D = A.dosar = {};
const ST = A.study, P = () => A.play;

const refLink = r => `<a href="#/act/${r.act}/a/${r.art}">${A.esc(A.actShort(r.act))}, art. ${A.idToNum(r.art)}</a>`;
const PASS = 0.7;

/* materialele dosarului: o speță din raion (dacă există) și întrebările adversarului */
D.build = async (unit) => {
  const spete = (unit === 'decan' ? ST.unlockedSpete() : ST.unlockedSpete().filter(x => (x.m || '').startsWith(unit + '.')));
  const sp = spete.length ? A.pick(spete) : null;
  const pool = await A.quiz.pool(unit === 'decan' ? 'citite' : 'raion:' + unit);
  await A.quiz.loadBank();
  const qs = [];
  const seen = new Set();
  for (let i = 0; i < 40 && qs.length < 6; i++) {
    const q = await A.quiz.make(pool, null, .8);
    if (q && !seen.has(q.q)) { seen.add(q.q); qs.push(q); }
  }
  return { sp, qs, pool };
};

/* o întrebare cu variante, desenată în pagină (merge și pentru grile din bancă, și pentru cele generate) */
const askHTML = (q, label, hint) => `<div class="dq">
  <div class="src">${A.esc(label)}</div>
  ${hint ? `<p class="advers">${A.esc(hint)}</p>` : ''}
  <div class="q">${A.esc(q.q)}</div>${q.ctx ? `<div class="ctx">${q.ctx}</div>` : ''}
  <div class="opts ${q.long ? 'long' : ''}">${q.options.map((o, i) => `<button class="opt" data-i="${i}"><span class="k">${'ABC'[i] || 'D'}</span><span>${A.esc(o.t)}</span></button>`).join('')}</div>
  <div class="fb"></div></div>`;

const bindAsk = (host, q, done) => {
  let answered = false;
  A.$$('.opt', host).forEach(b => b.onclick = () => {
    if (answered) return; answered = true;
    const ok = !!q.options[+b.dataset.i].ok;
    A.$$('.opt', host).forEach((x, i) => { x.disabled = true; if (q.options[i].ok) x.classList.add('right'); });
    if (!ok) b.classList.add('wrong');
    A.S.quiz.answered++; if (ok) { A.S.quiz.correct++; A.S.points.grile++; }
    A.studied(); A.sound(ok ? 'ok' : 'ko'); A.guardStop();
    A.$('.fb', host).innerHTML = `<div class="feedback ${ok ? 'ok' : 'ko'}"><div><b>${ok ? 'Excepție respinsă.' : 'Excepția a fost admisă împotriva ta.'}</b>${q.explainExtra ? `<div class="why">${A.esc(q.explainExtra)}</div>` : ''}${q.src ? `<div class="why">${refLink({ act: q.src.act, art: q.src.art })}</div>` : ''}</div></div>`;
    A.store.save();
    done(ok);
  });
  A.guardStart(() => { if (!answered) { const b = A.$('.opt', host); if (b) b.click(); } });
};

/* întrebare cu răspuns liber, corectată pe concepte-cheie */
const freeHTML = (q, label) => `<div class="dq">
  <div class="src">${A.esc(label)}</div>
  <div class="q">${A.esc(q.q)}</div>
  <textarea id="dfa" rows="4" placeholder="Răspunsul tău, pe scurt, cu temeiul legal"></textarea>
  ${P().mic('dfa')}
  <div class="mbtns"><button class="btn primary" id="dfok">Depune</button></div>
  <div class="fb"></div></div>`;

const bindFree = (host, q, done) => {
  P().bindMic(host);
  let sent = false;
  const send = left => {
    if (sent) return; sent = true; A.guardStop();
    const g = left ? { verdict: 'ko', why: 'Ai ieșit din aplicație: concluziile s-au pierdut.' } : P().grade(q, A.$('#dfa', host).value);
    const pts = g.verdict === 'ok' ? 1 : g.verdict === 'partial' ? .5 : 0;
    A.$('#dfa', host).disabled = true; const ok = A.$('#dfok', host); if (ok) ok.remove();
    A.$('.fb', host).innerHTML = `<div class="feedback ${g.verdict === 'ok' ? 'ok' : g.verdict === 'partial' ? 'mid' : 'ko'}">
      <div><b>${g.verdict === 'ok' ? 'Instanța îți dă dreptate.' : g.verdict === 'partial' ? 'Parțial întemeiat.' : 'Neîntemeiat.'}</b> ${g.why ? A.esc(g.why) : g.miss && g.miss.length ? 'Lipsește: ' + g.miss.map(A.esc).join(', ') + '.' : ''}
      <div class="why"><b>Cum trebuia:</b> ${A.esc(q.model)}</div>${(q.refs || []).length ? `<div class="why">${q.refs.map(refLink).join(' · ')}</div>` : ''}</div></div>`;
    A.studied(); A.store.save();
    done(pts);
  };
  A.$('#dfok', host).onclick = () => send(false);
  A.guardStart(() => send(true));
};

/* ---------------- dosarul ---------------- */
/* opt: {unit, name, title, onWin(scor), onLose(scor), rematch} */
D.run = async (view, opt) => {
  view.innerHTML = `<div class="dosar"><div class="dhead"><h1>${A.esc(opt.title)}</h1><p class="muted">Se pregătește dosarul…</p></div></div>`;
  const mat = await D.build(opt.unit);
  const sp = mat.sp;
  const stages = [];
  if (sp) {
    stages.push({ k: 'free', w: 2, label: 'Etapa 1 · Calificarea raportului juridic', q: sp.q[0] });
    if (sp.q[1]) stages.push({ k: 'free', w: 2, label: 'Etapa 4 · Concluziile', q: sp.q[1], last: true });
  }
  const nq = sp ? 4 : 6;
  for (let i = 0; i < nq && i < mat.qs.length; i++)
    stages.push({ k: 'ask', w: 1, label: `Excepția adversarului ${i + 1}`, q: mat.qs[i], hint: EXC[i % EXC.length] });
  if (!stages.length) { view.innerHTML = `<div class="dosar"><div class="dhead"><h1>${A.esc(opt.title)}</h1><p class="muted">Nu am destul material pentru acest dosar. Mai citește din raion și revino.</p><a class="btn" href="#/raion/${opt.unit}">Înapoi</a></div></div>`; return; }
  /* ordinea: calificarea, excepțiile, concluziile */
  stages.sort((a, b) => (a.last ? 2 : a.k === 'free' ? 0 : 1) - (b.last ? 2 : b.k === 'free' ? 0 : 1));
  stages.forEach((st, i) => { if (st.k === 'ask') st.label = `Etapa ${sp ? 2 : 1} · ${st.label}`; });

  const maxP = stages.reduce((x, s) => x + s.w, 0);
  let got = 0, i = 0;
  const root = document.createElement('div'); root.className = 'dosar';
  view.innerHTML = ''; view.appendChild(root);
  const headHTML = () => `<div class="dhead"><a class="back" href="#/raion/${opt.unit === 'decan' ? '' : opt.unit}">← Înapoi</a>
    <h1>${A.esc(opt.title)}</h1>
    <div class="dprog"><span>Dosarul ${i}/${stages.length}</span><div class="bar"><i style="width:${i / stages.length * 100}%"></i></div><span>${got.toFixed(1).replace('.0', '')}/${maxP} puncte</span></div>
    ${sp ? `<details class="speta-fold" ${i <= 1 ? 'open' : ''}><summary>Starea de fapt</summary><div class="enunt">${sp.enunt.split('\n').map(t => `<p>${A.esc(t)}</p>`).join('')}</div></details>` : ''}</div>`;

  const step = () => {
    if (i >= stages.length) return verdict();
    const st = stages[i];
    root.innerHTML = headHTML() + (st.k === 'free' ? freeHTML(st.q, st.label) : askHTML(st.q, st.label, st.hint));
    const host = A.$('.dq', root);
    const after = p => {
      got += p * st.w; i++;
      const b = document.createElement('div'); b.className = 'mbtns';
      b.innerHTML = `<button class="btn primary" id="dnext">${i >= stages.length ? 'Vezi verdictul' : 'Mai departe'}</button>`;
      host.appendChild(b); A.$('#dnext', host).onclick = () => { A.$('#dnext', host).disabled = true; step(); };
    };
    if (st.k === 'free') bindFree(host, st.q, p => after(p)); else bindAsk(host, st.q, ok => after(ok ? 1 : 0));
  };
  const verdict = () => {
    A.guardStop();
    const score = got / maxP, won = score >= PASS;
    A.sound(won ? 'level' : 'ko'); if (won) A.confetti();
    root.innerHTML = headHTML() + `<div class="dq verdict ${won ? 'won' : 'lost'}">
      <div class="src">Verdictul instanței</div>
      <h2>${won ? 'Ai câștigat procesul' : 'Ai pierdut procesul'}</h2>
      <p class="muted">${got.toFixed(1).replace('.0', '')} din ${maxP} puncte (${Math.round(score * 100)}%). Pentru câștig îți trebuie ${Math.round(PASS * 100)}%.</p>
      <div id="dres"></div></div>`;
    const host = A.$('#dres', root);
    if (won) opt.onWin(score, host); else opt.onLose(score, host);
  };
  step();
};
const EXC = [
  'Adversarul ridică o excepție. Dacă o respingi, procesul merge mai departe.',
  'Partea adversă susține contrariul. Arată care este regula.',
  'Avocatul advers citează legea pe dos. Corectează-l.',
  'Instanța cere lămuriri la obiecția adversarului.',
  'Adversarul mizează pe o confuzie între instituții.',
  'Ultima obiecție înainte de concluzii.',
];
})();
