/* Cititorul articolelor: motorul de voce al dispozitivului (iPhone, Android, Windows), fără servicii externe.
   Evidențiază cuvântul citit acum (evenimentul „boundary”), cu rezervă pe ritm estimat când dispozitivul nu îl trimite. */
'use strict';
A.tts = {};
const TT = A.tts;
const synth = () => window.speechSynthesis || null;
TT.supported = () => !!synth() && typeof SpeechSynthesisUtterance !== 'undefined';
const cfg = () => A.S.settings;
TT.lang = () => (cfg().ttsLang === 'it' ? 'it' : 'ro');
TT.tag = () => (TT.lang() === 'it' ? 'it-IT' : 'ro-RO');
TT.rate = () => Math.min(2, Math.max(.5, +(cfg().ttsRate || 1)));

/* vocile limbii alese, cele mai naturale primele */
TT.voices = () => {
  if (!TT.supported()) return [];
  const pre = TT.lang(), all = synth().getVoices() || [];
  const ok = v => new RegExp('^' + pre, 'i').test(v.lang) || (pre === 'ro' ? /român|romanian/i.test(v.name) : /italian|italiano/i.test(v.name));
  return all.filter(ok).sort((a, b) => TT.score(b) - TT.score(a));
};
TT.score = v => (/natural|enhanced|premium|neural|online/i.test(v.name) ? 10 : 0) + (v.localService ? 0 : 2) + (/google|microsoft/i.test(v.name) ? 1 : 0);
TT.voice = () => { const list = TT.voices(), want = cfg().ttsVoice; return list.find(v => v.voiceURI === want) || list[0] || null; };
if (synth()) synth().onvoiceschanged = () => { if (/^#\/setari/.test(location.hash)) A.render(); };

/* abrevieri juridice citite ca cuvinte întregi, pe fiecare cuvânt */
const TOK = { 'art.': 'articolul', 'Art.': 'articolul', 'alin.': 'alineatul', 'Alin.': 'alineatul', 'lit.': 'litera', 'Lit.': 'litera',
  'pct.': 'punctul', 'nr.': 'numărul', 'cap.': 'capitolul', 'sec.': 'secțiunea', 'CC': 'Codul civil', 'CPC': 'Codul de procedură civilă',
  'CF': 'Codul familiei', 'CE': 'Codul de executare', 'LTS': 'Legea taxei de stat' };
const ROMAN = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9, X: 10 };
/* cuvântul așa cum e citit; în română se înlocuiesc abrevierile, în italiană se citește textul tal cum e */
TT.spoken = tok => {
  if (TT.lang() === 'it') return tok;
  if (TOK[tok]) return TOK[tok];
  let m = tok.match(/^\(?(\d+)\)?[.;:,]?$/); if (m) return m[1];
  m = tok.match(/^\(?([a-zăâîșț])\)[;:,]?$/i); if (m) return m[1];
  m = tok.match(/^([IVX]{1,4})([.;:,)–-]*)$/); if (m && ROMAN[m[1]]) return String(ROMAN[m[1]]) + m[2].replace(/[–-]/g, '');
  return tok.replace(/(\d)\s*[–-]\s*(\d)/g, '$1 până la $2').replace(/\bnr\.\s*/gi, 'numărul ');
};

/* transformă textul articolului în cuvinte separate, fiecare marcată cu un span (ca să fie evidențiată) */
const SKIP = '.tools, .mynote, .comm, button, .lvl, .btn';
TT.wrap = root => {
  const words = [], nodes = [], w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  while (w.nextNode()) { const n = w.currentNode; if (!n.nodeValue.trim()) continue; if (n.parentElement && n.parentElement.closest(SKIP)) continue; nodes.push(n); }
  for (const n of nodes) {
    const frag = document.createDocumentFragment();
    for (const p of n.nodeValue.split(/(\s+)/)) {
      if (!p) continue;
      if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(p)); continue; }
      const sp = document.createElement('span'); sp.className = 'tw'; sp.textContent = p;
      const blk = n.parentElement && n.parentElement.closest('h1,h2,h3,h4,h5,p,li,td,div');
      words.push({ el: sp, s: TT.spoken(p), end: /[.!?;:]$/.test(p) && TOK[p] === undefined, blk }); frag.appendChild(sp);
    }
    n.replaceWith(frag);
  }
  /* sfârșit de paragraf: pauză și bucată nouă, ca titlul și textul să nu se lipească */
  words.forEach((x, i) => { if (i + 1 < words.length && words[i + 1].blk !== x.blk) x.end = true; });
  return words;
};
TT.unwrap = root => { if (!root) return; for (const sp of root.querySelectorAll('span.tw')) sp.replaceWith(document.createTextNode(sp.textContent)); root.normalize(); };

