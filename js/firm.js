/* Atlasul legislativ — ecranele biroului: înființare cu însemne desenate, prezentare, echipă, consultații,
   instanță, garaj cu flotă, mini-boși și bossii raioanelor. */
'use strict';
(() => {
const E = A.eco, ST = A.study;

/* ---------------- piese comune ---------------- */
const stars = n => `<span class="stars">${'★'.repeat(n)}<span>${'★'.repeat(3 - n)}</span></span>`;
const nameOf = m => m.me ? 'Tu' : m.name;
const roleName = m => `${nameOf(m)} · ${E.ROLES[m.role].name.toLowerCase()}`;
const tabs = cur => `<nav class="ftabs">${[['', 'Biroul'], ['echipa', 'Echipa'], ['consultatii', 'Consultații'], ['instanta', 'Instanța']].map(([k, n]) => `<a href="#/firma${k ? '/' + k : ''}" class="${cur === k ? 'on' : ''}">${n}${badge(k)}</a>`).join('')}<a href="#/garaj" class="${cur === 'garaj' ? 'on' : ''}">Garajul</a><a href="#/cariera" class="${cur === 'cariera' ? 'on' : ''}">Bossii</a><a href="#/profil" class="${cur === 'profil' ? 'on' : ''}">Ștampile</a></nav>`;
const badge = k => { const s = E.s(), n = Date.now(); let c = 0; if (k === 'consultatii') c = s.consults.filter(x => x.end <= n).length; if (k === 'instanta') c = s.procs.filter(x => x.end <= n).length; return c ? `<b class="bdg">${c}</b>` : ''; };
const logo = () => `<span class="flogo">${A.brand.logo()}</span>`;
const GEAR = '<a class="gear" href="#/setari" aria-label="Setări"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10.3 2h3.4l.5 2.6c.7.2 1.3.5 1.9.9l2.4-1.2 2.4 2.4-1.2 2.4c.4.6.7 1.2.9 1.9l2.6.5v3.4l-2.6.5c-.2.7-.5 1.3-.9 1.9l1.2 2.4-2.4 2.4-2.4-1.2c-.6.4-1.2.7-1.9.9l-.5 2.6h-3.4l-.5-2.6c-.7-.2-1.3-.5-1.9-.9l-2.4 1.2-2.4-2.4 1.2-2.4c-.4-.6-.7-1.2-.9-1.9L1 13.7v-3.4l2.6-.5c.2-.7.5-1.3.9-1.9L3.3 5.5l2.4-2.4 2.4 1.2c.6-.4 1.2-.7 1.9-.9z"/><circle cx="12" cy="12" r="3.6"/></svg></a>';
A.GEAR = GEAR;
const head = (title, sub) => { const s = E.s(); return `<div class="fhead" style="--firm:${s.firm.color}">${GEAR}<div class="fh1">${logo()}<div><div class="faint" style="font-size:13px">${A.esc(s.firm.name)}</div><h1>${title}</h1>${sub ? `<p class="muted">${sub}</p>` : ''}</div></div>
  <div class="purse"><b class="${s.money < 0 ? 'neg' : ''}">${A.lei(s.money)}</b><small>◆ ${A.fmt(A.S.points.grile)} puncte-grilă · ✦ ${A.fmt(A.S.points.spete)} puncte-speță · putere juridică ${A.fmt(E.power())} · bonus onorarii +${Math.round((E.feeMult() - 1) * 100)}% · salarii ${A.lei(E.dailyCost())}/zi</small></div></div>`; };
const prog = (a, b) => `<div class="bar thin"><i data-prog="${a},${b}" style="width:${(A.clamp((Date.now() - a) / (b - a), 0, 1) * 100).toFixed(1)}%"></i></div>`;
const until = t => `<span class="num" data-until="${t}">${A.dur(t - Date.now())}</span>`;
const at = el => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top }; };
const watch = ends => { const n = Date.now(), nx = Math.min(...ends.filter(t => t > n)); if (isFinite(nx)) A.every(1000, () => { if (Date.now() >= nx && !A.$('#overlay').innerHTML) A.render(); }); };
/* un singur ascultător pe pagină: înlocuit la fiecare randare (nu se mai adună) */
const bind = (view, map) => { view.onclick = e => { const b = e.target.closest('[data-do]'); if (!b || b.disabled) return; const [k, ...x] = b.dataset.do.split(':'); if (map[k]) map[k](b, ...x); }; };
A.unbindView = view => { view.onclick = null; };

/* ---------------- editor de desen (ștampila, insigna, sigla) ---------------- */
A.drawPad = (host, init) => {
  const W = 240, cols = ['#1B2A33', '#5A3F8F', '#2B5C8A', '#B23A2E', '#2E7D5B', '#B98A12', '#D9681C', '#FFFFFF'];
  host.innerHTML = `<div class="pad"><canvas width="${W * 2}" height="${W * 2}" style="width:${W}px;height:${W}px"></canvas>
    <div class="padtools">${cols.map((c, i) => `<button type="button" class="pc ${i === 1 ? 'on' : ''}" data-c="${c}" style="background:${c}" aria-label="Culoare"></button>`).join('')}
      <span class="sep"></span>${[3, 7, 14].map((w, i) => `<button type="button" class="pw ${i === 1 ? 'on' : ''}" data-w="${w}" aria-label="Grosime ${w}"><i style="width:${w}px;height:${w}px"></i></button>`).join('')}
      <span class="sep"></span><button type="button" class="btn small" data-t="erase">Radieră</button><button type="button" class="btn small" data-t="undo">Anulează</button><button type="button" class="btn small" data-t="clear">Golește</button></div></div>`;
  const cv = A.$('canvas', host), x = cv.getContext('2d'); x.scale(2, 2); x.lineCap = 'round'; x.lineJoin = 'round';
  let col = cols[1], w = 7, erase = false, drawing = false, hist = [], inked = 0;
  const snap = () => { hist.push(x.getImageData(0, 0, cv.width, cv.height)); if (hist.length > 30) hist.shift(); };
  if (init) { const img = new Image(); img.onload = () => { x.drawImage(img, 0, 0, W, W); inked = 1000; }; img.src = init; }
  const pos = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * W / r.width, (e.clientY - r.top) * W / r.height]; };
  cv.onpointerdown = e => { cv.setPointerCapture(e.pointerId); snap(); drawing = true; const [px, py] = pos(e); x.beginPath(); x.moveTo(px, py); x.lineTo(px + .01, py); stroke(); };
  cv.onpointermove = e => { if (!drawing) return; const [px, py] = pos(e); x.lineTo(px, py); stroke(); inked++; };
  cv.onpointerup = cv.onpointercancel = () => { drawing = false; };
  const stroke = () => { x.globalCompositeOperation = erase ? 'destination-out' : 'source-over'; x.strokeStyle = col; x.lineWidth = w; x.stroke(); };
  host.onclick = e => {
    const c = e.target.closest('.pc'), ww = e.target.closest('.pw'), t = e.target.closest('[data-t]');
    if (c) { col = c.dataset.c; erase = false; A.$$('.pc', host).forEach(b => b.classList.toggle('on', b === c)); A.$('[data-t=erase]', host).classList.remove('on'); }
    if (ww) { w = +ww.dataset.w; A.$$('.pw', host).forEach(b => b.classList.toggle('on', b === ww)); }
    if (t && t.dataset.t === 'erase') { erase = !erase; t.classList.toggle('on', erase); }
    if (t && t.dataset.t === 'undo' && hist.length) x.putImageData(hist.pop(), 0, 0);
    if (t && t.dataset.t === 'clear') { snap(); x.clearRect(0, 0, W, W); inked = 0; }
  };
  return { url: () => cv.toDataURL('image/png'), inked: () => inked };
};

