/* Atlasul legislativ — însemnele biroului: sigla, ștampila și insigna, desenate o dată, aceleași pentru toți.
   Sigla este și iconița aplicației (icons/*.png se generează din A.brand.logo()). */
'use strict';
(() => {
let uid = 0;
const id = p => p + (++uid);

/* balanța justiției: stâlp, braț, două talere pe lanțuri; (cx, cy) = vârful stâlpului */
const scales = (cx, cy, k, fill, line) => {
  const s = v => (v * k).toFixed(1), X = v => (cx + v * k).toFixed(1), Y = v => (cy + v * k).toFixed(1);
  const pan = dx => `
    <path d="M${X(dx)} ${Y(4)} L${X(dx - 46)} ${Y(118)} M${X(dx)} ${Y(4)} L${X(dx + 46)} ${Y(118)}" stroke="${line}" stroke-width="${s(3.2)}" fill="none" stroke-linecap="round"/>
    <path d="M${X(dx - 62)} ${Y(116)} Q${X(dx)} ${Y(176)} ${X(dx + 62)} ${Y(116)} Z" fill="${fill}" stroke="${line}" stroke-width="${s(5)}" stroke-linejoin="round"/>
    <path d="M${X(dx - 50)} ${Y(124)} Q${X(dx)} ${Y(160)} ${X(dx + 50)} ${Y(124)}" fill="none" stroke="rgba(255,255,255,.45)" stroke-width="${s(4)}" stroke-linecap="round"/>`;
  return `<g>
    <path d="M${X(-9)} ${Y(-6)} L${X(9)} ${Y(-6)} L${X(13)} ${Y(232)} L${X(-13)} ${Y(232)} Z" fill="${fill}" stroke="${line}" stroke-width="${s(5)}" stroke-linejoin="round"/>
    <path d="M${X(-60)} ${Y(232)} L${X(60)} ${Y(232)} L${X(74)} ${Y(258)} L${X(-74)} ${Y(258)} Z" fill="${fill}" stroke="${line}" stroke-width="${s(5)}" stroke-linejoin="round"/>
    <rect x="${X(-36)}" y="${Y(214)}" width="${s(72)}" height="${s(20)}" rx="${s(4)}" fill="${fill}" stroke="${line}" stroke-width="${s(5)}"/>
    <path d="M${X(-150)} ${Y(8)} Q${X(0)} ${Y(-22)} ${X(150)} ${Y(8)}" fill="none" stroke="${line}" stroke-width="${s(17)}" stroke-linecap="round"/>
    <path d="M${X(-150)} ${Y(8)} Q${X(0)} ${Y(-22)} ${X(150)} ${Y(8)}" fill="none" stroke="${fill}" stroke-width="${s(9)}" stroke-linecap="round"/>
    ${pan(-150)}${pan(150)}
    <circle cx="${X(0)}" cy="${Y(-16)}" r="${s(19)}" fill="${fill}" stroke="${line}" stroke-width="${s(5)}"/>
    <circle cx="${X(-5)}" cy="${Y(-21)}" r="${s(6)}" fill="rgba(255,255,255,.6)"/>
    <circle cx="${X(-150)}" cy="${Y(6)}" r="${s(9)}" fill="${fill}" stroke="${line}" stroke-width="${s(4)}"/>
    <circle cx="${X(150)}" cy="${Y(6)}" r="${s(9)}" fill="${fill}" stroke="${line}" stroke-width="${s(4)}"/>
  </g>`;
};

/* ramură de lauri pe un arc, de la unghiul a0 la a1 (grade), în jurul (cx, cy) */
const laurel = (cx, cy, R, a0, a1, n, size, fill, line) => {
  let out = `<path d="${arc(cx, cy, R, a0, a1)}" fill="none" stroke="${line}" stroke-width="${(size * .32).toFixed(1)}" stroke-linecap="round"/><path d="${arc(cx, cy, R, a0, a1)}" fill="none" stroke="${fill}" stroke-width="${(size * .16).toFixed(1)}" stroke-linecap="round"/>`;
  const dir = a1 > a0 ? 1 : -1;
  for (let i = 0; i < n; i++) {
    const ad = a0 + (a1 - a0) * (i + .6) / n, a = ad * Math.PI / 180, x = cx + R * Math.cos(a), y = cy + R * Math.sin(a);
    const tang = ad + 90 * dir, sz = size * (1 - .35 * i / n);      // frunzele se micșorează spre vârful ramurii
    for (const side of [-1, 1]) {
      const phi = (tang + side * 38) * Math.PI / 180, lx = x + Math.cos(phi) * sz * .95, ly = y + Math.sin(phi) * sz * .95;
      out += `<ellipse cx="${lx.toFixed(1)}" cy="${ly.toFixed(1)}" rx="${(sz * .4).toFixed(1)}" ry="${sz.toFixed(1)}" transform="rotate(${(tang + side * 38 - 90).toFixed(1)} ${lx.toFixed(1)} ${ly.toFixed(1)})" fill="${fill}" stroke="${line}" stroke-width="${(sz * .15).toFixed(1)}"/>`;
    }
  }
  return out;
};
const arc = (cx, cy, R, a0, a1) => { const p = a => [cx + R * Math.cos(a * Math.PI / 180), cy + R * Math.sin(a * Math.PI / 180)]; const [x0, y0] = p(a0), [x1, y1] = p(a1);
  return `M${x0.toFixed(1)} ${y0.toFixed(1)} A${R} ${R} 0 ${Math.abs(a1 - a0) > 180 ? 1 : 0} ${a1 > a0 ? 1 : 0} ${x1.toFixed(1)} ${y1.toFixed(1)}`; };
const star = (cx, cy, r, fill, line, sw) => { let d = ''; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .45 : r; d += (i ? 'L' : 'M') + (cx + rr * Math.cos(a)).toFixed(1) + ' ' + (cy + rr * Math.sin(a)).toFixed(1); }
  return `<path d="${d}Z" fill="${fill}" stroke="${line}" stroke-width="${sw}" stroke-linejoin="round"/>`; };

A.brand = {};

/* ---------- sigla: scut heraldic cu balanța, lauri, panglica LEX ---------- */
A.brand.logo = (opt = {}) => {
  const g = id('g'), bg = id('b'), sh = id('s'), rim = id('r'), ray = id('y'), clip = id('c');
  const bgRect = opt.bare ? '' : `<rect width="512" height="512" rx="${opt.square ? 0 : 112}" fill="url(#${bg})"/>
    <g opacity=".13" clip-path="url(#${clip})">${Array.from({ length: 24 }, (_, i) => `<path d="M256 236 L${(256 + 420 * Math.cos(i * Math.PI / 12)).toFixed(0)} ${(236 + 420 * Math.sin(i * Math.PI / 12)).toFixed(0)} L${(256 + 420 * Math.cos(i * Math.PI / 12 + .13)).toFixed(0)} ${(236 + 420 * Math.sin(i * Math.PI / 12 + .13)).toFixed(0)} Z" fill="url(#${ray})"/>`).join('')}</g>`;
  return `<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" class="brand-logo"><defs>
    <clipPath id="${clip}"><rect width="512" height="512" rx="${opt.square ? 0 : 112}"/></clipPath>
    <radialGradient id="${bg}" cx="50%" cy="38%" r="75%"><stop offset="0" stop-color="#2C5A96"/><stop offset=".55" stop-color="#142A4C"/><stop offset="1" stop-color="#08111F"/></radialGradient>
    <radialGradient id="${ray}" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FFE9A6"/><stop offset="1" stop-color="#FFE9A6" stop-opacity="0"/></radialGradient>
    <linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF1B8"/><stop offset=".45" stop-color="#FFC93A"/><stop offset="1" stop-color="#C77A00"/></linearGradient>
    <linearGradient id="${rim}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFE7A0"/><stop offset=".5" stop-color="#E8A31A"/><stop offset="1" stop-color="#9A5A00"/></linearGradient>
    <linearGradient id="${sh}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3A72BE"/><stop offset=".6" stop-color="#1D4479"/><stop offset="1" stop-color="#11284A"/></linearGradient>
  </defs>
  ${bgRect}
  ${laurel(256, 250, 176, 112, 206, 7, 20, `url(#${g})`, '#4A2C00')}
  ${laurel(256, 250, 176, 68, -26, 7, 20, `url(#${g})`, '#4A2C00')}
  <path d="M256 66 L398 104 Q404 106 404 113 L404 236 Q404 352 256 432 Q108 352 108 236 L108 113 Q108 106 114 104 Z" fill="url(#${rim})" stroke="#2E1A00" stroke-width="7" stroke-linejoin="round"/>
  <path d="M256 88 L382 121 L382 236 Q382 336 256 406 Q130 336 130 236 L130 121 Z" fill="url(#${sh})" stroke="#0A1A33" stroke-width="5" stroke-linejoin="round"/>
  <path d="M256 88 L382 121 L382 180 Q256 150 130 180 L130 121 Z" fill="rgba(255,255,255,.08)"/>
  ${star(256, 124, 15, `url(#${g})`, '#4A2C00', 3)}
  ${scales(256, 166, .62, `url(#${g})`, '#3A2200')}
  <path d="M146 396 Q256 432 366 396 L380 432 Q256 470 132 432 Z" fill="#C8352B" stroke="#4A0E0A" stroke-width="6" stroke-linejoin="round"/>
  <path d="M132 432 L104 442 L120 414 L108 392 L146 396 Z M380 432 L408 442 L392 414 L404 392 L366 396 Z" fill="#9C2620" stroke="#4A0E0A" stroke-width="6" stroke-linejoin="round"/>
  <text x="256" y="440" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-weight="700" font-size="34" letter-spacing="10" fill="#FFF3D0" stroke="#4A0E0A" stroke-width="1.2">LEX</text>
  </svg>`;
};

/* ---------- ștampila: sigiliu rotund cu numele biroului, în cerneala firmei ---------- */
A.brand.stamp = (color = '#5A3F8F', name = 'Biroul de avocați') => {
  const top = id('t'), bot = id('u'), f = id('f');
  const up = s => String(s).toUpperCase().slice(0, 30);
  return `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg" class="brand-stamp"><defs>
    <path id="${top}" d="M42 150 A108 108 0 0 1 258 150"/><path id="${bot}" d="M34 150 A116 116 0 0 0 266 150"/>
    <filter id="${f}" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="7"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.1 1.55"/><feComposite in="SourceGraphic" operator="in"/></filter>
  </defs><g fill="none" stroke="${color}" filter="url(#${f})" transform="rotate(-8 150 150)">
    <circle cx="150" cy="150" r="140" stroke-width="8"/><circle cx="150" cy="150" r="130" stroke-width="3"/>
    <circle cx="150" cy="150" r="86" stroke-width="3"/><circle cx="150" cy="150" r="79" stroke-width="1.5" stroke-dasharray="3 4"/>
    <text font-family="Georgia, 'Times New Roman', serif" font-weight="700" font-size="${up(name).length > 22 ? 17 : 21}" letter-spacing="2.5" fill="${color}" stroke="none" text-anchor="middle"><textPath href="#${top}" startOffset="50%">${A.esc(up(name))}</textPath></text>
    <text font-family="Georgia, 'Times New Roman', serif" font-weight="700" font-size="17" letter-spacing="4" fill="${color}" stroke="none" text-anchor="middle"><textPath href="#${bot}" startOffset="50%">BIROU DE AVOCAȚI</textPath></text>
    ${star(46, 154, 9, color, 'none', 0)}${star(254, 154, 9, color, 'none', 0)}
    <g transform="translate(0 2)">${scales(150, 102, .33, 'none', color)}</g>
    <text x="150" y="216" text-anchor="middle" font-family="Georgia, serif" font-size="13" letter-spacing="3" fill="${color}" stroke="none">· MD ·</text>
  </g></svg>`;
};

/* ---------- insigna: rozetă aurie cu email albastru, cartea legii și pana ---------- */
A.brand.insignia = (color = '#5A3F8F') => {
  const g = id('g'), e = id('e'), rb = id('r');
  let rays = ''; for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8, a1 = a - .17, a2 = a + .17, R = i % 2 ? 112 : 128;
    rays += `<path d="M150 150 L${(150 + 70 * Math.cos(a1)).toFixed(1)} ${(150 + 70 * Math.sin(a1)).toFixed(1)} L${(150 + R * Math.cos(a)).toFixed(1)} ${(150 + R * Math.sin(a)).toFixed(1)} L${(150 + 70 * Math.cos(a2)).toFixed(1)} ${(150 + 70 * Math.sin(a2)).toFixed(1)} Z" fill="url(#${g})" stroke="#4A2C00" stroke-width="2.5" stroke-linejoin="round"/>`; }
  return `<svg viewBox="0 0 300 330" xmlns="http://www.w3.org/2000/svg" class="brand-ins"><defs>
    <linearGradient id="${g}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFF1B8"/><stop offset=".5" stop-color="#F2B52A"/><stop offset="1" stop-color="#A86200"/></linearGradient>
    <radialGradient id="${e}" cx="45%" cy="35%" r="70%"><stop offset="0" stop-color="${color}" stop-opacity=".75"/><stop offset=".3" stop-color="${color}"/><stop offset="1" stop-color="#0A1528"/></radialGradient>
    <linearGradient id="${rb}" x1="0" x2="1"><stop offset="0" stop-color="#8E1E1A"/><stop offset=".5" stop-color="#D23B30"/><stop offset="1" stop-color="#8E1E1A"/></linearGradient>
  </defs>
  <path d="M104 214 L78 318 L112 298 L136 324 L150 228 Z M196 214 L222 318 L188 298 L164 324 L150 228 Z" fill="url(#${rb})" stroke="#3E0A08" stroke-width="4" stroke-linejoin="round"/>
  <path d="M120 236 L104 296 M180 236 L196 296" stroke="#FFD86B" stroke-width="5" opacity=".8"/>
  ${rays}
  <circle cx="150" cy="150" r="76" fill="url(#${g})" stroke="#4A2C00" stroke-width="4"/>
  <circle cx="150" cy="150" r="62" fill="url(#${e})" stroke="#4A2C00" stroke-width="3.5"/>
  <circle cx="150" cy="150" r="56" fill="none" stroke="#FFE7A0" stroke-width="1.5" stroke-dasharray="2 4" opacity=".8"/>
  <g stroke="#3A2200" stroke-width="3" stroke-linejoin="round">
    <path d="M112 136 Q130 128 150 138 L150 186 Q130 176 112 184 Z" fill="#FFF6DD"/>
    <path d="M188 136 Q170 128 150 138 L150 186 Q170 176 188 184 Z" fill="#F4E4BA"/>
    <path d="M120 146 Q133 141 144 147 M120 157 Q133 152 144 158 M120 168 Q133 163 144 169 M156 147 Q167 141 180 146 M156 158 Q167 152 180 157" fill="none" stroke-width="1.6" opacity=".6"/>
    <path d="M176 104 Q200 108 196 126 Q186 150 158 172 L154 168 Q172 140 176 104 Z" fill="url(#${g})"/>
  </g>
  ${star(150, 108, 10, `url(#${g})`, '#4A2C00', 2)}
  </svg>`;
};

/* imagine (data URL) pentru <img>, iconițe și foile de partajare */
A.brand.url = svg => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
})();