/* bucăți de ~220 de caractere, rupte la sfârșit de propoziție; fiecare bucată ține minte cuvintele și pozițiile lor */
TT.chunks = words => {
  const out = []; let cur = null;
  const push = () => { if (cur && cur.w.length) out.push(cur); cur = null; };
  words.forEach((x, i) => {
    if (cur && cur.text.length + 1 + x.s.length > 220) push();
    if (!cur) cur = { text: '', w: [], off: [] };
    cur.off.push(cur.text ? cur.text.length + 1 : 0);
    cur.text += (cur.text ? ' ' : '') + x.s; cur.w.push(i);
    if (x.end) push();
  });
  push();
  return out;
};

let SP = null; /* estat curent: {id, words, queue, root, done, timer} */
const hl = i => {
  if (!SP) return; const prev = SP.hot; if (prev != null && SP.words[prev]) SP.words[prev].el.classList.remove('on');
  if (i == null || !SP.words[i]) { SP.hot = null; return; }
  const el = SP.words[i].el; el.classList.add('on'); SP.hot = i;
  const r = el.getBoundingClientRect(); if (r.top < 90 || r.bottom > innerHeight - 90) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
};
const clearTimer = () => { if (SP && SP.timer) { clearInterval(SP.timer); SP.timer = null; } };

TT.stop = () => {
  if (!SP) return;
  clearTimer(); if (synth()) synth().cancel();
  hl(null); TT.unwrap(SP.root);
  const done = SP.done; SP = null; TT.paint(); done && done(false);
};
TT.speak = (root, id, done) => {
  if (!TT.supported()) { A.toast('Dispozitivul tău nu are citire vocală în aplicație.'); return; }
  TT.stop();
  const words = TT.wrap(root);
  if (!words.length) { TT.unwrap(root); return; }
  SP = { id, root, words, queue: TT.chunks(words), done, hot: null, timer: null };
  const sy = synth(); sy.resume && sy.resume();
  const v = TT.voice(), rate = TT.rate();
  const next = () => {
    if (!SP) return;
    const ch = SP.queue.shift();
    if (!ch) { const d = SP.done; const r = SP.root; hl(null); TT.unwrap(r); SP = null; TT.paint(); d && d(true); return; }
    const u = new SpeechSynthesisUtterance(ch.text);
    u.lang = TT.tag(); u.rate = rate; u.pitch = 1; u.volume = 1; if (v) u.voice = v;
    let real = false, k = 0;
    const at = pos => { /* poziția caracterului → cuvântul din bucată */
      let j = 0; while (j + 1 < ch.off.length && ch.off[j + 1] <= pos) j++; return j; };
    u.onboundary = e => { if (!SP || (e.name && e.name !== 'word')) return; real = true; clearTimer(); hl(ch.w[at(e.charIndex || 0)]); };
    u.onstart = () => {
      /* rezervă: dacă dispozitivul nu trimite poziția cuvintelor, mergem în ritmul vorbirii */
      setTimeout(() => {
        if (!SP || real) return;
        const per = 330 / rate; k = 0; hl(ch.w[0]);
        SP.timer = setInterval(() => { if (!SP || real) return clearTimer(); if (++k >= ch.w.length) return clearTimer(); hl(ch.w[k]); }, per);
      }, 500);
    };
    u.onend = () => { clearTimer(); if (SP) setTimeout(next, 170); };
    u.onerror = () => { clearTimer(); if (SP) setTimeout(next, 60); };
    sy.speak(u);
  };
  TT.paint(); next();
};
TT.paint = () => A.$$('[data-tts]').forEach(b => { const on = !!SP && b.dataset.tts === SP.id; b.classList.toggle('on', on); b.textContent = on ? '■ Oprește' : '🔊 Ascultă'; });
/* la schimbarea paginii sau la ecran blocat, citirea se oprește */
addEventListener('hashchange', () => TT.stop());
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') TT.stop(); });

/* butonul din articol */
TT.bind = (view) => {
  A.$$('[data-tts]', view).forEach(b => b.onclick = e => {
    e.preventDefault(); e.stopPropagation();
    if (SP && SP.id === b.dataset.tts) { TT.stop(); return; }
    const art = b.closest('article'); if (!art) return;
    TT.speak(art, b.dataset.tts);
  });
  TT.paint();
};