/* ---------------- însemne prestabilite ---------------- */
/* șase modele gata făcute; culoarea e comună pentru toate trei piesele */
const svgURL = inner => 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">${inner}</svg>`);
E.BRAND_SETS = [
  { id: 'cerc', n: 'Sigiliu rotund', mk: c => ({
      stamp: svgURL(`<circle cx="60" cy="60" r="50" fill="none" stroke="${c}" stroke-width="5"/><circle cx="60" cy="60" r="41" fill="none" stroke="${c}" stroke-width="2"/><path d="M38 60h44M60 38v44" stroke="${c}" stroke-width="4"/>`),
      insignia: svgURL(`<circle cx="60" cy="60" r="44" fill="${c}"/><path d="M60 26l9 20 22 3-16 15 4 22-19-10-19 10 4-22-16-15 22-3z" fill="#fff" opacity=".92"/>`),
      logo: svgURL(`<circle cx="60" cy="60" r="52" fill="${c}"/><path d="M34 76V44h12l14 20 14-20h12v32" fill="none" stroke="#fff" stroke-width="7" stroke-linejoin="round"/>`) }) },
  { id: 'scut', n: 'Scut', mk: c => ({
      stamp: svgURL(`<path d="M60 12l44 14v34c0 28-20 42-44 50-24-8-44-22-44-50V26z" fill="none" stroke="${c}" stroke-width="5"/><path d="M40 60h40M60 42v36" stroke="${c}" stroke-width="4"/>`),
      insignia: svgURL(`<path d="M60 10l46 16v36c0 28-22 42-46 50-24-8-46-22-46-50V26z" fill="${c}"/><path d="M60 34v46M42 50h36" stroke="#fff" stroke-width="7"/>`),
      logo: svgURL(`<path d="M60 8l48 18v34c0 30-24 46-48 54-24-8-48-24-48-54V26z" fill="${c}"/><circle cx="60" cy="56" r="17" fill="#fff"/>`) }) },
  { id: 'balanta', n: 'Balanța', mk: c => ({
      stamp: svgURL(`<circle cx="60" cy="60" r="50" fill="none" stroke="${c}" stroke-width="4"/><path d="M60 26v62M30 42h60M30 42l-12 22h24zM90 42l-12 22h24zM42 90h36" fill="none" stroke="${c}" stroke-width="4" stroke-linejoin="round"/>`),
      insignia: svgURL(`<rect x="12" y="12" width="96" height="96" rx="18" fill="${c}"/><path d="M60 28v58M34 44h52M34 44l-11 20h22zM86 44l-11 20h22z" fill="none" stroke="#fff" stroke-width="5"/>`),
      logo: svgURL(`<rect x="8" y="8" width="104" height="104" rx="24" fill="${c}"/><path d="M60 30v56M36 46h48" stroke="#fff" stroke-width="8" stroke-linecap="round"/>`) }) },
  { id: 'coloana', n: 'Coloana', mk: c => ({
      stamp: svgURL(`<rect x="14" y="14" width="92" height="92" rx="8" fill="none" stroke="${c}" stroke-width="5"/><path d="M30 40h60M36 40v44M60 40v44M84 40v44M26 90h68" stroke="${c}" stroke-width="5" stroke-linecap="round"/>`),
      insignia: svgURL(`<path d="M60 10l50 24H10z" fill="${c}"/><path d="M28 44v46M60 44v46M92 44v46" stroke="${c}" stroke-width="10"/><rect x="12" y="94" width="96" height="14" rx="4" fill="${c}"/>`),
      logo: svgURL(`<circle cx="60" cy="60" r="52" fill="${c}"/><path d="M34 46h52M40 46v38M60 46v38M80 46v38M30 90h60" stroke="#fff" stroke-width="6" stroke-linecap="round"/>`) }) },
  { id: 'pana', n: 'Pana și calimara', mk: c => ({
      stamp: svgURL(`<circle cx="60" cy="60" r="50" fill="none" stroke="${c}" stroke-width="5"/><path d="M38 84C50 50 70 36 88 32c0 26-14 46-40 54z" fill="none" stroke="${c}" stroke-width="4"/><path d="M34 88c8-6 14-10 20-13" stroke="${c}" stroke-width="4"/>`),
      insignia: svgURL(`<circle cx="60" cy="60" r="46" fill="${c}"/><path d="M38 84C50 50 70 36 88 32c0 26-14 46-40 54z" fill="#fff"/>`),
      logo: svgURL(`<rect x="10" y="10" width="100" height="100" rx="26" fill="${c}"/><path d="M36 86C48 52 68 38 86 34c0 26-14 46-40 54z" fill="#fff"/>`) }) },
  { id: 'harta', n: 'Harta', mk: c => ({
      stamp: svgURL(`<circle cx="60" cy="60" r="50" fill="none" stroke="${c}" stroke-width="5"/><path d="M44 30l16 8 18-8 2 56-18 8-18-8-2-56z" fill="none" stroke="${c}" stroke-width="4"/><circle cx="62" cy="62" r="7" fill="${c}"/>`),
      insignia: svgURL(`<rect x="14" y="14" width="92" height="92" rx="14" fill="${c}"/><path d="M42 30l18 8 20-8v54l-20 8-18-8z" fill="#fff" opacity=".9"/>`),
      logo: svgURL(`<circle cx="60" cy="60" r="52" fill="${c}"/><path d="M40 32l20 9 22-9v56l-22 9-20-9z" fill="#fff"/>`) }) },
];
E.BRAND_COLORS = ['#5A3F8F', '#2B5C8A', '#B23A2E', '#2E7D5B', '#B98A12', '#1B2A33', '#6E1F2B', '#2F6B3A'];

E.REDRAW_COST = 100000;
/* desenarea însemnelor: o singură dată; ulterior doar contra 100.000 lei */
E.brandChooser = (onDone, paid) => {
  let set = E.BRAND_SETS[0], col = E.BRAND_COLORS[0];
  const m = A.modal(`<div class="brand"><h2>Însemnele biroului</h2>
    <p>Alege un model gata făcut și culoarea lui, sau desenează-ți singur ștampila, insigna și sigla. ${paid ? '' : `Le poți schimba mai târziu doar contra ${A.lei(E.REDRAW_COST)}.`}</p>
    <div class="bsets" id="bsets"></div>
    <div class="field"><span>Culoarea însemnelor</span><div class="swatches" id="bcol">${E.BRAND_COLORS.map(c => `<button type="button" class="sw ${c === col ? 'on' : ''}" data-c="${c}" style="background:${c}" aria-label="Culoare"></button>`).join('')}</div></div>
    <div class="bprev" id="bprev"></div>
    <div class="mbtns"><button class="btn primary" id="btake">Folosesc acest model</button><button class="btn" id="bdraw">Le desenez eu</button></div></div>`);
  m.el.classList.add('wide');
  const prev = () => {
    const out = set.mk(col);
    A.$('#bprev', m.el).innerHTML = [['stamp', 'Ștampila'], ['insignia', 'Insigna'], ['logo', 'Sigla']]
      .map(([k, n]) => `<figure><img src="${out[k]}" alt="${n}"><figcaption>${n}</figcaption></figure>`).join('');
    A.$$('.bsets button', m.el).forEach(b => b.classList.toggle('on', b.dataset.s === set.id));
    A.$$('#bcol .sw', m.el).forEach(b => b.classList.toggle('on', b.dataset.c === col));
  };
  A.$('#bsets', m.el).innerHTML = E.BRAND_SETS.map(x => `<button type="button" data-s="${x.id}" class="${x.id === set.id ? 'on' : ''}"><img src="${x.mk(col).insignia}" alt=""><span>${A.esc(x.n)}</span></button>`).join('');
  A.$$('#bsets button', m.el).forEach(b => b.onclick = () => { set = E.BRAND_SETS.find(x => x.id === b.dataset.s); prev(); });
  A.$$('#bcol .sw', m.el).forEach(b => b.onclick = () => { col = b.dataset.c; A.$$('#bsets button img', m.el).forEach((img, i) => img.src = E.BRAND_SETS[i].mk(col).insignia); prev(); });
  A.$('#btake', m.el).onclick = () => {
    const out = set.mk(col);
    A.S.brand = { stamp: out.stamp, insignia: out.insignia, logo: out.logo, set: set.id, color: col, at: Date.now() };
    A.store.save(); m.close(); onDone && onDone();
  };
  A.$('#bdraw', m.el).onclick = () => { m.close(); E.brandEditor(onDone, paid); };
  prev();
};
E.brandEditor = (onDone, paid) => {
  const b = A.S.brand || {}, parts = [['stamp', 'Ștampila', 'Ștampila cabinetului: apare pe actele și pe profilul tău.'], ['insignia', 'Insigna', 'Insigna ta personală.'], ['logo', 'Sigla', 'Sigla firmei: pe birou și pe mașini.']];
  let cur = 0; const out = Object.assign({}, b);
  const m = A.modal(`<div class="brand"><h2>Însemnele biroului</h2><p>Le desenezi o singură dată. ${paid ? '' : `Mai târziu le poți schimba doar contra ${A.lei(E.REDRAW_COST)}.`}</p>
    <nav class="btabs">${parts.map(([k, n], i) => `<button type="button" data-i="${i}" class="${i ? '' : 'on'}">${n}</button>`).join('')}</nav><p class="faint" id="bdesc"></p><div id="bpad"></div>
    <div class="mbtns"><button class="btn primary" id="bnext">Următorul</button></div></div>`);
  m.el.classList.add('wide');
  let pad;
  const show = i => {
    if (pad) out[parts[cur][0]] = pad.inked() > 15 ? pad.url() : out[parts[cur][0]];
    cur = i; A.$$('.btabs button', m.el).forEach((x, j) => x.classList.toggle('on', j === i));
    A.$('#bdesc', m.el).textContent = parts[i][2]; pad = A.drawPad(A.$('#bpad', m.el), out[parts[i][0]]);
    A.$('#bnext', m.el).textContent = i < 2 ? 'Următorul' : 'Gata';
  };
  A.$$('.btabs button', m.el).forEach(x => x.onclick = () => show(+x.dataset.i));
  A.$('#bnext', m.el).onclick = () => {
    if (pad.inked() < 15 && !out[parts[cur][0]]) { A.toast(`Desenează ${parts[cur][1].toLowerCase()} înainte să mergi mai departe.`); return; }
    if (cur < 2) return show(cur + 1);
    out[parts[cur][0]] = pad.inked() > 15 ? pad.url() : out[parts[cur][0]];
    if (parts.some(([k]) => !out[k])) { const miss = parts.findIndex(([k]) => !out[k]); A.toast(`Lipsește ${parts[miss][1].toLowerCase()}.`); return show(miss); }
    A.S.brand = { stamp: out.stamp, insignia: out.insignia, logo: out.logo, at: Date.now() };
    A.store.save(); m.close(); onDone && onDone();
  };
  show(0);
};

/* ---------------- înființarea biroului ---------------- */
const COLORS = ['#5A3F8F', '#2B5C8A', '#B23A2E', '#2E7D5B', '#B98A12', '#1B2A33'];
function onboarding(view) {
  const home = ST.current() || A.raioane[0].unit;
  let color = COLORS[0];
  view.innerHTML = `<div class="firm onboard">${GEAR}<div class="hero"><div class="faint" style="font-size:13px;letter-spacing:.08em;text-transform:uppercase">Biroul tău de avocați</div>
    <h1>Înființează biroul</h1><p class="muted">Prima filială e în ${A.esc(A.unitById[home].name)}, raionul pe care îl studiezi acum. Clienții vin pe măsură ce citești și rezumi articole: sub 50 de articole înțelese, aproape nimeni nu-ți trece pragul.</p></div>
    <label class="field"><span>Numele biroului</span><input id="fname" maxlength="40" value="Biroul de avocați"></label>
    <div class="field"><span>Culoarea firmei</span><div class="swatches">${COLORS.map(c => `<button class="sw ${c === color ? 'on' : ''}" data-c="${c}" style="background:${c}" aria-label="Culoare ${c}"></button>`).join('')}</div></div>
    <ul class="perks"><li>Pornești cu 2.000 de lei, cu tine (avocat) și un avocat stagiar.</li><li>Angajații au salariu pe zi reală; fără bani intră în grevă.</li><li>Culoarea aleasă colorează raioanele pe care le cucerești și cerneala ștampilei.</li></ul>
    <div class="insemne"><figure>${A.brand.logo()}<figcaption>Sigla</figcaption></figure><figure class="st">${A.brand.stamp(color, 'Biroul de avocați')}<figcaption>Ștampila</figcaption></figure><figure>${A.brand.insignia(color)}<figcaption>Insigna</figcaption></figure></div>
    <button class="btn primary big" id="go">Înființează biroul</button></div>`;
  const ins = A.$('.insemne', view), redraw = () => { const nm = A.$('#fname', view).value.trim() || 'Biroul de avocați'; ins.children[1].innerHTML = A.brand.stamp(color, nm) + '<figcaption>Ștampila</figcaption>'; ins.children[2].innerHTML = A.brand.insignia(color) + '<figcaption>Insigna</figcaption>'; };
  A.$('#fname', view).oninput = A.debounce(redraw, 200);
  A.$$('.sw', view).forEach(b => b.onclick = () => { color = b.dataset.c; A.$$('.sw', view).forEach(x => x.classList.toggle('on', x === b)); redraw(); });
  A.$('#go', view).onclick = () => { const name = A.$('#fname', view).value.trim(); E.found(name, color, home); A.go('#/firma'); };
}
E.found = (name, color, unit) => {
  const s = E.s(), now = Date.now(), r = A.raion(unit);
  Object.assign(s, { started: true, firm: { name: name || 'Biroul de avocați', color }, home: unit, branches: [unit], money: (s.money || 0) + 2000, walkAt: now + 20 * 60e3, freeAt: now + E.FREE_EVERY, freeStock: 1, passiveBank: 0 });
  s.staff = [{ id: s.nextStaffId++, role: 'avocat', name: 'Tu', lvl: 1, me: true, hired: now }, { id: s.nextStaffId++, role: 'stagiar', name: A.pick(E.NAMES), lvl: 1, hired: now, paidTo: now }];
  s.clients = [E.newClient(1, r.disc)];
  s.slots[0] = { id: E.id(), type: 'simplu', src: 'Înființarea biroului', unlockEnd: null };
  A.store.save(); A.game.checkStamps(); A.confetti(); A.sound('level');
};
E.moveOffice = () => { const s = E.s(), nx = E.OFFICES[s.office + 1]; if (!nx) return; if (!E.spend(nx[2])) return; s.office++; A.toast(`V-ați mutat: ${nx[0]}, ${nx[1]} locuri.`); A.store.save(); };

