/* Atlasul legislativ — ecrane: hartă, raion, cititor cu trimiteri, căutare, antrenament, ștampile, setări. */
'use strict';

/* ======================= HARTA ======================= */
A.bossReady = unit => A.study.bossReady(unit);
A.BOSS_MASTERY = 0.6;
const ICON = {
  lock: '<path d="M-5 -1v-3a5 5 0 0 1 10 0v3" fill="none" stroke="#fff" stroke-width="2.2"/><rect x="-7" y="-1" width="14" height="10" rx="2" fill="#fff"/>',
  swords: '<path d="M-7 -7L7 7M7 -7L-7 7" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/><path d="M-8 4l4 4M8 4l-4 4" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/>',
  flag: '<path d="M-5 9V-9M-5 -8h11l-3 4 3 4H-5" fill="#fff" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/>',
  office: '<path d="M-6 -2h12v8h-12zM-3 -2v-3h6v3" fill="none" stroke="#fff" stroke-width="2"/>',
};
A.route('harta', async view => {
  const s = A.S, eco = s.eco;
  const raionByUnit = Object.fromEntries(A.raioane.map(r => [r.unit, r]));
  const resByUnit = Object.fromEntries(A.reserved.map(r => [r.unit, r]));
  let paths = '', labels = '', marks = '';
  for (const [id, name, d] of MD_MAP.units) {
    const r = raionByUnit[id], res = resByUnit[id], lab = MD_MAP.labels[id];
    if (r) {
      const st = A.raionStats(id), col = A.disc[r.disc].color, lock = A.locked(id), big = lab[2] > 24;
      paths += lock ? `<path class="u on lockd" data-u="${id}" d="${d}" fill="url(#hatch-${r.disc})"/>`
        : `<path class="u on${A.conquered(id) ? ' conq' : ''}" data-u="${id}" d="${d}" fill="${col}" fill-opacity="${r.n ? (0.34 + 0.66 * st.mastery).toFixed(2) : .2}"/>`;
      const sub = lock ? 'blocat' : A.conquered(id) ? `${A.esc(r.short)} · cucerit` : `${A.esc(r.short)} · ${A.study.beatenCount(id)}/9`;
      labels += big ? `<text class="lab on${lock ? ' dim' : ''}" x="${lab[0]}" y="${lab[1] - 4}">${A.esc(name)}</text><text class="lab on sub${lock ? ' dim' : ''}" x="${lab[0]}" y="${lab[1] + 13}">${sub}</text>`
        : `<text class="lab on${lock ? ' dim' : ''}" x="${lab[0]}" y="${lab[1] + 5}" style="font-size:14px">${A.esc(name)}</text>`;
      const pin = (icon, bg, dy) => `<g class="pin" transform="translate(${lab[0]},${lab[1] - (big ? 36 : 26) + (dy || 0)})"><circle r="13" fill="${bg}" stroke="#fff" stroke-width="2.5"/>${icon}</g>`;
      if (lock) marks += pin(ICON.lock, '#4A5A63');
      else if (A.conquered(id)) marks += pin(ICON.flag, eco && eco.firm ? eco.firm.color : '#5A3F8F');
      else if (A.bossReady(id)) marks += `<g class="pin boss" transform="translate(${lab[0]},${lab[1] - (big ? 36 : 26)})"><circle r="14" fill="#B23A2E" stroke="#fff" stroke-width="2.5"/>${ICON.swords}</g>`;
    } else if (res) {
      paths += `<path class="u res" data-u="${id}" d="${d}"/>`;
      labels += `<text class="lab res" x="${lab[0]}" y="${lab[1]}">${A.esc(name)}</text>`;
    } else {
      paths += `<path class="u plain" data-u="${id}" d="${d}"/>`;
      if (lab[2] > 14) labels += `<text class="lab" x="${lab[0]}" y="${lab[1] + 4}" style="font-size:12px;fill:var(--ink-3)">${A.esc(name)}</text>`;
    }
  }
  if (eco && eco.started) {
    for (const b of eco.branches) { const [x, y, rr] = MD_MAP.labels[b]; marks += `<g class="pin" transform="translate(${x + 22},${y - (rr > 24 ? 36 : 26)})"><rect x="-12" y="-12" width="24" height="24" rx="5" fill="${eco.firm.color}" stroke="#fff" stroke-width="2.5"/>${ICON.office}</g>`; }
    for (const p of eco.procs) {
      const o = A.eco.originFor(p.unit).from, [x1, y1] = MD_MAP.labels[o], [x2, y2] = MD_MAP.labels[p.unit];
      marks += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${eco.firm.color}" stroke-width="3" stroke-dasharray="6 6" opacity=".7"/><circle class="car" data-p="${p.id}" r="9" fill="${((eco.fleet || []).find(f => f.id === p.car) || { paint: '#8A9399' }).paint}" stroke="#fff" stroke-width="3" cx="${x1}" cy="${y1}"/>`;
    }
  }
  const discs = [...new Set(A.raioane.map(r => r.disc))];
  const hatches = discs.map(dc => `<pattern id="hatch-${dc}" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="9" height="9" fill="var(--paper-2)"/><rect width="3.5" height="9" fill="${A.disc[dc].color}" opacity=".35"/></pattern>`).join('');
  const due = A.game.dueKeys().length, last = s.last;
  const daily = eco && eco.started && eco.daily ? eco.daily.quests : [];
  const today = s.days[A.today()] || 0;
  const ready = A.raioane.filter(r => A.bossReady(r.unit));
  const nConq = A.raioane.filter(r => A.conquered(r.unit)).length;
  view.innerHTML = `
  <div class="mappage">
    <div class="mapwrap">
      <span class="coord tl">48°29′ N · 26°37′ E</span><span class="coord br">45°28′ N · 30°10′ E</span>
      <svg class="md" viewBox="-10 -10 1020 1270" role="img" aria-label="Harta Republicii Moldova cu raioanele-discipline">
        <defs><pattern id="hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="8" height="8" fill="var(--paper-2)"/><rect width="3" height="8" fill="var(--rule)"/></pattern>${hatches}</defs>
        ${paths}${labels}${marks}
      </svg>
      <details class="legend" id="legend" ${innerWidth > 620 ? 'open' : ''}>
        <summary><h3>Legendă</h3></summary>
        ${discs.map(dc => `<div class="row"><span class="sw" style="background:${A.disc[dc].color}"></span>${A.esc(A.disc[dc].name)}</div>`).join('')}
        <div class="row"><span class="ico" style="background:#B23A2E"><svg viewBox="-14 -14 28 28">${ICON.swords}</svg></span>Bossul te așteaptă</div>
        <div class="row"><span class="ico" style="background:${eco && eco.firm ? eco.firm.color : '#5A3F8F'}"><svg viewBox="-14 -14 28 28">${ICON.flag}</svg></span>Raion cucerit</div>
        <div class="row"><span class="ico" style="background:#4A5A63"><svg viewBox="-14 -14 28 28">${ICON.lock}</svg></span>Se deschide după raionul curent</div>
        <div class="row"><span class="sw hatch"></span>Rezervat pentru alte ramuri</div>
        <div class="faint" style="font-size:12px;margin-top:6px">Culoarea mai intensă înseamnă stăpânire mai mare.</div>
        <div class="credit">${A.esc(MD_MAP.credit)}</div>
      </details>
      <div class="ticker"><span id="tick"></span></div>
    </div>
    <aside class="side">
      <a class="playbig" href="#/joc"><span class="pl">▶</span><span><b>Joacă</b><small>3 grile de examen + 1 speță · bani, XP, puncte și un dosar</small></span></a>
      <div class="quicklinks">
        <a href="#/antrenament"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l2.5 5.5L20 9.3l-4 4 1 5.7-5-2.8-5 2.8 1-5.7-4-4 5.5-.8z"/></svg><b>Antrenament</b><small>sesiuni pe teme, termene, definiții</small></a>
        <a href="#/profil"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4.5"/><path d="M12 4v2M12 18v2M4 12h2M18 12h2"/></svg><b>Ștampile</b><small>rangul, seria și activitatea ta</small></a>
      </div>
      ${(() => { const cu = A.study.current(), r = cu && A.raion(cu); if (!r) return ''; const c = A.study.activeChapter(cu), cs = c ? A.study.chapStats(c) : null; return `<section class="curr"><h3>Acum studiezi</h3><a href="#/raion/${cu}" class="resume"><span class="muted" style="font-size:13px">${A.esc(r.name)} · ${A.esc(r.short)}</span><b>Capitolul ${c.ci + 1}: ${A.esc(c.name)}</b><small>${cs.und}/${cs.n} articole înțelese · ${A.study.beatenCount(cu)}/9 mini-boși</small></a></section>`; })()}
      <section class="daily">
        <div class="muted" style="font-size:13px">Astăzi</div>
        <div class="big">${A.fmt(today)} <span style="font-size:16px;font-weight:400" class="muted">din ${s.settings.goal} XP</span></div>
        <div class="bar" style="margin-top:8px"><i style="width:${Math.min(100, today / s.settings.goal * 100)}%"></i></div>
        ${daily.length ? `<div style="margin-top:12px;display:flex;flex-direction:column;gap:6px">${daily.map(q => `<div style="display:flex;justify-content:space-between;gap:8px;font-size:13px"><span style="${q.done ? 'text-decoration:line-through;color:var(--ink-3)' : ''}">${A.esc(q.t)}</span><span class="num faint">${Math.min(q.p, q.n)}/${q.n}</span></div>`).join('')}</div>` : ''}
      </section>
      ${ready.length ? `<section class="bossready"><h3>Bossul te așteaptă</h3>${ready.map(r => `<a class="btn boss" href="#/cariera/duel/${r.unit}">${A.esc(r.boss)} · ${A.esc(r.name)}</a>`).join('')}</section>` : ''}
      ${last ? `<section><h3>Ultimul articol</h3><a class="resume" href="#/act/${last.act}/a/${last.art}"><span class="muted" style="font-size:13px">${A.esc(A.actName(last.act))}</span><b>Articolul ${A.idToNum(last.art)}</b></a></section>` : `<section><h3>Începe de aici</h3><p class="muted" style="margin:0;font-family:var(--serif)">Chișinăul este Partea generală a Codului civil. Fiecare raion are 9 capitole, fiecare cu mini-bossul lui, și un boss mare la final. Raioanele se cuceresc pe rând.</p></section>`}
      <section><h3>Repetare</h3>
        ${due ? `<a class="btn primary" href="#/antrenament/repetare/citite">Repetă ${due} ${due === 1 ? 'articol' : 'articole'} scadente</a>` : `<span class="muted" style="font-size:14px">Nicio repetare scadentă azi.</span>`}
      </section>
      <section><h3>Raioane · ${nConq}/${A.raioane.length} cucerite</h3><div class="list">
        ${A.study.order.map(u => A.raion(u)).filter(Boolean).map(r => { const lock = A.locked(r.unit), won = A.conquered(r.unit), b = A.study.beatenCount(r.unit); return `<a href="#/raion/${r.unit}" class="${lock ? 'lockd' : ''}"><span class="dot" style="background:${A.disc[r.disc].color}"></span><span><b>${A.esc(r.name)}</b>${won ? ' <span class="conq-tag">cucerit</span>' : ''}<br><small class="muted">${A.esc(r.short)} · ${lock ? 'după raionul curent' : won ? 'cucerit' : `capitolul ${Math.min(9, b + 1)} din 9`}</small></span><span class="num">${lock ? '—' : won ? '✓' : b + '/9'}</span></a>`; }).join('')}
      </div></section>
    </aside>
  </div>`;
  const tip = document.createElement('div'); tip.className = 'maptip'; tip.hidden = true; view.appendChild(tip);
  const describe = u => {
    const r = raionByUnit[u], res = resByUnit[u], name = A.unitById[u].name;
    if (r) {
      const lock = A.locked(u);
      const bossLine = lock ? 'Se deschide după ce cucerești raionul curent' : A.conquered(u) ? 'Cucerit' : A.bossReady(u) ? `Bossul ${A.esc(r.boss)} te așteaptă` : `${A.study.beatenCount(u)}/9 mini-boși învinși · bossul: ${A.esc(r.boss)}`;
      return { name, title: r.title, line: bossLine + (eco && eco.branches && eco.branches.includes(u) ? ' · filiala ta' : ''), go: true };
    }
    if (res) return { name, title: 'Rezervat: ' + A.disc[res.disc].name, line: 'Se deschide când adaugi pachetul acestei ramuri.', go: false };
    return { name, title: 'Liber', line: 'Liber pentru alte ramuri de drept.', go: false };
  };
  const touchUI = A.phone() || matchMedia('(hover: none)').matches;
  const wrap = A.$('.mapwrap', view), svg = A.$('svg.md', view);

  if (!touchUI) {
    /* calculator: indicii la survol, clic deschide raionul */
    A.$$('path.u', view).forEach(p => {
      const u = p.dataset.u;
      p.onmousemove = e => { const d = describe(u); tip.hidden = false; tip.style.left = e.clientX + 'px'; tip.style.top = e.clientY + 'px'; tip.innerHTML = `<b>${A.esc(d.name)}${d.go ? ' · ' + A.esc(d.title) : ''}</b>${d.go ? d.line : A.esc(d.title) + '<br>' + A.esc(d.line)}`; };
      p.onmouseleave = () => tip.hidden = true;
      if (raionByUnit[u]) p.onclick = () => A.go('#/raion/' + u);
    });
  } else {
    /* telefon: atingerea alege raionul, foaia de jos îl deschide; harta se mărește cu două degete */
    const base = svg.viewBox.baseVal, B = { x: base.x, y: base.y, w: base.width, h: base.height };
    let vb = { ...B };
    const setVB = () => { svg.setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.w} ${vb.h}`); wrap.classList.toggle('zoomed', vb.w < B.w * .98); };
    const clampVB = () => { vb.w = A.clamp(vb.w, B.w / 6, B.w); vb.h = vb.w * B.h / B.w; vb.x = A.clamp(vb.x, B.x, B.x + B.w - vb.w); vb.y = A.clamp(vb.y, B.y, B.y + B.h - vb.h); };
    const toSvg = (cx, cy) => { const r = svg.getBoundingClientRect(); return { x: vb.x + (cx - r.left) / r.width * vb.w, y: vb.y + (cy - r.top) / r.height * vb.h }; };
    const zoomAt = (f, cx, cy) => { const pt = toSvg(cx, cy), nw = A.clamp(vb.w / f, B.w / 6, B.w), k = nw / vb.w; vb.x = pt.x - (pt.x - vb.x) * k; vb.y = pt.y - (pt.y - vb.y) * k; vb.w = nw; vb.h = nw * B.h / B.w; clampVB(); setVB(); };

    const ctl = document.createElement('div'); ctl.className = 'mapzoom';
    ctl.innerHTML = `<button type="button" data-z="in" aria-label="Mărește harta">+</button><button type="button" data-z="out" aria-label="Micșorează harta">−</button><button type="button" data-z="reset" aria-label="Toată harta">⤢</button>`;
    wrap.appendChild(ctl);
    ctl.onclick = e => { const b = e.target.closest('[data-z]'); if (!b) return; const r = svg.getBoundingClientRect();
      if (b.dataset.z === 'reset') { vb = { ...B }; setVB(); } else zoomAt(b.dataset.z === 'in' ? 1.6 : 1 / 1.6, r.left + r.width / 2, r.top + r.height / 2); };

    const sheet = document.createElement('div'); sheet.className = 'mapsheet'; sheet.hidden = true; wrap.appendChild(sheet);
    let selEl = null;
    const select = u => {
      if (selEl) selEl.classList.remove('sel');
      selEl = A.$(`path.u[data-u="${u}"]`, view); if (selEl) selEl.classList.add('sel');
      const d = describe(u);
      sheet.innerHTML = `<b>${A.esc(d.name)}</b><small>${A.esc(d.title)}<br>${d.line}</small>
        <div class="row2">${d.go ? `<a class="btn primary" href="#/raion/${u}">Deschide raionul</a>` : ''}<button type="button" class="btn" data-x>Închide</button></div>`;
      sheet.hidden = false;
      A.$('[data-x]', sheet).onclick = () => { sheet.hidden = true; if (selEl) selEl.classList.remove('sel'); selEl = null; };
    };

    /* gesturi: un deget = atingere (sau mutare, când e mărită), două degete = mărire */
    const pts = new Map(); let start = null, moved = false, pinch0 = null;
    svg.addEventListener('pointerdown', e => {
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pts.size === 1) { start = { x: e.clientX, y: e.clientY, vb: { ...vb } }; moved = false; }
      if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch0 = { d: Math.hypot(a.x - b.x, a.y - b.y), w: vb.w }; moved = true; }
    });
    svg.addEventListener('pointermove', e => {
      if (!pts.has(e.pointerId)) return;
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pts.size === 2 && pinch0) {
        const [a, b] = [...pts.values()], d = Math.hypot(a.x - b.x, a.y - b.y);
        zoomAt(vb.w / (pinch0.w * pinch0.d / d), (a.x + b.x) / 2, (a.y + b.y) / 2);
        e.preventDefault(); return;
      }
      if (pts.size === 1 && start) {
        const dx = e.clientX - start.x, dy = e.clientY - start.y;
        if (Math.hypot(dx, dy) > 8) moved = true;
        if (moved && wrap.classList.contains('zoomed')) {
          const r = svg.getBoundingClientRect();
          vb.x = start.vb.x - dx / r.width * vb.w; vb.y = start.vb.y - dy / r.height * vb.h; clampVB(); setVB(); e.preventDefault();
        }
      }
    }, { passive: false });
    const up = e => {
      const was = pts.has(e.pointerId); pts.delete(e.pointerId);
      if (pts.size < 2) pinch0 = null;
      if (was && pts.size === 0 && !moved && e.type === 'pointerup') {
        const el = document.elementFromPoint(e.clientX, e.clientY), p = el && el.closest && el.closest('path.u');
        if (p) select(p.dataset.u);
      }
      if (pts.size === 0) start = null;
    };
    svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', up); svg.addEventListener('pointerleave', e => { if (e.pointerType !== 'mouse') up(e); });
  }
  const moveCars = () => A.$$('circle.car', view).forEach(c => {
    const p = (A.S.eco.procs || []).find(x => x.id === +c.dataset.p); if (!p) return;
    const o = A.eco.originFor(p.unit).from, [x1, y1] = MD_MAP.labels[o], [x2, y2] = MD_MAP.labels[p.unit], n = Date.now();
    let f = n < p.t1 ? (n - p.start) / (p.t1 - p.start) : n < p.t2 ? 1 : n < p.end ? 1 - (n - p.t2) / (p.end - p.t2) : 0;
    f = A.clamp(f || 0, 0, 1); c.setAttribute('cx', x1 + (x2 - x1) * f); c.setAttribute('cy', y1 + (y2 - y1) * f);
  });
  moveCars(); A.every(1000, moveCars);
  const tick = A.$('#tick', view);
  if (!A._ticker) { try { A._ticker = await A.json('data/ticker.json'); } catch (e) { A._ticker = { glume: [], fapte: [], barfe: [] }; } }
  const news = () => {
    const T = A._ticker, r = Math.random();
    const open = (T.barfe || []).filter(b => !b.r || !A.study.order || A.study.unitOpen(A.unitOf(b.r.act, b.r.art) || ''));
    let t;
    if (r < .4 && open.length) { const b = A.pick(open); t = `<span class="tk barfa">Bârfă</span>${A.esc(b.t)}${b.r ? ` <a href="#/act/${b.r.act}/a/${b.r.art}">${A.esc(A.actShort(b.r.act))}, art. ${A.idToNum(b.r.art)}</a>` : ''}`; }
    else if (r < .75 && T.glume.length) t = `<span class="tk gluma">Glumă</span>${A.esc(A.pick(T.glume))}`;
    else if (T.fapte.length) t = `<span class="tk fapt">Știai că?</span>${A.esc(A.pick(T.fapte))}`;
    else t = '';
    tick.innerHTML = t;
  };
  news(); A.every(16000, news);
});

/* ======================= RAION ======================= */
A.route('raion', async (view, [unit]) => {
  const r = A.raion(unit); if (!r) return A.go('#/harta');
  const st = A.raionStats(unit), col = A.disc[r.disc].color, eco = A.S.eco, lock = A.locked(unit);
  const rows = r.places.map(p => {
    const ix = A.index[p.act];
    const roleTxt = { capital: 'oraș reședință', suburb: 'suburbie', village: 'localitate' }[p.role] || 'localitate';
    if (!p.available) return `<tr class="place"><td><div class="pname">${A.esc(A.actName(p.act))}<small>actul nu a fost încă adăugat</small></div></td><td class="role ${p.role}"><i></i>${roleTxt}</td><td colspan="2"><span class="pending-note">Atașează PDF-ul actului ca să deblochezi localitatea.</span></td></tr>`;
    const s = A.listStats(p.act, p.arts), first = p.arts.find(a => !(A.S.arts[A.key(p.act, a)] || {}).r) || p.arts[0];
    return `<tr class="place"><td><div class="pname">${A.esc(ix.name)}${p.from ? `, art. ${A.idToNum(p.from)}–${A.idToNum(p.to)}` : ''}<small>${ix.number ? 'nr. ' + A.esc(ix.number) + ' · ' : ''}${s.n} articole în vigoare${ix.lastAmend ? ' · text la zi: ' + A.esc(ix.lastAmend.split(',')[0]) : ''}</small></div></td>
      <td class="role ${p.role}"><i></i>${roleTxt}</td>
      <td class="bars"><div class="bar read"><i style="width:${s.n ? s.read / s.n * 100 : 0}%"></i></div><div class="bar"><i style="width:${s.mastery * 100}%"></i></div><small>${s.read}/${s.n} citite · ${Math.round(s.mastery * 100)}% stăpânire</small></td>
      <td class="acts"><a class="btn small primary" href="#/act/${p.act}/a/${first}">${lock ? 'Consultă' : s.read ? 'Continuă' : 'Citește'}</a></td></tr>`;
  });
  const req = r.requires ? A.raion(r.requires) : null;
  const pct = Math.round(st.mastery * 100), need = Math.round(A.BOSS_MASTERY * 100);
  const curU = A.study.current(), curR = curU && A.raion(curU);
  const bossCard = lock
    ? `<div class="bosscard locked"><div class="bi">${A.stampSVG('blocat', 'raion', '—', '#4A5A63', -6)}</div><div><b>Raion blocat</b><p>Raioanele se cuceresc pe rând. Termină întâi ${curR ? A.esc(curR.name) + ' (' + A.esc(curR.short) + ')' : 'raionul curent'}. Textul rămâne deschis pentru consultare, dar progresul nu se numără.</p>${curR ? `<a class="btn" href="#/raion/${curU}">Mergi la ${A.esc(curR.name)}</a>` : ''}</div></div>`
    : A.conquered(unit)
      ? `<div class="bosscard won"><div class="bi">${A.stampSVG('cucerit', A.S.conq[unit], '✓', 'var(--forest)', -8)}</div><div><b>${A.esc(r.boss)} a fost învins</b><p>Raionul este al tău. Onorariile firmei sunt mai mari cu 3%${A.raioane.some(x => x.requires === unit) ? ', iar raionul următor s-a deschis' : ''}.</p><a class="btn" href="#/cariera/duel/${unit}">Revanșă de antrenament</a></div></div>`
      : `<div class="bosscard ${A.bossReady(unit) ? 'ready' : ''}"><div class="bi">${A.stampSVG('boss', r.short, '!', 'var(--seal)', -8)}</div><div><b>Bossul raionului: ${A.esc(r.boss)}</b>
          <p>${A.bossReady(unit) ? 'Toți cei 9 mini-boși au căzut. Duelul se dă pe grilele raionului.' : `Apare după ce învingi cei 9 mini-boși ai capitolelor. Acum: ${A.study.beatenCount(unit)}/9.`}</p>
          <div class="bar" style="max-width:320px;margin:6px 0 10px"><i style="width:${A.study.beatenCount(unit) / 9 * 100}%;background:var(--seal)"></i></div>
          ${A.bossReady(unit) ? `<a class="btn primary" href="#/cariera/duel/${unit}">Provoacă-l la duel</a>` : ''}</div></div>`;
  const branch = eco && eco.started && !lock ? (eco.branches.includes(unit) ? `<span class="muted" style="font-size:13px">Ai o filială aici.</span>` : `<button class="btn" id="br">Deschide filială · ${A.lei(A.eco.openBranchCost())}</button>`) : '';
  view.innerHTML = `<div class="raion">
    <div class="head" style="border-bottom-color:${col}">
      <div><a href="#/harta" class="faint" style="font-size:13px;text-decoration:none">← Harta</a><h1>${A.esc(r.name)}</h1><div class="disc">${A.esc(r.title)}</div><div class="about">${A.esc(r.about)}</div></div>
      <div class="mastery"><div class="big" style="color:${col}">${lock ? '—' : A.conquered(unit) ? '✓' : A.study.beatenCount(unit) + '/9'}</div><div class="muted" style="font-size:13px">${A.conquered(unit) ? 'raion cucerit' : 'capitole încheiate'}</div>
        <div style="margin-top:10px;display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap;align-items:center">${branch}${lock ? '' : `<a class="btn primary" href="#/antrenament/grila/raion:${unit}">Antrenament pe raion</a>`}</div></div>
    </div>
    ${bossCard}
    ${chaptersHTML(unit)}
    <h2 class="regh">Actele raionului</h2>
    <table class="register"><thead><tr><th>Localitate (act normativ)</th><th>Rol</th><th>Progres</th><th></th></tr></thead><tbody>${rows.join('')}</tbody></table>
  </div>`;
  const br = A.$('#br', view); if (br) br.onclick = () => { A.eco.openBranch(unit); A.render(); };
});

/* capitolele raionului, cu micro-secțiunile și mini-bossul fiecăruia */
function chaptersHTML(unit) {
  const cs = A.study.chapters(unit); if (!cs.length) return '';
  const cur = A.study.activeChapter(unit);
  return `<section class="chaps"><h2 class="regh">Capitolele și mini-boșii</h2>${cs.map(c => {
    const st = A.study.chapStats(c), open = A.study.chapterOpen(c), won = A.study.beaten(c.id), ready = A.study.miniReady(c), isCur = cur && cur.id === c.id && !A.conquered(unit);
    return `<details class="chap ${won ? 'won' : ready ? 'ready' : open ? '' : 'lock'}" ${isCur ? 'open' : ''}><summary><span class="cn">${c.ci + 1}</span><span class="ct"><b>${A.esc(c.name)}</b><small>Mini-boss: ${A.esc(c.boss)} · ${open ? `${st.und}/${st.n} articole înțelese` : 'blocat până învingi mini-bossul anterior'}</small></span>
      ${won ? '<span class="ok">învins</span>' : ready ? `<a class="btn small primary" href="#/cariera/mini/${c.id}">Provoacă</a>` : open ? `<span class="num">${st.microDone}/${st.micro}</span>` : '<span class="faint">blocat</span>'}</summary>
      <div class="micros">${c.micro.map(m => { const ms = A.study.microStats(m), first = m.arts.find(a => !A.study.artDone(m.act, a)) || m.arts[0]; const gN = (A.study.gByMicro[m.id] || []).length, sN = (A.study.sByMicro[m.id] || []).length;
        return `<a class="micro ${ms.done ? 'done' : ''} ${open ? '' : 'lock'}" href="#/act/${m.act}/a/${first}"><span><b>${A.esc(m.name)}</b><small>${A.esc(A.actShort(m.act))}, art. ${A.idToNum(m.arts[0])}–${A.idToNum(m.arts[m.arts.length - 1])}${gN || sN ? ` · ${gN} grile, ${sN} spețe` : ''}</small></span><span class="num">${ms.und}/${ms.n}</span><div class="bar thin"><i style="width:${ms.und / ms.n * 100}%"></i></div></a>`; }).join('')}</div></details>`; }).join('')}</section>`;
}

/* ======================= CITITORUL ======================= */
A.route('act', async (view, args) => {
  const [id, mode, x] = args;
  const act = await A.loadAct(id);
  let group = null, focus = null;
  if (mode === 'a' && x) { const f = A.findArt(act, x); if (f) { focus = f.art; group = act.nodeById[f.art.node]; } }
  if (mode === 'g' && x) {
    let n = act.nodeById[x];
    if (n && !n.arts.length) { const first = act.groups.find(g => A.nodePath(act, g.id).some(p => p.id === n.id)); n = first || n; }
    group = n;
  }
  if (!group) {
    const lastHere = A.S.last && A.S.last.act === id ? act.artById[A.S.last.art] : null;
    group = lastHere ? act.nodeById[lastHere.node] : act.groups.find(g => g.arts.some(a => !(A.S.arts[A.key(id, a)] || {}).r)) || act.groups[0];
  }
  const gi = act.groupIndex[group.id];
  // cuprins
  const depthOf = n => A.nodePath(act, n.id).length - 1;
  let toc = '';
  for (const n of act.nodes) {
    const d = depthOf(n);
    if (n.arts.length) {
      const ss = A.listStats(id, n.arts.filter(a => !act.artById[a].abrogat));
      toc += `<li class="${n.abrogat ? 'abrog' : ''}"><a href="#/act/${id}/g/${n.id}" style="--d:${d}" class="${n.id === group.id ? 'on' : ''}"><span class="t"><span class="lab">${A.esc(n.label)}</span> ${A.esc(n.name)}</span><span class="mini"><i style="width:${ss.n ? ss.read / ss.n * 100 : 0}%"></i></span></a></li>`;
    } else toc += `<li class="${n.abrogat ? 'abrog' : ''}"><div class="grp" style="--d:${d}"><b>${A.esc(n.label)}</b> ${A.esc(n.name)}</div></li>`;
  }
  const curM = A.study.microOf(id, (focus || act.artById[group.arts.find(x => !act.artById[x].abrogat) || group.arts[0]]).id), curC = curM && A.study.chapOf(curM);
  const mS = curM ? A.study.microStats(curM) : null, cS = curC ? A.study.chapStats(curC) : null;
  const path = A.nodePath(act, group.id);
  const live = group.arts.filter(a => !act.artById[a].abrogat), gs = A.listStats(id, live);
  const comm = (A.comments && A.comments[id]) || null;
  const unitHere = A.unitOf(id, (group.arts.find(x => !act.artById[x].abrogat) || group.arts[0])), rHere = A.raion(unitHere);
  const lockedArt = a => A.locked(A.unitOf(id, a.id)) || !A.study.artOpen(id, a.id);
  const anyLocked = group.arts.some(x => !act.artById[x].abrogat && lockedArt(act.artById[x]));
  const artHTML = a => {
    const k = A.key(id, a.id), rec = A.S.arts[k] || {}, dots = A.levelDots(rec), lk = !a.abrogat && lockedArt(a);
    return `<article class="art ${a.abrogat ? 'abrog' : ''} ${lk ? 'locked' : ''}" id="art-${a.id}" data-a="${a.id}">
      <div class="gut"><div class="n">Art. ${A.esc(a.num)}</div>${a.abrogat ? '' : `<div class="lvl" title="citit · înțeles · reținut · aplicat">${dots.map(d => `<i class="${d ? 'on' : ''}"></i>`).join('')}</div>`}</div>
      <div><h3>${A.esc(a.title || (a.abrogat ? 'Abrogat' : ''))}</h3>
        <div class="body">${a.blocks.map(b => A.blockHTML(b, id)).join('')}</div>
        ${comm && comm.arts && comm.arts[a.id] ? `<div class="comm">${A.esc(comm.arts[a.id])}</div>` : ''}
        ${a.abrogat || lk ? '' : `<div class="tools">
          <button class="btn read ${rec.r ? 'on' : ''}" data-act="read">${rec.r ? 'Citit' : 'Marchează citit'}</button>
          <button class="btn und ${rec.u ? 'on' : ''}" data-act="und">${rec.u ? 'Înțeles · rezumat' : 'Am înțeles'}</button>
          <button class="btn star ${rec.st ? 'on' : ''}" data-act="star" aria-label="Marcaj">★</button>
          <button class="btn" data-act="note">${rec.n ? 'Notă' : 'Adaugă notă'}</button>
          <button class="btn appl ${rec.ap ? 'on' : ''}" data-act="appl">${rec.ap ? 'Aplicat · cazul' : 'Aplicat la un caz'}</button></div>
          ${rec.sum ? `<div class="mysum"><small>Rezumatul tău</small>${A.esc(rec.sum)}</div>` : ''}
          <div class="mynote" ${rec.n ? '' : 'hidden'}><textarea placeholder="Notele tale la acest articol">${A.esc(rec.n || '')}</textarea></div>`}
      </div></article>`;
  };
  const prev = act.groups[gi - 1], next = act.groups[gi + 1];
  view.innerHTML = `<div class="reader">
    <nav class="toc" aria-label="Cuprins"><div class="acthead"><a href="#/raion/${unitHere || ''}" class="faint" style="font-size:13px;text-decoration:none">← ${A.esc(rHere ? rHere.name + ' · ' + rHere.short : 'Harta')}</a>
      <h2>${A.esc(act.meta.name)}</h2><div class="meta">${act.meta.number ? 'Nr. ' + A.esc(act.meta.number) + ' · ' : ''}${act.meta.lastAmend ? 'Text la zi: ' + A.esc(act.meta.lastAmend) : ''}</div>
      ${curM ? `<div class="curprog"><small>Micro-secțiunea curentă</small><b>${mS.und} din ${mS.n} articole înțelese</b><div class="bar"><i style="width:${mS.und / mS.n * 100}%"></i></div>
        <small>Capitolul ${curC.ci + 1}: ${A.esc(curC.name)}</small><b>${cS.microDone} din ${cS.micro} micro-secțiuni</b><div class="bar thin"><i style="width:${cS.microDone / cS.micro * 100}%"></i></div></div>` : ''}</div><ul>${toc}</ul>
      ${(act.annexes || []).filter(x => x.blocks && x.blocks.length).map(x => `<div style="padding:10px 18px"><a href="#/act/${id}/anexa/${x.id}" class="btn small">${A.esc(x.label)}</a></div>`).join('')}</nav>
    <div class="page" id="page"><div class="page-inner">
      ${mode === 'anexa' ? '' : `<div class="chaphead"><div><div class="crumb">${path.slice(0, -1).map(n => A.esc(n.label + ' ' + n.name)).join(' › ')}</div><h1>${A.esc(group.label)} ${A.esc(group.name)}</h1></div>
        <div class="chapstats">${gs.read}/${gs.n} citite în această secțiune<div class="bar read"><i style="width:${gs.n ? gs.read / gs.n * 100 : 0}%"></i></div><a class="btn small" href="#/antrenament/grila/node:${id}:${group.id}">Antrenează secțiunea</a></div></div>
      ${anyLocked ? (() => { const a0 = group.arts.find(x => !act.artById[x].abrogat && lockedArt(act.artById[x])), u = A.unitOf(id, a0), lr = A.raion(u); return A.locked(u) ? `<div class="lockbar"><b>${A.esc(lr.name)} · ${A.esc(lr.short)} nu este raionul curent.</b> Raioanele se cuceresc pe rând; textul rămâne deschis pentru consultare, dar progresul nu se numără.</div>` : `<div class="lockbar"><b>Capitol încă închis.</b> Învinge mini-bossul capitolului anterior ca să numeri progresul aici. Textul rămâne deschis pentru consultare.</div>`; })() : ''}
      ${(group.intro || []).map(t => `<p class="intro">${A.esc(t)}</p>`).join('')}
      ${comm && comm.chapters && comm.chapters[group.id] ? `<div class="comm chap"><b>Comentariu la capitol</b>${A.esc(comm.chapters[group.id])}</div>` : ''}
      ${group.arts.map(a => artHTML(act.artById[a])).join('')}
      <div class="chapnav">${prev ? `<a class="btn" href="#/act/${id}/g/${prev.id}">← ${A.esc(prev.label)} ${A.esc(prev.name).slice(0, 40)}</a>` : '<span></span>'}${next ? `<a class="btn primary" href="#/act/${id}/g/${next.id}">${A.esc(next.label)} ${A.esc(next.name).slice(0, 40)} →</a>` : ''}</div>`}
    </div></div></div>`;
  if (mode === 'anexa') {
    const anx = act.annexes.find(a => a.id === x);
    A.$('.page-inner', view).innerHTML = `<div class="chaphead"><div><div class="crumb">${A.esc(act.meta.name)}</div><h1>${A.esc(anx.label)}</h1>${anx.title ? `<div class="intro">${A.esc(anx.title)}</div>` : ''}</div></div>
      <div class="art" style="grid-template-columns:1fr"><div class="body">${anx.blocks.map(b => { const lvl = b.k === 'pct' ? Math.min(4, b.lvl) : 1; return A.blockHTML(Object.assign({}, b, { lvl, k: b.k === 'pct' ? 'pct' : b.k }), id, b.head ? 'head' : ''); }).join('')}</div></div>`;
  }
  // acțiuni pe articole
  A.$$('.art', view).forEach(el => {
    const aid = el.dataset.a; if (!aid) return;
    el.addEventListener('click', e => {
      const b = e.target.closest('[data-act]'); if (!b) return;
      const r = b.getBoundingClientRect(), at = { x: r.left + r.width / 2, y: r.top };
      const k = b.dataset.act;
      if (k === 'read' && A.game.markRead(id, aid, at)) A.eco.quest('read', 1);
      if (k === 'und') return summaryModal(aid, at, refreshArt);
      if (k === 'star') A.game.toggleStar(id, aid);
      if (k === 'note') { const box = A.$('.mynote', el); box.hidden = !box.hidden; if (!box.hidden) A.$('textarea', box).focus(); return; }
      if (k === 'appl') return caseModal(aid, refreshArt);
      refreshArt();
      if (k === 'read') A.game.checkChapter(act, group);
      function refreshArt() { const tmp = document.createElement('div'); tmp.innerHTML = artHTML(act.artById[aid]); const neu = tmp.firstElementChild; el.innerHTML = neu.innerHTML; bindNote(el); }
    });
    bindNote(el);
  });
  /* „Am înțeles”: rezumat cu cuvintele tale, minimum 100 de caractere */
  function summaryModal(aid, at, done) {
    const k = A.key(id, aid), rec = A.S.arts[k] || {}, art = act.artById[aid];
    const txt = art.blocks.filter(b => b.k !== 'note').map(b => b.t).join(' ');
    const m = A.modal(`<div class="sumbox"><h2>Ce spune art. ${A.esc(art.num)}?</h2><p>Explică esențialul cu cuvintele tale (minimum ${A.game.MIN_SUM} de caractere). Nu copia textul articolului.</p>
      <textarea id="sumt" rows="6" placeholder="De exemplu: cine, ce drept sau obligație, în ce condiții, ce excepții...">${A.esc(rec.sum || '')}</textarea><div class="cnt" id="sumc"></div><div class="why" id="sume"></div>
      <div class="mbtns"><button class="btn primary" id="sok">${rec.u ? 'Actualizează' : 'Am înțeles'}</button>${rec.u ? '<button class="btn ghost" id="sdel">Nu mai consider înțeles</button>' : ''}<button class="btn" data-close>Renunță</button></div></div>`);
    m.el.classList.add('wide');
    const ta = A.$('#sumt', m.el), cnt = A.$('#sumc', m.el);
    const upd = () => { const n = ta.value.trim().length; cnt.textContent = `${n}/${A.game.MIN_SUM} caractere`; cnt.classList.toggle('ok', n >= A.game.MIN_SUM); };
    ta.oninput = upd; upd(); ta.focus();
    A.$('#sok', m.el).onclick = () => { const err = A.game.checkSummary(ta.value, txt); if (err) { A.$('#sume', m.el).textContent = err; A.sound('warn'); return; } const first = !rec.u; A.game.markUnderstood(id, aid, ta.value, at); if (first) A.eco.quest('und', 1); m.close(); done(); };
    const del = A.$('#sdel', m.el); if (del) del.onclick = () => { A.game.unmarkUnderstood(id, aid); m.close(); done(); };
  }
  /* „Aplicat la un caz”: descrierea cazului (minimum 80 de caractere); poate fi ștearsă */
  function caseModal(aid, done) {
    const rec = A.S.arts[A.key(id, aid)] || {}, art = act.artById[aid];
    const m = A.modal(`<div class="sumbox"><h2>Aplicat la un caz</h2><p>Descrie cazul în care ai aplicat art. ${A.esc(art.num)}: situația și ce ai rezolvat cu el (minimum ${A.game.MIN_CASE} de caractere).</p>
      <textarea id="apt" rows="5" placeholder="De exemplu: clientul ... a cerut ...; am invocat articolul pentru ...">${A.esc(rec.ap && rec.ap !== '—' ? rec.ap : '')}</textarea><div class="cnt" id="apc"></div><div class="why" id="ape"></div>
      <div class="mbtns"><button class="btn primary" id="aok">Salvează</button>${rec.ap ? '<button class="btn ghost" id="adel">Șterge cazul</button>' : ''}<button class="btn" data-close>Renunță</button></div></div>`);
    m.el.classList.add('wide');
    const ta = A.$('#apt', m.el), cnt = A.$('#apc', m.el);
    const upd = () => { const n = ta.value.trim().length; cnt.textContent = `${n}/${A.game.MIN_CASE} caractere`; cnt.classList.toggle('ok', n >= A.game.MIN_CASE); };
    ta.oninput = upd; upd(); ta.focus();
    A.$('#aok', m.el).onclick = () => { if (!A.game.markApplied(id, aid, ta.value)) { A.$('#ape', m.el).textContent = `Scrie cel puțin ${A.game.MIN_CASE} de caractere despre caz.`; A.sound('warn'); return; } m.close(); done(); };
    const del = A.$('#adel', m.el); if (del) del.onclick = () => { A.game.removeApplied(id, aid); A.toast('Cazul a fost șters; recompensa a fost retrasă.'); m.close(); done(); };
  }
  function bindNote(el) { const ta = A.$('textarea', el); if (ta) ta.oninput = A.debounce(() => A.game.setNote(id, el.dataset.a, ta.value.trim()), 500); }
  A.bindRefs(view);
  if (focus) {
    const el = A.$('#art-' + CSS.escape(focus.id), view);
    if (el) { requestAnimationFrame(() => { el.scrollIntoView({ block: 'start' }); el.classList.add('flash'); }); }
  }
  A.S.last = A.S.last && A.S.last.act === id ? A.S.last : { act: id, art: (focus || act.artById[group.arts[0]]).id, t: Date.now() };
});

/* ======================= FEREASTRA DE TRIMITERE ======================= */
A.bindRefs = root => {
  if (root._refsBound) return; root._refsBound = true;
  root.addEventListener('click', e => {
    const a = e.target.closest('a.ref[data-t]'); if (!a) return;
    e.preventDefault(); e.stopPropagation();
    A.openPop(JSON.parse(a.dataset.t), a.dataset.from, a.getBoundingClientRect());
  });
};
A.closePopups = () => { A.$('#popups').innerHTML = ''; };
document.addEventListener('keydown', e => { if (e.key === 'Escape') { if (A.$('#overlay').innerHTML) { if (!A._modalEsc) A.$('#overlay').innerHTML = ''; } else A.closePopups(); } });
document.addEventListener('mousedown', e => { if (!e.target.closest('.pop') && !e.target.closest('a.ref')) A.closePopups(); });
A.openPop = async (t, from, rect) => {
  const host = A.$('#popups'); host.innerHTML = '';
  const pop = document.createElement('div'); pop.className = 'pop'; host.appendChild(pop);
  const stack = [];
  const W = Math.min(560, innerWidth - 32);
  let left = A.clamp(rect.left, 16, innerWidth - W - 16), top = rect.bottom + 8;
  const place = () => { const h = pop.offsetHeight; let tp = top; if (tp + h > innerHeight - 12) tp = Math.max(12, rect.top - h - 8); pop.style.left = left + 'px'; pop.style.top = tp + 'px'; };
  A.S.quiz.refsOpened++; A.eco.quest('refs', 1); A.store.save();
  const show = async (t, from) => {
    stack.push({ t, from });
    const r = await A.resolve(t, from);
    let body = '', foot = '', openHref = '';
    if (r.missing === 'pending') body = `<div class="missing">Trimitere la <b>${A.esc(r.label)}</b>. Actul este pe hartă, dar textul lui nu a fost încă adăugat.</div>`;
    else if (r.missing === 'external') body = `<div class="missing">Trimitere la <b>${A.esc(r.label)}</b>. Acest act nu este încă pe hartă; se va deschide aici după ce adaugi pachetul raionului lui.</div>`;
    else if (r.whole && r.act) { const ix = A.index[r.act.id]; body = `<h4>${A.esc(r.act.meta.name)}</h4><div class="body"><p>${ix.number ? 'Nr. ' + A.esc(ix.number) + '. ' : ''}${ix.n} articole în vigoare.${ix.lastAmend ? ' Ultima modificare: ' + A.esc(ix.lastAmend) + '.' : ''}</p></div>`; openHref = `#/act/${r.act.id}`; }
    else if (r.annex) { const blocks = r.hit && r.hit.size ? r.annex.blocks.filter(b => r.hit.has(b.id)) : r.annex.blocks.slice(0, 12); body = `<h4>${A.esc(r.annex.label)}${r.annex.title ? ' · ' + A.esc(r.annex.title) : ''}</h4><div class="body">${blocks.map(b => A.blockHTML(b, r.act.id, r.hit && r.hit.has(b.id) ? 'hit' : '')).join('')}</div>`; openHref = `#/act/${r.act.id}/anexa/${r.annex.id}`; }
    else if (r.range) { body = `<div class="range-list">${r.range.map(a => `<a data-art="${a.id}">Art. ${A.esc(a.num)}. ${A.esc(a.title || (a.abrogat ? 'abrogat' : ''))}</a>`).join('')}</div>`; }
    else if (r.art) {
      const art = r.art, hit = r.hit || new Set(), ctx = r.ctx || new Set();
      const partial = hit.size > 0;
      const blocks = art.blocks.filter(b => b.k !== 'note' && (!partial || hit.has(b.id) || ctx.has(b.id)));
      body = `${r.warn ? `<div class="note-old">${A.esc(r.warn)}</div>` : ''}${r.missing ? `<div class="note-old">Unitatea citată (${A.esc(r.label.split(' · ').slice(2).join(' · '))}) nu există în textul actual; afișez articolul întreg.</div>` : ''}
        <h4>Art. ${A.esc(art.num)}. ${A.esc(art.title)}</h4><div class="body">${blocks.map(b => A.blockHTML(b, r.act.id, hit.has(b.id) ? 'hit' : ctx.has(b.id) ? 'ctx' : '')).join('')}</div>
        ${partial ? `<button class="btn small ghost" id="whole">Arată tot articolul</button>` : ''}`;
      openHref = `#/act/${r.act.id}/a/${art.id}`;
    }
    pop.innerHTML = `<div class="ph">${stack.length > 1 ? '<button id="pback" aria-label="Înapoi">←</button>' : ''}<div class="crumbs"><b>${A.esc(r.label || '')}</b></div><button id="pclose" aria-label="Închide">×</button></div>
      <div class="pb">${body}</div>${openHref ? `<div class="pf"><a class="btn small primary" href="${openHref}">Deschide în cititor</a>${r.art ? `<button class="btn small" id="pread">${(A.S.arts[A.key(r.act.id, r.art.id)] || {}).r ? 'Citit' : 'Marchează citit'}</button>` : ''}</div>` : ''}`;
    A.$('#pclose', pop).onclick = A.closePopups;
    const back = A.$('#pback', pop); if (back) back.onclick = () => { stack.pop(); const p = stack.pop(); show(p.t, p.from); };
    const whole = A.$('#whole', pop); if (whole) whole.onclick = () => { A.$('.body', pop).innerHTML = r.art.blocks.map(b => A.blockHTML(b, r.act.id, r.hit.has(b.id) ? 'hit' : '')).join(''); whole.remove(); place(); };
    const pr = A.$('#pread', pop); if (pr) pr.onclick = () => { if (!(A.S.arts[A.key(r.act.id, r.art.id)] || {}).r) { const b = pr.getBoundingClientRect(); A.game.markRead(r.act.id, r.art.id, { x: b.left, y: b.top }); } pr.textContent = 'Citit'; pr.disabled = true; };
    A.$$('.range-list a', pop).forEach(a => a.onclick = () => show({ a: r.act.meta.aliases && r.act.meta.aliases[0], art: a.dataset.art }, r.act.id));
    A.$$('.pf a', pop).forEach(a => a.onclick = () => A.closePopups());
    pop.querySelector('.pb').onclick = e => { const a = e.target.closest('a.ref[data-t]'); if (!a) return; e.preventDefault(); show(JSON.parse(a.dataset.t), a.dataset.from); };
    place();
  };
  pop.style.left = left + 'px'; pop.style.top = top + 'px';
  await show(t, from);
};

/* ======================= CĂUTARE ======================= */
A.route('cautare', async (view, [q0]) => {
  view.innerHTML = `<div class="search"><h1>Căutare</h1><p class="muted">Caută în titlurile și textul tuturor actelor de pe hartă.</p>
    <input class="big" id="q" placeholder="uzucapiune, termen de apel, pensie de întreținere" value="${A.esc(q0 || '')}" autofocus>
    <div class="results" id="res"></div></div>`;
  const inp = A.$('#q', view), res = A.$('#res', view);
  const run = async () => {
    const q = A.fold(inp.value.trim());
    if (q.length < 3) { res.innerHTML = '<div class="empty">Scrie cel puțin 3 litere.</div>'; return; }
    res.innerHTML = '<div class="empty">Caut…</div>';
    await A.loadAll();
    const words = q.split(/\s+/).filter(Boolean);
    const hits = [];
    for (const act of Object.values(A.acts)) for (const a of act.articles) {
      if (a.abrogat) continue;
      const title = A.fold(a.title); let score = 0, snip = '';
      if (words.every(w => title.includes(w))) score += 10;
      for (const b of a.blocks) { const ft = A.fold(b.t); if (words.every(w => ft.includes(w))) { score += 3; if (!snip) { const i = ft.indexOf(words[0]); snip = b.t.slice(Math.max(0, i - 80), i + 160); } } }
      if (score) hits.push({ act, a, score, snip });
      if (hits.length > 600) break;
    }
    hits.sort((x, y) => y.score - x.score);
    const mark = s => { let h = A.esc(s); for (const w of words) { const f = A.fold(h); let out = '', i = 0, j; while ((j = f.indexOf(w, i)) >= 0) { out += h.slice(i, j) + '<mark>' + h.slice(j, j + w.length) + '</mark>'; i = j + w.length; } h = out + h.slice(i); } return h; };
    res.innerHTML = hits.length ? `<p class="faint">${hits.length} rezultate</p>` + hits.slice(0, 120).map(h => `<a href="#/act/${h.act.id}/a/${h.a.id}"><b>${A.esc(h.act.meta.short)}, art. ${A.esc(h.a.num)}. ${mark(h.a.title || '')}</b>${h.snip ? `<span>…${mark(h.snip)}…</span>` : ''}</a>`).join('') : '<div class="empty">Niciun rezultat. Încearcă alt cuvânt.</div>';
  };
  inp.oninput = A.debounce(run, 300);
  if (q0) run();
});

/* ======================= ANTRENAMENT ======================= */
A.route('antrenament', async (view, [mode, scope]) => {
  if (mode) {
    const cfg = {
      grila: { title: 'Grilă rapidă', n: 10 },
      repetare: { title: 'Repetare', keys: A.shuffle(A.game.dueKeys()).slice(0, 20), kinds: ['regula', 'text', 'term', 'tf', 'def'] },
      urmarire: { title: 'Urmărire', lives: 3, perQuestion: 30 },
      termene: { title: 'Sprint de termene', seconds: 60, kinds: ['term', 'tf'] },
      definitii: { title: 'Definiții', n: 10, kinds: ['def'] },
      taxa: { title: 'Taxa de stat', n: 5, mode: 'taxa' },
    }[mode];
    if (!cfg) return A.go('#/antrenament');
    if (mode === 'repetare' && !cfg.keys.length) { view.innerHTML = `<div class="quiz"><div class="empty">Nicio repetare scadentă azi. <a href="#/antrenament">Înapoi</a></div></div>`; return; }
    const opt = Object.assign({ mode, scope: scope || 'citite' }, cfg);
    if (mode === 'urmarire') opt.onDone = (res, root) => {
      const best = A.S.quiz.survivalBest; A.S.quiz.survivalBest = Math.max(best, res.ok);
      const notor = res.ok * 10; A.eco.earn(notor * 5);
      A.S.eco.notoriety = (A.S.eco.notoriety || 0) + notor; A.store.save(); A.game.checkStamps();
      root.innerHTML = `<div class="qcard summary"><div class="big">${res.ok}</div><p class="muted">răspunsuri corecte până la prinderea ta${res.ok > best ? ' · record nou' : ''}</p><p><b>+${A.fmt(notor)} notorietate</b> · +${A.fmt(res.xp)} XP</p>
        <div style="display:flex;gap:10px;justify-content:center"><a class="btn primary" href="#/antrenament/urmarire/${opt.scope}">Încă o urmărire</a><a class="btn" href="#/antrenament">Înapoi</a></div></div>`;
    };
    return A.quiz.run(view, opt);
  }
  const due = A.game.dueKeys().length;
  const opts = [['citite', 'Articolele citite'], ['tot', 'Toată legislația'], ...A.raioane.filter(r => A.raionActs(r).length).map(r => ['raion:' + r.unit, `${r.name} · ${A.disc[r.disc].name}`]), ...Object.entries(A.index).map(([id, a]) => ['act:' + id, a.name])];
  const sel = A.S.settings.scope || 'citite';
  const modes = [
    ['repetare', 'Repetare', 'Articolele scadente, la intervale tot mai mari.', due, 'M4 12a8 8 0 1 1 3 6.2M4 18v-4h4', '#2E7D5B'],
    ['grila', 'Grilă rapidă', '10 întrebări din domeniul ales.', '', 'M5 6h14M5 12h14M5 18h9', '#2B5C8A'],
    ['urmarire', 'Urmărire', 'Trei vieți, presiune crescândă, notorietate.', A.S.quiz.survivalBest ? 'record ' + A.S.quiz.survivalBest : '', 'M12 3v4M12 17v4M3 12h4M17 12h4M12 12m-4 0a4 4 0 1 0 8 0a4 4 0 1 0-8 0', '#B23A2E'],
    ['termene', 'Sprint de termene', '60 de secunde, doar termene.', Object.keys(A.S.album).length + ' în album', 'M12 7v5l3 3M12 3a9 9 0 1 0 0 18a9 9 0 0 0 0-18', '#B98A12'],
    ['definitii', 'Definiții', 'Noțiunile din articolele de definiții.', '', 'M5 4h10l4 4v12H5zM9 12h6M9 16h6', '#5A3F8F'],
    ['taxa', 'Taxa de stat', 'Calculezi taxa după anexa nr. 1.', A.S.quiz.taxOk ? A.S.quiz.taxOk + ' corecte' : '', 'M6 4h12v16H6zM9 8h6M9 12h6M9 16h3', '#1F7A74'],
  ];
  view.innerHTML = `<div class="train"><div class="head"><div><h1>Antrenament</h1><p class="muted" style="margin:6px 0 0">Fiecare răspuns corect aduce XP și onorarii; combo-urile le înmulțesc.</p></div>
    <label class="scope"><span class="muted">Din</span><select id="scope">${opts.map(([v, l]) => `<option value="${v}" ${v === sel ? 'selected' : ''}>${A.esc(l)}</option>`).join('')}</select></label></div>
    <div class="modes">${modes.map(([id, n, d, cnt, icon, col]) => `<a class="mode" data-m="${id}" href="#/antrenament/${id}/${sel}"><span class="ico" style="background:${col}1f;color:${col}"><svg viewBox="0 0 24 24"><path d="${icon}"/></svg></span><span><b>${n}</b><small>${d}</small></span><span class="cnt">${cnt}</span></a>`).join('')}</div>
    <p style="margin-top:22px"><a class="btn" href="#/cariera">Lista neagră: dueluri cu rivalii</a></p></div>`;
  A.$('#scope', view).onchange = e => { A.S.settings.scope = e.target.value; A.store.save(); A.$$('.mode', view).forEach(a => a.href = `#/antrenament/${a.dataset.m}/${e.target.value}`); };
});

/* ======================= ȘTAMPILE / PROFIL ======================= */
A.route('profil', async view => {
  const li = A.game.levelInfo(), t = A.totalStats(), s = A.S;
  const weeks = 26, start = A.addDays(A.today(), -(weeks * 7 - 1) - ((new Date().getDay() + 6) % 7));
  let heat = '';
  for (let i = 0; i < weeks * 7 + ((new Date().getDay() + 6) % 7) + 1; i++) { const d = A.addDays(start, i); const x = s.days[d] || 0; const l = s.frozen[d] && !x ? 'frz' : x >= 120 ? 'l4' : x >= 60 ? 'l3' : x >= 25 ? 'l2' : x >= 10 ? 'l1' : ''; heat += `<i class="${l}" title="${d}: ${x} XP"></i>`; }
  const weak = Object.entries(s.arts).filter(([k, r]) => (r.ko || 0) > 0).sort((a, b) => (b[1].ko - (b[1].ok || 0) / 2) - (a[1].ko - (a[1].ok || 0) / 2)).slice(0, 8);
  const starred = Object.entries(s.arts).filter(([k, r]) => r.st || r.n).slice(0, 30);
  const albumN = Object.keys(s.album).length;
  view.innerHTML = `<div class="profile">
    <div class="idcard"><div style="color:var(--stamp)">${s.brand && s.brand.stamp ? `<img class="mystamp" src="${s.brand.stamp}" alt="Ștampila ta">` : A.stampSVG('nivel ' + li.L, li.rank, String(li.L), 'var(--stamp)', -8)}</div>
      <div><h1>${A.esc(li.rank)}</h1><p class="muted" style="margin:6px 0 0">${A.fmt(li.xp)} XP în total · următorul rang: ${A.esc(A.game.nextRank(li.L))}</p>
      ${s.brand && s.brand.insignia ? `<img class="myins" src="${s.brand.insignia}" alt="Insigna ta">` : ''}
      <div class="statgrid"><div><b>${A.fmt(t.read)}</b><small>articole citite</small></div><div><b>${Math.round(t.mastery * 100)}%</b><small>stăpânire totală</small></div><div><b>${A.fmt(s.quiz.correct)}</b><small>răspunsuri corecte</small></div><div><b>${A.game.bestStreak()}</b><small>cea mai lungă serie</small></div></div></div></div>
    <section><h2 style="margin-bottom:12px">Activitate</h2><div class="heat">${heat}</div><p class="faint" style="font-size:12px">Fiecare pătrat este o zi. Albastru: zi salvată de o înghețare (două pe lună).</p></section>
    <section><h2 style="margin-bottom:16px">Ștampile · ${Object.keys(s.stamps).length}/${A.game.STAMPS.length}</h2><p class="muted" style="margin-top:-8px">Nu știi pentru ce se dau. Fiecare aduce XP și între 1.000 și 100.000 de lei; stelele arată cât de greu se obține.</p>
      <div class="stamps">${A.game.STAMPS.map(([id, n, d, top, g]) => s.stamps[id] ? `<div class="stampbox">${A.stampSVG(top, s.stamps[id], g)}<b>${A.esc(n)}</b><small>${A.esc(d)} · ${A.lei(A.game.TIER_PRIZE[A.game.TIER[id] || 1].money)}</small></div>` : `<div class="stampbox locked secret"><div class="qm">?</div><b>Ștampilă ascunsă</b><small>${'★'.repeat(A.game.TIER[id] || 1)}${'☆'.repeat(4 - (A.game.TIER[id] || 1))}</small></div>`).join('')}</div></section>
    <section><h2 style="margin-bottom:12px">Albumul termenelor · ${albumN}</h2>
      <div class="album">${Object.entries(s.album).slice(-60).reverse().map(([k, lab]) => { const [a, r] = k.split(':'); return `<a class="card-term got" href="#/act/${a}/a/${r}" style="text-decoration:none"><b>${A.esc(lab)}</b>${A.esc(A.actShort(a))}, art. ${A.idToNum(r)}</a>`; }).join('') || '<div class="card-term lock"><b>Gol deocamdată</b>Câștigă cartonașe în Sprintul de termene.</div>'}</div></section>
    ${weak.length ? `<section class="weak"><h2 style="margin-bottom:10px">Puncte slabe</h2>${weak.map(([k, r]) => { const [a, ar] = k.split(':'); return `<a href="#/act/${a}/a/${ar}"><span>${A.esc(A.actShort(a))}, art. ${A.idToNum(ar)}</span><span class="faint">${r.ko} greșeli · ${r.ok || 0} corecte</span></a>`; }).join('')}<p><a class="btn" href="#/antrenament/repetare/citite">Repetă acum</a></p></section>` : ''}
    ${starred.length ? `<section class="weak"><h2 style="margin-bottom:10px">Marcaje și note</h2>${starred.map(([k, r]) => { const [a, ar] = k.split(':'); return `<a href="#/act/${a}/a/${ar}"><span>${r.st ? '★ ' : ''}${A.esc(A.actShort(a))}, art. ${A.idToNum(ar)}</span><span class="faint">${A.esc((r.n || '').slice(0, 60))}</span></a>`; }).join('')}</section>` : ''}
  </div>`;
});

/* ======================= SETĂRI ======================= */
A.route('setari', async view => {
  const st = A.S.settings;
  view.innerHTML = `<div class="settings"><h1>Setări</h1>
    <div class="row"><div><b>Obiectivul zilnic</b><small>Câte XP vrei să aduni în fiecare zi.</small></div><select id="goal">${[30, 60, 100, 150, 250].map(g => `<option ${g === st.goal ? 'selected' : ''}>${g}</option>`).join('')}</select></div>
    <div class="row"><div><b>Sunet</b><small>Efecte scurte la XP, monede și ștampile.</small></div><select id="snd"><option value="1" ${st.sound ? 'selected' : ''}>Pornit</option><option value="0" ${!st.sound ? 'selected' : ''}>Oprit</option></select></div>
    <div class="row"><div><b>Temă</b><small>Luminoasă, întunecată sau după sistem.</small></div><select id="theme"><option value="auto">După sistem</option><option value="light">Luminoasă</option><option value="dark">Întunecată</option></select></div>
    <div class="row"><div><b>Exportă progresul</b><small>Salvează un fișier cu tot progresul tău (copie de siguranță).</small></div><button class="btn" id="exp">Exportă</button></div>
    <div class="row"><div><b>Importă progresul</b><small>Înlocuiește progresul curent cu cel dintr-un fișier exportat.</small></div><label class="btn">Alege fișierul<input type="file" id="imp" accept=".json" hidden></label></div>
    <div class="row"><div><b>Adaugă un pachet de raion</b><small>Un fișier .json generat în alt proiect (de exemplu, penal). Raionul lui se aprinde pe hartă.</small></div><label class="btn">Adaugă pachet<input type="file" id="pack" accept=".json" hidden></label></div>
    <div class="row"><div><b>Redesenează însemnele</b><small>Ștampila, insigna și sigla. Costă ${A.lei(A.eco.REDRAW_COST)}.</small></div><button class="btn" id="redraw">Redesenează</button></div>
    <div class="row" id="menurow" hidden><div><b>Meniul principal</b><small>Înapoi la ecranul de start al jocului.</small></div><button class="btn" id="tomenu">Meniu</button></div>
    <div class="row" id="quitrow" hidden><div><b>Ieșire din joc</b><small>Închide fereastra. Progresul este deja salvat.</small></div><button class="btn" id="quitapp">Ieșire</button></div>
    <div class="row danger"><div><b>Șterge tot progresul</b><small>Articolele citite, rezumatele, XP-ul, ștampilele, raioanele cucerite, trofeele, biroul și însemnele. Nu se poate anula.</small></div><button class="btn ghost" id="reset">Șterge tot</button></div>
    <p class="faint" style="font-size:12px;margin-top:24px">Textele actelor provin din fișierele proiectului tău (versiunile la zi indicate în fiecare act). ${A.esc(MD_MAP.credit)}.</p></div>`;
  A.$('#theme', view).value = st.theme;
  if (A.desktop()) {
    A.$('#menurow', view).hidden = false; A.$('#quitrow', view).hidden = false;
    A.$('#tomenu', view).onclick = async () => { await A.store.flush(); location.href = 'menu.html'; };
    A.$('#quitapp', view).onclick = async () => { await A.store.flush(); window.stratiev.quit(); };
  }
  A.$('#goal', view).onchange = e => { st.goal = +e.target.value; A.store.save(); A.hud(); };
  A.$('#snd', view).onchange = e => { st.sound = e.target.value === '1'; A.store.save(); };
  A.$('#theme', view).onchange = e => { st.theme = e.target.value; A.applyTheme(); A.store.save(); };
  A.$('#exp', view).onclick = () => { const b = new Blob([JSON.stringify(A.S, null, 1)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `atlas-progres-${A.today()}.json`; a.click(); };
  A.$('#imp', view).onchange = async e => { const f = e.target.files[0]; if (!f) return; try { const d = JSON.parse(await f.text()); if (!d.v) throw 0; A.store.data = Object.assign(A.defaultState(), d); A.eco.init(); await A.store.flush(); A.toast('Progres importat.'); A.render(); } catch (x) { A.toast('Fișierul nu este un export valid.'); } };
  A.$('#pack', view).onchange = async e => {
    const f = e.target.files[0]; if (!f) return;
    try { const txt = await f.text(); const d = JSON.parse(txt); if (d.format !== 'atlas-pack/1') throw 0;
      const r = await fetch('/api/pack?name=' + encodeURIComponent(f.name), { method: 'POST', body: txt }); if (!r.ok) throw 1;
      A.toast('Pachet adăugat. Repornesc harta.'); setTimeout(() => location.reload(), 900);
    } catch (x) { A.toast(x === 1 ? 'Pachetul poate fi adăugat doar din aplicația instalată.' : 'Fișierul nu este un pachet de raion valid.'); }
  };
  A.$('#redraw', view).onclick = () => { if (!A.S.brand) return A.toast('Desenezi însemnele când înființezi biroul.'); if (!A.eco.spend(A.eco.REDRAW_COST)) return; A.eco.brandChooser(() => { A.toast('Însemnele au fost redesenate.'); A.render(); }, true); };
  A.$('#reset', view).onclick = () => {
    const m = A.modal(`<h2>Ștergi tot progresul?</h2>
      <p>Se șterge <b>absolut tot</b>: articolele citite și rezumatele, XP-ul, nivelul, ștampilele, raioanele cucerite, mini-boșii, trofeele, grilele și spețele rezolvate, banii, echipa, flota, filialele și însemnele desenate. Jocul pornește de la zero.</p>
      <p class="faint">Dacă vrei să poți reveni, închide această fereastră și exportă mai întâi progresul.</p>
      <label class="field" style="text-align:left"><span>Scrie <b>ȘTERG TOT</b> ca să confirmi</span><input id="cnf" autocomplete="off" placeholder="ȘTERG TOT"></label>
      <div style="display:flex;gap:10px;justify-content:center;margin-top:12px"><button class="btn primary" id="yes" disabled>Șterge tot și pornește de la zero</button><button class="btn" data-close>Renunță</button></div>`);
    const inp = A.$('#cnf', m.el), yes = A.$('#yes', m.el);
    const ok = () => A.fold(inp.value).replace(/[^a-z ]/g, '').trim() === 'sterg tot';
    inp.oninput = () => { yes.disabled = !ok(); };
    inp.focus();
    yes.onclick = async () => {
      if (!ok()) return;
      try { localStorage.removeItem('atlas-state'); } catch (e) { }
      A.store.data = A.defaultState();
      A.eco.init();
      await A.store.flush();
      m.close(); A.toast('Progresul a fost șters. Începi de la zero.'); A.go('#/harta'); A.render(); A.hud();
    };
  };
});
