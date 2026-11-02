/* Cititorul articolelor: motorul de voce al dispozitivului (iPhone, Android, Windows), fără servicii externe. */
'use strict';
A.tts = {};
const TT = A.tts;
const synth = () => (window.speechSynthesis || null);
TT.supported = () => !!synth() && typeof SpeechSynthesisUtterance !== 'undefined';
const cfg = () => A.S.settings;
TT.rate = () => { const r = +(cfg().ttsRate || 1); return Math.min(2, Math.max(.5, r)); };

/* voci românești, cu cele mai naturale în față (nume care conțin „Natural”, „Enhanced”, „Premium”, „Neural”) */
TT.voices = () => {
  if (!TT.supported()) return [];
  const all = synth().getVoices() || [];
  return all.filter(v => /^ro/i.test(v.lang) || /român|romanian/i.test(v.name))
    .sort((a, b) => TT.score(b) - TT.score(a));
};
TT.score = v => (/natural|enhanced|premium|neural|online/i.test(v.name) ? 10 : 0) + (v.localService ? 0 : 2) + (/google|microsoft/i.test(v.name) ? 1 : 0);
TT.voice = () => { const list = TT.voices(), want = cfg().ttsVoice; return list.find(v => v.voiceURI === want) || list[0] || null; };

/* textul juridic se citește prost brut: „art. 1000” → „articolul 1000”, „alin. (2)” → „alineatul 2” și așa mai departe */
const ROMAN = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9, X: 10 };
TT.normalize = s => String(s)
  .replace(/\bCC\b/g, 'Codul civil').replace(/\bCPC\b/g, 'Codul de procedură civilă').replace(/\bCF\b/g, 'Codul familiei')
  .replace(/\bCE\b/g, 'Codul de executare').replace(/\bLTS\b/g, 'Legea taxei de stat')
  .replace(/\bart\.\s*/gi, 'articolul ').replace(/\balin\.\s*\((\d+)\)/gi, 'alineatul $1').replace(/\balin\.\s*/gi, 'alineatul ')
  .replace(/\blit\.\s*([a-zăâîșț])\)?/gi, 'litera $1').replace(/\bpct\.\s*/gi, 'punctul ').replace(/\bnr\.\s*/gi, 'numărul ')
  .replace(/\bși urm\./gi, 'și următoarele').replace(/\bLegea nr\.\s*/gi, 'Legea numărul ')
  .replace(/\b([IVX]{1,4})\b(?=\s*[-–.)])/g, m => ROMAN[m] ? String(ROMAN[m]) : m)
  .replace(/\s*–\s*/g, ', până la ').replace(/\s*;\s*/g, '; ').replace(/\s+/g, ' ').trim();

/* împarte în propoziții scurte, ca pauzele să fie naturale și citirea să nu se oprească pe paragrafe lungi */
TT.chunks = text => {
  const out = [];
  for (const para of String(text).split(/\n+/)) {
    const p = TT.normalize(para); if (!p) continue;
    const sents = p.match(/[^.!?;:]+[.!?;:]*/g) || [p];
    let cur = '';
    for (const s of sents) { if ((cur + s).length > 220 && cur) { out.push(cur.trim()); cur = s; } else cur += s; }
    if (cur.trim()) out.push(cur.trim());
  }
  return out;
};

let queue = [], playing = false, current = null, onDone = null;
TT.stop = () => { queue = []; playing = false; current = null; if (synth()) synth().cancel(); if (onDone) { const f = onDone; onDone = null; f(false); } TT.paint(); };
TT.speak = (text, id, done) => {
  if (!TT.supported()) { A.toast('Dispozitivul tău nu are citire vocală în aplicație.'); return; }
  TT.stop();
  current = id; onDone = done || null; queue = TT.chunks(text); playing = true;
  const sy = synth(); sy.resume && sy.resume();
  const v = TT.voice(), rate = TT.rate();
  const next = () => {
    if (!playing) return;
    const part = queue.shift();
    if (!part) { playing = false; current = null; const f = onDone; onDone = null; TT.paint(); f && f(true); return; }
    const u = new SpeechSynthesisUtterance(part);
    u.lang = 'ro-RO'; u.rate = rate; u.pitch = 1; u.volume = 1; if (v) u.voice = v;
    u.onend = () => setTimeout(next, 180);       // pauză scurtă între propoziții
    u.onerror = () => { if (playing) setTimeout(next, 60); };
    sy.speak(u);
  };
  TT.paint(); next();
};
TT.paint = () => A.$$('[data-tts]').forEach(b => { const on = b.dataset.tts === current; b.classList.toggle('on', on); b.textContent = on ? '■ Oprește' : '🔊 Ascultă'; });
/* la schimbarea paginii sau la ecran blocat, citirea se oprește */
addEventListener('hashchange', () => TT.stop());
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') TT.stop(); });

/* textul unui articol: titlul, apoi paragrafele (fără note și fără liste de tabel) */
TT.artText = a => {
  const parts = [];
  if (a.title) parts.push(`Articolul ${a.num}. ${a.title}.`); else parts.push(`Articolul ${a.num}.`);
  for (const b of a.blocks || []) if (b.k !== 'note' && b.t) parts.push(String(b.t).replace(/\s+/g, ' ').trim());
  return parts.join('\n');
};
/* butonul din articol: se ascultă sau se oprește */
TT.bind = (view, act) => {
  A.$$('[data-tts]', view).forEach(b => b.onclick = e => {
    e.preventDefault(); e.stopPropagation();
    if (current === b.dataset.tts) { TT.stop(); return; }
    const a = act.artById[b.dataset.tts]; if (!a) return;
    TT.speak(TT.artText(a), b.dataset.tts);
  });
  TT.paint();
};