/* ---------------- biroul: prezentare ---------------- */
A.route('firma', async (view, [sub]) => {
  const s = E.s();
  if (!s.started) return onboarding(view);
  if (sub === 'echipa') return team(view);
  if (sub === 'consultatii') return consults(view);
  if (sub === 'instanta') return court(view);
  const n = Date.now(), unlocking = E.unlocking();
  const chestLock = E.chestsLocked();
  const slot = (c, i) => {
    if (!c) return `<div class="slot empty"><div class="ph">Slot liber</div><small>Dosarele vin din jocul rapid (butonul PLAY), mini-boși, misiuni și serii de zile.</small></div>`;
    const C = E.CHESTS[c.type];
    const head = `<div class="chestbox">${E.chestSVG(c.type)}</div><b>${C.name}</b>`;
    if (c.unlockEnd && c.unlockEnd <= n)
      return `<div class="slot ready" style="--c:${C.color}">${head}<small>${A.esc(c.src || '')}</small><div class="act"><button class="btn primary" data-do="open:${i}">Deschide · ${E.spGem}${C.sp}</button></div></div>`;
    if (c.unlockEnd)
      return `<div class="slot run" style="--c:${C.color}">${head}<small>se deblochează: ${until(c.unlockEnd)}</small>${prog(c.unlockEnd - E.unlockMs(c.type), c.unlockEnd)}
        <div class="act">${c.speedLocked ? '<small class="faint">Testul a fost picat: se deschide la timp.</small>' : `<button class="btn small" data-do="speed:${i}" title="15 grile grele; ai nevoie de ${E.SPEED_PASS} corecte">Deschide acum: test de ${E.SPEED_N} grile</button>`}</div></div>`;
    return `<div class="slot" style="--c:${C.color}">${head}<small>${A.esc(c.src || '')} · deblocare ${A.dur(E.unlockMs(c.type))}</small>
      <div class="act"><button class="btn" data-do="unlock:${i}" ${unlocking || chestLock ? 'disabled' : ''}>${chestLock ? `Încă ${chestLock} ${chestLock === 1 ? 'articol' : 'articole'} de citit` : unlocking ? 'Alt dosar se deblochează' : 'Pornește deblocarea'}</button></div></div>`;
  };
  const readyC = s.consults.filter(c => c.end <= n), readyP = s.procs.filter(p => p.end <= n);
  const pas = E.passiveRaw(), rate = E.passiveRateRaw() * E.feeMult();
  const busy = s.staff.filter(m => E.busy(m.id)).length, strike = s.staff.filter(m => m.strike).length;
  const q = s.daily ? s.daily.quests : [];
  const nextTimes = [...s.consults.map(c => c.end), ...s.procs.map(p => p.end), ...s.slots.filter(c => c && c.unlockEnd).map(c => c.unlockEnd), s.freeStock < 2 ? s.freeAt : 0];
  view.innerHTML = `<div class="firm">${head('Biroul', '')}${tabs('')}
    ${A.arena.shopHTML()}
    <div class="fgrid">
      <section class="fsec"><div class="sh"><h2>De încasat</h2></div>
        <div class="income"><div><b>${A.lei(pas)}</b><small>din ${s.branches.length} ${s.branches.length === 1 ? 'filială' : 'filiale'} · ${A.lei(rate)} pe oră${A.active() ? '' : ' · <span style="color:var(--seal)">oprit: studiază ca filialele să producă</span>'}</small></div><button class="btn primary" data-do="passive" ${pas < 1 ? 'disabled' : ''}>Încasează</button></div>
        ${readyC.map(c => `<div class="income"><div><b>${A.esc(c.client.title)}</b><small>consultație terminată de ${A.esc(roleName(s.staff.find(m => m.id === c.staff) || { name: '?', role: 'jurist' }))}</small></div><button class="btn primary" data-do="cc:${c.id}">Colectează</button></div>`).join('')}
        ${readyP.map(p => `<div class="income"><div><b>${A.esc(p.title)}</b><small>avocatul s-a întors de la ${A.esc(A.unitById[p.unit].name)}</small></div><button class="btn primary" data-do="cp:${p.id}">Află verdictul</button></div>`).join('')}
        ${!readyC.length && !readyP.length ? `<p class="faint" style="margin:10px 0 0">Nicio consultație sau proces terminat încă.</p>` : ''}
      </section>
      ${A.arena.questsHTML()}
      <section class="fsec"><div class="sh"><h2>Pe scurt</h2></div>
        <div class="kv"><span>Puterea juridică</span><b>${A.fmt(E.power())}</b></div>
        <div class="kv"><span>Echipa</span><b>${s.staff.length}/${E.staffLimit()} · ${busy} ocupați${strike ? ` · <span style="color:var(--seal)">${strike} în grevă</span>` : ''}</b></div>
        <div class="kv"><span>Clienți în așteptare</span><b>${s.clients.length}/${E.maxWaiting()}</b></div>
        <div class="kv"><span>Următorul client</span><b>${s.clients.length >= E.maxWaiting() ? 'sala e plină' : until(s.walkAt)}</b></div>
        <div class="kv"><span>Procese câștigate / pierdute</span><b>${s.stats.won} / ${s.stats.lost}</b></div>
        <div class="kv"><span>Flota</span><b>${s.fleet.length ? s.fleet.length + ' mașini' : 'doar autobuzul'} · nitro ${s.nitro}</b></div>
        ${Object.values(s.buffs).filter(b => b.until > n).map(b => `<div class="kv"><span>${A.esc(b.label)}</span><b>${until(b.until)}</b></div>`).join('')}
      </section>
    </div></div>`;
  bind(view, {
    open: (b, i) => E.openChest(+i), free: () => E.openChest(0, true),
    unlock: (b, i) => { E.startUnlock(+i); A.render(); }, speed: (b, i) => E.speedChest(+i),
    passive: b => { E.collectPassive(at(b)); A.render(); },
    cc: (b, id) => { E.collectConsult(+id, at(b)); A.render(); }, cp: (b, id) => { E.collectProc(+id, at(b)); A.render(); },
  });
  A.arena.bindBiroul(view);
  watch(nextTimes);
});

