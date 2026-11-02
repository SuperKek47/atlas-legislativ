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
/* cât din raion e cucerit (0..1): capitolele învinse contează întreg, cel în lucru după articolele înțelese */
A.conqPct = u => {
  if (A.conquered(u)) return 1;
  const cs = A.study.chapters(u); if (!cs.length) return 0;
  let t = 0; for (const c of cs) { if (A.study.beaten(c.id)) { t += 1; continue; } const st = A.study.chapStats(c); t += st.n ? .85 * st.und / st.n : 0; }
  return Math.min(.99, t / cs.length);
};
/* roșu aprins (0%) → galben (50%) → verde (100%), fără trepte */
A.conqColor = p => `hsl(${Math.round(A.clamp(p, 0, 1) * 120)} 95% 55%)`;
A.route('harta', async view => {
  const s = A.S, eco = s.eco;
  const raionByUnit = Object.fromEntries(A.raioane.map(r => [r.unit, r]));
  const resByUnit = Object.fromEntries(A.reserved.map(r => [r.unit, r]));
  let paths = '', labels = '', marks = '', curOut = '';
  for (const [id, name, d] of MD_MAP.units) {
    const r = raionByUnit[id], res = resByUnit[id], lab = MD_MAP.labels[id];
    if (r) {
      const st = A.raionStats(id), col = A.disc[r.disc].color, lock = A.locked(id), big = lab[2] > 24;
      const cur = id === A.study.current(), firmCol = eco && eco.started ? eco.firm.color : '#5A3F8F';
      paths += lock ? `<path class="u on lockd" data-u="${id}" d="${d}" fill="url(#hatch-${r.disc})"/>`
        : A.conquered(id) ? `<path class="u on conq" data-u="${id}" d="${d}" fill="${firmCol}" fill-opacity=".88"/>`
        : `<path class="u on${cur ? ' cur' : ''}" data-u="${id}" d="${d}" fill="${col}" fill-opacity="${r.n ? (0.34 + 0.4 * A.conqPct(id)).toFixed(2) : .2}"${cur ? ` style="--pc:${A.conqColor(A.conqPct(id))}"` : ''}/>`;
      if (cur && !lock && !A.conquered(id)) curOut = `<path class="curline" d="${d}" style="--pc:${A.conqColor(A.conqPct(id))}"/><path class="curline glow" d="${d}" style="--pc:${A.conqColor(A.conqPct(id))}"/>`;
      const sub = lock ? 'blocat' : A.conquered(id) ? `${A.esc(r.short)} · cucerit` : `${A.esc(r.short)} · ${A.study.beatenCount(id)}/9`;
      labels += big ? `<text class="lab on${lock ? ' dim' : ''}" x="${lab[0]}" y="${lab[1] - 4}">${A.esc(name)}</text><text class="lab on sub${lock ? ' dim' : ''}" x="${lab[0]}" y="${lab[1] + 13}">${sub}</text>`
        : `<text class="lab on sm${lock ? ' dim' : ''}" x="${lab[0]}" y="${lab[1] + 5}">${A.esc(name)}</text>`;
      const pin = (icon, bg, dy) => `<g class="pin" transform="translate(${lab[0]},${lab[1] - (big ? 36 : 26) + (dy || 0)})"><g class="pi"><circle r="13" fill="${bg}" stroke="#fff" stroke-width="2.5"/>${icon}</g></g>`;
      if (lock) marks += pin(ICON.lock, '#4A5A63');
      else if (A.conquered(id)) marks += pin(ICON.flag, eco && eco.firm ? eco.firm.color : '#5A3F8F');
      else if (A.bossReady(id)) marks += `<g class="pin boss" transform="translate(${lab[0]},${lab[1] - (big ? 36 : 26)})"><g class="pi"><circle r="14" fill="#B23A2E" stroke="#fff" stroke-width="2.5"/>${ICON.swords}</g></g>`;
    } else if (res) {
      paths += `<path class="u res" data-u="${id}" d="${d}" fill="${(A.disc[res.disc] || {}).color || '#999'}" fill-opacity=".16"/>`;
      labels += `<text class="lab res" x="${lab[0]}" y="${lab[1]}">${A.esc(name)}</text>`;
    } else {
      paths += `<path class="u plain" data-u="${id}" d="${d}"/>`;
      if (lab[2] > 14) labels += `<text class="lab pl" x="${lab[0]}" y="${lab[1] + 4}">${A.esc(name)}</text>`;
    }
  }
  if (eco && eco.started) {
    for (const b of eco.branches) { const [x, y, rr] = MD_MAP.labels[b]; marks += `<g class="pin" transform="translate(${x + 22},${y - (rr > 24 ? 36 : 26)})"><g class="pi"><rect x="-12" y="-12" width="24" height="24" rx="5" fill="${eco.firm.color}" stroke="#fff" stroke-width="2.5"/>${ICON.office}</g></g>`; }
    for (const p of eco.procs) {
      const o = A.eco.originFor(p.unit).from, [x1, y1] = MD_MAP.labels[o], [x2, y2] = MD_MAP.labels[p.unit];
      marks += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${eco.firm.color}" stroke-width="3" stroke-dasharray="6 6" opacity=".7"/><circle class="car" data-p="${p.id}" r="9" fill="${((eco.fleet || []).find(f => f.id === p.car) || { paint: '#8A9399' }).paint}" stroke="#fff" stroke-width="3" cx="${x1}" cy="${y1}"/>`;
    }
  }
  const discs = [...new Set(A.raioane.map(r => r.disc))];
  const resDiscs = [...new Set(A.reserved.map(r => r.disc))].filter(d => !discs.includes(d) && A.disc[d]);
  const hatches = discs.map(dc => `<pattern id="hatch-${dc}" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="9" height="9" fill="var(--paper-2)"/><rect width="3.5" height="9" fill="${A.disc[dc].color}" opacity=".35"/></pattern>`).join('');
  const due = A.game.dueKeys().length, last = s.last;
  const daily = eco && eco.started && eco.daily ? eco.daily.quests : [];
  const today = s.days[A.today()] || 0;
  const ready = A.raioane.filter(r => A.bossReady(r.unit));
  const nConq = A.raioane.filter(r => A.conquered(r.unit)).length;
  const E = A.eco, hasEco = !!(E && E.s && E.s() && E.s().started);
  view.innerHTML = `
  <div class="mappage">
    <div class="mapwrap">
      <span class="coord tl">48°29′ N · 26°37′ E</span><span class="coord br">45°28′ N · 30°10′ E</span>
      <svg class="md" viewBox="-10 -10 1020 1270" role="img" aria-label="Harta Republicii Moldova cu raioanele-discipline">
        <defs><pattern id="hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="8" height="8" fill="var(--paper-2)"/><rect width="3" height="8" fill="var(--rule)"/></pattern>${hatches}</defs>
        ${paths}${curOut}${labels}${marks}
      </svg>
      <details class="legend" id="legend" ${innerWidth > 620 ? 'open' : ''}>
        <summary><h3>Legendă</h3></summary>
        ${discs.map(dc => `<div class="row"><span class="sw" style="background:${A.disc[dc].color}"></span>${A.esc(A.disc[dc].name)}</div>`).join('')}
        <div class="row"><span class="ico" style="background:#B23A2E"><svg viewBox="-14 -14 28 28">${ICON.swords}</svg></span>Bossul te așteaptă</div>
        <div class="row"><span class="ico" style="background:${eco && eco.firm ? eco.firm.color : '#5A3F8F'}"><svg viewBox="-14 -14 28 28">${ICON.flag}</svg></span>Raion cucerit</div>
        <div class="row"><span class="ico" style="background:#4A5A63"><svg viewBox="-14 -14 28 28">${ICON.lock}</svg></span>Se deschide după raionul curent</div>
        ${resDiscs.length ? `<div class="faint" style="font-size:12px;margin:8px 0 2px">Urmează (rezervate)</div>${resDiscs.map(dc => `<div class="row"><span class="sw" style="background:${A.disc[dc].color};opacity:.35"></span>${A.esc(A.disc[dc].name)}</div>`).join('')}` : ''}
        <div class="row"><span class="sw" style="background:linear-gradient(90deg,hsl(0 95% 55%),hsl(60 95% 55%),hsl(120 95% 55%))"></span>În cucerire: roșu 0% → verde 100%</div>
        <div class="row"><span class="sw" style="background:${eco && eco.started ? eco.firm.color : '#5A3F8F'}"></span>Cucerit: culoarea biroului</div>
        <div class="credit">${A.esc(MD_MAP.credit)}</div>
      </details>
      <div class="mapfabs">${hasEco ? E.freeHTML() : ''}</div>
    </div>
    <aside class="side">
      <div class="dock">
        <div class="enwrap">${A.arena.energyHTML()}</div>
        <button type="button" class="playbig" id="play"><b>PLAY</b><i class="shine"></i></button>
        <div class="dockslots">${hasEco ? E.dockHTML() : `<a class="cs found" href="#/firma"><b>Înființează biroul</b><small>ca să primești dosare</small></a>`}</div>
      </div>
      <section class="daily">
        <div class="muted" style="font-size:13px">Astăzi</div>
        <div class="big">${A.fmt(today)} <span style="font-size:16px;font-weight:400" class="muted">din ${s.settings.goal} XP</span></div>
        <div class="bar" style="margin-top:8px"><i style="width:${Math.min(100, today / s.settings.goal * 100)}%"></i></div>
        ${daily.length ? `<div style="margin-top:12px;display:flex;flex-direction:column;gap:6px">${daily.map(q => `<div style="display:flex;justify-content:space-between;gap:8px;font-size:13px"><span style="${q.done ? 'text-decoration:line-through;color:var(--ink-3)' : ''}">${A.esc(q.t)}</span><span class="num faint">${Math.min(q.p, q.n)}/${q.n}</span></div>`).join('')}</div>` : ''}
      </section>
      ${ready.length ? `<section class="bossready"><h3>Bossul te așteaptă</h3>${ready.map(r => `<a class="btn boss" href="#/cariera/duel/${r.unit}">${A.esc(r.boss)} · ${A.esc(r.name)}</a>`).join('')}</section>` : ''}
    </aside>
  </div>`;
  const tip = document.createElement('div'); tip.className = 'maptip'; tip.hidden = true; view.appendChild(tip);
  /* PLAY: sclipire, apoi jocul apare din estompare */
  A.$('#play', view).onclick = e => { const b = e.currentTarget; if (b.classList.contains('go')) return; if (!A.arena.useEnergy()) return; b.classList.add('go'); A.buzz([20, 40, 60]); A.sound('level'); setTimeout(() => A.fadeGo('#/joc'), 520); };
  A.every(5000, () => { const w = A.$('.enwrap', view); if (w) w.innerHTML = A.arena.energyHTML(); });
  /* rândul de dosare și butoanele rotunde de pe hartă */
  const dock = A.$('.dockslots', view);
  if (hasEco) {
    dock.onclick = e => { const b = e.target.closest('[data-cs]'); if (!b) return; const i = +b.dataset.cs; E.dockTap(i); key = E.dockKey(); dock.innerHTML = E.dockHTML(); const nb = A.$(`[data-cs="${i}"]`, dock); nb && nb.classList.add('pop'); A.hud(); };
    let key = E.dockKey();
    A.every(1000, () => {
      const k = E.dockKey();
      if (k !== key) { key = k; dock.innerHTML = E.dockHTML(); const f = A.$('.mapfabs [data-free]', view); if (f) f.outerHTML = E.freeHTML(); }
      else E.dockTimers(view);
    });
  }
  A.$('.mapfabs', view).onclick = e => {
    if (e.target.closest('[data-free]')) { const st = E.s(); const lk = E.chestsLocked(); if (lk) { A.toast(`Dosarele se deschid după etapa de începător: mai citește ${lk} ${lk === 1 ? 'articol' : 'articole'}.`); A.sound('warn'); return; } if (st.freeStock > 0) E.openChest(0, true); else A.toast(`${E.FREE_NAME}: următorul peste ${A.dur(st.freeAt - Date.now())}.`); return; }
  };
  const describe = u => {
    const r = raionByUnit[u], res = resByUnit[u], name = A.unitById[u].name;
    if (r) {
      const lock = A.locked(u);
      const bossLine = lock ? 'Se deschide după ce cucerești raionul curent' : A.conquered(u) ? 'Cucerit' : A.bossReady(u) ? `Bossul ${A.esc(r.boss)} te așteaptă` : `${A.study.beatenCount(u)}/9 mini-boși învinși · bossul: ${A.esc(r.boss)}`;
      return { name, title: r.title, line: bossLine + (eco && eco.branches && eco.branches.includes(u) ? ' · filiala ta' : ''), go: true };
    }
    if (res) return { name, title: (A.disc[res.disc] || { name: res.disc }).name + (res.title ? ' · ' + res.title : ''), line: 'Rezervat. Se deschide când adaugi pachetul acestei discipline.', go: false };
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
    /* telefon: atingerea alege raionul, foaia de jos îl deschide; harta se mută cu un deget */
    const base = svg.viewBox.baseVal, B = { x: base.x, y: base.y, w: base.width, h: base.height };
    /* cutia vizibilă are proporțiile ecranului, nu ale hărții: așa raionul curent umple tot spațiul */
    const AR = () => { const r = wrap.getBoundingClientRect(); return r.width ? r.height / r.width : B.h / B.w; };
    const wholeVB = () => { const ar = AR(); let w = B.w, h = w * ar; if (h < B.h) { h = B.h; w = h / ar; } return { x: B.x + (B.w - w) / 2, y: B.y + (B.h - h) / 2, w, h }; };
    let vb = wholeVB();
    const setVB = () => { svg.setAttribute('viewBox', `${vb.x.toFixed(1)} ${vb.y.toFixed(1)} ${vb.w.toFixed(1)} ${vb.h.toFixed(1)}`); };
    const clampVB = () => { const ar = AR(), W = wholeVB(); vb.w = A.clamp(vb.w, B.w / 7, W.w); vb.h = vb.w * ar;
      vb.x = vb.w >= B.w ? B.x + (B.w - vb.w) / 2 : A.clamp(vb.x, B.x - 40, B.x + B.w - vb.w + 40);
      vb.y = vb.h >= B.h ? B.y + (B.h - vb.h) / 2 : A.clamp(vb.y, B.y - 40, B.y + B.h - vb.h + 40); };
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

    /* harta pornește apropiată pe raionul în cucerire; un buton arată toată harta și înapoi */
    const curP = A.$('path.curline', view) || A.$(`path.u[data-u="${A.study.current()}"]`, view);
    const focusVB = () => { if (!curP) return wholeVB(); const bb = curP.getBBox(), ar = AR(), pad = 1.9;
      let w = Math.max(bb.width * pad, bb.height * pad / ar, B.w / 4); const h = w * ar;
      return { x: bb.x + bb.width / 2 - w / 2, y: bb.y + bb.height / 2 - h / 2, w, h }; };
    const ctl = document.createElement('div'); ctl.className = 'mapzoom';
    ctl.innerHTML = `<button type="button" data-z="all" aria-label="Toată harta"><svg viewBox="0 0 24 24"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg></button>`;
    wrap.appendChild(ctl);
    let whole = !curP;
    const showWhole = w => { whole = w; const from = { ...vb }; vb = w ? wholeVB() : focusVB(); clampVB(); const to = { ...vb }, t0 = performance.now();
      const step = t => { const k = Math.min(1, (t - t0) / 380), e = 1 - Math.pow(1 - k, 3); for (const q of ['x', 'y', 'w', 'h']) vb[q] = from[q] + (to[q] - from[q]) * e; setVB(); if (k < 1) requestAnimationFrame(step); else { vb = to; setVB(); } };
      requestAnimationFrame(step);
      ctl.firstElementChild.innerHTML = w ? '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/></svg>' : '<svg viewBox="0 0 24 24"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>';
      ctl.firstElementChild.setAttribute('aria-label', w ? 'Înapoi la raionul curent' : 'Toată harta'); };
    ctl.onclick = () => showWhole(!whole);
    if (curP) { vb = focusVB(); clampVB(); setVB(); } else { clampVB(); setVB(); }
    if (window.ResizeObserver) { const ro = new ResizeObserver(() => { if (!document.body.contains(wrap)) return ro.disconnect(); vb = whole ? wholeVB() : focusVB(); clampVB(); setVB(); }); ro.observe(wrap); }

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

    /* gesturi: atingere = alege raionul; tragere cu un deget = mută harta. Fără mărire cu două degete. */
    const pts = new Map(); let start = null, moved = false;
    svg.addEventListener('pointerdown', e => {
      pts.set(e.pointerId, 1);
      if (pts.size === 1) { start = { x: e.clientX, y: e.clientY, vb: { ...vb } }; moved = false; } else moved = true;
    });
    svg.addEventListener('pointermove', e => {
      if (!pts.has(e.pointerId) || pts.size !== 1 || !start) return;
      const dx = e.clientX - start.x, dy = e.clientY - start.y;
      if (Math.hypot(dx, dy) > 8) moved = true;
      if (moved) { const r = svg.getBoundingClientRect(); vb.x = start.vb.x - dx / r.width * vb.w; vb.y = start.vb.y - dy / r.height * vb.h; clampVB(); setVB(); e.preventDefault(); }
    }, { passive: false });
    const up = e => {
      const was = pts.has(e.pointerId); pts.delete(e.pointerId);
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
    const [rk, rn] = A.arena.rarity(c.ci);
    return `<details class="chap rar-${rk} ${won ? 'won' : ready ? 'ready' : open ? '' : 'lock'}" ${isCur ? 'open' : ''}><summary><span class="cn">${c.ci + 1}</span><span class="ct"><b>${A.esc(c.name)}</b><span class="mb"><span class="rar ${rk}">${rn}</span><span class="mbn">${A.esc(c.boss)}</span><span class="hearts">${'♥'.repeat(3)}</span><span class="prize">${A.lei(A.eco.miniPrize ? A.eco.miniPrize(c) : 0)}</span></span><small> ${open ? `${st.und}/${st.n} articole înțelese` : 'blocat până învingi mini-bossul anterior'}</small></span>
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
          ${A.tts.supported() ? `<button class="btn tts" data-tts="${a.id}" aria-label="Ascultă articolul">🔊 Ascultă</button>` : ''}
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
        ${(() => { const sp = A.study.sectionStats(act, group.id), pc = sp.n ? sp.p / sp.n * 100 : 0; return `<div class="chapstats secprog">
          <div class="secprog-top"><span class="secicon"><svg viewBox="0 0 24 24"><path d="M5 6h14M5 12h14M5 18h9"/></svg></span><div><small>Grile de studiu trecute</small><b>${sp.p} din ${sp.n} grile</b></div></div>
          <div class="bar mark"><i style="width:${pc}%"></i>${sp.n ? `<u class="need" style="left:${(sp.need / sp.n * 100).toFixed(1)}%" title="Minimul obligatoriu pentru mini-boss"></u>` : ''}</div>
          <small class="needlbl">Până la linia roșie (${sp.need} grile) este obligatoriu pentru mini-boss.</small>
          <div class="secprog-foot"><span class="faint">${gs.read}/${gs.n} articole citite</span><a class="btn primary small" href="#/antrenament/grila/node:${id}:${group.id}">Antrenează secțiunea</a></div></div>`; })()}
      </div>
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
  // citirea vocală a articolelor (motorul dispozitivului)
  if (A.tts.supported()) A.tts.bind(view);
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
  view.innerHTML = `<div class="search"><a class="backlink" href="#/lectura">‹ Lectură</a><h1>Căutare</h1><p class="muted">Caută în titlurile și textul tuturor actelor de pe hartă.</p>
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

/* ======================= LECTURĂ: citit, căutare, studiu ======================= */
A.route('lectura', async view => {
  const s = A.S, due = A.game.dueKeys().length, last = s.last;
  const cu = A.study.current(), r = cu && A.raion(cu);
  const c = r ? A.study.activeChapter(cu) : null, cs = c ? A.study.chapStats(c) : null;
  const nConq = A.raioane.filter(x => A.conquered(x.unit)).length;
  const list = A.study.order.map(u => A.raion(u)).filter(Boolean).map(x => { const lock = A.locked(x.unit), won = A.conquered(x.unit), b = A.study.beatenCount(x.unit), pc = Math.round(A.conqPct(x.unit) * 100);
    return `<a href="#/raion/${x.unit}" class="lr ${lock ? 'lockd' : ''} ${won ? 'won' : ''}"><span class="dot" style="background:${won && s.eco && s.eco.started ? s.eco.firm.color : A.disc[x.disc].color}"></span><span><b>${A.esc(x.name)}</b><small>${A.esc(x.short)} · ${lock ? 'se deschide după raionul curent' : won ? 'cucerit' : `capitolul ${Math.min(9, b + 1)} din 9 · ${pc}%`}</small></span><span class="num">${lock ? '🔒' : won ? '✓' : b + '/9'}</span></a>`; }).join('');
  view.innerHTML = `<div class="lectura">
    <form class="lsearch" id="lq"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5 5"/></svg><input id="q" placeholder="Caută: uzucapiune, termen de apel…" enterkeyhint="search"></form>
    ${A.arena.roadStrip()}
    ${r ? `<a class="lnow" href="#/raion/${cu}" style="--pc:${A.conqColor(A.conqPct(cu))}"><small>Acum studiezi · ${A.esc(r.name)} · ${A.esc(r.short)}</small><b>Capitolul ${c.ci + 1}: ${A.esc(c.name)}</b>
      <span class="lbar"><i style="width:${Math.round(A.conqPct(cu) * 100)}%"></i></span><small>${cs.und}/${cs.n} articole înțelese în capitol · ${A.study.beatenCount(cu)}/9 mini-boși · ${Math.round(A.conqPct(cu) * 100)}% cucerit</small><span class="go">Continuă lectura ›</span></a>` : ''}
    <div class="ltiles">
      ${last ? `<a href="#/act/${last.act}/a/${last.art}"><svg viewBox="0 0 24 24"><path d="M6 3h9l3 3v15H6z M14 3v4h4 M9 12h6 M9 16h6"/></svg><b>Ultimul articol</b><small>${A.esc(A.actShort(last.act))}, art. ${A.idToNum(last.art)}</small></a>` : ''}
      <a href="#/antrenament/repetare/citite">${due ? `<b class="nb">${due > 9 ? '9+' : due}</b>` : ''}<svg viewBox="0 0 24 24"><path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3M18 3v4h-4M6 21v-4h4"/></svg><b>Repetare</b><small>${due ? `${due} ${due === 1 ? 'articol scadent' : 'articole scadente'}` : 'nimic scadent azi'}</small></a>
      <a href="#/antrenament"><svg viewBox="0 0 24 24"><path d="M12 3l2.5 5.5L20 9.3l-4 4 1 5.7-5-2.8-5 2.8 1-5.7-4-4 5.5-.8z"/></svg><b>Antrenament</b><small>teme, termene, definiții</small></a>
    </div>
    <h2 class="lh">Raioane · ${nConq}/${A.raioane.length} cucerite</h2>
    <p class="faint lnote">Raioanele se cuceresc pe rând: următorul se deschide abia după ce l-ai cucerit integral pe cel curent.</p>
    <div class="llist">${list}</div>
  </div>`;
  A.$('#lq', view).onsubmit = e => { e.preventDefault(); const q = A.$('#q', view).value.trim(); if (q) A.go('#/cautare/' + encodeURIComponent(q)); };
});

/* ======================= CALCULATOR TAXĂ DE STAT (anexa nr. 1 LTS, pct. 1) ======================= */
A.taxBand = (v, pf) => {
  if (v <= 5000) { const m = pf ? 150 : 250, t = Math.max(v * .05, m); return { tax: t, pct: '1.1.1', how: `5% × ${A.fmt(v)} = ${A.money2(v * .05)}, dar minimum ${m} lei (${pf ? 'persoană fizică' : 'persoană juridică'})` }; }
  if (v <= 50000) return { tax: 250 + .04 * (v - 5001), pct: '1.1.2', how: `250 + 4% × (${A.fmt(v)} − 5.001)` };
  if (v <= 1500000) return { tax: 2050 + .03 * (v - 50001), pct: '1.1.3', how: `2.050 + 3% × (${A.fmt(v)} − 50.001)` };
  if (v <= 5000000) return { tax: 45550 + .02 * (v - 1500001), pct: '1.1.4', how: `45.550 + 2% × (${A.fmt(v)} − 1.500.001)` };
  if (v <= 10000000) return { tax: 115550 + .01 * (v - 5000001), pct: '1.1.5', how: `115.550 + 1% × (${A.fmt(v)} − 5.000.001)` };
  return { tax: 165550 + .005 * (v - 10000001), pct: '1.1.6', how: `165.550 + 0,5% × (${A.fmt(v)} − 10.000.001)` };
};
A.money2 = n => (Math.round(n * 100) / 100).toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
A.TAXTYPES = [
  { id: 'pat', n: 'Cerere de chemare în judecată cu caracter patrimonial', pct: '1.1', val: true },
  { id: 'partaj', n: 'Cerere de partaj (din valoarea bunurilor pretinse)', pct: '1.7', val: true },
  { id: 'gaj', n: 'Exercitarea dreptului de gaj (din valoarea bunului gajat sau a creanței)', pct: '1.10', val: true },
  { id: 'prej', n: 'Prejudiciu moral și material în acțiuni de proprietate intelectuală, onoare și demnitate sau contencios administrativ', pct: '1.12, 1.14, 1.15', val: true },
  { id: 'insp', n: 'Cerere patrimonială în insolvabilitate (fără cererile de admitere a creanțelor)', pct: '1.5', val: true },
  { id: 'div', n: 'Desfacerea căsătoriei', pct: '1.6', fixed: 500 },
  { id: 'dom', n: 'Stabilirea domiciliului copilului minor', pct: '1.8', fixed: 200 },
  { id: 'nonpat', n: 'Cerere de chemare în judecată cu caracter nepatrimonial', pct: '1.9', fixed: 250 },
  { id: 'spec', n: 'Cerere (plângere) cu procedură specială', pct: '1.11', fixed: 250 },
  { id: 'exec', n: 'Contestarea actelor și acțiunilor executorului judecătoresc', pct: '1.2', fixed: 250 },
  { id: 'susp', n: 'Cerere asociată cu suspendarea executării', pct: '1.3', fixed: 250 },
  { id: 'insol', n: 'Cerere introductivă de insolvabilitate (creditor sau debitor)', pct: '1.4', fixed: 1000 },
  { id: 'onoare', n: 'Apărarea onoarei și demnității', pct: '1.13', fixed: 250 },
  { id: 'tranz', n: 'Confirmarea tranzacției încheiate în afara procesului', pct: '1.19', fixed: 500 },
  { id: 'audio', n: 'Eliberarea înregistrării audio a ședinței', pct: '1.20', fixed: 50 },
  { id: 'arb', n: 'Hotărâri arbitrale: recunoaștere, executare, desființare', pct: '1.22', fixed: 250 },
  { id: 'apel', n: 'Cerere de apel', pct: '1.16', share: .85, from: true },
  { id: 'recurs', n: 'Cerere de recurs', pct: '1.17', share: .70, from: true },
  { id: 'revizuire', n: 'Cerere de revizuire', pct: '1.18', share: .55, from: true },
];
A.taxCalc = view => {
  view.innerHTML = `<div class="taxcalc"><a class="backlink" href="#/antrenament">‹ Antrenament</a><h1>Calculator taxă de stat</h1>
    <p class="muted">După anexa nr. 1 la Legea nr. 213/2023. Alege tipul cererii și completează câmpurile care apar.</p>
    <label class="field"><span>Tipul cererii</span><select id="tt">${A.TAXTYPES.map(t => `<option value="${t.id}">${A.esc(t.n)} · pct. ${t.pct}</option>`).join('')}</select></label>
    <label class="field" id="f-base" hidden><span>Calculezi din</span><select id="tb"><option value="taxa">Taxa achitată în prima instanță</option><option value="suma">Suma contestată (litigiu patrimonial)</option></select></label>
    <label class="field" id="f-val" hidden><span id="lv">Valoarea acțiunii (lei)</span><input id="tv" inputmode="decimal" autocomplete="off" placeholder="de exemplu 120000"></label>
    <label class="field" id="f-pf" hidden><span>Reclamantul este</span><select id="tp"><option value="pf">persoană fizică</option><option value="pj">persoană juridică</option></select></label>
    <div class="calcout" id="out" aria-live="polite"></div>
    <p class="faint" style="font-size:12px;margin-top:14px">Rezultatul nu include taxa de timbru (200 lei), care se datorează separat, în condițiile art. 2 LTS. Scutirile se verifică în anexa nr. 2.</p></div>`;
  const $ = id => A.$('#' + id, view);
  const num = x => parseFloat(String(x).replace(/\s|\./g, '').replace(',', '.'));
  const calc = () => {
    const t = A.TAXTYPES.find(x => x.id === $('tt').value), pf = $('tp').value === 'pf';
    const bySuma = t.from && $('tb').value === 'suma', needVal = t.val || bySuma;
    $('f-base').hidden = !t.from; $('f-val').hidden = !(needVal || (t.from && !bySuma)); $('f-pf').hidden = !needVal;
    $('lv').textContent = t.from ? (bySuma ? 'Suma contestată (lei)' : 'Taxa achitată în prima instanță (lei)') : 'Valoarea (lei)';
    const out = $('out');
    if (t.fixed) { out.innerHTML = `<div class="big">${A.money2(t.fixed)} lei</div><p>Taxă fixă, anexa nr. 1 LTS, pct. ${t.pct}.</p>`; return; }
    const v = num($('tv').value);
    if (!(v >= 0) || $('tv').value.trim() === '') { out.innerHTML = '<p class="muted">Introdu suma ca să vezi taxa.</p>'; return; }
    if (t.from && !bySuma) { const x = v * t.share; out.innerHTML = `<div class="big">${A.money2(x)} lei</div><p>${Math.round(t.share * 100)}% × ${A.money2(v)} lei, anexa nr. 1 LTS, pct. ${t.pct}.</p>`; return; }
    const b = A.taxBand(v, pf), x = t.from ? b.tax * t.share : b.tax;
    out.innerHTML = `<div class="big">${A.money2(x)} lei</div><p>${t.from ? `Taxa din suma contestată după pct. ${b.pct} (${A.money2(b.tax)} lei) × ${Math.round(t.share * 100)}% (pct. ${t.pct}).` : `Anexa nr. 1 LTS, pct. ${b.pct}${t.pct === '1.1' ? '' : ' (prin trimitere de la pct. ' + t.pct + ')'}.`}</p><p class="faint">${b.how}</p>`;
  };
  A.$$('select, input', view).forEach(e => { e.oninput = calc; e.onchange = calc; });
  calc();
};

/* ======================= SPEȚE (deblocate și rezolvate) ======================= */
A.spetePage = async (view, id) => {
  const ST = A.study, all = ST.bank.spete, sp = id && all.find(x => x.id === decodeURIComponent(id));
  if (sp) {
    const root = document.createElement('div'); root.className = 'quiz'; view.innerHTML = ''; view.appendChild(root);
    A.game.addXP(0);
    return A.play.speta(root, sp, res => {
      let msg = res.ok ? 'Speță rezolvată corect.' : res.score > 0 ? 'Speță rezolvată parțial.' : 'Speța nu a fost rezolvată.';
      if (res.ok) { A.game.addXP(res.first ? 30 : 10); if (res.first) { A.S.points.spete++; msg += ' +1 punct-speță (prima rezolvare).'; A.fx.fly('sp', 1, null, { delay: 300 }); } if (A.eco && A.eco.quest) A.eco.quest('spete', 1); else msg += ' Punctul-speță se acordă doar la prima rezolvare.'; A.store.save(); A.hud(); }
      root.innerHTML = `<div class="qcard summary"><div class="big">${res.ok ? '✓' : '·'}</div><p>${A.esc(msg)}</p><div style="display:flex;gap:10px;justify-content:center;margin-top:14px"><a class="btn primary" href="#/antrenament/spete">Lista de spețe</a><a class="btn" href="#/antrenament/spete/${encodeURIComponent(sp.id)}" onclick="setTimeout(()=>A.render(),0)">Din nou</a></div></div>`;
    });
  }
  const un = ST.unlockedSpete(), rec = x => A.S.spete[x.id] || {};
  const solved = all.filter(x => rec(x).ok), todo = un.filter(x => !rec(x).ok);
  const row = x => { const r = rec(x), mi = ST.microById[x.m]; return `<a class="mode sprow" href="#/antrenament/spete/${encodeURIComponent(x.id)}"><span><b>${A.esc(x.tip || 'Speță civilă')}</b><small>${A.esc(mi ? mi.name.slice(0, 80) : '')}</small></span><span class="cnt">${r.ok ? '✓ ×' + r.ok : 'de rezolvat'}</span></a>`; };
  view.innerHTML = `<div class="train"><a class="backlink" href="#/antrenament">‹ Antrenament</a><h1>Spețe</h1>
    <p class="muted">Punctul-speță se primește doar la prima rezolvare corectă a unei spețe. O poți reface oricând, fără punct.</p>
    <h2 style="margin:18px 0 8px">Rezolvate · ${solved.length}</h2><div class="modes">${solved.map(row).join('') || '<p class="muted">Nicio speță rezolvată încă.</p>'}</div>
    <h2 style="margin:22px 0 8px">Deblocate, nerezolvate · ${todo.length}</h2><div class="modes">${todo.map(row).join('') || `<p class="muted">${un.length ? 'Toate spețele deblocate sunt rezolvate.' : 'Încă nu ai nicio speță deblocată: parcurge (citește și treci grilele) o micro-secțiune.'}</p>`}</div></div>`;
};

/* ======================= ANTRENAMENT ======================= */
A.route('antrenament', async (view, [mode, scope]) => {
  if (mode === 'calculator') return A.taxCalc(view);
  if (mode === 'spete') return A.spetePage(view, scope);
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
    if (mode === 'grila' && /^node:/.test(scope || '')) {
      /* antrenament pe secțiune: 5 grile de studiu, alese la fiecare sesiune */
      const [, aid, nid] = scope.split(':'); const sact = await A.loadAct(aid);
      cfg.title = 'Secțiune'; cfg.makeGrile = () => A.study.pickSession(sact, nid, 5);
    }
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
    ['calculator', 'Calculator taxă de stat', 'Calculează taxa pentru orice cerere, după anexa nr. 1.', '', 'M6 3h12v18H6zM9 7h6M9 12h2M13 12h2M9 16h2M13 16h2', '#1F7A74'],
    ['spete', 'Spețe', 'Spețele deblocate și cele rezolvate.', Object.values(A.S.spete || {}).filter(x => x.ok).length + ' rezolvate', 'M7 3h8l4 4v14H7zM10 12h6M10 16h6', '#8A4B2A'],
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
    <div class="idcard"><div class="mystamp">${s.eco && s.eco.started ? A.brand.stamp(s.eco.firm.color, s.eco.firm.name) : `<span style="color:var(--stamp)">${A.stampSVG('nivel ' + li.L, li.rank, String(li.L), 'var(--stamp)', -8)}</span>`}</div>
      <div><h1>${A.esc(li.rank)}</h1><p class="muted" style="margin:6px 0 0">${A.fmt(li.xp)} XP în total · următorul rang: ${A.esc(A.game.nextRank(li.L))}</p>
      ${s.eco && s.eco.started ? `<span class="myins">${A.brand.insignia(s.eco.firm.color)}</span>` : ''}
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

/* ======================= UPDATE (istoricul modificărilor) ======================= */
A.CHANGELOG = [
  { v: '2 noiembrie 2026 · Cartonașe, sunete și efecte', items: [
    'Personaje ilustrate pentru fiecare rol (secretar, avocat stagiar, jurist, avocat, avocat senior, partener): în cartonașe, la angajare și în tabelul echipei.',
    'Birou: secțiune nouă „Cartonașele mele”, sub misiuni, cu filele Echipă și Boost. Cartonașele identice se strâng într-unul singur, cu numărul în colț (de exemplu ×5).',
    'Cartonașele boost (XP dublu, onorarii duble, procese mai rapide, onorarii ×10) se păstrează acum în inventar. Apeși pe ele și alegi „Folosește” (albastru, apoi galben) sau „Renunță” (roșu).',
    'Tot ce primești din dosare iese din cufăr și zboară spre bara de sus: monedele cu clinchet, punctele-grilă și punctele-speță spre romburile lor, XP spre nivel, cartonașele spre butonul Birou. Numărul de monede crește cu suma, dar are un plafon.',
    'Sunete noi, generate în aplicație: fanfară diferită pentru fiecare tip de dosar (simplu, argint, aur, magic, legendar), clinchet de monede, sunet la cartonașe, la încasarea misiunilor și la boost.',
    'Confetti la nivel nou, la o micro-secțiune terminată, la toate cele 3 misiuni ale zilei, la serii de zile, la mini-boși, la cucerirea raionului și la serii de 5, 10, 20 de răspunsuri corecte la rând.',
    'Misiuni: 15 tipuri în loc de 7, nu se repetă cu ziua sau săptămâna precedentă. Cele neîncasate la reînnoire se încasează automat. Cele săptămânale se reînnoiesc luni.',
    'Setări: volumul sunetelor și „Efecte vizuale” (Complete sau Reduse).',
    'Citirea articolelor: cuvântul citit acum este evidențiat, iar în Setări poți alege limba vocii (română sau italiană).',
    'Mesajele de sus: mai mari, colorate după tip (roșu pentru erori, verde pentru încasări, mov pentru evenimente, albastru pentru informații), stau între 4 și 8 secunde după lungime, până la 3 deodată. Le ții apăsat ca să rămână sau le atingi scurt ca să dispară. Clopoțelul și Setări → Mesaje recente arată ultimele 30.',
    'Orice încasare de bani, puncte-grilă sau puncte-speță, din orice loc (consultații, procese, PLAY, antrenament, mini-boși, filiale), pornește acum monedele sau rombul spre bara de sus, cu clinchet.',
    'Birou, De încasat: când filialele sunt oprite (nu ai studiat de 30 de minute), vezi de la ce oră și cât ai pierdut. Când studiezi din nou, primești un mesaj cu suma pierdută.',
    'Harta: Ungheni va fi Dreptul afacerilor, iar Cimișlia Insolvența (în locul Avocaturii și Filosofiei dreptului).',
    'Runda PLAY: testul e trecut de la 3 răspunsuri corecte; dosarul se primește doar la câștig complet (3 coroane). Dosarele din celelalte surse (nivel, misiuni, CNAJGS, Calea Atlasului) rămân.',
  ] },
  { v: '2 noiembrie 2026 · Calea Atlasului pe raioane', items: [
    'Fiecare raion are acum propria Cale a Atlasului (Chișinău, Ialoveni, Strășeni, Criuleni, Orhei, Telenești, Rezina, Hîncești, Leova, Călărași, Anenii Noi, Căușeni, Nisporeni, Ștefan Vodă). Treci de la un raion la altul din chip-urile de sus.',
    'Calea are 12 trepte, calculate din numărul de articole al raionului, și se urcă de jos în sus, până la marele premiu din vârf.',
    'Premiile cresc cu etapa: cu cât raionul vine mai târziu în joc și are mai multe articole, cu atât banii, punctele, cartonașele și buff-urile sunt mai mari.',
    'Noutăți: plic sigilat cu surpriză, cartonașe de angajați potrivite etapei, buff-uri XP dublu sau onorarii duble, nitro, o vopsea nouă pentru mașini și Medalia raionului (+2% onorarii pentru totdeauna) la marele premiu, împreună cu un dosar legendar.',
    'Progresul vechi al căii globale a fost înlocuit de căile pe raioane.',
  ] },
  { v: '2 noiembrie 2026 · Calea Atlasului', items: [
    'Dosarele primite de pe Calea Atlasului se deschid imediat la apăsarea „ia”, fără slot, fără așteptare și fără puncte-speță.',
  ] },
  { v: '1 noiembrie 2026 · deschidere cu puncte-speță, spețe, calculator', items: [
    'Dosarele: apeși pe un dosar închis sau în curs de deblocare și alegi „Deschide cu puncte-speță” (simplu 1, argint 2, aur 3, magic 4, legendar 5) sau „Așteaptă”. Dosarul gata de deschis se deschide gratuit.',
    'Testul de 15 grile pentru deschiderea rapidă a fost scos complet.',
    'Punctul-speță se primește doar la prima rezolvare corectă a unei spețe.',
    'Antrenament › Spețe: lista spețelor rezolvate și a celor deblocate, nerezolvate; le poți rezolva sau reface de acolo.',
    'Antrenament › Calculator taxă de stat: calculezi taxa după anexa nr. 1 pentru orice tip de cerere, inclusiv apel, recurs și revizuire.',
  ] },
  { v: '1 noiembrie 2026 · dosare și interfață', items: [
    'Dosarele se primesc acum din jocul rapid (PLAY), doar cu toate răspunsurile corecte (3/3 la grile, 4/4 dacă ai și speță): simplu 63,5%, argint 20%, aur 15%, magic 1%, legendar 0,5%. Au rămas premiile speciale (mini-boși, serii de zile, misiuni, magazin).',
    'Bara de sus (telefon): doar cercul nivelului; apasă-l ca să vezi XP-ul (de exemplu 143/1.430 XP). Romburile de puncte arată acum corect denumirea la apăsare.',
    'Meniul Birou: butoanele de îmbunătățire și concediere nu mai sunt alungite; angajații apar ca fișe.',
    'Lectură: antetul secțiunii nu mai iese din ecran, iar bara de grile are o linie roșie până la care trebuie obligatoriu trecute grile pentru mini-boss.',
  ] },
  { v: '1 noiembrie 2026 · puncte-speță', items: [
    'Costul în puncte-speță pe tip de dosar: simplu 1, argint 2, aur 3, magic 4, legendar 5. Se plătește la deschiderea imediată (vezi intrarea de mai sus), nu la deschiderea normală.',
    'Două tipuri noi de dosare: Dosar magic (violet) și Dosar legendar (portocaliu, fostul Dosar al Decanului). Magicul se primește la mini-bossul ultimului capitol, la seria de 14 zile și pe Calea Atlasului; legendarul, la cucerirea unui raion.',
    'Magazinul zilei: în fiecare zi are un dosar rar de cumpărat cu puncte-speță (magic 6, legendar 12).',
    'Îmbunătățirea angajaților: avocații seniori și partenerii cer puncte-speță, la fel orice angajat de la nivelul 4 în sus.',
  ] },
  { v: '1 noiembrie 2026', items: [
    'Grile de studiu: 3364 de grile și 417 spețe încărcate pentru 13 raioane civile (Chișinău, Anenii Noi, Căușeni, Criuleni, Hîncești, Ialoveni, Leova, Nisporeni, Orhei, Rezina, Ștefan Vodă, Strășeni, Telenești).',
    'Raioanele noi Nisporeni (312 grile, 39 spețe) și Ștefan Vodă (425 grile, 40 spețe, capitole despre executarea sancțiunilor din Codul de executare) sunt acum în joc.',
    'Antrenament pe secțiune: fiecare sesiune are 5 grile, diferite la fiecare reluare; poți repeta sesiunile oricâte ori.',
    'Progres la grile: sub titlul secțiunii vezi „x din N grile” trecute. O grilă se socotește trecută dacă ai răspuns corect, indiferent de câte încercări ai avut.',
    'Mini-boss: pentru fiecare micro-secțiune trebuie trecute min(10, numărul grilelor ei) grile, pe lângă citirea și înțelegerea articolelor. O micro-secțiune cu 6 grile cere toate cele 6.',
    'Antetul secțiunii din Lectură a fost refăcut: card cu iconiță, progres în grile, articole citite și butonul „Antrenează secțiunea”.',
    'Bara de sus: puncte-grilă (romb smarald) și puncte-speță (romb auriu), vizibile pe toate paginile. Apasă pe un romb ca să vezi denumirea lui.',
    'Secțiune nouă în Setări: Update (această listă).',
  ] },
];
A.route('update', async view => {
  view.innerHTML = `<div class="settings"><a class="backlink" href="#/setari">‹ Setări</a><h1>Update</h1>
    ${A.CHANGELOG.map(u => `<div class="row" style="display:block"><b>${A.esc(u.v)}</b><ul style="margin:8px 0 0 18px;padding:0;line-height:1.55">${u.items.map(i => `<li>${A.esc(i)}</li>`).join('')}</ul></div>`).join('')}</div>`;
});

/* ======================= SETĂRI ======================= */
A.route('setari', async view => {
  const st = A.S.settings;
  view.innerHTML = `<div class="settings"><a class="backlink" href="#/firma">‹ Biroul</a><h1>Setări</h1>
    <div class="row"><div><b>Obiectivul zilnic</b><small>Câte XP vrei să aduni în fiecare zi.</small></div><select id="goal">${[30, 60, 100, 150, 250].map(g => `<option ${g === st.goal ? 'selected' : ''}>${g}</option>`).join('')}</select></div>
    <div class="row"><div><b>Sunet</b><small>Efecte scurte la XP, monede și ștampile.</small></div><select id="snd"><option value="1" ${st.sound ? 'selected' : ''}>Pornit</option><option value="0" ${!st.sound ? 'selected' : ''}>Oprit</option></select></div>
    ${A.tts.supported() ? `<div class="row"><div><b>Limba vocii</b><small>Română pentru articole. Italiana e pentru vocile italiene instalate pe dispozitiv.</small></div><select id="ttsl"><option value="ro" ${(st.ttsLang || "ro") === "ro" ? "selected" : ""}>Română</option><option value="it" ${st.ttsLang === "it" ? "selected" : ""}>Italiană</option></select></div>` : ""}
    <div class="row"><div><b>Viteza vocii</b><small>Pentru citirea articolelor (butonul 🔊).</small></div><select id="ttsr">${[[.5, '×0,5'], [.75, '×0,75'], [1, '×1'], [1.25, '×1,25'], [1.5, '×1,5'], [2, '×2']].map(([v, n]) => `<option value="${v}" ${Math.abs((st.ttsRate || 1) - v) < .01 ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
    ${A.tts.supported() ? `<div class="row"><div><b>Vocea</b><small>Vocile românești instalate pe dispozitiv. Pe iPhone: Setări → Accesibilitate → Conținut rostit → Voci.</small></div><select id="ttsv">${A.tts.voices().map(v => `<option value="${A.esc(v.voiceURI)}" ${st.ttsVoice === v.voiceURI ? 'selected' : ''}>${A.esc(v.name)}</option>`).join('') || '<option value="">Nu există voci românești</option>'}</select></div>` : ''}
    <div class="row"><div><b>Volum</b><small>Cât de tare sunt sunetele jocului.</small></div><select id="vol">${[[.3, 'Mic'], [.6, 'Mediu'], [.8, 'Normal'], [1, 'Maxim']].map(([v, n]) => `<option value="${v}" ${Math.abs((st.volume == null ? .8 : st.volume) - v) < .05 ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
    <div class="row"><div><b>Efecte vizuale</b><small>Confetti, monede și cartonașe care zboară spre bara de sus. „Reduse” le oprește.</small></div><select id="fxs"><option value="1" ${st.fx !== false ? 'selected' : ''}>Complete</option><option value="0" ${st.fx === false ? 'selected' : ''}>Reduse</option></select></div>
    <div class="row"><div><b>Vibrații</b><small>Vibrație scurtă la dosare, victorii și nivel nou, pe telefoanele care o permit. iPhone nu permite vibrații aplicațiilor web.</small></div><select id="vib"><option value="1" ${st.vib !== false ? 'selected' : ''}>Pornite</option><option value="0" ${st.vib === false ? 'selected' : ''}>Oprite</option></select></div>
    <div class="row"><div><b>Temă</b><small>Luminoasă, întunecată sau după sistem.</small></div><select id="theme"><option value="auto">După sistem</option><option value="light">Luminoasă</option><option value="dark">Întunecată</option></select></div>
    <div class="row"><div><b>Mesaje recente</b><small>Ultimele 30 de mesaje de pe ecran, ca să recitești ce ai ratat.</small></div><button class="btn" id="notifs">Vezi</button></div>
    <div class="row"><div><b>Update</b><small>Ce s-a adăugat și ce s-a schimbat în aplicație, pe versiuni.</small></div><a class="btn" href="#/update">Vezi</a></div>
    <div class="row"><div><b>Exportă progresul</b><small>Salvează un fișier cu tot progresul tău (copie de siguranță).</small></div><button class="btn" id="exp">Exportă</button></div>
    <div class="row"><div><b>Importă progresul</b><small>Înlocuiește progresul curent cu cel dintr-un fișier exportat.</small></div><label class="btn">Alege fișierul<input type="file" id="imp" accept=".json" hidden></label></div>
    <div class="row"><div><b>Adaugă un pachet de raion</b><small>Un fișier .json generat în alt proiect (de exemplu, penal). Raionul lui se aprinde pe hartă.</small></div><label class="btn">Adaugă pachet<input type="file" id="pack" accept=".json" hidden></label></div>
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
  A.$('#snd', view).onchange = e => { st.sound = e.target.value === '1'; A.store.save(); A.sound('ok'); };
  A.$('#notifs', view).onclick = () => A.fx.notifs();
  const tl = A.$('#ttsl', view); if (tl) tl.onchange = e => { st.ttsLang = e.target.value; st.ttsVoice = ''; A.store.save(); A.render(); };
  A.$('#ttsr', view).onchange = e => { st.ttsRate = +e.target.value; A.store.save(); };
  const tv = A.$('#ttsv', view); if (tv) tv.onchange = e => { st.ttsVoice = e.target.value; A.store.save(); };
  A.$('#vol', view).onchange = e => { st.volume = +e.target.value; A.store.save(); A.sound('claim'); };
  A.$('#fxs', view).onchange = e => { st.fx = e.target.value === '1'; A.store.save(); if (st.fx) A.fx.confetti('small'); };
  A.$('#vib', view).onchange = e => { st.vib = e.target.value === '1'; A.store.save(); A.buzz(30); };
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