/* ---------------- echipa ---------------- */
function team(view) {
  const s = E.s(), office = E.OFFICES[s.office], nx = E.OFFICES[s.office + 1], block = E.hireBlock(), fired = E.firedOpen();
  const st = m => { if (m.strike) return '<span style="color:var(--seal)">în grevă: plătește salariul</span>'; const c = s.consults.find(x => x.staff === m.id); if (c) return `consultă: ${A.esc(c.client.title)}`; const p = s.procs.find(x => x.staff === m.id); if (p) return `în instanță la ${A.esc(A.unitById[p.unit].name)}`; return 'liber'; };
  view.innerHTML = `<div class="firm">${head('Echipa', 'Fiecare angajat are plată de angajare și salariu pe zi reală. Îmbunătățirile cer bani, cartonașe din dosare și grile rezolvate.')}${tabs('echipa')}
    <section class="fsec office"><div><div class="faint" style="font-size:13px">Sediul</div><h2>${office[0]}</h2><p class="muted" style="margin:4px 0 0">${s.staff.length} oameni · limita ta: ${E.staffLimit()} (sediul are ${office[1]} locuri; +1 loc la fiecare 30 de articole rezumate)</p></div>
      ${nx ? `<button class="btn primary" data-do="move">Mută-te: ${nx[0]} (${nx[1]} locuri) · ${A.lei(nx[2])}</button>` : '<span class="faint">Ai cel mai mare sediu.</span>'}</section>
    <section class="fsec"><div class="sh"><h2>Angajări</h2><span class="faint">${block ? A.esc(block) : 'Poți angaja acum.'}</span></div><div class="roles">
      ${E.ROLE_ORDER.map(r => { const R = E.ROLES[r]; return `<div class="rolecard"><div class="rt"><b>${R.name}</b><span class="faint">${s.staff.filter(m => m.role === r).length} în echipă</span></div><p>${A.esc(R.desc)}</p>
        <div class="rstats"><span>Angajare ${A.lei(R.cost)}</span><span>Salariu ${A.lei(R.sal)}/zi</span>${R.base ? `<span>Consultație ~${A.lei(R.base)}</span>` : ''}${R.court ? '<span>Merge în instanță</span>' : ''}</div>
        <div class="ra"><input class="nm" id="nm-${r}" maxlength="24" placeholder="Numele angajatului"><button class="btn" data-do="hire:${r}" ${block ? 'disabled' : ''}>Angajează</button></div></div>`; }).join('')}
    </div></section>
    ${fired.length ? `<section class="fsec"><div class="sh"><h2>Foști angajați</h2><span class="faint">Reangajare cu reducere, timp de ${E.REHIRE_DAYS} zile de la concediere</span></div>
      ${fired.map((f, i) => `<div class="tier"><div><b>${A.esc(f.name)}</b><small>${E.ROLES[f.role].name} · nivelul ${f.lvl} · reducere ${Math.round(E.ROLES[f.role].disc * 100)}% · încă ${A.dur(f.at + E.REHIRE_DAYS * 864e5 - Date.now())}</small></div><button class="btn small" data-do="rehire:${i}" ${block ? 'disabled' : ''}>Reangajează · ${A.lei(Math.round(E.ROLES[f.role].cost * (1 - E.ROLES[f.role].disc)))}</button></div>`).join('')}</section>` : ''}
    <section class="fsec"><div class="sh"><h2>Oamenii firmei</h2><span class="faint">Cartonașe: ${E.ROLE_ORDER.filter(r => s.cards[r]).map(r => `${E.ROLES[r].name} ${s.cards[r]}`).join(' · ') || 'niciunul'} · grile disponibile: ${A.fmt(A.S.points.grile)}</span></div><table class="staff"><tbody>
      ${s.staff.map(m => { const need = E.upgradeNeed(m); return `<tr><td><b>${A.esc(nameOf(m))}</b>${m.me ? '' : ` <button class="lnk" data-do="ren:${m.id}">redenumește</button>`}</td><td>${E.ROLES[m.role].name}</td><td class="num">nivelul ${m.lvl || 1}</td><td class="${E.busy(m.id) || m.strike ? '' : 'free'}">${st(m)}</td>
        <td class="ups"><button class="btn small" data-do="up:${m.id}" title="${A.lei(need.money)} · ${need.cards} cartonașe · ${need.grile} grile${need.spete ? ' · ' + need.spete + ' puncte-speță' : ''}">Nivelul ${(m.lvl || 1) + 1}: ${A.lei(need.money)} + ${need.cards} cart. + ${need.grile} grile${need.spete ? ' + ' + need.spete + ' ' + E.spGem : ''}</button>
        ${m.strike ? `<button class="btn small primary" data-do="pay:${m.id}">Plătește ${A.lei(E.ROLES[m.role].sal)}</button>` : ''}${m.me ? '' : `<button class="btn small ghost" data-do="fire:${m.id}" ${E.busy(m.id) ? 'disabled' : ''}>Concediază</button>`}</td></tr>`; }).join('')}
    </tbody></table></section></div>`;
  bind(view, {
    move: () => { E.moveOffice(); A.render(); },
    hire: (b, r) => { if (E.hire(r, A.$('#nm-' + r, view).value)) A.render(); },
    rehire: (b, i) => { const f = E.firedOpen()[+i]; if (f && E.hire(f.role, f.name, f)) A.render(); },
    up: (b, id) => { E.upgrade(+id); A.render(); },
    ren: (b, id) => { const m = s.staff.find(x => x.id === +id); const md = A.modal(`<h2>Redenumește</h2><input id="rn" class="tin" maxlength="24" value="${A.esc(m.name)}"><div class="mbtns"><button class="btn primary" id="rok">Salvează</button><button class="btn" data-close>Renunță</button></div>`); A.$('#rok', md.el).onclick = () => { E.rename(+id, A.$('#rn', md.el).value); md.close(); A.render(); }; },
    fire: (b, id) => { const m = s.staff.find(x => x.id === +id); const md = A.modal(`<h2>Concediezi pe ${A.esc(m.name)}?</h2><p>Banii investiți nu se întorc. Timp de ${E.REHIRE_DAYS} zile îl poți reangaja cu ${Math.round(E.ROLES[m.role].disc * 100)}% reducere, la același nivel.</p><div class="mbtns"><button class="btn primary" id="fok">Concediază</button><button class="btn" data-close>Renunță</button></div>`); A.$('#fok', md.el).onclick = () => { E.fire(+id); md.close(); A.render(); }; },
    pay: (b, id) => { const m = s.staff.find(x => x.id === +id); if (!E.spend(E.ROLES[m.role].sal)) return; m.paidTo += 864e5; m.strike = false; A.store.save(); E.paySalaries(); A.render(); },
  });
}

/* ---------------- consultații ---------------- */
let selConsult = null;
function consults(view) {
  const s = E.s(), n = Date.now();
  const free = E.free(m => m.role !== 'secretar');
  if (!free.find(m => m.id === selConsult)) selConsult = free.length ? free.slice().sort((a, b) => E.ROLES[b.role].base - E.ROLES[a.role].base)[0].id : null;
  const who = s.staff.find(m => m.id === selConsult);
  view.innerHTML = `<div class="firm">${head('Consultații', `Orice consultație durează cel puțin 10 minute. Cu cât ai studiat mai mult (putere juridică ${A.fmt(E.power())}), cu atât consultați mai repede și vin clienți mai bogați.`)}${tabs('consultatii')}
    <section class="fsec"><div class="sh"><h2>Cine consultă</h2></div>
      ${free.length ? `<div class="who">${free.map(m => `<button class="whob ${m.id === selConsult ? 'on' : ''}" data-do="who:${m.id}"><b>${A.esc(nameOf(m))}</b><small>${E.ROLES[m.role].name} · niv. ${m.lvl || 1}</small></button>`).join('')}</div>` : `<p class="faint">Toți oamenii sunt ocupați sau în grevă.</p>`}</section>
    <section class="fsec"><div class="sh"><h2>Clienți în așteptare · ${s.clients.length}/${E.maxWaiting()}</h2><span class="faint">${E.power() < 50 ? 'Sub 50 de puncte de putere juridică clienții aproape nu vin. Citește și rezumă articole.' : `Următorul client: ${until(s.walkAt)}`}</span></div>
      ${s.clients.length ? `<div class="clients">${s.clients.map(c => { const p = who ? E.consultPreview(c, who) : null; return `<div class="client" style="--c:${(A.disc[c.disc] || {}).color || '#555'}"><div class="ct">${stars(c.stars)}<span class="faint">${A.esc((A.disc[c.disc] || {}).name || '')}</span></div><b>${A.esc(c.title)}</b>
        ${p ? `<div class="pv"><span>${A.dur(p.ms)}</span><span>${A.lei(p.fee * E.feeMult())}</span><span>${Math.round(p.gen * 100)}% generos</span></div>` : ''}
        <button class="btn primary small" data-do="go:${c.id}" ${who ? '' : 'disabled'}>Consultă</button></div>`; }).join('')}</div>` : `<p class="faint">Niciun client acum.</p>`}</section>
    <section class="fsec"><div class="sh"><h2>În curs · ${s.consults.length}</h2></div>
      ${s.consults.map(c => { const m = s.staff.find(x => x.id === c.staff) || { name: '?', role: 'jurist' }, done = c.end <= n; return `<div class="run ${done ? 'done' : ''}"><div class="rl"><b>${A.esc(c.client.title)}</b> ${stars(c.client.stars)}<small>${A.esc(roleName(m))}${c.prep ? ' · pregătită' : ''}</small></div>
        <div class="rm">${done ? '<span class="ok">terminată</span>' : until(c.end)}${prog(c.start, c.end)}</div>
        <div class="rr">${done ? `<button class="btn primary" data-do="cc:${c.id}">Colectează · ${A.lei(c.fee * E.feeMult())}</button>` : `<button class="btn small" data-do="prep:${c.id}" ${c.prep ? 'disabled' : ''}>Pregătește (+30%)</button>`}</div></div>`; }).join('') || '<p class="faint">Nicio consultație în curs.</p>'}</section></div>`;
  bind(view, {
    who: (b, id) => { selConsult = +id; A.render(); },
    go: (b, id) => { E.startConsult(+id, selConsult); selConsult = null; A.sound('xp'); A.render(); },
    cc: (b, id) => { E.collectConsult(+id, at(b)); A.render(); },
    prep: (b, id) => E.prepConsult(+id),
  });
  watch([...s.consults.map(c => c.end), s.walkAt]);
}

/* ---------------- instanța ---------------- */
let selCourt = null, selCar = 0;
function court(view) {
  const s = E.s(), n = Date.now();
  const free = E.free(m => E.ROLES[m.role].court);
  if (!free.find(m => m.id === selCourt)) selCourt = free.length ? free.slice().sort((a, b) => E.ROLES[b.role].base - E.ROLES[a.role].base)[0].id : null;
  const cars = s.fleet.filter(c => !E.carBusy(c.id)).sort((a, b) => b.tier - a.tier);
  if (selCar && !cars.find(c => c.id === selCar)) selCar = 0;
  if (!selCar && cars.length) selCar = cars[0].id;
  const who = s.staff.find(m => m.id === selCourt);
  const open = E.unlocked();
  const card = r => {
    const u = r.unit, mast = E.unitMastery(u), o = E.originFor(u), offers = E.offersFor(u), br = s.branches.includes(u);
    return `<div class="court" style="--c:${A.disc[r.disc].color}"><div class="cth"><div><b>${A.esc(r.name)}</b><small>${A.esc(A.disc[r.disc].name)} · ${br ? 'filiala ta' : `${Math.round(o.km)} km de la ${A.esc(A.unitById[o.from].name)}`}</small></div><span class="pct">${Math.round(mast * 100)}%<small>stăpânire</small></span></div>
      ${offers.map(of => { const p = who ? E.procPreview(u, of, who, selCar) : null; return `<div class="offer"><div><b>${A.esc(of.t)}</b>${p ? `<small>drum ${A.dur(p.travel)} ×2 · ședință ${A.dur(p.hearing)} · câștig ${Math.round(p.win * 100)}%</small>` : `<small>ședință ${of.min} min</small>`}</div>
        <div class="oa"><span class="num">${p ? A.lei(p.fee * E.feeMult()) : ''}</span><button class="btn small primary" data-do="send:${u}:${of.id}" ${who ? '' : 'disabled'}>Trimite</button></div></div>`; }).join('') || '<p class="faint">Nicio cauză nouă.</p>'}
      <div class="ctf"><span class="faint">Cauze noi peste ${until(s.offers[u].until)}</span>${br ? '' : `<button class="btn small" data-do="branch:${u}" title="${mast < .1 ? 'Necesită 10% stăpânire' : ''}">Filială aici · ${A.lei(E.openBranchCost())}</button>`}</div></div>`;
  };
  const procs = s.procs.slice().sort((a, b) => a.end - b.end);
  const carName = id => id ? E.CARS[E.carTier(id)][0] : 'autobuzul';
  view.innerHTML = `<div class="firm">${head('Instanța', 'Alegi cine pleacă și cu ce mașină. Mașina mai rapidă scurtează drumul; stăpânirea raionului crește șansa de câștig.')}${tabs('instanta')}
    ${procs.length ? `<section class="fsec"><div class="sh"><h2>Procese în curs · ${procs.length}</h2><span class="faint">Nitro: ${s.nitro}</span></div>
      ${procs.map(p => { const m = s.staff.find(x => x.id === p.staff) || { name: '?', role: 'avocat' }, ph = E.procPhase(p), done = p.end <= n; return `<div class="run ${done ? 'done' : ''}"><div class="rl"><b>${A.esc(p.title)}</b><small>${A.esc(A.unitById[p.unit].name)} · ${A.esc(roleName(m))} cu ${A.esc(carName(p.car))} · ${ph}</small></div>
        <div class="rm">${done ? '<span class="ok">s-a întors</span>' : until(p.end)}<div class="phases"><i data-prog="${p.start},${p.t1}"></i><i data-prog="${p.t1},${p.t2}"></i><i data-prog="${p.t2},${p.end}"></i></div></div>
        <div class="rr">${done ? `<button class="btn primary" data-do="cp:${p.id}">Află verdictul</button>` : `<button class="btn small" data-do="prep:${p.id}" ${p.prep >= 3 ? 'disabled' : ''}>Pregătește (${p.prep}/3)</button><button class="btn small nitro" data-do="nitro:${p.id}" ${s.nitro < 1 ? 'disabled' : ''}>Nitro</button>`}</div></div>`; }).join('')}</section>` : ''}
    <div class="fgrid two"><section class="fsec"><div class="sh"><h2>Cine merge</h2></div>
      ${free.length ? `<div class="who">${free.map(m => `<button class="whob ${m.id === selCourt ? 'on' : ''}" data-do="who:${m.id}"><b>${A.esc(nameOf(m))}</b><small>${E.ROLES[m.role].name} · niv. ${m.lvl || 1}</small></button>`).join('')}</div>` : `<p class="faint">${s.staff.some(m => E.ROLES[m.role].court) ? 'Toți avocații sunt pe drum, în ședință sau în grevă.' : 'Doar avocații merg în instanță.'}</p>`}</section>
      <section class="fsec"><div class="sh"><h2>Cu ce mașină</h2></div><div class="who">
        ${cars.map(c => `<button class="whob ${c.id === selCar ? 'on' : ''}" data-do="car:${c.id}"><b>${A.esc(E.CARS[c.tier][0])}</b><small>${E.CARS[c.tier][1]} km/h</small></button>`).join('')}
        <button class="whob ${!selCar ? 'on' : ''}" data-do="car:0"><b>Autobuzul</b><small>${E.CARS[0][1]} km/h · mereu disponibil</small></button></div>
        ${s.fleet.length > cars.length ? `<p class="faint" style="margin-top:8px">${s.fleet.length - cars.length} ${s.fleet.length - cars.length === 1 ? 'mașină e' : 'mașini sunt'} pe drum.</p>` : ''}</section></div>
    <section class="fsec"><div class="sh"><h2>Cauze pe raioane</h2><span class="faint">Doar în raioanele deschise (cucerite sau cel curent)</span></div>
      <div class="courts">${open.map(card).join('')}</div></section></div>`;
  bind(view, {
    who: (b, id) => { selCourt = +id; A.render(); }, car: (b, id) => { selCar = +id; A.render(); },
    send: (b, u, id) => { E.startProc(u, +id, selCourt, selCar); selCourt = null; selCar = 0; A.sound('xp'); A.render(); },
    cp: (b, id) => { E.collectProc(+id, at(b)); A.render(); },
    prep: (b, id) => E.prepProc(+id), nitro: (b, id) => { E.nitroProc(+id); A.render(); },
    branch: (b, u) => { E.openBranch(u); A.render(); },
  });
  watch([...s.procs.flatMap(p => [p.t1, p.t2, p.end]), ...open.map(r => (s.offers[r.unit] || {}).until || 0)]);
}

/* ---------------- garajul: mașini 2D, în profil ---------------- */
/* fiecare caroserie: x spate, x față, înălțimea capotei, a portbagajului, a centurii, a plafonului,
   baza parbrizului, începutul și sfârșitul plafonului, baza stâlpului C, axele roților, raza roții */
const BODY = {
  logan: { r: 40, f: 360, hood: 92, trunk: 88, belt: 90, roof: 48, xa: 268, xr1: 150, xr2: 236, xc: 104, w: [102, 296], R: 21, ground: 136 },
  octavia: { r: 34, f: 364, hood: 92, trunk: 84, belt: 89, roof: 46, xa: 270, xr1: 138, xr2: 238, xc: 72, w: [98, 300], R: 22, ground: 136, hatch: true },
  passat: { r: 28, f: 370, hood: 92, trunk: 86, belt: 90, roof: 48, xa: 274, xr1: 142, xr2: 240, xc: 92, w: [94, 306], R: 22, ground: 136 },
  eclass: { r: 22, f: 376, hood: 90, trunk: 86, belt: 90, roof: 50, xa: 268, xr1: 140, xr2: 230, xc: 92, w: [92, 314], R: 23, ground: 136, chrome: true },
  tesla: { r: 30, f: 368, hood: 96, trunk: 82, belt: 90, roof: 46, xa: 262, xr1: 160, xr2: 214, xc: 64, w: [96, 302], R: 22, ground: 136, fast: true, nogrille: true },
  lc300: { r: 30, f: 368, hood: 80, trunk: 70, belt: 80, roof: 30, xa: 282, xr1: 254, xr2: 66, xc: 40, w: [100, 300], R: 27, ground: 138, suv: true },
  maybach: { r: 10, f: 390, hood: 90, trunk: 86, belt: 90, roof: 50, xa: 284, xr1: 150, xr2: 244, xc: 96, w: [88, 330], R: 23, ground: 136, chrome: true, two: true },
};
const shade = (hex, k) => { const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255; r = Math.round(A.clamp(r * k, 0, 255)); g = Math.round(A.clamp(g * k, 0, 255)); b = Math.round(A.clamp(b * k, 0, 255)); return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1); };
E.carSVG = (tier, paint, vinyl, moving) => {
  const kind = E.CARS[tier][4], id = 'c' + Math.random().toString(36).slice(2, 7);
  const wheel = (cx, cy, R) => `<g class="wheel" style="transform-origin:${cx}px ${cy}px"><circle cx="${cx}" cy="${cy}" r="${R}" fill="#16191B"/><circle cx="${cx}" cy="${cy}" r="${R * .62}" fill="#B9C0C7"/><circle cx="${cx}" cy="${cy}" r="${R * .5}" fill="#8A9399"/>${[0, 72, 144, 216, 288].map(a => `<rect x="${cx - 1.6}" y="${cy - R * .58}" width="3.2" height="${R * .5}" rx="1.4" fill="#D7DCE0" transform="rotate(${a} ${cx} ${cy})"/>`).join('')}<circle cx="${cx}" cy="${cy}" r="${R * .14}" fill="#5A6066"/></g>`;
  const road = `<g class="road">${moving ? [0, 1, 2, 3, 4, 5].map(i => `<rect class="dash" x="${i * 80}" y="152" width="40" height="3" fill="var(--rule)"/>`).join('') : ''}</g>`;
  const logoFill = `<image href="${A.brand.url(A.brand.logo({ bare: true }))}" x="-15" y="-15" width="30" height="30"/>`;
  if (kind === 'bus') {
    return `<svg viewBox="0 0 400 160" class="carsvg ${moving ? 'moving' : ''}"><ellipse cx="200" cy="146" rx="182" ry="6" fill="rgba(0,0,0,.28)"/>${road}<g class="bodyg">
      <path d="M14 126 L14 40 Q14 28 28 28 L368 28 Q386 28 388 46 L392 112 Q392 126 380 126 Z" fill="${paint}" stroke="#15191C" stroke-width="2.5"/>
      <rect x="14" y="96" width="378" height="9" fill="${shade(paint, .75)}"/>
      ${[0, 1, 2, 3, 4, 5].map(i => `<rect x="${30 + i * 50}" y="40" width="42" height="40" rx="3" fill="#A9C4D6" stroke="#15191C" stroke-width="1.6"/><path d="M${34 + i * 50} 44 L${48 + i * 50} 44 L${34 + i * 50} 70 Z" fill="#fff" opacity=".35"/>`).join('')}
      <rect x="334" y="38" width="22" height="84" rx="2" fill="#7F9AAB" stroke="#15191C" stroke-width="1.6"/><line x1="345" y1="38" x2="345" y2="122" stroke="#15191C" stroke-width="1.4"/>
      <path d="M362 38 L382 38 Q386 40 387 52 L388 80 L362 80 Z" fill="#A9C4D6" stroke="#15191C" stroke-width="1.6"/>
      <rect x="370" y="104" width="16" height="8" rx="2" fill="#FFF3C2"/><rect x="16" y="104" width="8" height="10" rx="1" fill="#D23A2E"/>
      <rect x="40" y="20" width="60" height="9" rx="2" fill="${shade(paint, .7)}"/><text x="200" y="118" text-anchor="middle" font-family="Bahnschrift,sans-serif" font-size="11" font-weight="700" fill="#15191C">CHIȘINĂU — IALOVENI — STRĂȘENI</text></g>
      ${wheel(84, 126, 20)}${wheel(310, 126, 20)}</svg>`;
  }
  const b = BODY[kind], g = b.ground, R = b.R, wy = g - R + 2;
  let body;
  if (b.suv) {
    body = `M${b.r} ${g - 12} L${b.r} ${b.trunk + 6} Q${b.r} ${b.trunk - 6} ${b.r + 10} ${b.roof + 6} L${b.r + 14} ${b.roof} L${b.xa - 22} ${b.roof} Q${b.xa - 8} ${b.roof} ${b.xa + 6} ${b.belt - 4} L${b.f - 14} ${b.hood - 2} Q${b.f} ${b.hood} ${b.f} ${b.hood + 14} L${b.f} ${g - 12} Q${b.f} ${g - 4} ${b.f - 8} ${g - 4} L${b.r + 8} ${g - 4} Q${b.r} ${g - 4} ${b.r} ${g - 12} Z`;
  } else {
    const rear = b.hatch || b.fast ? `L${b.r} ${b.trunk + 6} Q${b.r + 2} ${b.trunk - 2} ${b.r + 14} ${b.trunk - 4} C${b.xc + 20} ${b.trunk - 10} ${b.xr1 - 30} ${b.roof + 4} ${b.xr1} ${b.roof}`
      : `L${b.r} ${b.trunk + 6} Q${b.r + 2} ${b.trunk - 2} ${b.r + 14} ${b.trunk - 2} L${b.xc - 6} ${b.trunk - 4} C${b.xc + 18} ${b.trunk - 8} ${b.xr1 - 26} ${b.roof + 2} ${b.xr1} ${b.roof}`;
    body = `M${b.r} ${g - 12} ${rear} L${b.xr2} ${b.roof} C${b.xr2 + 18} ${b.roof} ${b.xa - 14} ${b.belt - 10} ${b.xa} ${b.belt - 2} L${b.f - 22} ${b.hood - 4} Q${b.f - 2} ${b.hood - 2} ${b.f} ${b.hood + 12} L${b.f} ${g - 14} Q${b.f} ${g - 4} ${b.f - 10} ${g - 4} L${b.r + 8} ${g - 4} Q${b.r} ${g - 4} ${b.r} ${g - 12} Z`;
  }
  // geamurile: poligon sub plafon, despărțit de stâlpul B
  const top = b.roof + 5, bot = b.belt - 4, xb = Math.round((b.xr1 + b.xr2) / 2 + (b.suv ? 0 : 6));
  const glass = b.suv
    ? `<path d="M${b.r + 16} ${top + 2} L${b.xa - 26} ${top + 2} Q${b.xa - 14} ${top + 2} ${b.xa - 2} ${bot} L${b.r + 16} ${bot} Z" fill="url(#gl-${id})" stroke="#15191C" stroke-width="1.6"/><rect x="${xb - 3}" y="${top}" width="6" height="${bot - top}" fill="${paint}"/><rect x="${b.r + 96}" y="${top}" width="6" height="${bot - top}" fill="${paint}"/><rect x="${b.r + 22}" y="${b.roof - 6}" width="${b.xa - b.r - 70}" height="4" rx="2" fill="#2A2F33"/>`
    : `<path d="M${b.xc + (b.hatch || b.fast ? 20 : 12)} ${bot} C${b.xc + 30} ${bot - 12} ${b.xr1 - 20} ${top + 2} ${b.xr1 + 4} ${top} L${b.xr2 - 2} ${top} C${b.xr2 + 14} ${top} ${b.xa - 18} ${bot - 10} ${b.xa - 8} ${bot} Z" fill="url(#gl-${id})" stroke="#15191C" stroke-width="1.6"/><rect x="${xb - 3}" y="${top - 1}" width="6" height="${bot - top + 1}" fill="${b.chrome ? '#1A1E21' : paint}"/>`;
  const lights = `<path d="M${b.f - 16} ${b.hood + 2} L${b.f - 1} ${b.hood + 8} L${b.f - 1} ${b.hood + 14} L${b.f - 18} ${b.hood + 8} Z" fill="#FFF6D2" stroke="#15191C" stroke-width="1.2"/>
    <path d="M${b.r + 1} ${b.trunk + 6} L${b.r + 14} ${b.trunk + 2} L${b.r + 14} ${b.trunk + 10} L${b.r + 1} ${b.trunk + 14} Z" fill="#C8302A"/>
    ${b.nogrille ? '' : `<rect x="${b.f - 8}" y="${b.hood + 18}" width="7" height="${b.suv ? 22 : 12}" rx="2" fill="${b.chrome ? '#C9CED2' : '#2A2F33'}"/>`}`;
  const doors = `<path d="M${xb} ${b.belt - 2} L${xb} ${g - 16}" stroke="${shade(paint, .6)}" stroke-width="1.4"/><path d="M${b.xa - 4} ${b.belt} Q${b.xa} ${g - 20} ${b.xa - 6} ${g - 16}" fill="none" stroke="${shade(paint, .6)}" stroke-width="1.4"/>
    <path d="M${b.xc + 26} ${b.belt} L${b.xc + 26} ${g - 18}" stroke="${shade(paint, .6)}" stroke-width="1.4"/>
    <rect x="${xb + 10}" y="${b.belt + 5}" width="14" height="3.5" rx="1.7" fill="${shade(paint, .55)}"/><rect x="${b.xc + 36}" y="${b.belt + 5}" width="14" height="3.5" rx="1.7" fill="${shade(paint, .55)}"/>
    <path d="M${b.xa - 6} ${b.belt - 6} l10 -2 l2 6 l-11 2 Z" fill="${shade(paint, .8)}" stroke="#15191C" stroke-width="1"/>`;
  const lower = `<path d="M${b.r + 4} ${g - 22} L${b.f - 4} ${g - 22}" stroke="${shade(paint, .7)}" stroke-width="2"/>${b.chrome ? `<path d="M${b.xc} ${b.belt + 1} L${b.xa} ${b.belt + 1}" stroke="#DDE2E5" stroke-width="2"/>` : ''}`;
  const two = b.two ? `<path d="M${b.r} ${b.belt + 4} L${b.f} ${b.belt + 4} L${b.f} ${g} L${b.r} ${g} Z" fill="#C9CED2" clip-path="url(#cl-${id})"/>` : '';
  const vin = vinyl === 'stripes' ? `<path d="M${b.r + 6} ${b.belt + 14} L${b.f - 6} ${b.belt + 14}" stroke="#fff" stroke-width="5" opacity=".85" clip-path="url(#cl-${id})"/>`
    : vinyl === 'logo' ? `<g transform="translate(${xb + 40} ${b.belt + 20})">${logoFill}</g>` : '';
  const arches = b.w.map(x => `<path d="M${x - R - 6} ${g - 4} A${R + 6} ${R + 6} 0 0 1 ${x + R + 6} ${g - 4} Z" fill="#101316"/>`).join('');
  return `<svg viewBox="0 0 400 160" class="carsvg ${moving ? 'moving' : ''}"><defs><linearGradient id="gl-${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C9DCE8"/><stop offset="1" stop-color="#6F8A9C"/></linearGradient>
    <linearGradient id="bd-${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(paint, 1.12)}"/><stop offset=".55" stop-color="${paint}"/><stop offset="1" stop-color="${shade(paint, .72)}"/></linearGradient><clipPath id="cl-${id}"><path d="${body}"/></clipPath></defs>
    <ellipse cx="200" cy="${g + 8}" rx="${(b.f - b.r) / 2 + 10}" ry="6" fill="rgba(0,0,0,.3)"/>${road}<g class="bodyg">
    <path d="${body}" fill="url(#bd-${id})" stroke="#15191C" stroke-width="2.4"/>${two}${glass}${doors}${lower}${lights}${vin}${arches}</g>
    ${b.w.map(x => wheel(x, wy, R)).join('')}</svg>`;
};
A.route('garaj', async view => {
  const s = E.s(); if (!s.started) return A.go('#/firma');
  if (!A._garCar || !s.fleet.find(c => c.id === A._garCar)) A._garCar = s.fleet.length ? s.fleet[s.fleet.length - 1].id : 0;
  const sel = E.carById(A._garCar);
  const use = id => { const p = s.procs.find(x => x.car === id && x.end > Date.now()); if (!p) return null; const m = s.staff.find(x => x.id === p.staff); return { p, m }; };
  const carCard = c => { const u = use(c.id); return `<button class="carcard ${c.id === A._garCar ? 'on' : ''}" data-do="sel:${c.id}">${E.carSVG(c.tier, c.paint, c.vinyl, !!u)}<b>${A.esc(E.CARS[c.tier][0])}</b><small>${u ? `<span class="away">pe drum: ${A.esc(nameOf(u.m || { name: '?' }))} · ${A.esc(A.unitById[u.p.unit].name)} · ${E.procPhase(u.p)}</span>` : 'în garaj'}</small></button>`; };
  const busB = s.procs.filter(p => !p.car && p.end > Date.now());
  view.innerHTML = `<div class="firm">${head('Garajul', 'Flota firmei. Fiecare mașină poate duce un avocat; autobuzul e mereu la dispoziție. Mașinile mai bune aduc și prestigiu (onorarii mai mari).')}${tabs('garaj')}
    <section class="fsec"><div class="sh"><h2>Flota · ${s.fleet.length}</h2><span class="faint">Prestigiu: +${Math.round(E.prestige() * 100)}% la onorarii</span></div>
      <div class="fleet">${s.fleet.map(carCard).join('')}
        <div class="carcard bus">${E.carSVG(0, '#E2B11F', '', busB.length > 0)}<b>Autobuzul de linie</b><small>${busB.length ? `<span class="away">în autobuz: ${busB.map(p => A.esc(nameOf(s.staff.find(m => m.id === p.staff) || { name: '?' }))).join(', ')}</span>` : 'pentru oricine'}</small></div></div></section>
    <div class="fgrid">
      <section class="fsec"><div class="sh"><h2>Cumpără</h2></div>${E.CARS.slice(1).map(([nm, sp, cost, pr], i) => `<div class="tier"><div><b>${A.esc(nm)}</b><small>${sp} km/h · prestigiu +${Math.round(pr * 100)}%</small></div><button class="btn small" data-do="buy:${i + 1}">${A.lei(cost)}</button></div>`).join('')}</section>
      <section class="fsec"><div class="sh"><h2>Tuning pentru toată flota</h2></div>${Object.entries(E.TUNING).map(([k, T]) => `<div class="tier"><div><b>${T.name} ${'●'.repeat(s.tune[k])}${'○'.repeat(T.max - s.tune[k])}</b><small>${A.esc(T.desc)}</small></div>${s.tune[k] >= T.max ? '<span class="faint">maxim</span>' : `<button class="btn small" data-do="tune:${k}">${A.lei(E.tuneCost(k))}</button>`}</div>`).join('')}</section>
      ${sel ? `<section class="fsec"><div class="sh"><h2>Vopsea · ${A.esc(E.CARS[sel.tier][0])}</h2><span class="faint">din dosare sau ${A.lei(E.PAINT_COST)}</span></div><div class="paints">${E.PAINTS.map(([nm, col]) => { const own = s.owned.paints.includes(col); return `<button class="paint ${sel.paint === col ? 'on' : ''} ${own ? '' : 'lock'}" data-do="paint:${col}" style="--p:${col}" title="${A.esc(nm)}${own ? '' : ' · ' + A.lei(E.PAINT_COST)}"><i></i><small>${A.esc(nm)}</small></button>`; }).join('')}</div>
        <div class="sh" style="margin-top:14px"><h2>Colantare</h2><span class="faint">din dosare sau ${A.lei(E.VINYL_COST)}</span></div>${E.VINYLS.map(([nm, v]) => { const own = s.owned.vinyls.includes(v); return `<div class="tier ${sel.vinyl === v ? 'on' : ''}"><div><b>${A.esc(nm)}</b></div>${sel.vinyl === v ? '<span class="faint">aplicată</span>' : `<button class="btn small" data-do="vinyl:${v}">${own ? 'Aplică' : A.lei(E.VINYL_COST)}</button>`}</div>`; }).join('')}
        <p style="margin-top:12px"><button class="btn small ghost" data-do="sell:${sel.id}" ${E.carBusy(sel.id) ? 'disabled' : ''}>Vinde cu ${A.lei(E.CARS[sel.tier][2] * .5)}</button></p></section>` : ''}
    </div></div>`;
  bind(view, {
    sel: (b, id) => { A._garCar = +id; A.render(); },
    buy: (b, i) => { E.buyCar(+i); A.render(); }, tune: (b, k) => { E.tune(k); A.render(); },
    paint: (b, col) => { if (!s.owned.paints.includes(col)) { if (!E.spend(E.PAINT_COST)) return; s.owned.paints.push(col); } sel.paint = col; A.store.save(); A.render(); },
    vinyl: (b, v) => { if (!s.owned.vinyls.includes(v)) { if (!E.spend(E.VINYL_COST)) return; s.owned.vinyls.push(v); } sel.vinyl = v; A.store.save(); A.render(); },
    sell: (b, id) => { E.sellCar(+id); A.render(); },
  });
  watch(s.procs.map(p => p.end));
});

/* ---------------- mini-boși și bossii raioanelor ---------------- */
E.conqCount = () => A.raioane.filter(r => A.conquered(r.unit)).length;
E.bossDuel = r => ({ n: 15, perQuestion: 35, pass: 0.7 });
E.MINI = { n: 8, perQuestion: 40, pass: 0.75 };
E.DECAN = { n: 30, perQuestion: 30, pass: 0.75, notoriety: 500 };
E.MARKERS = k => {
  const s = E.s();
  const paints = E.PAINTS.filter(p => !s.owned.paints.includes(p[1])), vins = E.VINYLS.filter(v => !s.owned.vinyls.includes(v[1]));
  const list = [
    { t: 'Onorariu', d: A.lei(Math.round(3000 * (k + 1))), f: () => E.earn(3000 * (k + 1)) },
    { t: 'Nitro', d: '2 încărcături', f: () => E.addNitro(2) },
    { t: k >= 7 ? 'Dosar de aur' : 'Dosar de argint', d: 'în primul slot liber', f: () => E.grantChest(k >= 7 ? 'aur' : 'argint', 'Boss învins') },
    { t: 'Cartonașe', d: '5 cartonașe la întâmplare', f: () => { for (let i = 0; i < 5; i++) { const r = A.pick(['jurist', 'avocat', 'senior', 'stagiar']); s.cards[r] = (s.cards[r] || 0) + 1; } } },
    paints.length ? { t: 'Vopsea', d: paints[0][0], f: () => s.owned.paints.push(paints[0][1]) } : { t: 'Onorariu', d: A.lei(5000 * (k + 1)), f: () => E.earn(5000 * (k + 1)) },
    { t: 'Grile', d: '+20 puncte-grilă', f: () => { A.S.points.grile += 20; } },
  ];
  return A.shuffle(list);
};
/* cheile articolelor unui capitol: duelul mini-bossului se dă pe ele */
/* cheile articolelor unui capitol: duelul mini-bossului se dă pe ele */
const chapKeys = c => c.micro.flatMap(m => m.arts.map(a => A.key(m.act, a)));
/* slăbiciunea anunțată: din ce anume întreabă mini-bossul */
E.weakness = c => {
  const names = c.micro.map(m => m.name.replace(/\s*\(\d+\/\d+\)\s*$/, '').split(' · ')[0]);
  const u = [...new Set(names)].slice(0, 3);
  const a0 = c.micro[0], a1 = c.micro[c.micro.length - 1];
  return { teme: u, interval: `${A.actShort(a0.act)}, art. ${A.idToNum(a0.arts[0])}–${A.idToNum(a1.arts[a1.arts.length - 1])}` };
};
E.MINI = { hp: 8, lives: 3, perQuestion: 40 };
E.MINI_PREP = 3;                      // întrebări de pregătire obligatorii după o înfrângere
E.miniFee = c => 400 * (c.ci + 1);    // cheltuielile duelului pierdut
E.miniPrize = c => 2500 * (c.ci + 1);
E.miniPerk = c => E.PERKS[c.ci % E.PERKS.length];
E.prepLeft = cid => { const p = (A.S.study.prep || {})[cid]; return p ? Math.max(0, p.need - p.done) : 0; };

/* pregătirea obligatorie: întrebări din articolele la care ai greșit */
function miniPrep(view, c, keys) {
  const cid = c.id;
  const ask = () => {
    const left = E.prepLeft(cid);
    if (!left) { A.render(); return; }
    A.quiz.mini('keys:' + A.shuffle(keys).slice(0, 12).join(','), `Pregătire pentru revanșă (${E.MINI_PREP - left + 1}/${E.MINI_PREP})`, (ok, none) => {
      if (none) { A.S.study.prep[cid].done = A.S.study.prep[cid].need; A.store.save(); A.render(); return; }
      if (ok) A.S.study.prep[cid].done++;
      else A.toast('Răspuns greșit: întrebarea nu se pune la socoteală.');
      A.store.save();
      setTimeout(ask, 300);
    });
  };
  ask();
}

/* ecranul dinaintea duelului: cine e, ce întreabă, ce pui în joc, ce câștigi */
function miniIntro(view, c) {
  const w = E.weakness(c), prep = E.prepLeft(c.id), rematch = ST.beaten(c.id), perk = E.miniPerk(c);
  const keys = chapKeys(c);
  view.innerHTML = `<div class="bossintro">
    <a class="back" href="#/raion/${c.unit}">← ${A.esc(A.unitById[c.unit].name)}</a>
    <div class="bcard">
      <div class="bseal">${A.stampSVG('mini-boss', 'capitolul ' + (c.ci + 1), String(c.ci + 1), 'var(--seal)', -8)}</div>
      <div>
        <h1>${A.esc(c.boss)}</h1>
        <p class="muted">Mini-bossul capitolului ${c.ci + 1}: ${A.esc(c.name)}.</p>
        <div class="weak2"><b>Întreabă numai din:</b> ${w.teme.map(t => `<span class="tag">${A.esc(t)}</span>`).join('')} <span class="faint">(${A.esc(w.interval)})</span></div>
        <ul class="rules">
          <li>Ai <b>${E.MINI.lives} vieți</b>. Fiecare răspuns greșit îți ia una.</li>
          <li>Îl dobori cu <b>${E.MINI.hp} răspunsuri corecte</b>. Rămâi fără vieți, ai pierdut.</li>
          <li>Ieșirea din aplicație în timpul duelului contează ca răspuns greșit.</li>
          <li>Dacă pierzi, plătești <b>${A.lei(E.miniFee(c))}</b> cheltuieli și reiei doar după <b>${E.MINI_PREP} întrebări de pregătire</b> din articolele la care ai greșit.</li>
        </ul>
        <div class="loot2"><b>Dacă învingi:</b> ${A.lei(E.miniPrize(c))} · 60 XP · un dosar · 5 puncte-grilă${rematch ? '' : ` · trofeul <b>${A.esc(perk.n)}</b> — ${A.esc(perk.d)}`}</div>
        ${prep ? `<div class="lockbar"><b>Pregătire neterminată:</b> mai ai ${prep} ${prep === 1 ? 'întrebare' : 'întrebări'} înainte de revanșă.</div>
          <button class="btn primary big" id="prep">Continuă pregătirea</button>`
        : `<button class="btn primary big" id="go">${rematch ? 'Revanșă' : 'Intră în duel'}</button>`}
      </div>
    </div></div>`;
  const g = A.$('#go', view); if (g) g.onclick = () => miniDuel(view, c);
  const pb = A.$('#prep', view); if (pb) pb.onclick = () => miniPrep(view, c, (A.S.study.prep[c.id] || {}).keys || keys);
}

function miniDuel(view, c) {
  const cid = c.id, rematch = ST.beaten(cid), perk = E.miniPerk(c);
  return A.quiz.run(view, { mode: 'duel', keys: A.shuffle(chapKeys(c)), hp: E.MINI.hp, lives: E.MINI.lives, n: 99,
    perQuestion: E.MINI.perQuestion, study: c.micro.map(m => m.id), bankShare: .9, title: `${c.boss}`, onDone: (res, root) => {
    const won = res.ok >= E.MINI.hp;
    if (!won) {
      A.sound('ko');
      const fee = E.miniFee(c); E.s().money -= fee;
      const wrongKeys = [...new Set(res.wrong)];
      A.S.study.prep[cid] = { need: E.MINI_PREP, done: 0, at: Date.now(), keys: wrongKeys.length ? wrongKeys : chapKeys(c).slice(0, 12) };
      A.store.save();
      root.innerHTML = '';
      A.arena.victory({ win: false, crowns: 0, title: `${A.esc(c.boss)} te-a scos din sală`, sub: `${res.ok}/${E.MINI.hp} lovituri date · cheltuieli ${A.lei(fee)}.<br>Înainte de revanșă: ${E.MINI_PREP} întrebări din articolele la care ai greșit.`,
        extra: wrongKeys.length ? `<div class="vweak">${wrongKeys.slice(0, 6).map(k => { const [a, r] = k.split(':'); return `<a href="#/act/${a}/a/${r}">${A.actShort(a)}, art. ${A.idToNum(r)}</a>`; }).join('')}</div>` : '',
        primary: { t: 'Începe pregătirea', fn: () => miniPrep(view, c, A.S.study.prep[cid].keys) }, secondary: { t: 'Înapoi', href: '#/raion/' + c.unit } });
      return;
    }
    if (rematch) {
      const p2 = E.earn(Math.round(E.miniPrize(c) * .3)); A.game.addXP(15); A.store.save();
      const lv = Math.max(0, E.MINI.lives - (res.answered - res.ok)); root.innerHTML = '';
      A.arena.victory({ win: true, crowns: lv, title: 'Revanșă câștigată', rewards: [{ ico: A.arena.ICO.lei, n: p2, label: 'lei' }, { ico: A.arena.ICO.xp, n: 15, label: 'XP' }], primary: { t: 'Înapoi', href: '#/raion/' + c.unit } });
      return;
    }
    A.S.study.chapters[cid] = A.today();
    const prize = E.earn(E.miniPrize(c)); A.game.addXP(60); E.grantChest(c.ci >= 8 ? 'magic' : c.ci >= 6 ? 'aur' : 'argint', 'Mini-boss învins'); A.S.points.grile += 5;
    const got = E.grantPerk(perk.id, 'Trofeu: ' + c.boss);
    A.store.save(); A.game.checkStamps();
    const next = ST.chapters(c.unit)[c.ci + 1], lives = Math.max(0, E.MINI.lives - (res.answered - res.ok)), [rk, rn] = A.arena.rarity(c.ci); root.innerHTML = '';
    A.arena.victory({ win: true, crowns: lives, title: `${c.boss} a fost învins`, sub: `<span class="rar ${rk}">${rn}</span> Capitolul ${c.ci + 1} · ${lives} ${lives === 1 ? 'viață rămasă' : 'vieți rămase'}<br>${next ? `S-a deschis capitolul ${c.ci + 2}: ${A.esc(next.name)}.` : `Toți mini-boșii au căzut: dosarul bossului, ${A.esc(A.raion(c.unit).boss)}, te așteaptă.`}`,
      rewards: [{ ico: A.arena.ICO.lei, n: prize, label: 'lei' }, { ico: A.arena.ICO.xp, n: 60, label: 'XP' }, { ico: A.arena.ICO.gr, n: 5, label: 'puncte-grilă' }, { ico: A.arena.ICO.chest(c.ci >= 6 ? 'aur' : 'argint'), label: 'dosar' }],
      extra: got ? `<div class="trophy"><b>Trofeu: ${A.esc(got.n)}</b><span>${A.esc(got.d)}</span></div>` : '', primary: { t: 'Înapoi la raion', href: '#/raion/' + c.unit } });
  } });
}

function duel(view, unit) {
  const s = E.s(), decan = unit === 'decan', r = decan ? null : A.raion(unit);
  if (!decan && !r) return A.go('#/cariera');
  const all = E.conqCount() === A.raioane.length;
  if (decan && (!all || (s.notoriety || 0) < E.DECAN.notoriety)) return A.go('#/cariera');
  if (!decan && !A.conquered(unit) && !ST.bossReady(unit)) return A.go('#/raion/' + unit);
  const name = decan ? A.finalBoss.name : r.boss, rematch = !decan && A.conquered(unit);
  return A.dosar.run(view, {
    unit, name, title: `Dosarul contra ${name}`,
    onLose: (score, host) => {
      const fee = decan ? 25000 : 2000 + Math.round((r.n || 100) * 20);
      s.money -= fee; A.store.save();
      host.innerHTML = `<p>Cheltuieli de judecată: ${A.lei(fee)}. Recitește și depune un dosar nou.</p>
        <div class="mbtns"><a class="btn primary" href="#/cariera/duel/${unit}">Dosar nou</a><a class="btn" href="${decan ? '#/cariera' : '#/raion/' + unit}">Înapoi</a></div>`;
    },
    onWin: (score, host) => {
      if (rematch) { const g = E.earn(2000); host.innerHTML = `<p>Proces câștigat din nou: +${A.lei(g)}.</p><div class="mbtns"><a class="btn primary" href="#/raion/${unit}">Înapoi</a></div>`; A.store.save(); return; }
      const k = E.conqCount();
      if (decan) A.S.conq.__decan = A.today(); else A.S.conq[unit] = A.today();
      const prize = E.earn(decan ? 500000 : Math.round(r.n * 150 * (1 + 0.2 * k) * (score >= .95 ? 1.25 : 1)));
      if (!decan && s.started && !s.branches.includes(unit)) s.branches.push(unit);
      A.game.addXP(decan ? 1000 : 250); A.S.points.spete += 5;
      const lg = s.started ? E.grantChest('decan', decan ? 'Decanul' : 'Raion cucerit') : false;
      A.store.save(); A.game.checkStamps();
      const next = decan ? null : A.raion(ST.current());
      const marks = E.MARKERS(Math.min(14, k)); let picked = 0;
      host.innerHTML = `<div class="stampwrap slam" style="color:var(--seal)">${A.stampSVG('cucerit', decan ? 'decanul' : r.name, '✓', 'var(--seal)', -10)}</div>
        <p>${decan ? 'Toată harta este a ta.' : `${A.esc(r.name)} este cucerit${s.started ? ' și ai o filială acolo' : ''}.`} +${A.lei(prize)} · +${decan ? 1000 : 250} XP · +5 puncte-speță${lg ? ' · un dosar legendar' : ''}.${next ? ` S-a deschis ${A.esc(next.name)}.` : ''}</p>
        ${s.started ? `<p class="muted">Alege două dintre cele șase plicuri sigilate.</p><div class="markers">${marks.map((m, x) => `<button class="marker" data-i="${x}"><span>?</span></button>`).join('')}</div>` : ''}
        <div id="mk-done" ${s.started ? 'hidden' : ''} style="margin-top:16px"><a class="btn primary" href="#/harta">Harta</a>${next ? ` <a class="btn" href="#/raion/${next.unit}">Mergi la ${A.esc(next.name)}</a>` : ''}</div>`;
      A.$$('.marker', host).forEach(b => b.onclick = () => {
        if (picked >= 2 || b.classList.contains('got')) return;
        const m = marks[+b.dataset.i]; m.f(); picked++; A.sound('coin');
        b.classList.add('got'); b.innerHTML = `<b>${A.esc(m.t)}</b><small>${A.esc(m.d)}</small>`;
        if (picked === 2) { A.$$('.marker:not(.got)', host).forEach(x => { const mm = marks[+x.dataset.i]; x.classList.add('miss'); x.innerHTML = `<b>${A.esc(mm.t)}</b><small>${A.esc(mm.d)}</small>`; }); A.$('#mk-done', host).hidden = false; A.store.save(); }
      });
    },
  });
}
A.route('cariera', async (view, [mode, unit]) => {
  const s = E.s();
  if (mode === 'duel') return duel(view, unit || 'decan');
  if (mode === 'mini') { const c = ST.chapById[unit]; if (!c) return A.go('#/cariera');
    if (!ST.beaten(c.id) && !ST.miniReady(c)) return A.go('#/raion/' + c.unit);
    return miniIntro(view, c); }
  const cur = ST.current(), k = E.conqCount(), all = k === A.raioane.length, decanDone = !!A.S.conq.__decan;
  const miniRow = c => { const st = ST.chapStats(c), b = ST.beaten(c.id), open = ST.chapterOpen(c), ready = ST.miniReady(c);
    return `<div class="mrow ${b ? 'won' : ready ? 'ready' : open ? '' : 'lock'}"><span class="mn">${c.ci + 1}</span><div><b>${A.esc(c.boss)}</b><small>${A.esc(c.name)} · ${st.und}/${st.n} articole înțelese</small></div>
      ${b ? '<span class="ok">învins</span>' : ready ? `<a class="btn small primary" href="#/cariera/mini/${c.id}">Provoacă</a>` : open ? `<span class="faint">${st.microDone}/${st.micro} micro-secțiuni</span>` : '<span class="faint">blocat</span>'}</div>`; };
  const card = r => {
    const won = A.conquered(r.unit), lock = A.locked(r.unit), isCur = r.unit === cur, ready = ST.bossReady(r.unit);
    return `<div class="bcard ${lock ? 'lock' : won ? 'won' : ready ? 'ready' : ''}" style="--c:${A.disc[r.disc].color}">
      <div class="bt"><b>${A.esc(r.boss)}</b>${won ? A.stampSVG('învins', r.name, '✓', 'var(--seal)', -12) : ''}</div>
      <small>${A.esc(r.name)} · ${A.esc(r.short)} · ${r.n} articole</small>
      <p>${won ? `Învins pe ${A.S.conq[r.unit]}` : lock ? 'Se deschide după raionul curent' : `${ST.beatenCount(r.unit)}/9 mini-boși învinși`}</p>
      ${won ? `<a class="btn small" href="#/cariera/duel/${r.unit}">Revanșă</a>` : ready ? `<a class="btn small primary" href="#/cariera/duel/${r.unit}">Provoacă</a>` : isCur ? `<a class="btn small" href="#/raion/${r.unit}">Deschide raionul</a>` : ''}</div>`;
  };
  const curR = cur && A.raion(cur);
  view.innerHTML = `<div class="firm">${s.started ? head('Bossii', '') + tabs('cariera') : '<h1>Bossii</h1>'}
    ${curR ? `<section class="fsec"><div class="sh"><h2>${A.esc(curR.name)} · mini-boșii capitolelor</h2><span class="faint">Fiecare mini-boss apare după ce citești și înțelegi tot capitolul lui</span></div><div class="minis">${ST.chapters(cur).map(miniRow).join('')}</div>
      <div class="mrow big ${ST.bossReady(cur) ? 'ready' : 'lock'}"><span class="mn">★</span><div><b>${A.esc(curR.boss)}</b><small>Bossul raionului: duel de ${E.bossDuel(curR).n} grile, ${Math.round(E.bossDuel(curR).pass * 100)}% corecte</small></div>${ST.bossReady(cur) ? `<a class="btn primary" href="#/cariera/duel/${cur}">Provoacă</a>` : '<span class="faint">după cei 9 mini-boși</span>'}</div></section>` : ''}
    <section class="fsec decan ${decanDone ? 'won' : all ? 'ready' : ''}"><div class="rv"><span class="rnum">${k}/${A.raioane.length}</span><div><h2>${A.esc(A.finalBoss ? A.finalBoss.name : 'Decanul')}</h2>
      <small class="muted">${decanDone ? 'Învins. Harta este a ta.' : all ? 'Toți bossii au căzut. Decanul te așteaptă.' : 'Apare după ce cucerești toate raioanele.'}</small></div></div>
      ${all && !decanDone ? `<a class="btn primary" href="#/cariera/duel/decan">Provoacă Decanul</a>` : ''}</section>
    <div class="bgrid">${ST.order.map(u => A.raion(u)).filter(Boolean).map(card).join('')}</div></div>`;
});
})();
